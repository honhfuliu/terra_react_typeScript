import * as React from 'react';
import styles from './index.module.less';

import Search from '@/assets/svgs/Search.svg?react';
import Freshen from '@/assets/svgs/Freshen.svg?react';
import Download from '@/assets/svgs/Download.svg?react';
import Delete from '@/assets/svgs/Delete.svg?react';
import {
  App,
  Button,
  Col,
  DatePicker,
  Form,
  Grid,
  Input,
  Modal,
  PaginationProps,
  Popconfirm,
  Row,
  Select,
  Space,
  Table,
  TableColumnsType,
} from 'antd';
import { useEffect, useState } from 'react';
import { FilterOutlined, EyeOutlined, ClearOutlined } from '@ant-design/icons';
import {
  operationLogClear,
  operationLogDelete,
  operationLogList,
  OperationLogRow,
  OperationLogSearchType,
} from '@/service/operationLog.ts';
import { useDict } from '@/hooks/useDict.ts';
import DictTag from '@/components/DictTag';
import JsonViewer from '@/components/JsonViewer';

const { RangePicker } = DatePicker;

// 操作状态：1 成功 0 失败
const STATUS_SUCCESS = 1;
const STATUS_FAIL = 0;

// 筛选条件（表单字段，与服务端查询参数分离）
interface LogSearchFormType {
  username?: string; // 操作账号
  module?: string; // 业务模块
  operation?: string; // 操作类型
  status?: number; // 操作状态
  requestIp?: string; // 请求 IP
  operationTime?: [import('dayjs').Dayjs, import('dayjs').Dayjs]; // 操作时间范围
}

