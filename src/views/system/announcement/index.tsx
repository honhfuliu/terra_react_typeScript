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
  Dropdown,
  Form,
  Grid,
  Input,
  MenuProps,
  Modal,
  PaginationProps,
  Popconfirm,
  Row,
  Select,
  Space,
  Spin,
  Table,
  TableColumnsType,
} from 'antd';
import { useEffect, useState } from 'react';
import {
  SearchOutlined,
  ClockCircleOutlined,
  SendOutlined,
  EyeOutlined,
  EditOutlined,
  DownOutlined,
  PushpinOutlined,
  ArrowDownOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { Dayjs } from 'dayjs';
import RichTextEditor from '@/components/RichTextEditor';
import {
  noticeList,
  getNotice,
  saveNotice,
  deleteNotice,
  topNotice,
  publishNotices,
  offlineNotice,
  NoticeRow,
} from '@/service/notice.ts';
import { useDict } from '@/hooks/useDict.ts';
import DictTag from '@/components/DictTag';
import Auth from '@/components/Auth';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';

const { RangePicker } = DatePicker;

// 筛选条件表单
interface AnnounceSearchType {
  title?: string;
  noticeType?: string;
  status?: string;
  publishTime?: [Dayjs, Dayjs];
}

// 新建 / 编辑公告表单
interface AnnounceFormType {
  title: string;
  noticeType: string;
  summary?: string;
  content: string;
}

const Announcement: React.FC = () => {
  const noticeTypeOptions = useDict('sys_notice_type'); // 类型
  const noticeStatusOptions = useDict('sys_notice_status'); // 状态
  const { message } = App.useApp();
  // 按钮级权限（与后端 @SaCheckPermission 对齐）
  const permissions = useSelector((state: RootState) => state.permission.permissions);
  const hasEditPerm = permissions.includes('system:notice:edit');
  const hasDeletePerm = permissions.includes('system:notice:delete');
  const screens = Grid.useBreakpoint();
  const [searchForm] = Form.useForm<AnnounceSearchType>();

  // 表格数据
  const [dataList, setDataList] = useState<NoticeRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  // 服务端分页
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  // 表格行多选（批量发布等操作使用）
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  // “更多”下拉菜单当前展开的行 id（删除确认完成后主动收起）
  const [moreOpenId, setMoreOpenId] = useState<number | null>(null);
  // 批量发布确认气泡
  const [publishConfirmOpen, setPublishConfirmOpen] = useState(false);

  // 新建 / 编辑弹窗
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('新建公告');
  const [announceForm] = Form.useForm<AnnounceFormType>();
  // 编辑时记录公告 id，提交时带回后端以区分新增 / 修改
  const [editingId, setEditingId] = useState<number | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);

  // 预览弹窗
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewRecord, setPreviewRecord] = useState<NoticeRow | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  // 编辑详情加载
  const [editLoading, setEditLoading] = useState(false);

  // 查询公告列表
  const fetchList = async (pageNum: number, pageSize: number) => {
    const searchValues = searchForm.getFieldsValue();
    const params: AnnounceSearchType & {
      startTime?: string;
      endTime?: string;
      pageNum: number;
      pageSize: number;
    } = {
      ...searchValues,
      pageNum,
      pageSize,
    };
    // 发布时间范围转换为后端需要的 startTime / endTime 字符串（按所选时分秒精确传递）
    if (searchValues.publishTime && searchValues.publishTime.length === 2) {
      const [start, end] = searchValues.publishTime;
      params.startTime = start.format('YYYY-MM-DD HH:mm:ss');
      params.endTime = end.format('YYYY-MM-DD HH:mm:ss');
      delete params.publishTime;
    }

    setLoading(true);
    try {
      const data = await noticeList(params);
      setDataList(data.rows || []);
      setPagination((prev) => ({
        ...prev,
        current: pageNum,
        pageSize,
        total: data.total || 0,
      }));
    } catch (e) {
      console.error(e);
      setDataList([]);
      setPagination((prev) => ({ ...prev, current: pageNum, pageSize, total: 0 }));
    } finally {
      setLoading(false);
    }
  };

  // 首次加载
  useEffect(() => {
    void fetchList(1, 10);
  }, []);

  // 搜索：回到第一页
  const handleSearch = () => {
    void fetchList(1, pagination.pageSize);
  };

  // 重置：清空筛选条件并重新查询
  const handleResetSearch = () => {
    searchForm.resetFields();
    void fetchList(1, pagination.pageSize);
  };

  // 翻页
  const handlePageChange: PaginationProps['onChange'] = (page, pageSize) => {
    void fetchList(page, pageSize);
  };

  // 新建公告
  const handleAdd = () => {
    setEditingId(undefined);
    setModalTitle('新建公告');
    announceForm.resetFields();
    announceForm.setFieldsValue({ noticeType: 'ANNOUNCEMENT' });
    setModalOpen(true);
  };

  // 编辑公告：调用详情接口获取完整数据（正文 content 列表可能不返回）
  const handleEdit = async (record: NoticeRow) => {
    setEditingId(record.id);
    setModalTitle('编辑公告');
    announceForm.resetFields();
    setModalOpen(true);
    setEditLoading(true);
    try {
      const detail = await getNotice(record.id);
      announceForm.setFieldsValue({
        title: detail.title,
        noticeType: detail.noticeType,
        summary: detail.summary,
        content: detail.content,
      });
    } catch (e) {
      console.error(e);
      message.error('获取公告详情失败');
      setModalOpen(false);
    } finally {
      setEditLoading(false);
    }
  };

  // 预览公告：调用详情接口获取正文等完整数据
  const handlePreview = async (record: NoticeRow) => {
    // 先用列表行数据打开弹窗（保留 status 等列表独有字段），再用详情数据覆盖
    setPreviewRecord(record);
    setPreviewOpen(true);
    setPreviewLoading(true);
    try {
      const detail = await getNotice(record.id);
      setPreviewRecord({ ...record, ...detail });
    } catch (e) {
      console.error(e);
      message.error('获取公告详情失败');
    } finally {
      setPreviewLoading(false);
    }
  };

  // 保存
  const handleSave = async () => {
    let values: AnnounceFormType;
    try {
      values = await announceForm.validateFields();
    } catch (error) {
      console.log('表单校验失败：', error);
      return;
    }

    setSubmitting(true);
    try {
      // id 有值走修改，无值走新增，由后端根据 id 是否为空区分
      await saveNotice({
        id: editingId,
        title: values.title,
        noticeType: values.noticeType,
        content: values.content,
        summary: values.summary,
      });
      message.success(editingId ? '修改成功' : '新增成功');
      setModalOpen(false);
      announceForm.resetFields();
      // 新增后回到第一页，修改后刷新当前页
      void fetchList(editingId ? pagination.current : 1, pagination.pageSize);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  // 关闭弹窗
  const handleCancel = () => {
    setModalOpen(false);
    announceForm.resetFields();
  };

  // 置顶公告：调用置顶接口，成功后收起“更多”菜单并刷新当前页
  const handleTop = async (record: NoticeRow) => {
    try {
      await topNotice(record.id);
      message.success('置顶成功');
      setMoreOpenId(null);
      void fetchList(pagination.current, pagination.pageSize);
    } catch (e) {
      console.error(e);
    }
  };

  // 下架公告：仅已发布（status === '2'）的公告可下架
  const handleOffline = async (record: NoticeRow) => {
    try {
      await offlineNotice(record.id);
      message.success('下架成功');
      setMoreOpenId(null);
      void fetchList(pagination.current, pagination.pageSize);
    } catch (e) {
      console.error(e);
    }
  };

  // 批量发布前置校验：必须勾选、状态必须一致、已发布的不允许重复发布
  const validateBatchPublish = (): NoticeRow[] | null => {
    const selectedRows = dataList.filter((item) => selectedRowKeys.includes(item.id));
    if (selectedRows.length === 0) {
      message.warning('请先勾选要发布的公告');
      return null;
    }
    // 多选公告的状态必须一致（1 待发布 / 2 已发布 / 3 已下线）
    const statusSet = new Set(selectedRows.map((item) => item.status));
    if (statusSet.size > 1) {
      message.warning('所选公告的发布状态不一致，请选择状态相同的公告后再发布');
      return null;
    }
    // 已发布（status === '2'）的无需重复发布
    if (selectedRows[0].status === '2' || selectedRows[0].status === '3') {
      message.warning('所选公告均为「已发布 已下线」状态，无需重复发布');
      return null;
    }
    return selectedRows;
  };

  // 点击批量发布：校验通过才弹出 Popconfirm
  const handleBatchPublishClick = () => {
    if (validateBatchPublish()) {
      setPublishConfirmOpen(true);
    }
  };

  // 确认批量发布：请求体为 id 数组
  const handleBatchPublishConfirm = async () => {
    const selectedRows = validateBatchPublish();
    if (!selectedRows) {
      setPublishConfirmOpen(false);
      return;
    }
    try {
      await publishNotices(selectedRows.map((item) => item.id));
      message.success(`成功发布 ${selectedRows.length} 条公告`);
      setSelectedRowKeys([]);
      setPublishConfirmOpen(false);
      void fetchList(pagination.current, pagination.pageSize);
    } catch (e) {
      console.error(e);
    }
  };

  // 删除公告：Popconfirm 确认后调用删除接口并刷新列表
  const handleDeleteConfirm = async (record: NoticeRow) => {
    try {
      await deleteNotice(record.id);
      message.success('删除成功');
      setMoreOpenId(null);
      void fetchList(pagination.current, pagination.pageSize);
    } catch (e) {
      console.error(e);
    }
  };

  // 操作列「更多」下拉菜单：
  // - 置顶 / 下架需要 system:notice:edit；删除需要 system:notice:delete
  // - 置顶：仅待发布（1）、已发布（2）且未置顶时显示，已下架（3）不显示
  // - 仅已发布（status === '2'）显示“下架公告”
  const buildMoreMenu = (record: NoticeRow): MenuProps['items'] => {
    const items: NonNullable<MenuProps['items']> = [];
    if (
      hasEditPerm &&
      record.isTop !== '1' &&
      (record.status === '1' || record.status === '2')
    ) {
      items.push({ key: 'top', icon: <PushpinOutlined />, label: '置顶' });
    }
    if (hasEditPerm && record.status === '2') {
      items.push({ key: 'offline', icon: <ArrowDownOutlined />, label: '下架公告' });
    }
    if (hasDeletePerm) {
      items.push({
        key: 'delete',
        icon: <DeleteOutlined />,
        danger: true,
        // 气泡确认框放在菜单项内：阻止点击冒泡，避免下拉菜单先关闭把 Popconfirm 一起卸载
        label: (
          <Popconfirm
            title="确认删除"
            description={`确定要删除公告「${record.title}」吗？删除后不可恢复。`}
            okText="确定"
            cancelText="取消"
            okButtonProps={{ danger: true }}
            placement="left"
            onConfirm={() => handleDeleteConfirm(record)}
          >
            <span onClick={(e) => e.stopPropagation()}>删除公告</span>
          </Popconfirm>
        ),
      });
    }
    return items;
  };

  // 表格列配置
  const columns: TableColumnsType<NoticeRow> = [
    {
      title: '公告标题',
      dataIndex: 'title',
      key: 'title',
      width: 320,
      render: (_: string, record) => (
        <div className={styles.titleCell}>
          <div className={styles.titleLine}>
            <span className={styles.annTitle}>{record.title}</span>
            {record.isTop === '1' && <span className={styles.topTag}>置顶</span>}
          </div>
          <span className={styles.annSummary}>{record.summary}</span>
        </div>
      ),
    },
    {
      title: '类型',
      dataIndex: 'noticeType',
      key: 'noticeType',
      width: 90,
      render: (noticeType: string) => DictTag({ value: noticeType, option: noticeTypeOptions }),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => DictTag({ value: status, option: noticeStatusOptions }),
    },
    {
      title: '发布时间',
      dataIndex: 'publishTime',
      key: 'publishTime',
      width: 170,
      render: (text?: string | null) =>
        text ? <span>{text}</span> : <span className={styles.emptyTime}>-</span>,
    },
    {
      title: '失效时间',
      dataIndex: 'expireTime',
      key: 'expireTime',
      width: 170,
      render: (text?: string | null) =>
        text ? <span>{text}</span> : <span className={styles.emptyTime}>-</span>,
    },
    {
      title: '浏览量',
      dataIndex: 'viewCount',
      key: 'viewCount',
      width: 100,
      render: (viewCount?: number) => viewCount ?? 0,
    },
    {
      title: '操作',
      key: 'action',
      width: 210,
      fixed: 'right',
      render: (_, record) => {
        const moreMenuItems = buildMoreMenu(record);
        return (
          <Space className={styles.actionGroup} size="middle">
            <Auth permission={'system:notice:edit'}>
              <Button
                type="link"
                size="small"
                className={styles.actionLink}
                icon={<EyeOutlined />}
                onClick={() => handlePreview(record)}
              >
                预览
              </Button>
            </Auth>
            <Auth permission={'system:notice:edit'}>
              <Button
                type="link"
                size="small"
                className={styles.actionLink}
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
              >
                编辑
              </Button>
            </Auth>
            {moreMenuItems.length > 0 && (
              <Dropdown
                trigger={['click']}
                open={moreOpenId === record.id}
                onOpenChange={(open) => setMoreOpenId(open ? record.id : null)}
                menu={{
                  items: moreMenuItems,
                  onClick: ({ key }) => {
                    if (key === 'top') handleTop(record);
                    if (key === 'offline') handleOffline(record);
                    // 删除走菜单项内 Popconfirm，不在此处处理
                  },
                }}
              >
                <Button type="link" size="small" className={styles.actionLink}>
                  更多
                  <DownOutlined style={{ fontSize: 10 }} />
                </Button>
              </Dropdown>
            )}
          </Space>
        );
      },
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
                <Form.Item<AnnounceSearchType>
                  label={'公告类型'}
                  name="noticeType"
                  style={{ marginBottom: 0 }}
                >
                  <Select
                    placeholder={'全部类型'}
                    allowClear
                    options={noticeTypeOptions.map((item) => ({
                      label: item.dictLabel,
                      value: item.dictValue,
                    }))}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} lg={6} xl={4}>
                <Form.Item<AnnounceSearchType>
                  label={'发布状态'}
                  name="status"
                  style={{ marginBottom: 0 }}
                >
                  <Select
                    placeholder={'全部状态'}
                    allowClear
                    options={noticeStatusOptions.map((item) => ({
                      label: item.dictLabel,
                      value: item.dictValue,
                    }))}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} lg={6} xl={6}>
                <Form.Item<AnnounceSearchType>
                  label={'发布时间'}
                  name="publishTime"
                  style={{ marginBottom: 0 }}
                >
                  <RangePicker showTime style={{ width: '100%' }} />
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
            <span className={styles.cardSubtitle}>共 {pagination.total} 条公告记录</span>
          </div>
          <Space wrap>
            <Auth permission={'system:notice:add'}>
              <Button
                className={styles.toolButton}
                icon={<Add width={16} height={16} />}
                onClick={handleAdd}
              >
                新增公告
              </Button>
            </Auth>
            <Button className={styles.toolButton} icon={<ClockCircleOutlined />}>
              发布计划
            </Button>
            <Auth permission={'system:notice:edit'}>
              <Popconfirm
                open={publishConfirmOpen}
                title="确认批量发布"
                description={`确定发布选中的 ${selectedRowKeys.length} 条公告吗？`}
                okText="确定"
                cancelText="取消"
                onConfirm={handleBatchPublishConfirm}
                onCancel={() => setPublishConfirmOpen(false)}
                onOpenChange={(open) => {
                  if (!open) setPublishConfirmOpen(false);
                }}
              >
                <Button
                  className={styles.toolButton}
                  icon={<SendOutlined />}
                  onClick={handleBatchPublishClick}
                >
                  批量发布
                </Button>
              </Popconfirm>
            </Auth>
          </Space>
        </div>
        <div className={styles.tableCardBody}>
          <Table
            columns={columns}
            dataSource={dataList}
            rowKey="id"
            loading={loading}
            scroll={{ x: 1200 }}
            rowSelection={{
              selectedRowKeys,
              onChange: (keys) => setSelectedRowKeys(keys),
              fixed: 'left',
            }}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 条`,
              onChange: handlePageChange,
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
          <Button key="cancel" onClick={handleCancel} disabled={submitting || editLoading}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={submitting}
            disabled={editLoading}
            onClick={handleSave}
          >
            保存草稿
          </Button>,
        ]}
      >
        <Spin spinning={editLoading}>
          <div className={styles.modalBody}>
            <Form form={announceForm} initialValues={{ noticeType: 'ANNOUNCEMENT' }}>
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
                  <Form.Item<AnnounceFormType>
                    label="公告类型"
                    name="noticeType"
                    rules={[{ required: true, message: '公告类型不能为空!' }]}
                  >
                    <Select
                      options={noticeTypeOptions.map((item) => ({
                        label: item.dictLabel,
                        value: item.dictValue,
                      }))}
                    />
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
                    {/* 富文本编辑器：由 Form.Item 注入 value/onChange，内容变化自动收集 */}
                    <RichTextEditor />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </div>
        </Spin>
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
        <Spin spinning={previewLoading}>
          {previewRecord && (
            <div className={styles.previewBody}>
              <div className={styles.previewTitle}>{previewRecord.title}</div>
              <div className={styles.previewMeta}>
                <DictTag value={previewRecord.noticeType} option={noticeTypeOptions} />
                {previewRecord.status && (
                  <DictTag value={previewRecord.status} option={noticeStatusOptions} />
                )}
                <span>发布时间：{previewRecord.publishTime ?? '-'}</span>
                <span>失效时间：{previewRecord.expireTime ?? '-'}</span>
                <span>浏览量：{previewRecord.viewCount ?? 0}</span>
              </div>
              {previewRecord.summary && (
                <div className={styles.previewSummary}>{previewRecord.summary}</div>
              )}
              {/* 正文为富文本 HTML，直接渲染 */}
              <div
                className={styles.previewContent}
                dangerouslySetInnerHTML={{ __html: previewRecord.content ?? '' }}
              />
            </div>
          )}
        </Spin>
      </Modal>
    </div>
  );
};
export default Announcement;
