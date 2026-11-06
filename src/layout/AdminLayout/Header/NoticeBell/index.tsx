import * as React from 'react';
import { useEffect, useState } from 'react';
import styles from './index.module.less';
import { Badge, Drawer, Dropdown, Empty, List, Spin, Tag } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import { getLatestNotices, getNotice, NoticeDetail, NoticeLatestItem } from '@/service/notice.ts';
import { useDict } from '@/hooks/useDict.ts';
import { COMMON_STATUS, DICT_TYPE } from '@/constants';
import DictTag from '@/components/DictTag';

// 初版下拉最多展示条数
const MAX_VISIBLE = 5;

const NoticeBell: React.FC = () => {
  const noticeTypeOptions = useDict(DICT_TYPE.SYS_NOTICE_TYPE);
  const [list, setList] = useState<NoticeLatestItem[]>([]);
  const [loading, setLoading] = useState(false);

  // 右侧抽屉状态
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detail, setDetail] = useState<NoticeDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // 仅在组件挂载时加载一次（登录成功后 / F5 刷新时触发）
  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await getLatestNotices();
        if (!cancelled) {
          setList(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        console.error('获取最新公告失败:', e);
        if (!cancelled) setList([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void fetchData();
    return () => {
      cancelled = true;
    };
  }, []);

  // 点击公告项：拉取详情并打开右侧抽屉
  const handleItemClick = async (id: number) => {
    setDrawerOpen(true);
    setDetail(null);
    setDetailLoading(true);
    try {
      const data = await getNotice(id);
      setDetail(data);
    } catch (e) {
      console.error('获取公告详情失败:', e);
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  // 下拉内容（最多展示 MAX_VISIBLE 条）
  const dropdownRender = () => (
    <div className={styles.popup}>
      <div className={styles.popupHeader}>
        <span className={styles.popupTitle}>最新公告</span>
        <span className={styles.popupCount}>共 {list.length} 条</span>
      </div>
      <div className={styles.popupBody}>
        {loading ? (
          <div className={styles.loading}>加载中...</div>
        ) : list.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无公告" />
        ) : (
          <List
            dataSource={list.slice(0, MAX_VISIBLE)}
            renderItem={(item) => (
              <List.Item
                className={styles.listItem}
                onClick={() => handleItemClick(item.id)}
              >
                <div className={styles.itemMain}>
                  <div className={styles.itemTitle}>
                    <DictTag value={item.noticeType} option={noticeTypeOptions} />
                    {item.isTop === COMMON_STATUS.ENABLED && (
                      <Tag color="red" className={styles.topTag}>
                        置顶
                      </Tag>
                    )}
                  </div>
                  <div className={styles.itemSummary}>{item.summary || '无摘要'}</div>
                  <div className={styles.itemTime}>{item.createTime}</div>
                </div>
              </List.Item>
            )}
          />
        )}
      </div>
    </div>
  );

  return (
    <>
      <Dropdown placement="bottomRight" trigger={['click']} popupRender={dropdownRender}>
        <a onClick={(e) => e.preventDefault()}>
          <Badge count={list.length} size="small" offset={[2, 2]}>
            <BellOutlined style={{ fontSize: 16, cursor: 'pointer' }} />
          </Badge>
        </a>
      </Dropdown>

      {/* 右侧抽屉：公告详情 */}
      <Drawer
        title="公告详情"
        placement="right"
        size={560}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        destroyOnHidden
      >
        <Spin spinning={detailLoading}>
          {detail ? (
            <div className={styles.drawerBody}>
              <div className={styles.detailTitle}>{detail.title}</div>
              <div className={styles.detailMeta}>
                <DictTag value={detail.noticeType} option={noticeTypeOptions} />
                <span>发布时间：{detail.publishTime ?? '-'}</span>
                <span>浏览量：{detail.viewCount ?? 0}</span>
              </div>
              {detail.summary && (
                <div className={styles.detailSummary}>{detail.summary}</div>
              )}
              {/* 正文为富文本 HTML，直接渲染 */}
              <div
                className={styles.detailContent}
                dangerouslySetInnerHTML={{ __html: detail.content ?? '' }}
              />
            </div>
          ) : (
            !detailLoading && <Empty description="暂无内容" />
          )}
        </Spin>
      </Drawer>
    </>
  );
};

export default NoticeBell;
