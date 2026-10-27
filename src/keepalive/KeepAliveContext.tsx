import { createContext, useContext, type PropsWithChildren, type RefObject } from 'react';
import { useKeepAliveRef, type KeepAliveRef } from 'keepalive-for-react';

// 定义 KeepAliveContext 的值类型
type KeepAliveContextValue = {
  aliveRef: RefObject<KeepAliveRef | undefined>;
};

// 创建 KeepAliveContext
const KeepAliveContext = createContext<KeepAliveContextValue | null>(null);

// KeepAliveProvider 组件
export const KeepAliveProvider = ({ children }: PropsWithChildren) => {
  const aliveRef = useKeepAliveRef();
  return <KeepAliveContext.Provider value={{ aliveRef }}>{children}</KeepAliveContext.Provider>;
};

//封装 useContext，并在没有 Provider 时快速失败并给出明确报错，避免拿到 null 后出现难以排查的问题。
export const usePageKeepAlive = () => {
  const context = useContext(KeepAliveContext);
  if (!context) {
    throw new Error('usePageKeepAlive 必须在 KeepAliveProvider 内使用');
  }
  return context;
};
