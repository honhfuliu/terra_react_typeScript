/**
 * AI 对话页面
 *
 * 页面结构：左侧会话侧栏 + 右侧聊天区。
 * 1. 侧栏：服务端分页拉取会话列表，支持搜索、滚动加载更多、重命名、删除；
 * 2. 聊天区：消息列表 + 输入框，历史消息同样使用后端分页（按 id 倒序，第 1 页是最新一页）；
 * 3. 发送消息使用 SSE 流式接口，按 start / chunk / complete / error 四类事件增量更新界面。
 *
 * 核心数据：
 * - conversations：本地会话集合（渲染的唯一数据源），每个会话自带消息数组和分页状态；
 * - sessions：侧栏的服务端分页数据，和 conversations 按 sessionId 合并后展示；
 * - pendingId：正在等待 AI 回复的会话前端 id，用于禁用发送按钮、展示"回复中"状态。
 */
import * as React from 'react';
import { App, Button, Drawer, Dropdown, Grid, Input, Select } from 'antd';
import type { TextAreaRef } from 'antd/es/input/TextArea';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import Icon from '@/components/Icon';
import { PAGINATION } from '@/constants';
import { parseDateTime } from '@/utils/date';
import styles from './index.module.less';

import {
  deleteChatSession,
  getChatModelOptions,
  getChatMessagePage,
  getChatSessionPage,
  updateSessionTitle,
} from '@/service/model.ts';

import type { ChatModelOption } from '@/service/model.ts';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import {
  CHAT_MESSAGE_ROLE,
  ChatMessageDto,
  ChatMessageRole,
  streamChatMessage,
} from '@/service/chat';

// ===== 类型 =====

// 单条消息（前端渲染使用，后端数字 id 统一转成 string 方便本地生成临时 id）
interface ChatMessage {
  id: string; // 本地临时 id（createId 生成）或后端消息 id
  role: ChatMessageRole; // 角色：USER 用户 / ASSISTANT AI
  content: string; // 消息内容，AI 消息为 Markdown 文本
  createdAt: number; // 毫秒时间戳，用于展示 "HH:mm"
}

// 一个会话：包含消息列表、草稿状态和后端分页加载状态
interface Conversation {
  id: string; // 前端唯一 key（侧栏/列表渲染用，和后端 sessionId 无关）
  sessionId: number | null; // 后端会话 id，新建会话在收到 start 事件前为 null
  title: string; // 会话标题，后端返回前用首条消息截断
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
  draft?: boolean; // true 表示用户刚点"新建"、还没发首条消息，侧栏不显示
  pendingReply?: boolean; // true 表示已发消息、正在等后端回复
  msgInited?: boolean; // 是否已从后端加载过历史消息
  msgLoading?: boolean; // 是否正在加载历史消息
  msgPage?: number; // 当前已加载到的页码（后端按 id 倒序，页码越大越早）
  msgTotal?: number; // 该会话消息总数
  msgHasMore?: boolean; // 是否还有更早的历史消息
}

// 流式事件 start 返回的数据：新会话 id、标题、以及落库后的用户消息
interface StreamStartData {
  sessionId: number;
  title: string;
  userMessage: ChatMessageDto;
}

// 侧栏会话项（服务端分页数据 + 本地临时项合并后）
interface SidebarSession {
  key: string; // React key
  sessionId: number; // 后端会话 id
  title: string; // 会话标题
  updatedAt: number; // 更新时间戳，用于展示"刚刚/昨天/x 分钟前"
  pendingReply: boolean; // 是否正在等待 AI 回复
}

// ===== 常量 =====
// 时间换算常量，供会话列表展示相对时间使用
const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

// 空对话引导问题
const SUGGESTIONS = [
  { icon: 'mdi:code-tags', text: '帮我写一段 Spring AI 接入代码' },
  { icon: 'mdi:database-search-outline', text: '设计一个 RAG 知识库方案' },
  { icon: 'mdi:briefcase-outline', text: '整理 Java 面试高频考点' },
  { icon: 'mdi:lightbulb-on-outline', text: '介绍一下你都有哪些功能' },
];

// ===== 工具 =====
// 生成前端唯一 id：时间戳 + 自增序号，避免同一毫秒内重复
let idSeed = 0;
const createId = (prefix: string) => `${prefix}-${Date.now()}-${idSeed++}`;

/**
 * 格式化会话列表中显示的相对时间：
 * 1 分钟内 -> 刚刚；1 小时内 -> x 分钟前；今天 -> HH:mm；昨天 -> 昨天；
 * 一周内 -> 周几；更早 -> M 月 D 日
 */
