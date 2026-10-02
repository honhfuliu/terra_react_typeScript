import * as React from 'react';
import { useSelector } from 'react-redux';
import RjvJsonView from '@uiw/react-json-view';
import { githubLightTheme } from '@uiw/react-json-view/githubLight';
import { githubDarkTheme } from '@uiw/react-json-view/githubDark';
import { RootState } from '@/store';
import styles from './index.module.less';

// 等宽字体栈
const MONO_FONT_STACK = "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace";

export interface JsonViewerProps {
  /** 要展示的数据：对象/数组以树形结构展示，原始类型以文本展示；JSON 字符串请在外部解析后传入 */
  value: unknown;
  /**
   * 默认折叠层级：数字表示折叠到第几层，true 全部折叠，false 全部展开
   * @default 2
   */
  collapsed?: boolean | number;
  /** 容器最大高度，超出后内部滚动，传 0/undefined 表示不限高
   * @default 320
   */
  maxHeight?: number;
  /** 自定义容器类名 */
  className?: string;
}

/**
 * 通用 JSON 视图
 * - 基于 @uiw/react-json-view 的树形展示，支持展开/折叠与复制
 * - 自动跟随系统亮/暗主题切换语法高亮配色
 * - 自带带边框/滚动条的代码容器，非对象类型降级为纯文本展示
 */
const JsonViewer: React.FC<JsonViewerProps> = ({
  value,
  collapsed = 2,
  maxHeight = 320,
  className,
}) => {
  const themeMode = useSelector((state: RootState) => state.layout.theme);
  const theme = themeMode === 'dark' ? githubDarkTheme : githubLightTheme;

  const jsonStyle = {
    ...theme,
    // 透明背景，使用外层容器背景
    '--w-rjv-background-color': 'transparent',
    // 层级缩进线跟随全局边框色
    '--w-rjv-line-color': 'var(--border-color)',
    '--w-rjv-font-family': MONO_FONT_STACK,
    fontSize: 13,
    lineHeight: 1.7,
  } as React.CSSProperties;

  const blockClassName = [styles.jsonBlock, className].filter(Boolean).join(' ');

  // 非对象/数组（字符串、数字、布尔、null 等）直接以文本展示
  if (value === null || typeof value !== 'object') {
    return (
      <div
        className={blockClassName}
        style={maxHeight ? { maxHeight } : undefined}
      >
        <span className={styles.jsonPrimitive}>
          {value === null ? 'null' : String(value)}
        </span>
      </div>
    );
  }

  return (
    <div
      className={blockClassName}
      style={maxHeight ? { maxHeight } : undefined}
    >
      <RjvJsonView
        value={value as object}
        style={jsonStyle}
        // 隐藏值前面的类型标注（如 "string"），界面更干净
        displayDataTypes={false}
        // 显示对象/数组元素数量
        displayObjectSize
        // 支持点击复制
        enableClipboard
        // 默认展开两层，深层内容点击箭头展开
        collapsed={collapsed}
        // 长文本截断阈值放宽，减少无谓的省略号
        shortenTextAfterLength={100}
        indentWidth={16}
        highlightUpdates={false}
      />
    </div>
  );
};

export default JsonViewer;
