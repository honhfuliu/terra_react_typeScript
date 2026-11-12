import request from '@/utils/request.ts';
import { fetchEventSource } from '@microsoft/fetch-event-source';

import { getAuthHeaders, handleForbidden, handleUnauthorized } from '@/utils/requestAuth.ts';
import { HTTP } from '@/constants';

// 发送对话消息入参（sessionId 为 null 时表示新建会话）
export type SendChatParams = {
  modelId: number;
  sessionId: number | null;
  message: string;
};

// 消息角色（与后端 AiChatMessageRole 枚举保持一致）
export const CHAT_MESSAGE_ROLE = {
  USER: 'USER',
  ASSISTANT: 'ASSISTANT',
} as const;

export type ChatMessageRole = (typeof CHAT_MESSAGE_ROLE)[keyof typeof CHAT_MESSAGE_ROLE];

// 对话消息（后端返回）
export type ChatMessageDto = {
  id: number;
  content: string;
  role: ChatMessageRole;
  modelId: number | null;
  modelName: string | null;
  providerName: string | null;
  createTime: string;
};

// 发送对话消息返回
export type SendChatResult = {
  sessionId: number;
  title: string;
  userMessage: ChatMessageDto;
  assistantMessage: ChatMessageDto;
};

// 发送对话消息
export const sendChatMessage = async (data: SendChatParams) => {
  try {
    return await request.post<SendChatResult>('/ai/chat/send', data);
  } catch (e) {
    console.error(e);
    throw e;
  }
};

/**
 * AI 流式事件
 */
export interface AiChatStreamEvent<T = unknown> {
  type: 'start' | 'chunk' | 'complete' | 'error';
  data: T;
}

// 流式聊天请求参数
export type StreamChatParams = SendChatParams & {
  signal?: AbortSignal;
};

// 流式聊天回调
export interface StreamChatCallbacks {
  onMessage: (event: AiChatStreamEvent) => void;
  onClose?: () => void;
  onError?: (error: Error) => void;
}

// AI 流式聊天
// AI 流式聊天
export const streamChatMessage = async (data: StreamChatParams, callbacks: StreamChatCallbacks) => {
  const baseURL = import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '');
  await fetchEventSource(`${baseURL}/ai/chat/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({
      sessionId: data.sessionId,
      modelId: data.modelId,
      message: data.message,
    }),
    signal: data.signal,
    // 建立连接后检查响应
    async onopen(response) {
      if (response.status === HTTP.UNAUTHORIZED) {
        handleUnauthorized();
        throw new Error('登录已失效');
      }
      if (response.status === HTTP.FORBIDDEN) {
        handleForbidden();
        throw new Error('没有权限访问该资源');
      }
      if (!response.ok) {
        throw new Error(`请求失败：${response.status}`);
      }
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('text/event-stream')) {
        throw new Error('响应类型不是 SSE');
      }
    },

    // 接收 SSE 消息
    onmessage(message) {
      if (!message.data) return;
      try {
        const eventData = JSON.parse(message.data) as AiChatStreamEvent;
        if (message.event && message.event !== eventData.type) {
          throw new Error('SSE 事件类型不一致');
        }
        callbacks.onMessage(eventData);
      } catch (error) {
        console.error('SSE 事件解析失败：', error);
      }
    },

    // 连接正常关闭
    onclose() {
      callbacks.onClose?.();
    },

    // 请求异常
    onerror(error) {
      const requestError = error instanceof Error ? error : new Error('AI 流式请求失败');
      callbacks.onError?.(requestError);
      // 抛出异常，停止自动重试
      throw requestError;
    },
  });
};