const formatConversationTime = (timestamp: number) => {
  const now = new Date();
  const target = new Date(timestamp);
  const diff = now.getTime() - timestamp;
  if (diff < MINUTE) return '刚刚';
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)} 分钟前`;
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dayDiff = Math.round(
    (todayStart - new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime()) /
      DAY,
  );
  if (dayDiff === 0)
    return `${String(target.getHours()).padStart(2, '0')}:${String(target.getMinutes()).padStart(2, '0')}`;
  if (dayDiff === 1) return '昨天';
  if (dayDiff < 7) return WEEKDAYS[target.getDay()];
  return `${target.getMonth() + 1} 月 ${target.getDate()} 日`;
};

// 格式化消息气泡下方的时间：只展示时分
const formatMessageTime = (timestamp: number) => {
  const d = new Date(timestamp);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

// 新建一个草稿会话：draft=true 时不会出现在侧栏，发送首条消息后转正
const createDraftConversation = (): Conversation => ({
  id: createId('conv'),
  sessionId: null,
  title: '新对话',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  messages: [],
  draft: true,
});

// 后端消息结构 -> 前端渲染结构（id 转 string，时间字符串转时间戳）
const toChatMessage = (item: ChatMessageDto): ChatMessage => ({
  id: String(item.id),
  role: item.role,
  content: item.content,
  createdAt: parseDateTime(item.createTime),
});

// ===== 组件 =====
const AiChat: React.FC = () => {
  const { message } = App.useApp();
  const screens = Grid.useBreakpoint();
  const isMobile = screens.md === false; // md 以下视为移动端：侧栏改为抽屉

  // ---- 会话与消息（本地数据源） ----
  // 首次渲染先创建一个 draft 会话作为兜底，保证 activeConversation 永远存在
  const [initialConversation] = useState<Conversation>(createDraftConversation);
  const [conversations, setConversations] = useState<Conversation[]>(() => [initialConversation]);
  const [activeId, setActiveId] = useState<string>(() => initialConversation.id); // 当前选中的会话前端 id

  // ---- 输入框与模型选择 ----
  const [input, setInput] = useState(''); // 输入框内容
  const [modelId, setModelId] = useState<number>(); // 当前选中的模型 id
  const [modelOptions, setModelOptions] = useState<ChatModelOption[]>([]); // 可选模型列表
  const [modelLoading, setModelLoading] = useState(true); // 模型列表加载中

  // ---- 交互状态 ----
  const [keyword, setKeyword] = useState(''); // 侧栏搜索关键字
  const [pendingId, setPendingId] = useState<string | null>(null); // 正在等待 AI 回复的会话前端 id
  const [copiedId, setCopiedId] = useState<string | null>(null); // 刚复制过的消息 id，用于显示"已复制"
  const copyTimerRef = useRef<number | null>(null); // "已复制"提示的定时器
  const [collapsed, setCollapsed] = useState(false); // 桌面端侧栏是否收起
  const [drawerOpen, setDrawerOpen] = useState(false); // 移动端抽屉是否打开

  // ---- 侧栏会话（服务端分页） ----
  const [sessions, setSessions] = useState<SidebarSession[]>([]);
  const [sessionTotal, setSessionTotal] = useState(0); // 服务端会话总数
  const [sessionPage, setSessionPage] = useState<number>(PAGINATION.DEFAULT_PAGE_NUM); // 已加载到的页码
  const [sessionLoading, setSessionLoading] = useState(false);
  const [sessionHasMore, setSessionHasMore] = useState(false); // 是否还有下一页
  const sessionLoadingRef = useRef(false); // 同步锁，防止滚动事件重复触发请求

  // ---- DOM / 滚动相关 ----
  const listRef = useRef<HTMLDivElement>(null); // 消息列表容器
  const inputRef = useRef<TextAreaRef>(null); // 输入框实例，用于聚焦
  const prependRef = useRef(false); // 本次渲染是否为"向上加载历史消息"（需要保持滚动位置）
  const prevScrollHeightRef = useRef(0); // 前插历史消息前的滚动高度
  // 会话 id -> 流式请求控制器，用于删除会话/卸载页面时中断
  const streamControllersRef = useRef<Map<string, AbortController>>(new Map());

  // ---- 派生值（每次渲染重新计算） ----
  const activeConversation = conversations.find((c) => c.id === activeId) ?? conversations[0];
  const activeSessionId = activeConversation?.sessionId ?? null; // 侧栏高亮用
  const messages = activeConversation?.messages ?? [];
  const busy = pendingId !== null && pendingId === activeConversation?.id; // 当前会话是否正在回复
  // 最后一条消息内容长度：流式输出时用于跟随滚动
  const lastMessageLength = messages.length ? messages[messages.length - 1].content.length : 0;

  /**
   * 拉取侧栏会话分页数据
   * @param page 页码（从 1 开始）
   * @param append 是否追加到已有列表（滚动加载更多）；false 表示整体替换（首屏 / 搜索）
   */
  const fetchSessions = useCallback(
    async (page: number, append: boolean) => {
      // ref 锁做同步防重：state 更新是异步的，滚动事件可能在请求未完成时再次触发
      if (sessionLoadingRef.current) return;
      sessionLoadingRef.current = true;
      setSessionLoading(true);
      try {
        // keyword 传给后端做标题模糊搜索，空串时传 undefined
        const res = await getChatSessionPage({
          pageNum: page,
          pageSize: PAGINATION.DEFAULT_PAGE_SIZE,
          title: keyword.trim() || undefined,
        });
        const rows: SidebarSession[] = res.rows.map((item) => ({
          key: `session-${item.sessionId}`,
          sessionId: item.sessionId,
          title: item.title,
          updatedAt: parseDateTime(item.updateTime),
          pendingReply: false,
        }));
        // append 模式下按 sessionId 去重追加，避免翻页时出现重复项
        setSessions((prev) => {
          if (!append) return rows;
          const exists = new Set(prev.map((s) => s.sessionId));
          return [...prev, ...rows.filter((row) => !exists.has(row.sessionId))];
        });
        setSessionTotal(res.total);
        setSessionPage(page);
        // 已加载条数 < 总数 时说明还有下一页
        setSessionHasMore(page * PAGINATION.DEFAULT_PAGE_SIZE < res.total);
      } catch {
        message.error('会话列表加载失败');
      } finally {
        sessionLoadingRef.current = false;
        setSessionLoading(false);
      }
    },
    [keyword, message],
  );

  // 首次进入 / 搜索关键字变化：从第一页重新加载（防抖）
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchSessions(1, false);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [fetchSessions]);

  // 侧栏展示项：服务端分页结果 + 本地刚创建但还没进入分页结果的会话
  const sidebarSessions = useMemo(() => {
    const serverIds = new Set(sessions.map((s) => s.sessionId));
    // 1. 本地已有、但服务端分页结果里还没有的会话（如刚发出的新会话），先在侧栏顶部展示
    const localOnly: SidebarSession[] = conversations
      .filter((c) => !c.draft && c.sessionId !== null && !serverIds.has(c.sessionId))
      .map((c) => ({
        key: c.id,
        sessionId: c.sessionId as number,
        title: c.title,
        updatedAt: c.updatedAt,
        pendingReply: !!c.pendingReply,
      }));
    // 2. 服务端分页项，用本地会话的 pendingReply 覆盖"回复中"状态
    const serverItems = sessions.map((s) => ({
      ...s,
      pendingReply: !!conversations.find((c) => c.sessionId === s.sessionId)?.pendingReply,
    }));
    const merged = [...localOnly, ...serverItems];
    // 3. 本地再按关键字过滤一次，保证新会话无需等接口返回也能即时筛选
    const value = keyword.trim().toLowerCase();
    return value ? merged.filter((s) => s.title.toLowerCase().includes(value)) : merged;
  }, [sessions, conversations, keyword]);

  // 侧栏滚动到底部时加载下一页（距底部 24px 内触发）
  const handleSessionListScroll: React.UIEventHandler<HTMLDivElement> = (event) => {
    const el = event.currentTarget;
    if (!sessionHasMore || sessionLoadingRef.current) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 24) {
      void fetchSessions(sessionPage + 1, true);
    }
  };

  /**
   * 加载会话的第一页消息（最新 10 条）
   * 后端按 id 倒序分页，所以第 1 页就是最新一页，直接替换 messages 即可
   */
  const loadSessionMessages = async (conversationId: string, sessionId: number) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? { ...c, msgLoading: true } : c)),
    );
    try {
      const res = await getChatMessagePage({
        sessionId,
        pageNum: PAGINATION.DEFAULT_PAGE_NUM,
        pageSize: PAGINATION.DEFAULT_PAGE_SIZE,
      });

      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId
            ? {
                ...c,
                messages: res.rows.map(toChatMessage),
                msgInited: true,
                msgLoading: false,
                msgPage: PAGINATION.DEFAULT_PAGE_NUM,
                msgTotal: res.total,
                msgHasMore: PAGINATION.DEFAULT_PAGE_SIZE < res.total,
              }
            : c,
        ),
      );
    } catch {
      message.error('消息加载失败');
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId ? { ...c, msgLoading: false, msgInited: true } : c,
        ),
      );
    }
  };

  /**
   * 向上加载更早的消息（页码 +1，结果前插到列表头部）
   * 前插会让列表变高，为避免视口跳动，这里记录前插前的高度，
   * 在渲染后的 scroll effect 中把 scrollTop 平移回原来的相对位置。
   */
  const loadOlderMessages = useCallback(
    async (conversation: Conversation) => {
      const sessionId = conversation.sessionId;
      const page = conversation.msgPage ?? 0;
      // 没有 sessionId、没有更多数据、或正在加载时不重复请求
      if (sessionId === null || !conversation.msgHasMore || conversation.msgLoading) return;

      const nextPage = page + 1;
      const total = conversation.msgTotal ?? 0;
      const el = listRef.current;
      prevScrollHeightRef.current = el?.scrollHeight ?? 0;
      prependRef.current = true; // 标记本次是前插，滚动 effect 会走"保持位置"分支

      setConversations((prev) =>
        prev.map((c) => (c.id === conversation.id ? { ...c, msgLoading: true } : c)),
      );
      try {
        const res = await getChatMessagePage({
          sessionId,
          pageNum: nextPage,
          pageSize: PAGINATION.DEFAULT_PAGE_SIZE,
        });
        const older = res.rows.map(toChatMessage);
        const exists = new Set(conversation.messages.map((m) => m.id));
        const added = older.filter((m) => !exists.has(m.id));
        // 没有新增消息时不会触发滚动副作用，这里主动复位，避免影响下一次新增消息
        if (!added.length) prependRef.current = false;
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== conversation.id) return c;
            const currentIds = new Set(c.messages.map((m) => m.id));
            return {
              ...c,
              messages: [...added.filter((m) => !currentIds.has(m.id)), ...c.messages],
              msgPage: nextPage,
              msgHasMore: nextPage * PAGINATION.DEFAULT_PAGE_SIZE < total,
              msgLoading: false,
            };
          }),
        );
      } catch {
        message.error('消息加载失败');
        prependRef.current = false;
        setConversations((prev) =>
          prev.map((c) => (c.id === conversation.id ? { ...c, msgLoading: false } : c)),
        );
      }
    },
    [message],
  );

  // 消息列表滚动到顶部时加载更早的消息
  const handleMessageListScroll: React.UIEventHandler<HTMLDivElement> = (event) => {
    if (!activeConversation) return;
    if (event.currentTarget.scrollTop <= 40) {
      void loadOlderMessages(activeConversation);
    }
  };

  // 拉取可选模型列表，成功后默认选中第一个（若之前选过且仍存在则保留）
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const list = await getChatModelOptions();
        if (cancelled) return;
        setModelOptions(list);
        if (list.length) {
          setModelId((prev) => (list.some((o) => o.id === prev) ? prev : list[0].id));
        }
      } catch {
        // 接口不可用时模型列表为空，发送时会提示选择模型
      } finally {
        if (!cancelled) setModelLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  // 断点切换时互斥侧栏与抽屉：移动端只用抽屉，桌面端只用可收起侧栏
  useEffect(() => {
    if (isMobile) setCollapsed(false);
    else setDrawerOpen(false);
  }, [isMobile]);

  // 页面卸载时中断所有流式请求，避免卸载后仍往已销毁的组件里 setState
  useEffect(() => {
    const controllers = streamControllersRef.current;
    return () => {
      controllers.forEach((controller) => controller.abort());
      controllers.clear();
    };
  }, []);

  // 消息列表滚动：新增消息时滚到底部；向上加载历史时保持当前位置
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    // 前插历史消息：用"新高度 - 旧高度"补偿 scrollTop，视觉上停留在原消息位置
    if (prependRef.current) {
      prependRef.current = false;
      el.scrollTop = el.scrollHeight - prevScrollHeightRef.current;
      return;
    }
    // 流式输出中持续跟随到底部（直接赋值，避免每个 chunk 触发平滑滚动动画）
    if (busy) {
      el.scrollTop = el.scrollHeight;
      return;
    }
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [activeId, messages.length, lastMessageLength, busy]);

  // 内容不足一屏时列表无法触发滚动事件，这里主动继续加载更早的消息
  useEffect(() => {
    const el = listRef.current;
    if (!el || !activeConversation) return;
    if (
      activeConversation.msgHasMore &&
      !activeConversation.msgLoading &&
      el.scrollHeight <= el.clientHeight + 1
    ) {
      void loadOlderMessages(activeConversation);
    }
  }, [activeConversation, messages.length, loadOlderMessages]);

  // ===== 操作 =====

  // 延迟聚焦：等 Input 完成渲染/更新后再 focus（新建会话、点击引导问题时使用）
  const focusInput = () => window.setTimeout(() => inputRef.current?.focus(), 0);

  // 点击空对话的引导问题：填入输入框并聚焦
  const handleSuggestion = (text: string) => {
    setInput(text);
    focusInput();
  };

  // 复制整条 AI 回复，并短暂展示"已复制"状态（2 秒后还原）
  const handleCopyMessage = async (item: ChatMessage) => {
    try {
      await navigator.clipboard.writeText(item.content);
      setCopiedId(item.id);
      message.success('已复制 AI 回复');
      if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
      copyTimerRef.current = window.setTimeout(() => setCopiedId(null), 2000);
    } catch {
      message.error('复制失败，请手动选择文本复制');
    }
  };

  useEffect(
    () => () => {
      if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
    },
    [],
  );

  // 新建会话
  const handleNewChat = () => {
    // 如果当前已经是 draft（什么都没发），就复用它，不用新建
    if (activeConversation?.draft) {
      setInput('');
      setKeyword('');
      setDrawerOpen(false);
      focusInput();
      return;
    }

    // 追加一个草稿会话并切换过去：draft 不显示在侧栏，发出首条消息后才转正
    const draft = createDraftConversation();
    setConversations((prev) => [...prev, draft]);
    setActiveId(draft.id);
    setInput('');
    setKeyword('');
    setDrawerOpen(false);
    focusInput();
  };

  // 切换当前会话（移动端顺带关闭抽屉）
  const handleSelect = (id: string) => {
    setActiveId(id);
    setDrawerOpen(false);
  };

  /**
   * 点击侧栏会话：
   * - 本地已有该会话：直接切换，若还没加载过消息则拉取第一页；
   * - 本地没有：先创建会话容器（携带 sessionId），再拉取第一页消息。
   */
  const handleSelectSession = (item: SidebarSession) => {
    const existing = conversations.find((c) => c.sessionId === item.sessionId);
    if (existing) {
      handleSelect(existing.id);
      if (!existing.msgInited && !existing.messages.length) {
        void loadSessionMessages(existing.id, item.sessionId);
      }
      return;
    }
    const conv: Conversation = {
      id: createId('conv'),
      sessionId: item.sessionId,
      title: item.title,
      createdAt: Date.now(),
      updatedAt: item.updatedAt,
      messages: [],
    };
    setConversations((prev) => [...prev, conv]);
    handleSelect(conv.id);
    void loadSessionMessages(conv.id, item.sessionId);
  };

  // 删除会话（纯本地）：只移除前端会话数据，不调用后端删除接口
  const handleDelete = (id: string) => {
    // 中断该会话可能仍在进行的流式请求
    streamControllersRef.current.get(id)?.abort();
    streamControllersRef.current.delete(id);

    const remaining = conversations.filter((c) => c.id !== id);
    // 如果删的是当前会话，挑一个非 draft 的或第一个；都没有就补一个 draft
    if (activeId === id) {
      const pick = remaining.find((c) => !c.draft) ?? remaining[0] ?? createDraftConversation();
      if (!remaining.length) remaining.push(pick);
      setActiveId(pick.id);
    }
    setConversations(remaining);
    if (pendingId === id) setPendingId(null);
  };

  // 删除侧栏会话：先调后端删除，再同步清理侧栏和本地会话；当前会话被删时自动新建草稿
  const handleDeleteSession = async (item: SidebarSession) => {
    try {
      // draft 会话 sessionId 为 null，只做本地清理，不调后端
      if (item.sessionId !== null) {
        await deleteChatSession(item.sessionId);
      }

      setSessions((prev) => prev.filter((s) => s.sessionId !== item.sessionId));
      setSessionTotal((prev) => Math.max(0, prev - 1));

      const local = conversations.find((c) => c.sessionId === item.sessionId);
      if (local) {
        handleDelete(local.id);
        message.success('会话已删除');
        return;
      }
      if (item.sessionId === activeSessionId) {
        const draft = createDraftConversation();
        setConversations((prev) => [...prev, draft]);
        setActiveId(draft.id);
      }
      message.success('会话已删除');
    } catch {
      message.error('会话删除失败');
    }
  };

  // 修改会话标题：动态引入 Modal，确认后调用后端接口并同步侧栏与本地会话
  const handleRenameSession = async (item: SidebarSession) => {
    const { Modal } = await import('antd');
    Modal.confirm({
      className: styles.renameModal,
      icon: null,
      title: (
        <div className={styles.renameTitle}>
          <span className={styles.renameIcon}>
            <Icon icon="mdi:pencil-outline" size={18} />
          </span>
          修改会话名称
        </div>
      ),
      content: (
        <div className={styles.renameContent}>
          <Input
            id="rename-session-input"
            defaultValue={item.title}
            maxLength={50}
            showCount
            autoFocus
            placeholder="请输入新的会话名称"
            size="large"
          />
          <div className={styles.renameHint}>
            简洁的标题能帮你快速定位到这段对话，建议不超过 20 个字。
          </div>
        </div>
      ),
      okText: '保存修改',
      cancelText: '取消',
      okButtonProps: { size: 'large', type: 'primary' },
      cancelButtonProps: { size: 'large' },
      onOk: async () => {
        const input = document.getElementById('rename-session-input') as HTMLInputElement | null;
        const nextTitle = input?.value.trim();
        if (!nextTitle) {
          message.warning('名称不能为空');
          return Promise.reject();
        }
        try {
          await updateSessionTitle({ sessionId: item.sessionId, title: nextTitle });
          setSessions((prev) =>
            prev.map((s) => (s.sessionId === item.sessionId ? { ...s, title: nextTitle } : s)),
          );
          setConversations((prev) =>
            prev.map((c) => (c.sessionId === item.sessionId ? { ...c, title: nextTitle } : c)),
          );
          message.success('名称已更新');
        } catch {
          message.error('名称更新失败');
          return Promise.reject();
        }
      },
    });
  };

  /**
   * 同步侧栏会话列表（收到 start 事件、拿到真实 sessionId 后调用）
   * - 已存在：更新标题与更新时间；
   * - 不存在：作为新会话插到列表最前面。
   */
  const syncSessionSidebar = (sid: number, title: string) => {
    setSessions((prev) => {
      if (prev.some((s) => s.sessionId === sid)) {
        return prev.map((s) =>
          s.sessionId === sid ? { ...s, title: title || s.title, updatedAt: Date.now() } : s,
        );
      }
      return [
        {
          key: `session-${sid}`,
          sessionId: sid,
          title,
          updatedAt: Date.now(),
          pendingReply: false,
        },
        ...prev,
      ];
    });
  };

  /**
   * 发送消息（SSE 流式接收 AI 回复）
   *
   * 整体流程：
   * 1. 校验内容、模型、是否正在回复；
   * 2. 乐观更新：先插入用户消息 + 空的 AI 占位消息，界面立即响应；
   * 3. 订阅 SSE 事件，按事件类型增量更新对应会话；
   * 4. 结束后清理占位、解除 pending 状态。
   *
   * 事件语义：
   * - start：返回真实 sessionId、会话标题、落库后的用户消息；
   * - chunk：一段增量文本，追加到 AI 占位消息上形成打字机效果；
   * - complete：完整的 AI 消息（真实 id、创建时间），用于替换占位消息；
   * - error：服务端返回的错误信息。
   */
  const handleSend = async () => {
    const content = input.trim();
    // 空内容、正在回复、没有活动会话时不发送
    if (!content || busy || !activeConversation) return;
    if (modelId === undefined) {
      message.warning('请先选择模型');
      return;
    }

    const conversationId = activeConversation.id;
    const sessionId = activeConversation.sessionId; // null 表示新建会话
    const now = Date.now();
    // 本地乐观用户消息（收到 start 事件后会被后端消息替换）
    const userMessage: ChatMessage = {
      id: createId('msg'),
      role: CHAT_MESSAGE_ROLE.USER,
      content,
      createdAt: now,
    };
    // AI 回复占位消息 id：chunk / complete 事件都按这个 id 定位要更新的消息
    const assistantMessageId = createId('msg');

    // 乐观更新：先插入用户消息和回复占位，draft 会话转正（侧栏开始显示）
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== conversationId) return c;
        return {
          ...c,
          draft: false,
          pendingReply: true,
          // 新建会话先用首条消息截断作为临时标题，start 事件返回后替换
          title: c.sessionId === null ? content.slice(0, 20) : c.title,
          updatedAt: now,
          messages: [
            ...c.messages,
            userMessage,
            {
              id: assistantMessageId,
              role: CHAT_MESSAGE_ROLE.ASSISTANT,
              content: '',
              createdAt: now,
            },
          ],
        };
      }),
    );

    setInput('');
    setPendingId(conversationId);

    const controller = new AbortController();
    streamControllersRef.current.set(conversationId, controller);

    // 只更新"当前会话"的快捷方法，避免每个回调重复写 map 逻辑
    const patchConversation = (updater: (c: Conversation) => Conversation) => {
      setConversations((prev) => prev.map((c) => (c.id === conversationId ? updater(c) : c)));
    };

    // 按消息 id 用后端消息替换本地消息
    const replaceMessage = (messageId: string, next: ChatMessage) => {
      patchConversation((c) => ({
        ...c,
        messages: c.messages.map((m) => (m.id === messageId ? next : m)),
      }));
    };

    // 回复结束：解除 pendingReply；若占位消息仍为空（请求失败/无内容）则移除它
    const finishReply = () => {
      patchConversation((c) => ({
        ...c,
        pendingReply: false,
        messages: c.messages.filter((m) => !(m.id === assistantMessageId && !m.content)),
      }));
      setPendingId((prev) => (prev === conversationId ? null : prev));
    };

    try {
      // 订阅 SSE 流：signal 用于删除会话 / 离开页面时主动中断请求
      await streamChatMessage(
        { modelId, sessionId, message: content, signal: controller.signal },
        {
          // 每收到一个 SSE 事件就在这里更新 UI
          onMessage(event) {
            // start：拿到真实 sessionId / 标题 / 后端用户消息
            if (event.type === 'start') {
              const data = event.data as StreamStartData;
              if (!data?.userMessage) return;
              // 用后端用户消息替换本地乐观消息，并同步会话 id / 标题
              replaceMessage(userMessage.id, {
                id: String(data.userMessage.id),
                role: CHAT_MESSAGE_ROLE.USER,
                content: data.userMessage.content,
                createdAt: parseDateTime(data.userMessage.createTime),
              });
              patchConversation((c) => ({
                ...c,
                sessionId: data.sessionId,
                title: data.title || c.title,
              }));
              syncSessionSidebar(data.sessionId, data.title);
              if (sessionId === null) setSessionTotal((prev) => prev + 1);
              return;
            }

            // chunk：把增量文本追加到 AI 占位消息上，实现逐字/逐块输出
            if (event.type === 'chunk') {
              const chunk = typeof event.data === 'string' ? event.data : '';
              if (!chunk) return;
              patchConversation((c) => ({
                ...c,
                messages: c.messages.map((m) =>
                  m.id === assistantMessageId ? { ...m, content: m.content + chunk } : m,
                ),
              }));
              return;
            }

            // complete：用完整 AI 消息替换占位消息，并同步会话更新时间
            if (event.type === 'complete') {
              const data = event.data as ChatMessageDto;
              replaceMessage(assistantMessageId, {
                id: String(data.id),
                role: CHAT_MESSAGE_ROLE.ASSISTANT,
                content: data.content,
                createdAt: parseDateTime(data.createTime),
              });
              patchConversation((c) => ({
                ...c,
                updatedAt: Date.now(),
                // 已加载过历史的会话，总数同步 +2（用户消息 + 助手消息）
                msgTotal: c.msgTotal === undefined ? c.msgTotal : c.msgTotal + 2,
              }));
              finishReply();
              return;
            }

            // error：服务端返回的流内错误（非 HTTP 错误），提示后结束回复
            if (event.type === 'error') {
              message.error(String(event.data ?? 'AI 回复失败'));
              finishReply();
            }
          },
          // 连接正常关闭：兜底解除 pending 状态（complete 后重复调用无副作用）
          onClose() {
            finishReply();
          },
          // 网络/HTTP 层异常：具体提示放到下面的 catch 中统一处理
          onError(error) {
            console.error('AI 流式请求异常：', error);
          },
        },
      );
    } catch (error) {
      // 主动中断（删除会话、离开页面）不提示错误
      if (!controller.signal.aborted) {
        console.error('AI 流式请求失败：', error);
        message.error('消息发送失败，请稍后重试');
      }
      finishReply();
    } finally {
      // 请求结束，移除控制器引用
      streamControllersRef.current.delete(conversationId);
    }
  };

  // Enter 发送，Shift + Enter 换行；输入法组合输入（如中文拼音）期间不触发发送
  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (event) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void handleSend();
    }
  };

  // 侧栏内容：移动端放进 Drawer，桌面端直接渲染为 aside（两者共用同一份 JSX）
  const sidebarContent = (
    <div className={styles.sidebarInner}>
      {/* 品牌区 */}
      <div className={styles.brand}>
        <span className={styles.brandLogo}>
          <Icon icon="mdi:robot-happy" size={22} />
        </span>
        <div className={styles.brandText}>
          <span className={styles.brandName}>AI 智能助手</span>
          <span className={styles.brandSub}>Terra AI Workspace</span>
        </div>
      </div>

      <Button
        type="primary"
        block
        className={styles.newChatBtn}
        icon={<Icon icon="mdi:plus" size={18} />}
        onClick={handleNewChat}
      >
        新建对话
      </Button>

      {/* 搜索框：keyword 变化会触发防抖后重新拉取第一页 */}
      <Input
        allowClear
        className={styles.searchInput}
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        prefix={<Icon icon="mdi:magnify" size={16} />}
        placeholder="搜索对话"
      />

      <div className={styles.listHeader}>
        <span>最近对话</span>
        <span className={styles.listCount}>{sessionTotal}</span>
      </div>

      {/* 会话列表：滚动到底部触发下一页加载 */}
      <div className={styles.conversationList} onScroll={handleSessionListScroll}>
        {sidebarSessions.length ? (
          sidebarSessions.map((item) => (
            <div
              key={item.key}
              className={clsx(
                styles.conversationItem,
                item.sessionId === activeSessionId && styles.conversationActive,
              )}
              onClick={() => handleSelectSession(item)}
            >
              <div className={styles.conversationMain}>
                <span className={styles.conversationTitle}>{item.title}</span>
                <span className={styles.conversationTime}>
                  {formatConversationTime(item.updatedAt)}
                  {item.pendingReply && <em className={styles.pendingTag}>回复中…</em>}
                </span>
              </div>
              {/* 会话操作菜单：修改名称 / 删除 */}
              <Dropdown
                trigger={['click']}
                menu={{
                  items: [
                    {
                      key: 'rename',
                      label: '修改会话名称',
                      icon: <Icon icon="mdi:pencil-outline" size={14} />,
                    },
                    { type: 'divider' },
                    {
                      key: 'delete',
                      label: '删除会话',
                      danger: true,
                      icon: <Icon icon="mdi:trash-can-outline" size={14} />,
                    },
                  ],
                  onClick: ({ key, domEvent }) => {
                    domEvent.stopPropagation();
                    if (key === 'rename') handleRenameSession(item);
                    if (key === 'delete') handleDeleteSession(item);
                  },
                }}
              >
                <button
                  type="button"
                  className={styles.itemMore}
                  aria-label="会话操作"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Icon icon="mdi:dots-vertical" size={16} />
                </button>
              </Dropdown>
            </div>
          ))
        ) : sessionLoading ? null : (
          <div className={styles.emptyList}>暂无历史会话</div>
        )}

        {sessionLoading && (
          <div className={styles.listLoading}>
            <Icon icon="mdi:loading" size={16} className={styles.listLoadingIcon} />
            加载中…
          </div>
        )}
        {!sessionLoading && !sessionHasMore && sidebarSessions.length > 0 && (
          <div className={styles.listLoading}>没有更多了</div>
        )}
      </div>
    </div>
  );

  const modelSelectOptions = modelOptions.map((o) => ({ label: o.modelCode, value: o.id }));

  return (
    <div className={styles.page}>
      {/* 响应式布局：移动端侧栏用 Drawer，桌面端用可收起的 aside */}
      {isMobile ? (
        <Drawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          placement="left"
          width={288}
          closable={false}
          styles={{
            body: {
              padding: 0,
              height: '100%',
              overflow: 'hidden',
              background: 'var(--container-bg)',
            },
          }}
        >
          {sidebarContent}
        </Drawer>
      ) : (
        !collapsed && <aside className={styles.sidebar}>{sidebarContent}</aside>
      )}

      <div className={styles.main}>
        {/* 顶部标题栏：侧栏开关 + 当前会话标题 / 消息数 */}
        <div className={styles.mainHeader}>
          <div className={styles.mainHeaderLeft}>
            <Button
              type="text"
              className={styles.iconBtn}
              aria-label={isMobile ? '打开会话列表' : collapsed ? '展开侧栏' : '收起侧栏'}
              icon={<Icon icon={collapsed ? 'mdi:menu-open' : 'mdi:menu'} size={20} />}
              onClick={() => (isMobile ? setDrawerOpen(true) : setCollapsed((prev) => !prev))}
            />
            <div className={styles.titleBlock}>
              <div className={styles.mainTitle}>
                {activeConversation?.draft ? '新对话' : (activeConversation?.title ?? '新对话')}
              </div>
              <div className={styles.mainSubtitle}>
                {activeConversation?.draft
                  ? '开始一段新的对话'
                  : messages.length
                    ? `共 ${messages.length} 条消息`
                    : '开始一段新的对话'}
              </div>
            </div>
          </div>

          <div className={styles.mainHeaderRight}>
            <span className={styles.aiBadge}>
              <Icon icon="mdi:creation" size={14} />
              AI 对话
            </span>
          </div>
        </div>

        <div className={styles.chatBody}>
          {/* 有消息 / 正在回复 / 正在加载消息时展示列表，否则展示欢迎页 */}
          {messages.length ||
          pendingId === activeConversation?.id ||
          activeConversation?.msgLoading ? (
            <div className={styles.messageList} ref={listRef} onScroll={handleMessageListScroll}>
              {activeConversation?.msgLoading && messages.length === 0 && (
                <div className={styles.messageLoading}>
                  <Icon icon="mdi:loading" size={16} className={styles.listLoadingIcon} />
                  加载消息中…
                </div>
              )}
              {activeConversation?.msgLoading && messages.length > 0 && (
                <div className={styles.listLoading}>
                  <Icon icon="mdi:loading" size={16} className={styles.listLoadingIcon} />
                  加载更早的消息…
                </div>
              )}
              {/* 消息列表：AI 消息带头像并用 Markdown 渲染，用户消息渲染纯文本气泡 */}
              {messages.map((item) => (
                <div
                  key={item.id}
                  className={clsx(
                    styles.messageRow,
                    item.role === CHAT_MESSAGE_ROLE.USER && styles.messageRowUser,
                  )}
                >
                  {item.role === CHAT_MESSAGE_ROLE.ASSISTANT && (
                    <span className={styles.assistantAvatar}>
                      <Icon icon="mdi:robot-happy" size={18} />
                    </span>
                  )}
                  <div
                    className={clsx(
                      styles.messageContent,
                      item.role === CHAT_MESSAGE_ROLE.USER && styles.messageContentUser,
                    )}
                  >
                    <div
                      className={clsx(
                        styles.bubble,
                        item.role === CHAT_MESSAGE_ROLE.USER
                          ? styles.userBubble
                          : styles.assistantBubble,
                      )}
                    >
                      {item.role === CHAT_MESSAGE_ROLE.ASSISTANT ? (
                        item.content ? (
                          <MarkdownRenderer content={item.content} />
                        ) : (
                          // 流式回复等待首个 chunk 时展示动效
                          <span className={styles.typing}>
                            <span className={styles.typingDot} />
                            <span className={styles.typingDot} />
                            <span className={styles.typingDot} />
                          </span>
                        )
                      ) : (
                        item.content
                      )}
                    </div>
                    {/* 流式回复还没有内容时不展示时间与复制 */}
                    {!(item.role === CHAT_MESSAGE_ROLE.ASSISTANT && !item.content) && (
                      <div className={styles.messageFooter}>
                        <span className={styles.messageTime}>
                          {formatMessageTime(item.createdAt)}
                        </span>
                        {item.role === CHAT_MESSAGE_ROLE.ASSISTANT && (
                          <button
                            type="button"
                            className={styles.copyAction}
                            onClick={() => handleCopyMessage(item)}
                          >
                            <Icon
                              icon={copiedId === item.id ? 'mdi:check' : 'mdi:content-copy'}
                              size={13}
                            />
                            {copiedId === item.id ? '已复制' : '复制'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.welcome}>
              <span className={styles.welcomeIcon}>
                <Icon icon="mdi:robot-happy-outline" size={38} />
              </span>
              <h2 className={styles.welcomeTitle}>开始你的 AI 对话</h2>
              <p className={styles.welcomeDesc}>
                选择一个模型，输入你的问题，让 AI 助手帮你完成创作与思考
              </p>
              <div className={styles.suggestions}>
                {SUGGESTIONS.map((item) => (
                  <button
                    key={item.text}
                    type="button"
                    className={styles.suggestion}
                    onClick={() => handleSuggestion(item.text)}
                  >
                    <Icon icon={item.icon} size={16} />
                    {item.text}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 输入区：文本域 + 模型选择 + 发送按钮，焦点样式统一由外层 composer 呈现 */}
        <div className={styles.composerWrap}>
          <div className={styles.composer}>
            {/* Enter 发送、Shift + Enter 换行，autoSize 最多 6 行 */}
            <Input.TextArea
              ref={inputRef}
              variant="borderless"
              className={styles.textarea}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入消息，开始与 AI 助手对话……"
              autoSize={{ minRows: 1, maxRows: 6 }}
            />
            <div className={styles.composerToolbar}>
              {/* 模型选择：borderless 样式融入输入框 */}
              <Select
                variant="borderless"
                className={styles.modelSelect}
                value={modelId}
                onChange={setModelId}
                options={modelSelectOptions}
                loading={modelLoading}
                placeholder="选择模型"
                popupMatchSelectWidth={false}
                prefix={<Icon icon="mdi:brain" size={16} />}
                suffixIcon={<Icon icon="mdi:chevron-down" size={16} />}
              />
              <div className={styles.composerActions}>
                <span className={styles.sendHint}>
                  {busy ? 'AI 正在回复…' : 'Enter 发送 · Shift + Enter 换行'}
                </span>
                {/* 输入为空或 AI 正在回复时禁用发送 */}
                <Button
                  type="primary"
                  className={styles.sendBtn}
                  disabled={!input.trim() || busy}
                  onClick={handleSend}
                  icon={<Icon icon="mdi:send" size={16} />}
                >
                  发送
                </Button>
              </div>
            </div>
          </div>
          <div className={styles.composerTip}>AI 生成内容仅供参考，请自行核实关键信息</div>
        </div>
      </div>
    </div>
  );
};

export default AiChat;