const OperationLog: React.FC = () => {
  const operateTypeOptions = useDict('sys_operate_type');
  const operateModuleOptions = useDict('sys_operate_module');
  const resultStatusOptions = useDict('sys_result_status');

  const avatar = 'https://i.imgur.com/MK3eW3As.jpg';
  const longArray = new Array(1000).fill(1);
  const example = {
    avatar,
    string: 'Lorem ipsum dolor sit amet',
    integer: 42,
    float: 114.514,
    bigint: 10086n,
    null: null,
    undefined,
    timer: 0,
    date: new Date('Tue Sep 13 2022 14:07:44 GMT-0500 (Central Daylight Time)'),
    array: [19, 100.86, 'test', NaN, Infinity],
    nestedArray: [
      [1, 2],
      [3, 4],
    ],
    object: {
      'first-child': true,
      'second-child': false,
      'last-child': null,
    },
    longArray,
    string_number: '1234',
  };

  const { message } = App.useApp();
  const screens = Grid.useBreakpoint();
  const [searchForm] = Form.useForm<LogSearchFormType>();

  // 表格数据
  const [dataList, setDataList] = useState<OperationLogRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  // 清空操作 loading
  const [clearing, setClearing] = useState<boolean>(false);
  // 表格多选
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  // 批量删除 loading
  const [deleting, setDeleting] = useState<boolean>(false);
  // 服务端分页
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // 详情弹窗
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRecord, setDetailRecord] = useState<OperationLogRow | null>(null);

  // 查询操作日志列表
  const fetchList = async (pageNum: number, pageSize: number) => {
    const searchValues = searchForm.getFieldsValue();
    const params: OperationLogSearchType = {
      username: searchValues.username,
      module: searchValues.module,
      operation: searchValues.operation,
      status: searchValues.status,
      requestIp: searchValues.requestIp,
      pageNum,
      pageSize,
    };

    // 操作时间范围转换为后端需要的 startTime / endTime 字符串
    if (searchValues.operationTime && searchValues.operationTime.length === 2) {
      const [start, end] = searchValues.operationTime;
      params.startTime = start.format('YYYY-MM-DD HH:mm:ss');
      params.endTime = end.format('YYYY-MM-DD HH:mm:ss');
    }

    setLoading(true);
    try {
      const data = await operationLogList(params);
      setDataList(data.rows || []);
      // 数据刷新后清空多选，避免残留失效的选中项
      setSelectedRowKeys([]);
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

  // 导出
  const handleExport = () => {
    message.success('导出成功');
  };

  // 清空操作日志
  const handleClearAll = async () => {
    setClearing(true);
    try {
      await operationLogClear();
      message.success('日志已清空');
      // 清空后回到第一页重新拉取，保证分页状态与数据一致
      void fetchList(1, pagination.pageSize);
    } catch (e) {
      console.error(e);
    } finally {
      setClearing(false);
    }
  };

  // 批量删除选中的操作日志
  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先勾选要删除的日志');
      return;
    }
    setDeleting(true);
    try {
      await operationLogDelete(selectedRowKeys);
      message.success(`成功删除 ${selectedRowKeys.length} 条日志`);
      void fetchList(pagination.current, pagination.pageSize);
    } catch (e) {
      console.error(e);
    } finally {
      setDeleting(false);
    }
  };

  // 查看详情
  const handleDetail = (record: OperationLogRow) => {
    setDetailRecord(record);
    setDetailOpen(true);
  };

  // 格式化操作前后数据（JSON 字符串美化展示，非 JSON 时原样展示，空值显示 -）
  const parseNestedJson = (value: unknown): unknown => {
    // 字符串：尝试解析 JSON
    if (typeof value === 'string') {
      try {
        return parseNestedJson(JSON.parse(value));
      } catch {
        return value;
      }
    }
    // 数组：递归处理每一项
    if (Array.isArray(value)) {
      return value.map((item) => parseNestedJson(item));
    }
    // 对象：递归处理每个属性
    if (value !== null && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value).map(([key, val]) => [key, parseNestedJson(val)]),
      );
    }
    // number / boolean / null
    return value;
  };

  // 状态标签
  const renderStatusTag = (status: number) => (
    <span
      className={`${styles.statusTag} ${
        status === STATUS_SUCCESS ? styles.statusSuccess : styles.statusFail
      }`}
    >
      {status === STATUS_SUCCESS ? '成功' : '失败'}
    </span>
  );

  // 请求方法标签样式
  const methodClassName = (method: string) => {
    const map: Record<string, string> = {
      GET: styles.methodGet,
      POST: styles.methodPost,
      PUT: styles.methodPut,
      DELETE: styles.methodDelete,
    };
    return `${styles.methodTag} ${map[method] || styles.methodGet}`;
  };

  // 表格列配置
  const columns: TableColumnsType<OperationLogRow> = [
    {
      title: '操作账号',
      dataIndex: 'username',
      key: 'username',
      width: 110,
      render: (text: string) => <span className={styles.accountName}>{text}</span>,
    },
    {
      title: '业务模块',
      dataIndex: 'module',
      key: 'module',
      width: 110,
      render: (module: string) => DictTag({ value: module, option: operateModuleOptions }),
    },
    {
      title: '操作类型',
      dataIndex: 'operation',
      key: 'operation',
      width: 110,
      render: (operation: string) => DictTag({ value: operation, option: operateTypeOptions }),
    },
    // {
    //   title: '操作对象',
    //   key: 'target',
    //   width: 160,
    //   render: (_, record) => (
    //     <div className={styles.targetCell}>
    //       <span className={styles.targetName}>{record.targetName || '-'}</span>
    //       {record.targetType && (
    //         <span className={styles.targetType}>{record.targetType}</span>
    //       )}
    //     </div>
    //   ),
    // },
    {
      title: '请求信息',
      key: 'request',
      width: 200,
      render: (_, record) => (
        <div className={styles.requestCell}>
          <div className={styles.requestLine}>
            <span className={methodClassName(record.requestMethod)}>{record.requestMethod}</span>
            <span className={styles.requestIp}>{record.requestIp || '-'}</span>
          </div>
          <span className={styles.requestLocation}>{record.requestLocation || '-'}</span>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status: string) => DictTag({ value: status, option: resultStatusOptions }),
    },
    {
      title: '耗时',
      dataIndex: 'costTime',
      key: 'costTime',
      width: 90,
      render: (value: number) => <span className={styles.duration}>{value} ms</span>,
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 170,
      render: (text: string) => <span className={styles.createTime}>{text}</span>,
    },
    {
      title: '操作',
      key: 'action',
      width: 90,
      fixed: 'right',
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          className={styles.actionLink}
          icon={<EyeOutlined />}
          onClick={() => handleDetail(record)}
        >
          详情
        </Button>
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
              <FilterOutlined />
            </span>
            <span className={styles.cardTitle}>筛选条件</span>
            <span className={styles.cardSubtitle}>按账号、模块、操作和状态快速查找</span>
          </div>
        </div>
        <div className={styles.searchCardBody}>
          <Form form={searchForm}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} lg={8} xl={4}>
                <Form.Item<LogSearchFormType>
                  label={'操作账号'}
                  name="username"
                  style={{ marginBottom: 0 }}
                >
                  <Input placeholder={'请输入操作账号'} allowClear />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} lg={8} xl={5}>
                <Form.Item<LogSearchFormType>
                  label={'业务模块'}
                  name="module"
                  style={{ marginBottom: 0 }}
                >
                  <Select
                    placeholder={'全部模块'}
                    allowClear
                    options={operateModuleOptions.map((item) => ({
                      label: item.dictLabel,
                      value: item.dictValue,
                    }))}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} lg={8} xl={5}>
                <Form.Item<LogSearchFormType>
                  label={'操作类型'}
                  name="operation"
                  style={{ marginBottom: 0 }}
                >
                  <Select
                    placeholder={'全部操作'}
                    allowClear
                    options={operateTypeOptions.map((item) => ({
                      label: item.dictLabel,
                      value: item.dictValue,
                    }))}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} lg={8} xl={4}>
                <Form.Item<LogSearchFormType>
                  label={'操作状态'}
                  name="status"
                  style={{ marginBottom: 0 }}
                >
                  <Select
                    placeholder={'全部状态'}
                    allowClear
                    options={resultStatusOptions.map((item) => ({
                      label: item.dictLabel,
                      value: item.dictValue,
                    }))}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} lg={8} xl={4}>
                <Form.Item<LogSearchFormType>
                  label={'请求 IP'}
                  name="requestIp"
                  style={{ marginBottom: 0 }}
                >
                  <Input placeholder={'请输入 IP 地址'} allowClear />
                </Form.Item>
              </Col>
              <Col xs={24} sm={24} lg={12} xl={6}>
                <Form.Item<LogSearchFormType>
                  label={'操作时间'}
                  name="operationTime"
                  style={{ marginBottom: 0 }}
                >
                  <RangePicker showTime style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} lg={8} xl={5}>
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

      {/* 卡片二：日志列表 */}
      <div className={styles.tableCard}>
        <div className={styles.tableCardHeader}>
          <div className={styles.titleBlock}>
            <span className={styles.cardTitle}>日志列表</span>
            <span className={styles.cardSubtitle}>共 {pagination.total} 条操作记录</span>
          </div>
          <Space wrap>
            <Popconfirm
              title="确认批量删除"
              description={`将删除选中的 ${selectedRowKeys.length} 条操作日志，确定继续吗？`}
              onConfirm={handleBatchDelete}
              okText="确定"
              cancelText="取消"
              okButtonProps={{ loading: deleting, danger: true }}
            >
              <Button
                className={styles.dangerButton}
                icon={<Delete width={16} height={16} />}
                disabled={selectedRowKeys.length === 0}
                loading={deleting}
              >
                批量删除{selectedRowKeys.length > 0 && ` (${selectedRowKeys.length})`}
              </Button>
            </Popconfirm>
            <Popconfirm
              title="确认清空"
              description="清空后所有操作日志将不可恢复，确定要清空吗？"
              onConfirm={handleClearAll}
              okText="确定"
              cancelText="取消"
              okButtonProps={{ loading: clearing, danger: true }}
            >
              <Button className={styles.dangerButton} icon={<ClearOutlined />} loading={clearing}>
                清空
              </Button>
            </Popconfirm>
            <Button
              className={styles.toolButton}
              icon={<Download width={16} height={16} />}
              onClick={handleExport}
            >
              导出
            </Button>
          </Space>
        </div>
        <div className={styles.tableCardBody}>
          <Table
            columns={columns}
            dataSource={dataList}
            rowKey="id"
            loading={loading}
            rowSelection={{
              selectedRowKeys,
              onChange: (keys) => setSelectedRowKeys(keys),
              // 翻页/筛选时清空选择，与服务端分页保持一致
              preserveSelectedRowKeys: false,
            }}
            scroll={{ x: 1260 }}
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

      {/* 操作日志详情弹窗 */}
      <Modal
        width={screens.md ? 900 : 'calc(100vw - 32px)'}
        title="操作日志详情"
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setDetailOpen(false)}>
            关闭
          </Button>,
        ]}
      >
        {detailRecord && (
          <div className={styles.modalBody}>
            {/* 基础信息 */}
            <div className={styles.detailCard}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>日志 ID</span>
                <span className={styles.detailValue}>{detailRecord.id}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>创建时间</span>
                <span className={styles.detailValue}>{detailRecord.createTime}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>操作账号 / IP</span>
                <span className={styles.detailValue}>
                  {detailRecord.username} · {detailRecord.requestIp}
                </span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>业务模块 / 操作类型</span>
                <span className={styles.detailValue}>
                  <DictTag value={detailRecord.module} option={operateModuleOptions} /> {''}
                  <DictTag value={detailRecord.operation} option={operateTypeOptions} />
                </span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>请求方法</span>
                <span className={styles.urlBlock}>
                  <b>{detailRecord.requestMethod}</b>
                </span>
              </div>
              <div className={styles.detailItem} style={{ gridColumn: '1 / -1' }}>
                <span className={styles.detailLabel}>请求地址</span>
                <span className={styles.codeBlock}>{detailRecord.requestUrl || '-'}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>操作对象</span>
                <span className={styles.detailValue}>
                  {detailRecord.targetName || '-'}
                  {detailRecord.targetType && ` (${detailRecord.targetType})`}
                </span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>请求归属地</span>
                <span className={styles.detailValue}>{detailRecord.requestLocation || '-'}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>操作结果</span>
                {/*<span className={styles.detailValue}>*/}
                {/*  {renderStatusTag(detailRecord.status)} {detailRecord.costTime} ms*/}
                {/*</span>*/}
                <span className={styles.detailValue}>
                  {DictTag({
                    value: detailRecord.status,
                    option: resultStatusOptions,
                  })}{' '}
                  {detailRecord.costTime} ms
                </span>
              </div>
            </div>

            {/* 请求参数 */}
            {detailRecord.requestParams && (
              <>
                <div className={styles.sectionTitle}>请求参数</div>
                <JsonViewer value={parseNestedJson(detailRecord.requestParams)} />
              </>
            )}

            {/* 数据变更：操作前 / 操作后 */}
            {(detailRecord.beforeData || detailRecord.afterData || detailRecord.targetId) && (
              <>
                <div className={styles.sectionTitle}>
                  数据变更
                  {detailRecord.targetId && (
                    <span
                      style={{
                        marginLeft: 10,
                        fontSize: 13,
                        fontWeight: 400,
                        color: 'var(--text-color-secondary)',
                      }}
                    >
                      对象 ID：{detailRecord.targetId}
                    </span>
                  )}
                </div>
                <div className={styles.dataChangeGrid}>
                  <div>
                    <div className={styles.dataChangeLabel}>操作前</div>
                    <JsonViewer value={parseNestedJson(detailRecord.beforeData)} />
                  </div>
                  <div>
                    <div className={styles.dataChangeLabel}>操作后</div>
                    <JsonViewer value={parseNestedJson(detailRecord.afterData)} />
                  </div>
                </div>
              </>
            )}

            {/* 错误信息 */}
            {detailRecord.errorMessage && (
              <>
                <div className={styles.sectionTitle}>错误信息</div>
                <div className={styles.codeBlock}>{detailRecord.errorMessage}</div>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
export default OperationLog;
