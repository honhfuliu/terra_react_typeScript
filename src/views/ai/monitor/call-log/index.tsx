import * as React from 'react';
import { useEffect, useState } from 'react';
import styles from './index.module.less';
import {
  Button,
  Col,
  DatePicker,
  Drawer,
  Form,
  Grid,
  Row,
  Select,
  Table,
  TableColumnsType,
} from 'antd';
import {
  ApiOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import Icon from '@/components/Icon';
import { PAGINATION } from '@/constants';
import {
  CallLogRow,
  CallLogStats,
  getCallLogModelStats,
  getCallLogPage,
  getCallLogStats,
  ModelStatsItem,
} from '@/service/callLog.ts';
import { getProviderOptions, ProviderOption } from '@/service/provider.ts';
import { getModelOptions, getModelTypeOptions, ModelOption } from '@/service/model.ts';
import { DictDataOption } from '@/service/dict.ts';

const { RangePicker } = DatePicker;

// 调用状态
type CallStatus = '进行中' | '成功' | '失败' | '取消';

// 筛选条件
interface CallLogFilterValues {
  providerId?: number;
  modelId?: number;
  status?: string;
  callType?: string;
  timeRange?: [Dayjs, Dayjs];
}

const NUMBER_FORMATTER = (value: number) => value.toLocaleString('en-US');

// 耗时：毫秒 -> 秒（保留两位小数）
const formatDuration = (milliseconds: number) => `${(milliseconds / 1000).toFixed(2)} 秒`;

// 调用状态码映射（AiCallStatusEnum）
const STATUS_LABEL_MAP: Record<string, CallStatus> = {
  '0': '进行中',
  '1': '成功',
  '2': '失败',
  '3': '取消',
};

// 调用类型码映射（AiCallTypeEnum）
const getStatusLabel = (status: string): CallStatus => STATUS_LABEL_MAP[status] ?? '进行中';

// 调用状态筛选（value 与后端 CallStatus 枚举 code 对齐）
const STATUS_OPTIONS = [
  { label: '进行中', value: '0' },
  { label: '成功', value: '1' },
  { label: '失败', value: '2' },
  { label: '已取消', value: '3' },
];
// 调用状态样式
const statusClassName = (status: string) =>
  status === '成功'
    ? styles.statusSuccess
    : status === '失败'
      ? styles.statusFail
      : status === '取消'
        ? styles.statusCancel
        : styles.statusRunning;

// 调用类型样式
const typeClassName = (type: string) =>
  type === 'EMBEDDING' ? styles.typeEmbedding : styles.typeChat;

const CallLog: React.FC = () => {
  const screens = Grid.useBreakpoint();
  const [filterForm] = Form.useForm<CallLogFilterValues>();

  // 全局调用统计
  const [stats, setStats] = useState<CallLogStats>({
    totalCalls: 0,
    totalTokens: 0,
    successCalls: 0,
    failCalls: 0,
  });
  // 模型消耗统计
  const [modelStats, setModelStats] = useState<ModelStatsItem[]>([]);
  // 筛选下拉选项（来自后端 options 接口）
  const [providerOptions, setProviderOptions] = useState<ProviderOption[]>([]);
  const [modelOptions, setModelOptions] = useState<ModelOption[]>([]);
  const [modelTypeOptions, setModelTypeOptions] = useState<DictDataOption[]>([]);

  // 调用日志列表（后端分页数据）
  const [logs, setLogs] = useState<CallLogRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // 已生效的筛选条件
  const [filters, setFilters] = useState<CallLogFilterValues>({});
  // 当前页码
  const [currentPage, setCurrentPage] = useState<number>(PAGINATION.DEFAULT_PAGE_NUM);
  // 详情抽屉
  const [detail, setDetail] = useState<CallLogRow | null>(null);

  // 首次加载统计数据 + 筛选下拉选项
  useEffect(() => {
    getCallLogStats()
      .then((data) => setStats(data))
      .catch(() => undefined);
    getCallLogModelStats()
      .then((data) => setModelStats(data))
      .catch(() => undefined);
    getProviderOptions()
      .then((data) => setProviderOptions(data))
      .catch(() => undefined);
    getModelOptions()
      .then((data) => setModelOptions(data))
      .catch(() => undefined);
    getModelTypeOptions()
      .then((data) => setModelTypeOptions(data))
      .catch(() => undefined);
  }, []);

  // 分页查询调用日志
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getCallLogPage({
      pageNum: currentPage,
      pageSize: PAGINATION.DEFAULT_PAGE_SIZE,
      providerId: filters.providerId,
      modelId: filters.modelId,
      status: filters.status,
      callType: filters.callType,
      beginTime: filters.timeRange?.[0]?.format('YYYY-MM-DD HH:mm:ss'),
      endTime: filters.timeRange?.[1]?.format('YYYY-MM-DD HH:mm:ss'),
    })
      .then((data) => {
        if (!mounted) return;
        setLogs(data?.rows ?? []);
        setTotal(data?.total ?? 0);
      })
      .catch(() => undefined)
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [currentPage, filters]);

  // 进度条最大值
  const maxModelTokens = modelStats.length
    ? Math.max(...modelStats.map((item) => item.totalTokens))
    : 0;

  // 查询：应用筛选条件并回到第一页
  const handleSearch = () => {
    setFilters(filterForm.getFieldsValue());
    setCurrentPage(PAGINATION.DEFAULT_PAGE_NUM);
  };

  // 重置：清空筛选条件
  const handleReset = () => {
    filterForm.resetFields();
    setFilters({});
    setCurrentPage(PAGINATION.DEFAULT_PAGE_NUM);
  };

  // 表格列配置
  const columns: TableColumnsType<CallLogRow> = [
    {
      title: '日志 ID',
      dataIndex: 'id',
      key: 'id',
      width: 90,
      render: (id: number) => <span className={styles.logId}>#{id}</span>,
    },
    {
      title: '用户',
      dataIndex: 'nickname',
      key: 'nickname',
      width: 110,
      render: (nickname: string) => <span className={styles.userName}>{nickname}</span>,
    },
    {
      title: '提供商',
      dataIndex: 'providerName',
      key: 'providerName',
      width: 110,
    },
    {
      title: '模型名称',
      dataIndex: 'modelName',
      key: 'modelName',
      width: 150,
    },
    {
      title: '调用类型',
      dataIndex: 'callType',
      key: 'callType',
      width: 120,
      render: (callType: string) => (
        <span className={`${styles.typeTag} ${typeClassName(callType)}`}>{callType}</span>
      ),
    },
    {
      title: 'Prompt Tokens',
      dataIndex: 'promptTokens',
      key: 'promptTokens',
      width: 130,
      render: (value: number | null) => (
        <span className={styles.tokenText}>{value === null ? '--' : NUMBER_FORMATTER(value)}</span>
      ),
    },
    {
      title: 'Completion Tokens',
      dataIndex: 'completionTokens',
      key: 'completionTokens',
      width: 150,
      render: (value: number | null) => (
        <span className={styles.tokenText}>{value === null ? '--' : NUMBER_FORMATTER(value)}</span>
      ),
    },
    {
      title: 'Total Tokens',
      dataIndex: 'totalTokens',
      key: 'totalTokens',
      width: 120,
      render: (value: number | null) => (
        <span className={styles.tokenTotal}>{value === null ? '--' : NUMBER_FORMATTER(value)}</span>
      ),
    },
    {
      title: '调用耗时',
      dataIndex: 'duration',
      key: 'duration',
      width: 110,
      render: (value: number) => (
        <span className={styles.durationText}>{formatDuration(value)}</span>
      ),
    },
    {
      title: '调用状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const label = getStatusLabel(status);
        return <span className={`${styles.statusTag} ${statusClassName(label)}`}>{label}</span>;
      },
    },
    {
      title: '调用时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 170,
      render: (value: string) => <span className={styles.timeText}>{value}</span>,
    },
    {
      title: '操作',
      key: 'action',
      width: 110,
      fixed: 'right',
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          className={styles.actionLink}
          icon={<EyeOutlined />}
          onClick={() => setDetail(record)}
        >
          查看详情
        </Button>
      ),
    },
  ];

  return (
    <div className={styles.layout}>
      {/* 01 全局调用统计 */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <div className={styles.titleBlock}>
            <div className={styles.titleLine}>
              <span className={styles.sectionIndex}>01</span>
              <span className={styles.sectionTitle}>全局调用统计</span>
            </div>
            <span className={styles.sectionDesc}>监控模型调用状态、Token 消耗及调用情况</span>
          </div>
          <span className={styles.headerExtra}>所有调用记录</span>
        </div>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} xl={6}>
            <div className={styles.statCard}>
              <div className={styles.statTop}>
                <span>总调用次数</span>
                <span className={styles.statIcon}>
                  <ApiOutlined />
                </span>
              </div>
              <div className={styles.statValue}>{stats.totalCalls}</div>
            </div>
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <div className={styles.statCard}>
              <div className={styles.statTop}>
                <span>Token 总消耗</span>
                <span className={styles.statIcon}>
                  <ThunderboltOutlined />
                </span>
              </div>
              <div className={styles.statValue}>{NUMBER_FORMATTER(stats.totalTokens)}</div>
            </div>
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <div className={styles.statCard}>
              <div className={styles.statTop}>
                <span>成功调用</span>
                <span className={styles.statIcon}>
                  <CheckCircleOutlined />
                </span>
              </div>
              <div className={styles.statValue}>{stats.successCalls}</div>
            </div>
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <div className={styles.statCard}>
              <div className={styles.statTop}>
                <span>失败调用</span>
                <span className={styles.statIcon}>
                  <CloseCircleOutlined />
                </span>
              </div>
              <div className={styles.statValue}>{stats.failCalls}</div>
            </div>
          </Col>
        </Row>
      </div>

      {/* 02 模型消耗统计 */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <div className={styles.titleBlock}>
            <div className={styles.titleLine}>
              <span className={styles.sectionIndex}>02</span>
              <span className={styles.sectionTitle}>模型消耗统计</span>
            </div>
            <span className={styles.sectionDesc}>仅统计成功调用的有效 Token，按消耗量降序排列</span>
          </div>
          <span className={styles.rangePill}>最近 30 天</span>
        </div>
        <Row gutter={[16, 16]}>
          {modelStats.map((item) => (
            <Col key={item.modelName} xs={24} sm={12} xl={6}>
              <div className={styles.modelCard}>
                <div className={styles.modelTop}>
                  <div>
                    <div className={styles.modelName}>{item.modelName}</div>
                    <div className={styles.modelProvider}>{item.providerName}</div>
                  </div>
                  <div className={styles.modelTotal}>
                    <div className={styles.modelTotalValue}>
                      {NUMBER_FORMATTER(item.totalTokens)}
                    </div>
                    <div className={styles.modelTotalLabel}>Total Tokens</div>
                  </div>
                </div>
                <div className={styles.progressTrack}>
                  <div
                    className={styles.progressBar}
                    style={{
                      width: maxModelTokens
                        ? `${(item.totalTokens / maxModelTokens) * 100}%`
                        : '0%',
                    }}
                  />
                </div>
                <div className={styles.modelMetaRow}>
                  <div>
                    <div className={styles.metaLabel}>调用次数</div>
                    <div className={styles.metaValue}>{item.callCount}</div>
                  </div>
                  <div>
                    <div className={styles.metaLabel}>输入 Token</div>
                    <div className={styles.metaValue}>{NUMBER_FORMATTER(item.promptTokens)}</div>
                  </div>
                  <div>
                    <div className={styles.metaLabel}>输出 Token</div>
                    <div className={styles.metaValue}>
                      {NUMBER_FORMATTER(item.completionTokens)}
                    </div>
                  </div>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </div>

      {/* 03 调用日志筛选 */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <div className={styles.titleLine}>
            <span className={styles.sectionIndex}>03</span>
            <span className={styles.sectionTitle}>调用日志筛选</span>
          </div>
        </div>
        <Form form={filterForm} layout="vertical" className={styles.filterForm}>
          <Row gutter={[16, 8]}>
            <Col xs={24} sm={12} lg={6}>
              <Form.Item<CallLogFilterValues> label="提供商" name="providerId">
                <Select
                  placeholder="全部提供商"
                  allowClear
                  showSearch
                  options={providerOptions.map((item) => ({
                    label: item.providerName,
                    value: item.id,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Form.Item<CallLogFilterValues> label="模型" name="modelId">
                <Select
                  placeholder="全部模型"
                  allowClear
                  showSearch
                  options={modelOptions.map((item) => ({
                    label: item.modelCode,
                    value: item.id,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Form.Item<CallLogFilterValues> label="调用状态" name="status">
                <Select placeholder="全部状态" allowClear options={STATUS_OPTIONS} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Form.Item<CallLogFilterValues> label="调用类型" name="callType">
                <Select
                  placeholder="全部类型"
                  allowClear
                  showSearch
                  options={modelTypeOptions.map((item) => ({
                    label: item.dictLabel,
                    value: item.dictValue,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} lg={10}>
              <Form.Item<CallLogFilterValues> label="调用时间" name="timeRange">
                <RangePicker
                  style={{ width: '100%' }}
                  showTime={{ format: 'HH:mm:ss' }}
                  placeholder={['开始时间', '结束时间']}
                  format="YYYY-MM-DD HH:mm:ss"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={24} lg={8}>
              <Form.Item label=" " colon={false} className={styles.actionItem}>
                <div className={styles.formActions}>
                  <Button
                    type="primary"
                    icon={<Icon icon="mdi:magnify" size={16} />}
                    onClick={handleSearch}
                  >
                    查询
                  </Button>
                  <Button icon={<Icon icon="mdi:refresh" size={16} />} onClick={handleReset}>
                    重置
                  </Button>
                </div>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </div>

      {/* 04 调用日志列表 */}
      <div className={styles.tableCard}>
        <div className={styles.tableCardHeader}>
          <div className={styles.titleLine}>
            <span className={styles.sectionIndex}>04</span>
            <span className={styles.sectionTitle}>调用日志列表</span>
          </div>
          <span className={styles.headerExtra}>共 {total} 条</span>
        </div>
        <div className={styles.tableCardBody}>
          <Table<CallLogRow>
            columns={columns}
            dataSource={logs}
            rowKey="id"
            loading={loading}
            scroll={{ x: 1430 }}
            pagination={{
              current: currentPage,
              pageSize: PAGINATION.DEFAULT_PAGE_SIZE,
              total,
              showSizeChanger: false,
              showTotal: (value) => `共 ${value} 条`,
              onChange: (page) => setCurrentPage(page),
            }}
          />
        </div>
      </div>

      {/* 调用日志详情抽屉 */}
      <Drawer
        open={detail !== null}
        onClose={() => setDetail(null)}
        styles={{ wrapper: { width: screens.md ? 920 : '100%' } }}
        destroyOnHidden
        title={
          detail && (
            <div className={styles.drawerTitle}>
              <span className={styles.drawerTitleMain}>调用日志详情</span>
              <span className={styles.drawerSubTitle}>记录 #{detail.id}</span>
            </div>
          )
        }
        extra={
          detail && (
            <span
              className={`${styles.statusTag} ${statusClassName(getStatusLabel(detail.status))}`}
            >
              {getStatusLabel(detail.status)}
            </span>
          )
        }
      >
        {detail && (
          <div className={styles.drawerBody}>
            {/* 基本信息 */}
            <div className={styles.detailBlock}>
              <div className={styles.detailTitle}>基本信息</div>
              <div className={styles.infoTable}>
                <div className={styles.infoRow}>
                  <div className={styles.infoLabel}>日志 ID</div>
                  <div className={styles.infoValue}>{detail.id}</div>
                </div>
                <div className={styles.infoRow}>
                  <div className={styles.infoLabel}>用户</div>
                  <div className={styles.infoValue}>{detail.nickname}</div>
                </div>
                <div className={styles.infoRow}>
                  <div className={styles.infoLabel}>提供商</div>
                  <div className={styles.infoValue}>{detail.providerName}</div>
                </div>
                <div className={styles.infoRow}>
                  <div className={styles.infoLabel}>模型</div>
                  <div className={styles.infoValue}>{detail.modelName}</div>
                </div>
                <div className={styles.infoRow}>
                  <div className={styles.infoLabel}>调用类型</div>
                  <div className={styles.infoValue}>
                    <span className={`${styles.typeTag} ${typeClassName(detail.callType)}`}>
                      {detail.callType}
                    </span>
                  </div>
                </div>
                <div className={styles.infoRow}>
                  <div className={styles.infoLabel}>调用状态</div>
                  <div className={styles.infoValue}>
                    <span
                      className={`${styles.statusTag} ${statusClassName(getStatusLabel(detail.status))}`}
                    >
                      {getStatusLabel(detail.status)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Token 消耗 */}
            <div className={styles.detailBlock}>
              <div className={styles.detailTitle}>Token 消耗</div>
              <div className={styles.tokenGrid}>
                <div className={styles.tokenCard}>
                  <div className={styles.tokenCardLabel}>Prompt</div>
                  <div className={styles.tokenCardValue}>
                    {detail.promptTokens === null ? '--' : NUMBER_FORMATTER(detail.promptTokens)}
                  </div>
                </div>
                <div className={styles.tokenCard}>
                  <div className={styles.tokenCardLabel}>Completion</div>
                  <div className={styles.tokenCardValue}>
                    {detail.completionTokens === null
                      ? '--'
                      : NUMBER_FORMATTER(detail.completionTokens)}
                  </div>
                </div>
                <div className={styles.tokenCard}>
                  <div className={styles.tokenCardLabel}>Total</div>
                  <div className={styles.tokenCardValue}>
                    {detail.totalTokens === null ? '--' : NUMBER_FORMATTER(detail.totalTokens)}
                  </div>
                </div>
              </div>
            </div>

            {/* 调用信息 */}
            <div className={styles.detailBlock}>
              <div className={styles.detailTitle}>调用信息</div>
              <div className={styles.infoTable}>
                <div className={styles.infoRow}>
                  <div className={styles.infoLabel}>Session ID</div>
                  <div className={styles.infoValue}>{detail.sessionId ?? '--'}</div>
                </div>
                <div className={styles.infoRow}>
                  <div className={styles.infoLabel}>Message ID</div>
                  <div className={styles.infoValue}>{detail.messageId ?? '--'}</div>
                </div>
                <div className={styles.infoRow}>
                  <div className={styles.infoLabel}>调用耗时</div>
                  <div className={styles.infoValue}>{formatDuration(detail.duration)}</div>
                </div>
                <div className={styles.infoRow}>
                  <div className={styles.infoLabel}>创建时间</div>
                  <div className={styles.infoValue}>{detail.createTime}</div>
                </div>
                <div className={styles.infoRow}>
                  <div className={styles.infoLabel}>更新时间</div>
                  <div className={styles.infoValue}>{detail.updateTime ?? '--'}</div>
                </div>
              </div>
            </div>

            {/* 异常信息 */}
            {detail.errorMessage && (
              <div className={styles.errorBox}>
                <div className={styles.errorTitle}>
                  <CloseCircleOutlined />
                  异常信息
                </div>
                <div className={styles.errorText}>{detail.errorMessage}</div>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default CallLog;
