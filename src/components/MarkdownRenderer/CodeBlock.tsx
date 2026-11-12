import React from 'react';
import { Button, message } from 'antd';
import { CopyOutlined, CheckOutlined } from '@ant-design/icons';

import styles from './index.module.less';

interface CodeBlockProps {
  children: React.ReactNode;
}

/**
 * 代码块组件
 */
const CodeBlock: React.FC<CodeBlockProps> = ({ children }) => {
  const [copied, setCopied] = React.useState(false);

  /**
   * 提取代码文本
   */
  const getCodeText = (node: React.ReactNode): string => {
    if (typeof node === 'string' || typeof node === 'number') {
      return String(node);
    }

    if (Array.isArray(node)) {
      return node.map(getCodeText).join('');
    }

    if (React.isValidElement<{ children?: React.ReactNode }>(node)) {
      return getCodeText(node.props.children);
    }

    return '';
  };

  const code = getCodeText(children);

  /**
   * 复制代码
   */
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      message.success('代码复制成功');

      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      message.error('复制失败，请手动复制');
    }
  };

  return (
    <div className={styles.codeBlock}>
      <div className={styles.header}>
        <span className={styles.language}>代码</span>

        <Button
          type="text"
          size="small"
          icon={copied ? <CheckOutlined /> : <CopyOutlined />}
          onClick={handleCopy}
        >
          {copied ? '已复制' : '复制代码'}
        </Button>
      </div>

      <pre>{children}</pre>
    </div>
  );
};

export default CodeBlock;
