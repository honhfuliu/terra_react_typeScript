import * as React from 'react';
import * as echarts from 'echarts';
import dayjs from 'dayjs';
import { Button, Progress, Table, TableColumnsType, Tag, Typography } from 'antd';
import {
  ReloadOutlined,
  DatabaseOutlined,
  ThunderboltOutlined,
  ApiOutlined,
  BarChartOutlined,
  DashboardOutlined,
} from '@ant-design/icons';
import styles from './index.module.less';
import { redisOverview, RedisCommandStat, RedisOverview } from '@/service/redisMonitor.ts';
import { formatDuration } from '@/utils/date.ts';

const { Text } = Typography;

/* ============ 常量与工具 ============ */

// 自动刷新间隔：30 秒
const AUTO_REFRESH_INTERVAL = 30 * 1000;
// 趋势图最大采样点数（30 秒一个点，保留 30 分钟）
const MAX_SAMPLES = 60;

// 命令统计条形图颜色
const CMD_COLORS: Record<string, string> = {
  GET: '#1677ff',
  SET: '#14b8a6',
  HGET: '#7c3aed',
  EXPIRE: '#f59e0b',
  其他命令: '#8c8c8c',
};

// 将字节数格式化为可读单位
const formatBytes = (bytes?: number | null) => {
  if (!bytes || bytes <= 0) return '0 KB';
  const mb = bytes / 1024 / 1024;
  if (mb < 1) return `${(bytes / 1024).toFixed(0)} KB`;
  if (mb < 1024) return `${mb.toFixed(2)} MB`;
  return `${(mb / 1024).toFixed(2)} GB`;
};

/* ============ 指标卡片数据 ============ */

interface MetricData {
  key: string;
  name: string;
  value: string;
  unit: string;
  detail: string;
  trend?: string;
  icon: React.ReactNode;
  iconClass: string;
}

/* ============ 趋势图数据 ============ */

// 趋势采样点
interface TrendSample {
  time: string;
  memory: number;
  hit: number;
}

/* ============ ECharts 折线图组件 ============ */

