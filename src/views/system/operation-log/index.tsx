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
  Popconfirm,
  Row,
  Select,
  Space,
  Table,
  TableColumnsType,
} from 'antd';
import { useState } from 'react';
import {
  FilterOutlined,
  EyeOutlined,
  ClearOutlined,
  AuditOutlined,
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';

const { RangePicker } = DatePicker;

// 请求方法
type MethodType = 'GET' | 'POST' | 'PUT' | 'DELETE';

// 操作状态
type LogStatus = 'success' | 'fail';

// 操作日志记录
interface OperationLogRecord {
  id: number;
  logId: number; // 日志 ID
  account: string; // 操作账号
  module: string; // 业务模块
  action: string; // 操作类型
  targetName: string; // 操作对象名称
  targetType: string; // 操作对象类型
  method: MethodType; // 请求方法
  ip: string; // 请求 IP
  location: string; // 归属地
  status: LogStatus; // 操作状态
  duration: number; // 耗时 ms
  createTime: string; // 创建时间
  operationTime: string; // 操作时间
  browser: string; // 浏览器
  os: string; // 操作系统
  requestUrl: string; // 请求地址
  requestParams: string; // 请求参数
  beforeData: string; // 操作前数据
  afterData: string; // 操作后数据
}

// 筛选条件
interface LogSearchType {
  account?: string;
  module?: string;
  action?: string;
  status?: LogStatus;
  operationTime?: [Dayjs, Dayjs];
  ip?: string;
}

// 业务模块选项
const MODULE_OPTIONS = ['用户管理', '公告管理', '字典管理', '角色管理', '菜单管理'];

// 操作类型选项
const ACTION_OPTIONS = ['新增用户', '发布公告', '修改字典值', '删除角色', '更新菜单'];

// 静态演示数据
const MOCK_DATA: OperationLogRecord[] = [
  {
    id: 1,
    logId: 10001,
    account: 'admin',
    module: '用户管理',
    action: '新增用户',
    targetName: 'test12',
    targetType: '用户',
    method: 'POST',
    ip: '138.***.8888',
    location: '北京市',
    status: 'success',
    duration: 86,
    createTime: '2026-09-09 16:59:57',
    operationTime: '2026-09-09 16:59:57',
    browser: 'Chrome 128',
    os: 'Windows 11',
    requestUrl: '/api/system/user',
    requestParams: '{"username":"test12","nickname":"测试用户"}',
    beforeData: 'null',
    afterData: '{"id":2,"username":"test12"}',
  },
  {
    id: 2,
    logId: 10002,
    account: 'admin',
    module: '公告管理',
    action: '发布公告',
    targetName: '系统维护通知',
    targetType: '公告',
    method: 'PUT',
    ip: '138.***.8888',
    location: '北京市',
    status: 'success',
    duration: 142,
    createTime: '2026-09-09 15:42:10',
    operationTime: '2026-09-09 15:42:10',
    browser: 'Chrome 128',
    os: 'Windows 11',
    requestUrl: '/api/system/announcement/publish',
    requestParams: '{"id":8,"title":"系统维护通知"}',
    beforeData: '{"id":8,"status":"draft"}',
    afterData: '{"id":8,"status":"published"}',
  },
  {
    id: 3,
    logId: 10003,
    account: 'test12',
    module: '字典管理',
    action: '修改字典值',
    targetName: '用户状态 / 启用',
    targetType: '字典值',
    method: 'PUT',
    ip: '111.***.2233',
    location: '上海市',
    status: 'fail',
    duration: 58,
    createTime: '2026-09-09 14:08:33',
    operationTime: '2026-09-09 14:08:33',
    browser: 'Edge 127',
    os: 'Windows 10',
    requestUrl: '/api/system/dict/data',
    requestParams: '{"dictCode":21,"dictValue":"启用"}',
    beforeData: '{"dictCode":21,"status":"disabled"}',
    afterData: '{"dictCode":21,"status":"enabled"}',
  },
  {
    id: 4,
    logId: 10004,
    account: 'operator',
    module: '角色管理',
    action: '删除角色',
    targetName: '访客角色',
    targetType: '角色',
    method: 'DELETE',
    ip: '120.***.1010',
    location: '杭州市',
    status: 'success',
    duration: 73,
    createTime: '2026-09-09 11:26:45',
    operationTime: '2026-09-09 11:26:45',
    browser: 'Firefox 128',
    os: 'Ubuntu 22.04',
    requestUrl: '/api/system/role/6',
    requestParams: '{"roleId":6}',
    beforeData: '{"roleId":6,"roleName":"访客角色"}',
    afterData: 'null',
  },
  {
    id: 5,
    logId: 10005,
    account: 'admin',
    module: '菜单管理',
    action: '更新菜单',
    targetName: '操作日志',
    targetType: '菜单',
    method: 'PUT',
    ip: '138.***.8888',
    location: '北京市',
    status: 'success',
    duration: 115,
    createTime: '2026-09-09 09:12:03',
    operationTime: '2026-09-09 09:12:03',
    browser: 'Chrome 128',
    os: 'Windows 11',
    requestUrl: '/api/system/menu/15',
    requestParams: '{"menuId":15,"menuName":"操作日志"}',
    beforeData: '{"menuId":15,"menuName":"日志"}',
    afterData: '{"menuId":15,"menuName":"操作日志"}',
  },
];

const OperationLog: React.FC = () => {
  const { message } = App.useApp();
  const screens = Grid.useBreakpoint();
  const [searchForm] = Form.useForm<LogSearchType>();
  const [dataList, setDataList] = useState<OperationLogRecord[]>(MOCK_DATA);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // 详情弹窗
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRecord, setDetailRecord] = useState<OperationLogRecord | null>(null);

  // 搜索（静态页面：在本地演示数据上筛选）
  const handleSearch = () => {
    const values = searchForm.getFieldsValue();
    let result = [...MOCK_DATA];

    const account = values.account?.trim();
    if (account) {
      result = result.filter((item) =>
        item.account.toLowerCase().includes(account.toLowerCase()),
      );
    }

    if (values.module) {
      result = result.filter((item) => item.module === values.module);
    }

    if (values.action) {
      result = result.filter((item) => item.action === values.action);
    }

    if (values.status) {
      result = result.filter((item) => item.status === values.status);
    }

    const ip = values.ip?.trim();
    if (ip) {
      result = result.filter((item) => item.ip.includes(ip));
    }

    if (values.operationTime && values.operationTime.length === 2) {
      const [start, end] = values.operationTime;
      result = result.filter((item) => {
        const time = dayjs(item.operationTime);
        return time.isAfter(start.startOf('day')) && time.isBefore(end.endOf('day'));
      });
    }

    setDataList(result);
    setSelectedRowKeys([]);
  };

  // 重置
  const handleResetSearch = () => {
    searchForm.resetFields();
    setDataList(MOCK_DATA);
    setSelectedRowKeys([]);
  };

  // 批量删除
  const handleBatchDelete = () => {
    setDataList((prev) => prev.filter((item) => !selectedRowKeys.includes(item.id)));
    message.success(`已删除 ${selectedRowKeys.length} 条日志`);
    setSelectedRowKeys([]);
  };

  // 清空
  const handleClearAll = () => {
    setDataList([]);
    setSelectedRowKeys([]);
    message.success('日志已清空');
  };

  // 导出
  const handleExport = () => {
    message.success('导出成功');
  };

  // 查看详情
  const handleDetail = (record: OperationLogRecord) => {
    setDetailRecord(record);
    setDetailOpen(true);
  };

  // 请求方法标签样式
  const methodClassName = (method: MethodType) => {
    const map: Record<MethodType, string> = {
      GET: styles.methodGet,
      POST: styles.methodPost,
      PUT: styles.methodPut,
      DELETE: styles.methodDelete,
    };
    return `${styles.methodTag} ${map[method]}`;
  };

  // 状态标签
  const renderStatusTag = (status: LogStatus) => (
    <span
      className={`${styles.statusTag} ${
        status === 'success' ? styles.statusSuccess : styles.statusFail
      }`}
    >
      {status === 'success' ? '成功' : '失败'}
    </span>
  );

  // 表格列配置
  const columns: TableColumnsType<OperationLogRecord> = [
    {
      title: '操作账号',
      dataIndex: 'account',
      key: 'account',
      width: 110,
      render: (text: string) => <span className={styles.accountName}>{text}</span>,
    },
    {
      title: '业务模块',
      dataIndex: 'module',
      key: 'module',
      width: 110,
    },
    {
      title: '操作类型',
      dataIndex: 'action',
      key: 'action',
      width: 110,
    },
    {
      title: '操作对象',
      key: 'target',
      width: 160,
      render: (_, record) => (
        <div className={styles.targetCell}>
          <span className={styles.targetName}>{record.targetName}</span>
          <span className={styles.targetType}>{record.targetType}</span>
        </div>
      ),
    },
    {
      title: '请求信息',
      key: 'request',
      width: 200,
      render: (_, record) => (
        <div className={styles.requestCell}>
          <div className={styles.requestLine}>
            <span className={methodClassName(record.method)}>{record.method}</span>
            <span className={styles.requestIp}>{record.ip}</span>
          </div>
          <span className={styles.requestLocation}>{record.location}</span>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status: LogStatus) => renderStatusTag(status),
    },
    {
      title: '耗时',
      dataIndex: 'duration',
      key: 'duration',
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
                <Form.Item<LogSearchType>
                  label={'操作账号'}
                  name="account"
                  style={{ marginBottom: 0 }}
                >
                  <Input placeholder={'请输入操作账号'} allowClear />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} lg={8} xl={5}>
                <Form.Item<LogSearchType> label={'业务模块'} name="module" style={{ marginBottom: 0 }}>
                  <Select
                    placeholder={'全部模块'}
                    allowClear
                    options={MODULE_OPTIONS.map((item) => ({ label: item, value: item }))}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} lg={8} xl={5}>
                <Form.Item<LogSearchType> label={'操作类型'} name="action" style={{ marginBottom: 0 }}>
                  <Select
                    placeholder={'全部操作'}
                    allowClear
                    options={ACTION_OPTIONS.map((item) => ({ label: item, value: item }))}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} lg={8} xl={4}>
                <Form.Item<LogSearchType>
                  label={'操作状态'}
                  name="status"
                  style={{ marginBottom: 0 }}
                >
                  <Select
                    placeholder={'全部状态'}
                    allowClear
                    options={[
                      { label: '成功', value: 'success' },
                      { label: '失败', value: 'fail' },
                    ]}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={24} lg={12} xl={6}>
                <Form.Item<LogSearchType>
                  label={'操作时间'}
                  name="operationTime"
                  style={{ marginBottom: 0 }}
                >
                  <RangePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} lg={8} xl={4}>
                <Form.Item<LogSearchType> label={'请求 IP'} name="ip" style={{ marginBottom: 0 }}>
                  <Input placeholder={'请输入 IP 地址'} allowClear />
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
            <span className={styles.cardSubtitle}>共 {dataList.length} 条操作记录</span>
          </div>
          <Space wrap>
            <span className={styles.hintText}>
              <AuditOutlined />
              仅保留必要审计字段
            </span>
            <Popconfirm
              title="确认批量删除"
              description={`确定要删除选中的 ${selectedRowKeys.length} 条日志吗？`}
              onConfirm={handleBatchDelete}
              okText="确定"
              cancelText="取消"
              disabled={selectedRowKeys.length === 0}
            >
              <Button
                className={styles.dangerButton}
                icon={<Delete width={16} height={16} />}
                disabled={selectedRowKeys.length === 0}
              >
                批量删除
              </Button>
            </Popconfirm>
            <Popconfirm
              title="确认清空"
              description="清空后所有操作日志将不可恢复，确定要清空吗？"
              onConfirm={handleClearAll}
              okText="确定"
              cancelText="取消"
            >
              <Button className={styles.dangerButton} icon={<ClearOutlined />}>
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
            rowSelection={{
              selectedRowKeys,
              onChange: (keys) => setSelectedRowKeys(keys),
            }}
            columns={columns}
            dataSource={dataList}
            rowKey="id"
            scroll={{ x: 1260 }}
            pagination={{
              pageSize: 10,
              showSizeChanger: false,
              showTotal: (total) => `共 ${total} 条`,
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
                <span className={styles.detailValue}>{detailRecord.logId}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>操作时间</span>
                <span className={styles.detailValue}>{detailRecord.operationTime}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>操作账号 / IP</span>
                <span className={styles.detailValue}>
                  {detailRecord.account} · {detailRecord.ip}
                </span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>浏览器 / 操作系统</span>
                <span className={styles.detailValue}>
                  {detailRecord.browser} · {detailRecord.os}
                </span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>请求地址</span>
                <span className={styles.urlBlock}>
                  <b>{detailRecord.method}</b>
                  {detailRecord.requestUrl}
                </span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>操作结果</span>
                <span className={styles.detailValue}>
                  {renderStatusTag(detailRecord.status)} {detailRecord.duration} ms
                </span>
              </div>
            </div>

            {/* 请求参数 */}
            <div className={styles.sectionTitle}>请求参数</div>
            <div className={styles.codeBlock}>{detailRecord.requestParams}</div>

            {/* 数据变更 */}
            <div className={styles.sectionTitle}>数据变更</div>
            <div className={styles.dataChangeGrid}>
              <div>
                <div className={styles.dataChangeLabel}>操作前</div>
                <div className={styles.codeBlock}>{detailRecord.beforeData}</div>
              </div>
              <div>
                <div className={styles.dataChangeLabel}>操作后</div>
                <div className={styles.codeBlock}>{detailRecord.afterData}</div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
export default OperationLog;
