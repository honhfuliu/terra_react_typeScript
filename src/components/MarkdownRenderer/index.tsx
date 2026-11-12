import React, { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { useSelector } from 'react-redux';

import { RootState } from '@/store';
import styles from './index.module.less';

import CodeBlock from '@/components/MarkdownRenderer/CodeBlock.tsx';

interface MarkdownRendererProps {
  content: string;
}

/**
 * 渲染 Markdown 内容
 */
const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const themeMode = useSelector((state: RootState) => state.layout.theme);

  const isDark = themeMode === 'dark';

  useEffect(() => {
    if (themeMode === 'dark') {
      import('highlight.js/styles/github-dark.css');
    } else {
      import('highlight.js/styles/github.css');
    }
  }, [themeMode]);
  return (
    <div className={`${styles.markdown} ${isDark ? styles.dark : styles.light}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          pre({ children }) {
            // 后面我们在这里自定义代码块容器
            return <CodeBlock>{children}</CodeBlock>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
