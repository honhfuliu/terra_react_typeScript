import * as React from 'react';
import styles from './index.module.less';

import Search from '@/assets/svgs/Search.svg?react';
import Freshen from '@/assets/svgs/Freshen.svg?react';
import Add from '@/assets/svgs/Add.svg?react';
import {
  App,
  Button,
  Col,
  DatePicker,
  Form,
  Grid,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Table,
  TableColumnsType,
} from 'antd';
import { useState } from 'react';
import {
  SearchOutlined,
  ClockCircleOutlined,
  SendOutlined,
  EyeOutlined,
  EditOutlined,
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';

const { RangePicker } = DatePicker;

// 公告类型：通知 / 公告
type AnnounceType = 'notice' | 'announcement';

// 发布状态：已发布 / 待发布 / 草稿 / 已下线
type AnnounceStatus = 'published' | 'pending' | 'draft' | 'offline';

// 公告记录数据结构
interface AnnouncementRecord {
  id: number;
  title: string; // 公告标题
  summary: string; // 公告摘要
  type: AnnounceType; // 类型
  status: AnnounceStatus; // 状态
  top: boolean; // 是否置顶
  publishTime: string | null; // 发布时间
  expireTime: string | null; // 失效时间
  views: number; // 浏览量
  content: string; // 公告内容
}

// 筛选条件表单
interface AnnounceSearchType {
  title?: string;
  type?: AnnounceType;
  status?: AnnounceStatus;
  publishTime?: [Dayjs, Dayjs];
}

// 新建 / 编辑公告表单
interface AnnounceFormType {
  title: string;
  type: AnnounceType;
  summary?: string;
  content: string;
}

// 类型选项
const TYPE_OPTIONS = [
  { label: '通知', value: 'notice' as AnnounceType },
  { label: '公告', value: 'announcement' as AnnounceType },
];

// 状态选项
const STATUS_OPTIONS: { label: string; value: AnnounceStatus }[] = [
  { label: '已发布', value: 'published' },
  { label: '待发布', value: 'pending' },
  { label: '草稿', value: 'draft' },
  { label: '已下线', value: 'offline' },
];

// 静态演示数据
const MOCK_DATA: AnnouncementRecord[] = [
  {
    id: 1,
    title: '关于 2026 年中秋节放假安排的通知',
    summary: '根据国家节假日安排，现将 2026 年中秋节放假事...',
    type: 'notice',
    status: 'published',
    top: true,
    publishTime: '2026-09-08 10:30',
    expireTime: '2026-10-08 23:59',
    views: 1286,
    content:
      '根据国家节假日安排，现将 2026 年中秋节放假事项通知如下：\n一、放假时间：2026 年 9 月 25 日至 9 月 27 日，共 3 天。\n二、请各部门提前做好工作安排，放假期间注意安全。',
  },
  {
    id: 2,
    title: '系统将于今晚进行例行维护',
    summary: '为保障系统稳定运行，平台将进行例行维护。',
    type: 'announcement',
    status: 'pending',
    top: false,
    publishTime: '2026-09-10 22:00',
    expireTime: '2026-09-11 02:00',
    views: 0,
    content: '为保障系统稳定运行，平台将于 2026-09-10 22:00 至次日 02:00 进行例行维护，维护期间系统将暂停服务，请提前做好准备。',
  },
  {
    id: 3,
    title: '平台用户协议更新说明',
    summary: '本次更新主要涉及隐私保护与账号安全相关内容。',
    type: 'announcement',
    status: 'draft',
    top: false,
    publishTime: null,
    expireTime: null,
    views: 0,
    content: '本次更新主要涉及隐私保护与账号安全相关内容，更新后的协议将于近期发布，请留意后续通知。',
  },
  {
    id: 4,
    title: '新版本功能上线公告',
    summary: '本次版本新增多项管理能力与体验优化。',
    type: 'notice',
    status: 'offline',
    top: false,
    publishTime: '2026-08-20 09:00',
    expireTime: '2026-09-01 23:59',
    views: 864,
    content: '本次版本新增多项管理能力与体验优化，包括公告管理、登录日志等模块，欢迎体验。',
  },
];

const Announcement: React.FC = () => {
  const { message } = App.useApp();
  const screens = Grid.useBreakpoint();
  const [searchForm] = Form.useForm<AnnounceSearchType>();
  const [dataList, setDataList] = useState<AnnouncementRecord[]>(MOCK_DATA);

  // 新建 / 编辑弹窗
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('新建公告');
  const [announceForm] = Form.useForm<AnnounceFormType>();

  // 预览弹窗
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewRecord, setPreviewRecord] = useState<AnnouncementRecord | null>(null);

  // 搜索（静态页面：在本地演示数据上筛选）
  const handleSearch = () => {
    const values = searchForm.getFieldsValue();
    let result = [...MOCK_DATA];

    const keyword = values.title?.trim();
    if (keyword) {
      result = result.filter((item) => item.title.includes(keyword));
    }

    if (values.type) {
      result = result.filter((item) => item.type === values.type);
    }

    if (values.status) {
      result = result.filter((item) => item.status === values.status);
    }

    if (values.publishTime && values.publishTime.length === 2) {
      const [start, end] = values.publishTime;
      result = result.filter((item) => {
        if (!item.publishTime) return false;
        const time = dayjs(item.publishTime);
        return time.isAfter(start.startOf('day')) && time.isBefore(end.endOf('day'));
      });
    }

    setDataList(result);
  };

  // 重置
  const handleResetSearch = () => {
    searchForm.resetFields();
    setDataList(MOCK_DATA);
  };

  // 新建公告
  const handleAdd = () => {
    setModalTitle('新建公告');
    announceForm.resetFields();
    announceForm.setFieldsValue({ type: 'announcement' });
    setModalOpen(true);
  };

  // 编辑公告
  const handleEdit = (record: AnnouncementRecord) => {
    setModalTitle('编辑公告');
    announceForm.setFieldsValue({
      title: record.title,
      type: record.type,
      summary: record.summary,
      content: record.content,
    });
    setModalOpen(true);
  };

  // 预览公告
  const handlePreview = (record: AnnouncementRecord) => {
    setPreviewRecord(record);
    setPreviewOpen(true);
  };

  // 保存草稿
  const handleSave = async () => {
    try {
      await announceForm.validateFields();
    } catch (error) {
      console.log('表单校验失败：', error);
      return;
    }
    message.success('保存成功');
    setModalOpen(false);
    announceForm.resetFields();
  };

  // 关闭弹窗
  const handleCancel = () => {
    setModalOpen(false);
    announceForm.resetFields();
  };

  // 类型标签
  const renderTypeTag = (type: AnnounceType) => {
    const isNotice = type === 'notice';
    const label = isNotice ? '通知' : '公告';
    return (
      <span className={`${styles.typeTag} ${isNotice ? styles.typeNotice : styles.typeAnnounce}`}>
        {label}
      </span>
    );
  };

  // 状态标签
  const renderStatusTag = (status: AnnounceStatus) => {
    const map: Record<AnnounceStatus, { label: string; cls: string }> = {
      published: { label: '已发布', cls: styles.statusPublished },
      pending: { label: '待发布', cls: styles.statusPending },
      draft: { label: '草稿', cls: styles.statusDraft },
      offline: { label: '已下线', cls: styles.statusOffline },
    };
    const item = map[status];
    return <span className={`${styles.statusTag} ${item.cls}`}>{item.label}</span>;
  };

  // 表格列配置
  const columns: TableColumnsType<AnnouncementRecord> = [
    {
      title: '公告标题',
      dataIndex: 'title',
      key: 'title',
      width: 320,
      render: (_: string, record) => (
        <div className={styles.titleCell}>
          <div className={styles.titleLine}>
            <span className={styles.annTitle}>{record.title}</span>
            {record.top && <span className={styles.topTag}>置顶</span>}
          </div>
          <span className={styles.annSummary}>{record.summary}</span>
        </div>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 90,
      render: (type: AnnounceType) => renderTypeTag(type),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: AnnounceStatus) => renderStatusTag(status),
    },
    {
      title: '发布时间',
      dataIndex: 'publishTime',
      key: 'publishTime',
      width: 160,
      render: (text: string | null) =>
        text ? <span>{text}</span> : <span className={styles.emptyTime}>-</span>,
    },
    {
      title: '失效时间',
      dataIndex: 'expireTime',
      key: 'expireTime',
      width: 160,
      render: (text: string | null) =>
        text ? <span>{text}</span> : <span className={styles.emptyTime}>-</span>,
    },
    {
      title: '浏览量',
      dataIndex: 'views',
      key: 'views',
      width: 100,
      sorter: (a, b) => a.views - b.views,
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space className={styles.actionGroup} size="middle">
          <Button
            type="link"
            size="small"
            className={styles.actionLink}
            icon={<EyeOutlined />}
            onClick={() => handlePreview(record)}
          >
            预览
          </Button>
          <Button
            type="link"
            size="small"
            className={styles.actionLink}
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.layout}>
      {/* 卡片一：筛选条件 */}
      <div className={styles.searchCard}>
        <div className={styles.searchCardHeader}>
          <div className={styles.titleWrap}>
            <span className={styles.titleIcon}>
              <SearchOutlined />
            </span>
            <span className={styles.cardTitle}>筛选条件</span>
            <span className={styles.cardSubtitle}>快速查找公告内容</span>
          </div>
        </div>
        <div className={styles.searchCardBody}>
          <Form form={searchForm}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} lg={6} xl={5}>
                <Form.Item<AnnounceSearchType>
                  label={'公告标题'}
                  name="title"
                  style={{ marginBottom: 0 }}
                >
                  <Input placeholder={'请输入公告标题'} allowClear />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} lg={6} xl={4}>
                <Form.Item<AnnounceSearchType> label={'公告类型'} name="type" style={{ marginBottom: 0 }}>
                  <Select placeholder={'全部类型'} allowClear options={TYPE_OPTIONS} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} lg={6} xl={4}>
                <Form.Item<AnnounceSearchType>
                  label={'发布状态'}
                  name="status"
                  style={{ marginBottom: 0 }}
                >
                  <Select placeholder={'全部状态'} allowClear options={STATUS_OPTIONS} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} lg={6} xl={6}>
                <Form.Item<AnnounceSearchType>
                  label={'发布时间'}
                  name="publishTime"
                  style={{ marginBottom: 0 }}
                >
                  <RangePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col xs={24} lg={24} xl={5}>
                <div className={styles.searchActions}>
                  <Button
                    type="primary"
                    icon={<Search width={16} height={16} />}
                    onClick={handleSearch}
                  >
                    搜索
                  </Button>
                  <Button icon={<Freshen width={16} height={16} />} onClick={handleResetSearch}>
                    重置
                  </Button>
                </div>
              </Col>
            </Row>
          </Form>
        </div>
      </div>

      {/* 卡片二：公告列表 */}
      <div className={styles.tableCard}>
        <div className={styles.tableCardHeader}>
          <div className={styles.titleBlock}>
            <span className={styles.cardTitle}>公告列表</span>
            <span className={styles.cardSubtitle}>共 {dataList.length} 条公告记录</span>
          </div>
          <Space wrap>
            <Button
              className={styles.toolButton}
              icon={<Add width={16} height={16} />}
              onClick={handleAdd}
            >
              新增公告
            </Button>
            <Button className={styles.toolButton} icon={<ClockCircleOutlined />}>
              发布计划
            </Button>
            <Button className={styles.toolButton} icon={<SendOutlined />}>
              批量发布
            </Button>
          </Space>
        </div>
        <div className={styles.tableCardBody}>
          <Table
            columns={columns}
            dataSource={dataList}
            rowKey="id"
            scroll={{ x: 1140 }}
            pagination={{
              pageSize: 10,
              showSizeChanger: false,
              showTotal: (total) => `共 ${total} 条`,
            }}
          />
        </div>
      </div>

      {/* 新建 / 编辑公告弹窗 */}
      <Modal
        width={screens.md ? 860 : 'calc(100vw - 32px)'}
        title={modalTitle}
        closable={{ 'aria-label': 'Custom Close Button' }}
        open={modalOpen}
        onCancel={handleCancel}
        footer={[
          <Button key="cancel" onClick={handleCancel}>
            Cancel
          </Button>,
          <Button key="submit" type="primary" onClick={handleSave}>
            保存草稿
          </Button>,
        ]}
      >
        <div className={styles.modalBody}>
          <Form form={announceForm} initialValues={{ type: 'announcement' }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} md={16}>
                <Form.Item<AnnounceFormType>
                  label="公告标题"
                  name="title"
                  rules={[{ required: true, message: '公告标题不能为空!' }]}
                >
                  <Input placeholder={'请输入公告标题'} maxLength={200} showCount allowClear />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item<AnnounceFormType> label="公告类型" name="type">
                  <Select options={TYPE_OPTIONS} />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item<AnnounceFormType> label="公告摘要" name="summary">
                  <Input.TextArea
                    placeholder={'用于列表展示的简短摘要，可选'}
                    rows={3}
                    maxLength={500}
                    showCount
                  />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item<AnnounceFormType>
                  label="公告内容"
                  name="content"
                  rules={[{ required: true, message: '公告内容不能为空!' }]}
                >
                  {/* 富文本编辑器占位：后续替换为富文本组件 */}
                  <Input.TextArea
                    className={styles.editorPlaceholder}
                    placeholder={'请输入公告正文内容...'}
                    rows={10}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </div>
      </Modal>

      {/* 预览弹窗 */}
      <Modal
        width={screens.md ? 760 : 'calc(100vw - 32px)'}
        title="公告预览"
        open={previewOpen}
        onCancel={() => setPreviewOpen(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setPreviewOpen(false)}>
            关闭
          </Button>,
        ]}
      >
        {previewRecord && (
          <div className={styles.previewBody}>
            <div className={styles.previewTitle}>{previewRecord.title}</div>
            <div className={styles.previewMeta}>
              {renderTypeTag(previewRecord.type)}
              {renderStatusTag(previewRecord.status)}
              <span>发布时间：{previewRecord.publishTime ?? '-'}</span>
              <span>失效时间：{previewRecord.expireTime ?? '-'}</span>
              <span>浏览量：{previewRecord.views}</span>
            </div>
            <div className={styles.previewSummary}>{previewRecord.summary}</div>
            <div className={styles.previewContent}>{previewRecord.content}</div>
          </div>
        )}
      </Modal>
    </div>
  );
};
export default Announcement;
