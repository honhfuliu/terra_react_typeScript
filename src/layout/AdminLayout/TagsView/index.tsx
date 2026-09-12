import * as React from 'react';
import styles from './index.module.less';
import {
  HomeOutlined,
  UserOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import { useState } from 'react';

// 标签数据结构
interface TagItem {
  key: string;
  title: string;
  icon: React.ReactNode;
  closable: boolean;
}

// 静态标签数据（按原型图：首页 / 用户管理 / 公告管理 / 操作日志）
const INITIAL_TAGS: TagItem[] = [
  {
    key: 'home',
    title: '首页',
    icon: <HomeOutlined style={{ color: '#13a8a8' }} />,
    closable: false,
  },
  {
    key: 'user',
    title: '用户管理',
    icon: <UserOutlined style={{ color: '#3b82f6' }} />,
    closable: true,
  },
  {
    key: 'announcement',
    title: '公告管理',
    icon: <FileTextOutlined style={{ color: '#fa8c16' }} />,
    closable: true,
  },
  {
    key: 'operation-log',
    title: '操作日志',
    icon: <FolderOpenOutlined style={{ color: '#8b5cf6' }} />,
    closable: true,
  },
];

const TagsView: React.FC = () => {
  const [tags, setTags] = useState<TagItem[]>(INITIAL_TAGS);
  // 默认选中：公告管理（与原型图一致）
  const [activeKey, setActiveKey] = useState<string>('announcement');

  // 点击标签切换选中
  const handleTagClick = (key: string) => {
    setActiveKey(key);
  };

  // 关闭标签
  const handleClose = (e: React.MouseEvent, key: string) => {
    e.stopPropagation();
    const next = tags.filter((item) => item.key !== key);
    setTags(next);
    // 关闭的是当前选中标签时，自动选中最后一个标签
    if (key === activeKey && next.length > 0) {
      setActiveKey(next[next.length - 1].key);
    }
  };

  return (
    <div className={styles.tags}>
      <div className={styles.tagList}>
        {tags.map((tag) => {
          const isActive = tag.key === activeKey;
          return (
            <div
              key={tag.key}
              className={`${styles.tagItem} ${isActive ? styles.tagItemActive : ''}`}
              onClick={() => handleTagClick(tag.key)}
            >
              <span className={styles.tagIcon}>{tag.icon}</span>
              <span className={styles.tagTitle}>{tag.title}</span>
              {tag.closable && (
                <span
                  className={styles.tagClose}
                  onClick={(e) => handleClose(e, tag.key)}
                >
                  <CloseOutlined />
                </span>
              )}
            </div>
          );
        })}
      </div>
      <span className={styles.tagHint}>右键标签可进行更多操作</span>
    </div>
  );
};
export default TagsView;
