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
  sendChatMessage,
} from '@/service/chat';

// ===== 类型 =====
interface ChatMessage {
  id: string;
  role: ChatMessageRole;
  content: string;
  createdAt: number;
}

interface Conversation {
  id: string; // 前端唯一 key
  sessionId: number | null; // 后端会话 id，新建会话回复前为 null
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

// 侧栏会话项（服务端分页数据 + 本地临时项合并后）
interface SidebarSession {
  key: string;
  sessionId: number;
  title: string;
  updatedAt: number;
  pendingReply: boolean;
}

// ===== 常量 =====
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
let idSeed = 0;
const createId = (prefix: string) => `${prefix}-${Date.now()}-${idSeed++}`;

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

const formatMessageTime = (timestamp: number) => {
  const d = new Date(timestamp);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const createDraftConversation = (): Conversation => ({
  id: createId('conv'),
  sessionId: null,
  title: '新对话',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  messages: [],
  draft: true,
});

// 后端消息 -> 页面消息
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
  const isMobile = screens.md === false;

  // 会话集合（含 draft，侧栏渲染时过滤）
  const [initialConversation] = useState<Conversation>(createDraftConversation);
  const [conversations, setConversations] = useState<Conversation[]>(() => [initialConversation]);
  const [activeId, setActiveId] = useState<string>(() => initialConversation.id);

  const [input, setInput] = useState('');
  const [modelId, setModelId] = useState<number>();
  const [modelOptions, setModelOptions] = useState<ChatModelOption[]>([]);
  const [modelLoading, setModelLoading] = useState(true);

  const [keyword, setKeyword] = useState('');
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const copyTimerRef = useRef<number | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // 侧栏会话（服务端分页）
  const [sessions, setSessions] = useState<SidebarSession[]>([]);
  const [sessionTotal, setSessionTotal] = useState(0);
  const [sessionPage, setSessionPage] = useState<number>(PAGINATION.DEFAULT_PAGE_NUM);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [sessionHasMore, setSessionHasMore] = useState(false);
  const sessionLoadingRef = useRef(false);

  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<TextAreaRef>(null);
  const prependRef = useRef(false);
  const prevScrollHeightRef = useRef(0);

  const activeConversation = conversations.find((c) => c.id === activeId) ?? conversations[0];
  const activeSessionId = activeConversation?.sessionId ?? null;
  const messages = activeConversation?.messages ?? [];
  const busy = pendingId !== null && pendingId === activeConversation?.id;

  // 拉取会话分页数据
  const fetchSessions = useCallback(
    async (page: number, append: boolean) => {
      if (sessionLoadingRef.current) return;
      sessionLoadingRef.current = true;
      setSessionLoading(true);
      try {
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
        setSessions((prev) => {
          if (!append) return rows;
          const exists = new Set(prev.map((s) => s.sessionId));
          return [...prev, ...rows.filter((row) => !exists.has(row.sessionId))];
        });
        setSessionTotal(res.total);
        setSessionPage(page);
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
    const localOnly: SidebarSession[] = conversations
      .filter((c) => !c.draft && c.sessionId !== null && !serverIds.has(c.sessionId))
      .map((c) => ({
        key: c.id,
        sessionId: c.sessionId as number,
        title: c.title,
        updatedAt: c.updatedAt,
        pendingReply: !!c.pendingReply,
      }));
    const serverItems = sessions.map((s) => ({
      ...s,
      pendingReply: !!conversations.find((c) => c.sessionId === s.sessionId)?.pendingReply,
    }));
    const merged = [...localOnly, ...serverItems];
    const value = keyword.trim().toLowerCase();
    return value ? merged.filter((s) => s.title.toLowerCase().includes(value)) : merged;
  }, [sessions, conversations, keyword]);

  // 滚动到底部加载下一页
  const handleSessionListScroll: React.UIEventHandler<HTMLDivElement> = (event) => {
    const el = event.currentTarget;
    if (!sessionHasMore || sessionLoadingRef.current) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 24) {
      void fetchSessions(sessionPage + 1, true);
    }
  };

  // 加载会话消息：后端按 id 倒序分页，第 1 页就是最新 10 条
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

  // 向上加载更早的消息：页码递增，结果前插到列表头部
  const loadOlderMessages = useCallback(
    async (conversation: Conversation) => {
      const sessionId = conversation.sessionId;
      const page = conversation.msgPage ?? 0;
      if (sessionId === null || !conversation.msgHasMore || conversation.msgLoading) return;

      const nextPage = page + 1;
      const total = conversation.msgTotal ?? 0;
      const el = listRef.current;
      prevScrollHeightRef.current = el?.scrollHeight ?? 0;
      prependRef.current = true;

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

  // 拉取模型列表
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

  // 断点切换互斥
  useEffect(() => {
    if (isMobile) setCollapsed(false);
    else setDrawerOpen(false);
  }, [isMobile]);

  // 消息列表滚动：新增消息时滚到底部；向上加载历史时保持当前位置
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    if (prependRef.current) {
      prependRef.current = false;
      el.scrollTop = el.scrollHeight - prevScrollHeightRef.current;
      return;
    }
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [activeId, messages.length, pendingId]);

  // 内容不足一屏时无法滚动，自动继续加载更早的消息
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

  const focusInput = () => window.setTimeout(() => inputRef.current?.focus(), 0);

  // 点击引导问题：填入输入框并聚焦
  const handleSuggestion = (text: string) => {
    setInput(text);
    focusInput();
  };

  // 复制整条 AI 回复
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

    const draft = createDraftConversation();
    setConversations((prev) => [...prev, draft]);
    setActiveId(draft.id);
    setInput('');
    setKeyword('');
    setDrawerOpen(false);
    focusInput();
  };

  // 切换会话
  const handleSelect = (id: string) => {
    setActiveId(id);
    setDrawerOpen(false);
  };

  // 点击侧栏会话：本地已打开则直接切换，否则新建会话容器并拉取消息
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

  // 删除会话
  const handleDelete = (id: string) => {
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

  // 删除侧栏会话
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

  // 修改会话标题
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

  // 发送消息
  const handleSend = async () => {
    const content = input.trim();
    if (!content || busy || !activeConversation) return;
    if (modelId === undefined) {
      message.warning('请先选择模型');
      return;
    }

    const conversationId = activeConversation.id;
    const sessionId = activeConversation.sessionId;
    const now = Date.now();
    const userMessage: ChatMessage = {
      id: createId('msg'),
      role: CHAT_MESSAGE_ROLE.USER,
      content,
      createdAt: now,
    };

    // 乐观更新：先插入用户消息，draft 会话转正（侧栏开始显示）
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== conversationId) return c;
        return {
          ...c,
          draft: false,
          pendingReply: true,
          // 新建会话先用首条消息截断作为临时标题，后端返回后替换
          title: c.sessionId === null ? content.slice(0, 20) : c.title,
          updatedAt: now,
          messages: [...c.messages, userMessage],
        };
      }),
    );

    setInput('');
    setPendingId(conversationId);

    try {
      const res = await sendChatMessage({ modelId, sessionId, message: content });

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== conversationId) return c;
          const nextMessages = [...c.messages];
          // 用后端返回的用户消息替换本地乐观消息
          nextMessages[nextMessages.length - 1] = {
            id: String(res.userMessage.id),
            role: CHAT_MESSAGE_ROLE.USER,
            content: res.userMessage.content,
            createdAt: parseDateTime(res.userMessage.createTime),
          };
          nextMessages.push({
            id: String(res.assistantMessage.id),
            role: CHAT_MESSAGE_ROLE.ASSISTANT,
            content: res.assistantMessage.content,
            createdAt: parseDateTime(res.assistantMessage.createTime),
          });
          return {
            ...c,
            sessionId: res.sessionId,
            title: res.title || c.title,
            pendingReply: false,
            updatedAt: Date.now(),
            messages: nextMessages,
            // 已加载过历史的会话，总数同步 +2（用户消息 + 助手消息）
            msgTotal: c.msgTotal === undefined ? c.msgTotal : c.msgTotal + 2,
          };
        }),
      );

      // 同步侧栏：新会话插到最前，已有会话更新标题和更新时间
      setSessions((prev) => {
        const exists = prev.some((s) => s.sessionId === res.sessionId);
        if (exists) {
          return prev.map((s) =>
            s.sessionId === res.sessionId
              ? { ...s, title: res.title || s.title, updatedAt: Date.now() }
              : s,
          );
        }
        return [
          {
            key: `session-${res.sessionId}`,
            sessionId: res.sessionId,
            title: res.title,
            updatedAt: Date.now(),
            pendingReply: false,
          },
          ...prev,
        ];
      });
      if (sessionId === null) setSessionTotal((prev) => prev + 1);
    } catch {
      message.error('消息发送失败，请稍后重试');
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, pendingReply: false } : c)),
      );
    } finally {
      setPendingId((prev) => (prev === conversationId ? null : prev));
    }
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (event) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void handleSend();
    }
  };

  const sidebarContent = (
    <div className={styles.sidebarInner}>
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
                        <MarkdownRenderer content={item.content} />
                      ) : (
                        item.content
                      )}
                    </div>
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
                  </div>
                </div>
              ))}

              {pendingId === activeConversation?.id && (
                <div className={styles.messageRow}>
                  <span className={styles.assistantAvatar}>
                    <Icon icon="mdi:robot-happy" size={18} />
                  </span>
                  <div className={styles.messageContent}>
                    <div className={clsx(styles.bubble, styles.assistantBubble, styles.typing)}>
                      <span className={styles.typingDot} />
                      <span className={styles.typingDot} />
                      <span className={styles.typingDot} />
                    </div>
                  </div>
                </div>
              )}
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

        <div className={styles.composerWrap}>
          <div className={styles.composer}>
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
