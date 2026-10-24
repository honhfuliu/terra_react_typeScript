import * as React from 'react';
import * as echarts from 'echarts';
import dayjs from 'dayjs';
import { Button, Card, Progress, Tag, Typography } from 'antd';
import {
  ReloadOutlined,
  DashboardOutlined,
  ThunderboltOutlined,
  DatabaseOutlined,
  HddOutlined,
  ApiOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import styles from './index.module.less';
import { serverOverview, ServerOverview } from '@/service/serverMonitor.ts';
import { formatDuration } from '@/utils/date.ts';

const { Text } = Typography;

/* ============ 常量与工具 ============ */

// 自动刷新间隔：30 秒
const AUTO_REFRESH_INTERVAL = 30 * 1000;
// 趋势图最大采样点数（30 秒一个点，保留 30 分钟）
const MAX_SAMPLES = 60;

/* ============ 指标卡片数据 ============ */

interface MetricData {
  key: string;
  name: string;
  value: number;
  displayValue: string;
  detail: string;
  detailPercent: string;
  icon: React.ReactNode;
  iconClass: string;
  color: string;
}

/* ============ 趋势图数据 ============ */

// 趋势采样点
interface TrendSample {
  time: string;
  cpu: number;
  memory: number;
  jvm: number;
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
      tooltip: {
        trigger: 'axis',
        valueFormatter: (value) => `${value}%`,
      },
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
          name: 'CPU',
          type: 'line',
          data: current.map((s) => s.cpu),
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
          name: '内存',
          type: 'line',
          data: current.map((s) => s.memory),
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
        {
          name: 'JVM',
          type: 'line',
          data: current.map((s) => s.jvm),
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { width: 2, color: '#7c3aed' },
          itemStyle: { color: '#7c3aed' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(124, 58, 237, 0.15)' },
              { offset: 1, color: 'rgba(124, 58, 237, 0)' },
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

const ServerMonitor: React.FC = () => {
  const [overview, setOverview] = React.useState<ServerOverview | null>(null);
  const [samples, setSamples] = React.useState<TrendSample[]>([]);
  const [lastUpdated, setLastUpdated] = React.useState<string>('');

  // 拉取服务监控概览，并记录一次趋势采样
  const fetchOverview = async () => {
    try {
      const data = await serverOverview();
      setOverview(data);
      setLastUpdated(dayjs().format('HH:mm:ss'));
      setSamples((prev) =>
        [
          ...prev,
          {
            time: dayjs().format('HH:mm'),
            cpu: data.server.cpuUsage,
            memory: data.server.memoryUsage,
            jvm: data.jvm.heapUsage,
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

  const server = overview?.server;
  const jvm = overview?.jvm;
  const app = overview?.application;
  const isUp = app?.status === 'UP';

  // 顶部指标卡片
  const metrics: MetricData[] = [
    {
      key: 'cpu',
      name: 'CPU 使用率',
      value: server?.cpuUsage ?? 0,
      displayValue: (server?.cpuUsage ?? 0).toFixed(1),
      detail: `${server?.cpuCores ?? '-'} 核`,
      detailPercent: `${(server?.cpuUsage ?? 0).toFixed(1)}%`,
      icon: <DashboardOutlined />,
      iconClass: styles.iconCpu,
      color: '#1677ff',
    },
    {
      key: 'memory',
      name: '内存使用率',
      value: server?.memoryUsage ?? 0,
      displayValue: (server?.memoryUsage ?? 0).toFixed(1),
      detail: `已用 ${server?.memoryUsed ?? 0} / ${server?.memoryTotal ?? 0} GB`,
      detailPercent: `${(server?.memoryUsage ?? 0).toFixed(1)}%`,
      icon: <ThunderboltOutlined />,
      iconClass: styles.iconMemory,
      color: '#14b8a6',
    },
    {
      key: 'jvm',
      name: 'JVM 内存',
      value: jvm?.heapUsage ?? 0,
      displayValue: (jvm?.heapUsage ?? 0).toFixed(1),
      detail: `堆内存 ${((jvm?.heapUsed ?? 0) / 1024).toFixed(2)} / ${(
        (jvm?.heapMax ?? 0) / 1024
      ).toFixed(2)} GB`,
      detailPercent: `${(jvm?.heapUsage ?? 0).toFixed(1)}%`,
      icon: <DatabaseOutlined />,
      iconClass: styles.iconJvm,
      color: '#7c3aed',
    },
    {
      key: 'disk',
      name: '磁盘使用率',
      value: server?.diskUsage ?? 0,
      displayValue: (server?.diskUsage ?? 0).toFixed(1),
      detail: `已用 ${server?.diskUsed ?? 0} / ${server?.diskTotal ?? 0} GB`,
      detailPercent: `${(server?.diskUsage ?? 0).toFixed(1)}%`,
      icon: <HddOutlined />,
      iconClass: styles.iconDisk,
      color: '#f59e0b',
    },
  ];

  // JVM 状态指标
  const jvmMetrics = [
    { label: '线程数', value: `${jvm?.threadCount ?? 0}`, unit: '' },
    { label: 'GC 次数', value: `${jvm?.gcCount ?? 0}`, unit: '' },
    { label: '非堆内存', value: `${jvm?.nonHeapUsed ?? 0}`, unit: 'MB' },
    { label: '运行时间', value: formatDuration(jvm?.uptime), unit: '' },
  ];

  // 应用服务指标
  const serviceMetrics = [
    { label: '运行时长', value: formatDuration(app?.uptime), unit: '' },
    { label: '累计请求', value: (app?.totalRequests ?? 0).toLocaleString(), unit: '' },
    { label: '平均响应', value: `${app?.averageResponseTime ?? 0}`, unit: 'ms' },
  ];

  return (
    <div className={styles.monitorPage}>
      {/* ============ 页面头部（优化版） ============ */}
      <div className={styles.pageHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>
            <GlobalOutlined />
          </div>
          <div className={styles.headerText}>
            <div className={styles.breadcrumb}>MONITOR / SERVER</div>
            <h2 className={styles.title}>服务监控</h2>
            <Text className={styles.subtitle}>
              实时查看服务器资源与应用服务运行状态
            </Text>
          </div>
        </div>
        <div className={styles.headerRight}>
          <Tag className={styles.statusTag} color={isUp ? 'success' : 'error'}>
            <span className={styles.statusDot} />
            {isUp ? '系统运行正常' : '服务异常'}
          </Tag>
          <Button icon={<ReloadOutlined />} onClick={() => void fetchOverview()}>
            刷新数据
          </Button>
        </div>
      </div>

      {/* ============ 顶部指标卡片 ============ */}
      <div className={styles.metricGrid}>
        {metrics.map((m) => (
          <Card
            key={m.key}
            variant="borderless"
            className={styles.metricCard}
            styles={{ body: { padding: 0 } }}
          >
            <div className={styles.cardBody}>
              <div className={styles.cardHeader}>
                <div className={`${styles.metricIcon} ${m.iconClass}`}>{m.icon}</div>
                <div className={styles.metricDot} />
              </div>
              <p className={styles.metricName}>{m.name}</p>
              <div className={styles.metricValue}>
                {m.displayValue}
                <span className={styles.unit}>%</span>
              </div>
              <div className={styles.metricBar}>
                <Progress
                  percent={Math.min(100, m.value)}
                  strokeColor={m.color}
                  trailColor="var(--search-bg)"
                  showInfo={false}
                  size="small"
                />
              </div>
              <div className={styles.metricDetail}>
                <span className={styles.detailText}>{m.detail}</span>
                <span className={styles.detailPercent}>{m.detailPercent}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* ============ 中间布局 ============ */}
      <div className={styles.middleLayout}>
        {/* 资源使用趋势 */}
        <Card variant="borderless" className={styles.panelCard}>
          <div className={styles.panelHeader}>
            <div className={styles.panelTitleGroup}>
              <p className={styles.panelTitle}>资源使用趋势</p>
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
              CPU
            </div>
            <div className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: '#14b8a6' }} />
              内存
            </div>
            <div className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: '#7c3aed' }} />
              JVM
            </div>
          </div>
        </Card>

        {/* JVM 状态 */}
        <Card variant="borderless" className={styles.panelCard}>
          <div className={styles.panelHeader}>
            <div className={styles.panelTitleGroup}>
              <p className={styles.panelTitle}>JVM 状态</p>
              <p className={styles.panelSubtitle}>Java 虚拟机运行指标</p>
            </div>
          </div>
          <div className={styles.jvmGauge}>
            <Progress
              type="circle"
              percent={Math.min(100, jvm?.heapUsage ?? 0)}
              strokeColor="#7c3aed"
              size={140}
              format={() => (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 700 }}>
                    {(jvm?.heapUsage ?? 0).toFixed(1)}%
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-color-secondary)' }}>
                    堆内存使用
                  </div>
                </div>
              )}
            />
          </div>
          <div className={styles.jvmMetrics}>
            {jvmMetrics.map((item) => (
              <div key={item.label} className={styles.jvmMetricItem}>
                <p className={styles.jvmMetricLabel}>{item.label}</p>
                <div className={styles.jvmMetricValue}>
                  {item.value}
                  {item.unit && <span className={styles.jvmMetricUnit}>{item.unit}</span>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ============ 应用服务 ============ */}
      <Card variant="borderless" className={styles.serviceCard}>
        <div className={styles.serviceHeader}>
          <div className={styles.serviceTitleGroup}>
            <p className={styles.serviceTitle}>应用服务</p>
            <p className={styles.serviceSubtitle}>当前单体应用运行实例</p>
          </div>
          <Button type="link">服务配置</Button>
        </div>

        <div className={styles.serviceInfo}>
          <div className={styles.serviceIcon}>
            <ApiOutlined />
          </div>
          <div>
            <p className={styles.serviceName}>{app?.applicationName ?? '-'}</p>
            <p className={styles.serviceDesc}>
              Spring Boot · {app?.activeProfile ?? '-'} · 端口 {app?.port ?? '-'}
            </p>
          </div>
          <Tag color={isUp ? 'success' : 'error'} style={{ marginLeft: 'auto' }}>
            {isUp ? '运行中' : '已停止'}
          </Tag>
        </div>

        <div className={styles.serviceMetrics}>
          {serviceMetrics.map((item) => (
            <div key={item.label} className={styles.serviceMetricItem}>
              <p className={styles.serviceMetricLabel}>{item.label}</p>
              <div className={styles.serviceMetricValue}>
                {item.value}
                {item.unit && (
                  <span className={styles.serviceMetricUnit}>{item.unit}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className={styles.serviceStatusBar}>
          <div className={styles.serviceStatusLeft}>
            <span className={styles.serviceStatusDot} />
            {isUp ? '服务运行正常' : '服务已停止'}
          </div>
          <span className={styles.serviceStatusRight}>
            最后检测: {lastUpdated || '-'}
          </span>
        </div>
      </Card>
    </div>
  );
};

export default ServerMonitor;
