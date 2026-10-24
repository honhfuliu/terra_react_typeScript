import * as React from 'react';
import {
  Avatar,
  Button,
  Col,
  Form,
  Input,
  Modal,
  Row,
  Table,
  TableColumnsType,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd';
import {
  TeamOutlined,
  LaptopOutlined,
  FieldTimeOutlined,
  FilterOutlined,
  SearchOutlined,
  ReloadOutlined,
  PoweroffOutlined,
} from '@ant-design/icons';
import styles from './index.module.less';
import {
  forceLogout,
  onlinePage,
  onlineStatistics,
  OnlineUserRow,
  OnlineUserStatistics,
} from '@/service/onlineUser.ts';
import { EXPIRING_THRESHOLD_SECONDS, PAGINATION } from '@/constants';
import { formatTimeout } from '@/utils/date.ts';
import { PaginationState } from '@/types/common.ts';
import Auth from '@/components/Auth';

const { Text } = Typography;

// 自动刷新间隔：1 分钟
const AUTO_REFRESH_INTERVAL = 60 * 1000;

/* ============ 主组件 ============ */

const OnlineUser: React.FC = () => {
  const [searchForm] = Form.useForm();
  const [statistics, setStatistics] = React.useState<OnlineUserStatistics | null>(null);

  // 表格数据与服务端分页
  const [dataList, setDataList] = React.useState<OnlineUserRow[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [pagination, setPagination] = React.useState<PaginationState>({
    current: PAGINATION.DEFAULT_PAGE_NUM,
    pageSize: PAGINATION.DEFAULT_PAGE_SIZE,
    total: 0,
  });

  // 分页查询在线用户
  const fetchList = async (pageNum: number, pageSize: number) => {
    setLoading(true);
    try {
      const values = searchForm.getFieldsValue();
      const res = await onlinePage({
        username: values.username?.trim() || undefined,
        ip: values.ip?.trim() || undefined,
        pageNum,
        pageSize,
      });
      setDataList(res.rows || []);
      setPagination((prev) => ({
        ...prev,
        current: pageNum,
        pageSize,
        total: res.total || 0,
      }));
    } catch {
      // 错误提示由请求拦截器统一处理
      setDataList([]);
      setPagination((prev) => ({ ...prev, current: pageNum, pageSize, total: 0 }));
    } finally {
      setLoading(false);
    }
  };

  // 获取在线统计
  const fetchStatistics = async () => {
    try {
      const res = await onlineStatistics();
      setStatistics(res);
    } catch {
      // 错误提示由请求拦截器统一处理
    }
  };

  // 定时刷新时始终读取最新分页状态，避免闭包过期
  const paginationRef = React.useRef<PaginationState>(pagination);
  paginationRef.current = pagination;

  React.useEffect(() => {
    void fetchList(PAGINATION.DEFAULT_PAGE_NUM, PAGINATION.DEFAULT_PAGE_SIZE);
    void fetchStatistics();

    // 每 1 分钟自动刷新当前页数据与统计卡片
    const timer = window.setInterval(() => {
      void fetchList(paginationRef.current.current, paginationRef.current.pageSize);
      void fetchStatistics();
    }, AUTO_REFRESH_INTERVAL);
    return () => window.clearInterval(timer);
  }, []);

  // 搜索：回到第一页
  const handleSearch = () => {
    void fetchList(PAGINATION.DEFAULT_PAGE_NUM, pagination.pageSize);
  };

  // 重置：清空筛选条件并重新查询
  const handleReset = () => {
    searchForm.resetFields();
    void fetchList(PAGINATION.DEFAULT_PAGE_NUM, pagination.pageSize);
  };

  // 翻页
  const handlePageChange = (page: number, pageSize: number) => {
    void fetchList(page, pageSize);
  };

  // 下线成功后刷新列表与统计
  const refreshAfterLogout = () => {
    void fetchList(paginationRef.current.current, paginationRef.current.pageSize);
    void fetchStatistics();
  };

  // 强制下线单个用户
  const handleForceLogout = (record: OnlineUserRow) => {
    Modal.confirm({
      title: '强制下线',
      content: `确定将用户「${record.nickname || record.username}」强制下线吗？`,
      okText: '确定',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await forceLogout(record.loginLogId);
          message.success('强制下线成功');
          refreshAfterLogout();
        } catch {
          // 错误提示由请求拦截器统一处理
        }
      },
    });
  };

  // 表格列配置
  const columns: TableColumnsType<OnlineUserRow> = [
    {
      title: '在线用户',
      dataIndex: 'nickname',
      key: 'nickname',
      width: 200,
      render: (_, record) => (
        <div className={styles.userCell}>
          <Avatar
            src={record.avatar ? `/upload/${record.avatar}` : undefined}
            style={{ backgroundColor: '#1677ff', flexShrink: 0 }}
          >
            {record.nickname?.charAt(0)}
          </Avatar>
          <div className={styles.userInfo}>
            <div className={styles.userName}>{record.nickname}</div>
            <div className={styles.userMeta}>{record.username}</div>
          </div>
        </div>
      ),
    },
    {
      title: '登录地址',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      width: 180,
      render: (_, record) => (
        <div>
          <span className={styles.ipTag}>{record.ipAddress}</span>
          <div className={styles.ipLocation}>{record.loginLocation}</div>
        </div>
      ),
    },
    {
      title: '设备与浏览器',
      key: 'device',
      width: 160,
      render: (_, record) => (
        <div className={styles.deviceCell}>
          <div className={styles.deviceName}>{record.os}</div>
          <div className={styles.browserName}>{record.browser}</div>
        </div>
      ),
    },
    {
      title: '登录时间',
      dataIndex: 'loginTime',
      key: 'loginTime',
      width: 180,
      render: (text: string) => <span className={styles.timeCell}>{text}</span>,
    },
    {
      title: '剩余时长',
      dataIndex: 'tokenTimeout',
      key: 'tokenTimeout',
      width: 120,
      render: (seconds: number) => (
        <span className={styles.duration}>{formatTimeout(seconds)}</span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'tokenTimeout',
      key: 'status',
      width: 110,
      render: (seconds: number) =>
        seconds > EXPIRING_THRESHOLD_SECONDS ? (
          <span className={styles.statusOnline}>
            <span className={styles.statusDot} />
            正常
          </span>
        ) : (
          <span className={styles.statusTimeout}>
            <span className={styles.statusDot} />
            即将超时
          </span>
        ),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <div style={{ display: 'flex', gap: 4 }}>
          <Auth permission={'system:monitor:online:forceLogout'}>
            <Tooltip title="强制下线">
              <Button
                type="link"
                size="small"
                danger
                icon={<PoweroffOutlined />}
                className={styles.actionLink}
                onClick={() => handleForceLogout(record)}
              />
            </Tooltip>
          </Auth>
        </div>
      ),
    },
  ];

  return (
    <div className={styles.onlinePage}>
      {/* ============ 页面头部（优化版） ============ */}
      <div className={styles.pageHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>
            <TeamOutlined />
          </div>
          <div className={styles.headerText}>
            <div className={styles.breadcrumb}>MONITOR / ONLINE USER</div>
            <h2 className={styles.title}>在线用户</h2>
            <Text className={styles.subtitle}>
              实时查看当前登录用户与会话状态，及时维护系统访问安全
            </Text>
          </div>
        </div>
        <div className={styles.headerRight}>
          <Tag className={styles.statusTag} color="success">
            <span className={styles.statusDot} />
            实时监控中
          </Tag>
        </div>
      </div>

      {/* ============ 指标卡片 ============ */}
      <div className={styles.metricGrid}>
        <div className={styles.metricCard + ' ' + styles.searchCard}>
          <div className={styles.cardBody}>
            <div className={`${styles.metricIcon} ${styles.iconOnline}`}>
              <TeamOutlined />
            </div>
            <div className={styles.metricInfo}>
              <p className={styles.metricLabel}>当前在线</p>
              <div className={styles.metricValue}>
                {statistics?.onlineUserCount ?? 0}
                <span className={styles.metricUnit}>人</span>
              </div>
            </div>
          </div>
        </div>
        <div className={styles.metricCard + ' ' + styles.searchCard}>
          <div className={styles.cardBody}>
            <div className={`${styles.metricIcon} ${styles.iconDevice}`}>
              <LaptopOutlined />
            </div>
            <div className={styles.metricInfo}>
              <p className={styles.metricLabel}>活跃设备</p>
              <div className={styles.metricValue}>
                {statistics?.activeDeviceCount ?? 0}
                <span className={styles.metricUnit}>台</span>
              </div>
            </div>
          </div>
        </div>
        <div className={styles.metricCard + ' ' + styles.searchCard}>
          <div className={styles.cardBody}>
            <div className={`${styles.metricIcon} ${styles.iconTimeout}`}>
              <FieldTimeOutlined />
            </div>
            <div className={styles.metricInfo}>
              <p className={styles.metricLabel}>即将超时</p>
              <div className={styles.metricValue}>
                {statistics?.expiringDeviceCount ?? 0}
                <span className={styles.metricUnit}>人</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============ 双卡片布局 ============ */}
      <div className={styles.layout}>
        {/* 卡片一：筛选条件 */}
        <div className={styles.searchCard}>
          <div className={styles.searchCardHeader}>
            <div className={styles.titleWrap}>
              <span className={styles.titleIcon}>
                <FilterOutlined />
              </span>
              <span className={styles.cardTitle}>筛选条件</span>
              <span className={styles.cardSubtitle}>按账号或 IP 地址快速查找</span>
            </div>
          </div>
          <div className={styles.searchCardBody}>
            <Form form={searchForm}>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} lg={6} xl={5}>
                  <Form.Item label={'账号'} name="username" style={{ marginBottom: 0 }}>
                    <Input placeholder={'请输入账号'} allowClear />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} lg={6} xl={5}>
                  <Form.Item label={'IP 地址'} name="ip" style={{ marginBottom: 0 }}>
                    <Input placeholder={'请输入 IP 地址'} allowClear />
                  </Form.Item>
                </Col>
                <Col xs={24} lg={6} xl={5}>
                  <div className={styles.searchActions}>
                    <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                      搜索
                    </Button>
                    <Button icon={<ReloadOutlined />} onClick={handleReset}>
                      重置
                    </Button>
                  </div>
                </Col>
              </Row>
            </Form>
          </div>
        </div>

        {/* 卡片二：在线会话 */}
        <div className={styles.tableCard}>
          <div className={styles.tableCardHeader}>
            <div className={styles.titleBlock}>
              <span className={styles.cardTitle}>在线会话</span>
              <span className={styles.cardSubtitle}>共 {pagination.total} 个活跃会话</span>
            </div>
            <div className={styles.tableHeaderRight}>
              <span className={styles.autoRefresh}>
                <span className={styles.refreshDot} />
                数据每 1 分钟自动刷新
              </span>
              <div className={styles.tableHeaderActions}>
                <Button
                  className={styles.toolButton}
                  icon={<ReloadOutlined />}
                  onClick={() => {
                    void fetchList(pagination.current, pagination.pageSize);
                    void fetchStatistics();
                  }}
                >
                  刷新
                </Button>
              </div>
            </div>
          </div>
          <div className={styles.tableCardBody}>
            <Table
              columns={columns}
              dataSource={dataList}
              rowKey="loginLogId"
              loading={loading}
              scroll={{ x: 1070 }}
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: pagination.total,
                showTotal: (total) => `共 ${total} 条`,
                showSizeChanger: true,
                onChange: handlePageChange,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnlineUser;