const TrendChart: React.FC<{ data: TrendSample[] }> = ({ data }) => {
  const chartRef = React.useRef<HTMLDivElement>(null);
  const chartInstance = React.useRef<echarts.ECharts | null>(null);
  const dataRef = React.useRef(data);
  dataRef.current = data;

  // 从 CSS 变量读取主题色，适配亮/暗模式
  const readThemeColors = () => {
    const cs = getComputedStyle(document.documentElement);
    return {
      textColor: cs.getPropertyValue('--text-color-secondary').trim() || '#666',
      borderColor: cs.getPropertyValue('--border-color').trim() || '#e8e8e8',
    };
  };

  const buildOption = (): echarts.EChartsOption => {
    const { textColor, borderColor } = readThemeColors();
    const current = dataRef.current;
    return {
      grid: { left: 40, right: 20, top: 16, bottom: 28 },
      tooltip: { trigger: 'axis', valueFormatter: (value) => `${value}%` },
      xAxis: {
        type: 'category',
        data: current.map((s) => s.time),
        boundaryGap: false,
        axisLabel: { color: textColor, fontSize: 10 },
        axisLine: { lineStyle: { color: borderColor } },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 100,
        axisLabel: { color: textColor, fontSize: 10, formatter: '{value}%' },
        splitLine: { lineStyle: { color: borderColor, type: 'dashed' } },
      },
      series: [
        {
          name: '内存使用率',
          type: 'line',
          data: current.map((s) => s.memory),
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { width: 2, color: '#1677ff' },
          itemStyle: { color: '#1677ff' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(22, 119, 255, 0.15)' },
              { offset: 1, color: 'rgba(22, 119, 255, 0)' },
            ]),
          },
        },
        {
          name: '命中率',
          type: 'line',
          data: current.map((s) => s.hit),
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { width: 2, color: '#14b8a6' },
          itemStyle: { color: '#14b8a6' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(20, 184, 166, 0.15)' },
              { offset: 1, color: 'rgba(20, 184, 166, 0)' },
            ]),
          },
        },
      ],
    };
  };

  // 初始化图表（仅一次）
  React.useEffect(() => {
    if (!chartRef.current) return;

    const chart = echarts.init(chartRef.current);
    chartInstance.current = chart;
    chart.setOption(buildOption());

    // 监听主题变化，重新渲染
    const observer = new MutationObserver(() => chart.setOption(buildOption()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
      chart.dispose();
      chartInstance.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 采样更新时重绘
  React.useEffect(() => {
    chartInstance.current?.setOption(buildOption());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  return <div ref={chartRef} className={styles.chartContainer} />;
};

/* ============ 主组件 ============ */

const RedisMonitor: React.FC = () => {
  const [overview, setOverview] = React.useState<RedisOverview | null>(null);
  const [samples, setSamples] = React.useState<TrendSample[]>([]);
  const [lastCheckTime, setLastCheckTime] = React.useState<string>('');

  // 拉取 Redis 监控概览，并记录一次趋势采样
  const fetchOverview = async () => {
    try {
      const data = await redisOverview();
      setOverview(data);
      setLastCheckTime(dayjs(data.instance.lastCheckTime).format('YYYY-MM-DD HH:mm:ss'));
      setSamples((prev) =>
        [
          ...prev,
          {
            time: dayjs().format('HH:mm'),
            memory: data.instance.memoryUsagePercent,
            hit: data.instance.hitRate,
          },
        ].slice(-MAX_SAMPLES),
      );
    } catch {
      // 错误提示由请求拦截器统一处理
    }
  };

  // 挂载时请求一次，之后每 30 秒自动刷新
  React.useEffect(() => {
    void fetchOverview();
    const timer = setInterval(() => void fetchOverview(), AUTO_REFRESH_INTERVAL);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const inst = overview?.instance;
  const health = overview?.health;
  const stats = overview?.stats;
  const isUp = inst?.status === 'UP';

  // 健康度环形图颜色：GOOD 绿 / WARN 橙 / 其他 红
  const healthColor =
    health?.level === 'GOOD' ? '#14b8a6' : health?.level === 'WARN' ? '#f59e0b' : '#ff4d4f';

  // 顶部指标卡片
  const metrics: MetricData[] = [
    {
      key: 'memory',
      name: '内存使用率',
      value: (inst?.memoryUsagePercent ?? 0).toFixed(1),
      unit: '%',
      detail: `已用 ${formatBytes(inst?.usedMemoryBytes)} / ${formatBytes(inst?.maxMemoryBytes)}`,
      icon: <DatabaseOutlined />,
      iconClass: styles.iconMemory,
    },
    {
      key: 'hit',
      name: '命中率',
      value: (inst?.hitRate ?? 0).toFixed(1),
      unit: '%',
      detail:
        (inst?.hitRate ?? 0) >= 90
          ? '缓存效率良好'
          : (inst?.hitRate ?? 0) >= 70
            ? '缓存效率一般'
            : '缓存效率偏低',
      icon: <ThunderboltOutlined />,
      iconClass: styles.iconHit,
    },
    {
      key: 'conn',
      name: '当前连接',
      value: `${inst?.connectedClients ?? 0}`,
      unit: '',
      detail: inst?.peakConnections != null ? `峰值 ${inst.peakConnections} 个连接` : '暂无峰值数据',
      icon: <ApiOutlined />,
      iconClass: styles.iconConn,
    },
    {
      key: 'qps',
      name: '每秒请求',
      value: inst?.qps != null ? inst.qps.toLocaleString() : '-',
      unit: 'QPS',
      detail: '暂无数据',
      trend:
        inst?.qpsChangePercent != null
          ? `${inst.qpsChangePercent > 0 ? '+' : ''}${inst.qpsChangePercent}%`
          : undefined,
      icon: <BarChartOutlined />,
      iconClass: styles.iconQps,
    },
  ];

  // 缓存健康度指标
  const healthMetrics = [
    { label: '键数量', value: (stats?.keyCount ?? 0).toLocaleString(), unit: '', green: false },
    { label: '过期键', value: (stats?.expiredKeys ?? 0).toLocaleString(), unit: '', green: false },
    {
      label: '阻塞客户端',
      value: `${stats?.blockedClients ?? 0}`,
      unit: '个',
      green: (stats?.blockedClients ?? 0) === 0,
    },
    { label: '淘汰策略', value: stats?.evictionPolicy ?? '-', unit: '', green: false },
  ];

  // 命令统计表格
  const columns: TableColumnsType<RedisCommandStat> = [
    {
      title: '命令类型',
      dataIndex: 'commandName',
      key: 'commandName',
      width: 140,
      render: (text: string) => <span className={styles.cmdName}>{text}</span>,
    },
    {
      title: '调用次数',
      dataIndex: 'calls',
      key: 'calls',
      width: 120,
      render: (calls: number) => <span className={styles.cmdTime}>{calls.toLocaleString()}</span>,
    },
    {
      title: '占比',
      dataIndex: 'percentage',
      key: 'percentage',
      width: 220,
      render: (percent: number, record) => (
        <div className={styles.barCell}>
          <div className={styles.barTrack}>
            <div
              className={styles.barFill}
              style={{ width: `${percent}%`, background: CMD_COLORS[record.commandName] ?? '#8c8c8c' }}
            />
          </div>
          <span className={styles.barPercent}>{percent}%</span>
        </div>
      ),
    },
    {
      title: '平均耗时',
      dataIndex: 'avgTimeMs',
      key: 'avgTimeMs',
      width: 120,
      render: (time: number) => <span className={styles.cmdTime}>{time} ms</span>,
    },
  ];

  return (
    <div className={styles.redisPage}>
      {/* ============ 页面头部（优化版） ============ */}
      <div className={styles.pageHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>
            <DashboardOutlined />
          </div>
          <div className={styles.headerText}>
            <div className={styles.breadcrumb}>MONITOR / REDIS</div>
            <h2 className={styles.title}>Redis 监控</h2>
            <Text className={styles.subtitle}>
              实时查看 Redis 服务运行状态、性能指标与缓存健康度
            </Text>
          </div>
        </div>
        <div className={styles.headerRight}>
          <Tag className={styles.statusTag} color={isUp ? 'success' : 'error'}>
            <span className={styles.statusDot} />
            {isUp ? '运行正常' : '服务异常'}
          </Tag>
          <Button icon={<ReloadOutlined />} onClick={() => void fetchOverview()}>
            刷新数据
          </Button>
        </div>
      </div>

      {/* ============ 服务状态卡片 ============ */}
      <div className={styles.serviceStatusCard}>
        <div className={styles.statusBody}>
          <div className={styles.serviceStatusIcon}>
            <DatabaseOutlined />
          </div>
          <div className={styles.serviceStatusInfo}>
            <div className={styles.serviceStatusRow}>
              <span className={styles.serviceStatusText}>{isUp ? '在线运行' : '已停止'}</span>
              {isUp && <span className={styles.pongBadge}>PONG</span>}
            </div>
            <div className={styles.serviceInstance}>
              {inst?.instanceName ?? '-'} · {isUp ? '连接已建立' : '连接已断开'} · 最近检测于{' '}
              {lastCheckTime || '-'}
            </div>
          </div>
          <div className={styles.serviceStatusMeta}>
            <div className={styles.metaItem}>
              <p className={styles.metaLabel}>版本</p>
              <span className={styles.metaValue}>{inst?.version ?? '-'}</span>
            </div>
            <div className={styles.metaItem}>
              <p className={styles.metaLabel}>运行时长</p>
              <span className={styles.metaValue}>{formatDuration((inst?.uptimeSeconds ?? 0) * 1000)}</span>
            </div>
            <div className={styles.metaItem}>
              <p className={styles.metaLabel}>连接地址</p>
              <span className={styles.metaValue}>{inst?.address ?? '-'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ============ 指标卡片 ============ */}
      <div className={styles.metricGrid}>
        {metrics.map((m) => (
          <div key={m.key} className={`${styles.metricCard} ${styles.panelCard}`}>
            <div className={styles.cardBody}>
              <div className={styles.cardHeader}>
                <div className={`${styles.metricIcon} ${m.iconClass}`}>{m.icon}</div>
                <div className={styles.metricDot} />
              </div>
              <p className={styles.metricName}>{m.name}</p>
              <div className={styles.metricValue}>
                {m.value}
                {m.unit && <span className={styles.unit}>{m.unit}</span>}
              </div>
              <div className={styles.metricDetail}>
                {m.trend ? (
                  <>
                    较上分钟 <span className={styles.trend}>{m.trend}</span>
                  </>
                ) : (
                  m.detail
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ============ 中间布局 ============ */}
      <div className={styles.middleLayout}>
        {/* 运行指标趋势 */}
        <div className={styles.panelCard}>
          <div className={styles.panelBody}>
            <div className={styles.panelHeader}>
              <div className={styles.panelTitleGroup}>
                <p className={styles.panelTitle}>运行指标</p>
                <p className={styles.panelSubtitle}>页面停留期间每 30 秒采样一次</p>
              </div>
              <span className={styles.autoRefresh}>
                <span className={styles.refreshDot} />
                自动刷新 30s
              </span>
            </div>
            <TrendChart data={samples} />
            <div className={styles.chartLegend}>
              <div className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: '#1677ff' }} />
                内存使用率
              </div>
              <div className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: '#14b8a6' }} />
                命中率
              </div>
            </div>
          </div>
        </div>

        {/* 缓存健康度 */}
        <div className={styles.panelCard}>
          <div className={styles.panelBody}>
            <div className={styles.panelHeader}>
              <div className={styles.panelTitleGroup}>
                <p className={styles.panelTitle}>缓存健康度</p>
                <p className={styles.panelSubtitle}>{health?.message ?? '当前实例资源概览'}</p>
              </div>
            </div>
            <div className={styles.healthGauge}>
              <Progress
                type="circle"
                percent={health?.score ?? 0}
                strokeColor={healthColor}
                size={140}
                format={() => (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 28, fontWeight: 700, color: healthColor }}>
                      {health?.score ?? 0}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-color-secondary)' }}>
                      健康度
                    </div>
                  </div>
                )}
              />
            </div>
            <div className={styles.healthMetrics}>
              {healthMetrics.map((item) => (
                <div key={item.label} className={styles.healthItem}>
                  <p className={styles.healthLabel}>{item.label}</p>
                  <div
                    className={`${styles.healthValue} ${item.green ? styles.healthValueGreen : ''}`}
                  >
                    {item.value}
                    {item.unit && <span className={styles.healthUnit}>{item.unit}</span>}
                  </div>
                </div>
              ))}
            </div>
            {health && health.deductionReasons.length > 0 && (
              <div style={{ padding: '8px 4px 0' }}>
                {health.deductionReasons.map((reason) => (
                  <p
                    key={reason}
                    style={{ margin: 0, fontSize: 12, color: '#ff4d4f' }}
                  >
                    · {reason}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============ 命令统计 ============ */}
      <div className={styles.cmdCard}>
        <div className={styles.cmdCardHeader}>
          <div className={styles.titleBlock}>
            <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-color)' }}>
              命令统计
            </span>
            <span className={styles.cmdSubtitle}>
              Redis 命令执行情况与平均响应时间
            </span>
          </div>
        </div>
        <div className={styles.cmdCardBody}>
          <Table
            columns={columns}
            dataSource={overview?.commandStats ?? []}
            rowKey="commandName"
            pagination={false}
            size="middle"
          />
        </div>
      </div>
    </div>
  );
};

export default RedisMonitor;
