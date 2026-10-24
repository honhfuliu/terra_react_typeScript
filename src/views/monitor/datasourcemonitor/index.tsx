import * as React from 'react';
import * as echarts from 'echarts';
import dayjs from 'dayjs';
import { Button, Progress, Table, TableColumnsType, Tag, Typography } from 'antd';
import {
  ReloadOutlined,
  DatabaseOutlined,
  CheckCircleFilled,
  ThunderboltOutlined,
  FieldTimeOutlined,
  WarningOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import styles from './index.module.less';
import { databaseOverview, DatabaseOverview } from '@/service/databaseMonitor.ts';

const { Text } = Typography;

// Druid 控制台地址，按环境读取 .env 中的 VITE_DRUID_URL
const DRUID_URL = import.meta.env.VITE_DRUID_URL as string;

/* ============ 指标卡片数据 ============ */

interface MetricData {
  key: string;
  name: string;
  value: string;
  unit: string;
  detail: string;
  icon: React.ReactNode;
  iconClass: string;
  dotClass: string;
  valueOrange?: boolean;
  progress?: number;
}

/* ============ ECharts 环形图 ============ */

const CapacityChart: React.FC<{
  active: number;
  idle: number;
  remaining: number;
  percent: number;
}> = ({ active, idle, remaining, percent }) => {
  const chartRef = React.useRef<HTMLDivElement>(null);
  const chartInstance = React.useRef<echarts.ECharts | null>(null);

  const buildOption = (): echarts.EChartsOption => {
    const cs = getComputedStyle(document.documentElement);
    const textColor = cs.getPropertyValue('--text-color-secondary').trim() || '#666';
    return {
      tooltip: { trigger: 'item', valueFormatter: (value) => `${value} 个` },
      series: [
        {
          type: 'pie',
          radius: ['55%', '80%'],
          avoidLabelOverlap: false,
          label: {
            show: true,
            position: 'center',
            formatter: () => `{a|${percent}%}\n{b|连接使用率}`,
            rich: {
              a: { fontSize: 24, fontWeight: 'bold', color: '#1677ff', lineHeight: 30 },
              b: { fontSize: 12, color: textColor, lineHeight: 16 },
            },
          },
          labelLine: { show: false },
          data: [
            { value: active, name: '活跃连接', itemStyle: { color: '#14b8a6' } },
            { value: idle, name: '空闲连接', itemStyle: { color: '#1677ff' } },
            { value: remaining, name: '剩余容量', itemStyle: { color: '#e8e8e8' } },
          ],
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
    const observer = new MutationObserver(() => chartInstance.current?.setOption(buildOption()));
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

  // 数据更新时重绘
  React.useEffect(() => {
    chartInstance.current?.setOption(buildOption());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, idle, remaining, percent]);

  return <div ref={chartRef} className={styles.capacityChart} />;
};

/* ============ 主组件 ============ */

const DatasourceMonitor: React.FC = () => {
  const [data, setData] = React.useState<DatabaseOverview | null>(null);
  const [lastUpdated, setLastUpdated] = React.useState<string>('');

  // 拉取数据库监控概览
  const fetchData = async () => {
    try {
      const res = await databaseOverview();
      setData(res);
      setLastUpdated(dayjs().format('HH:mm:ss'));
    } catch {
      // 错误提示由请求拦截器统一处理
    }
  };

  // 挂载时请求一次
  React.useEffect(() => {
    void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ov = data?.overview;
  const runtime = data?.runtime;
  const poolHealth = data?.connectionPoolHealth;
  const isHealthy = ov?.healthStatus === 'HEALTHY';

  // 顶部指标卡片
  const metrics: MetricData[] = [
    {
      key: 'pool',
      name: '连接池状态',
      value: ov?.status ?? '-',
      unit: '',
      detail: ov ? `${ov.poolName} ${ov.poolVersion}` : '-',
      icon: <CheckCircleFilled />,
      iconClass: styles.iconPool,
      dotClass: ov?.status === '正常' ? styles.dotGreen : styles.dotOrange,
    },
    {
      key: 'usage',
      name: '连接使用率',
      value: (ov?.connectionUsagePercent ?? 0).toFixed(0),
      unit: '%',
      detail: `${ov?.activeConnections ?? 0} / ${ov?.maxConnections ?? 0} 连接`,
      icon: <ThunderboltOutlined />,
      iconClass: styles.iconUsage,
      dotClass: styles.dotGreen,
      progress: ov?.connectionUsagePercent ?? 0,
    },
    {
      key: 'wait',
      name: '连接等待',
      value: `${ov?.waitingThreads ?? 0}`,
      unit: '',
      detail: (ov?.waitingThreads ?? 0) > 0 ? '存在线程等待连接' : '暂无线程等待连接',
      icon: <FieldTimeOutlined />,
      iconClass: styles.iconWait,
      dotClass: (ov?.waitingThreads ?? 0) > 0 ? styles.dotOrange : styles.dotGreen,
    },
    {
      key: 'slow',
      name: '慢查询数量',
      value: `${ov?.slowQueryCount ?? 0}`,
      unit: '条',
      detail: `慢 SQL 阈值 ${((data?.dataSourceConfig.slowSqlThresholdMs ?? 0) / 1000).toFixed(0)} 秒`,
      icon: <WarningOutlined />,
      iconClass: styles.iconSlow,
      dotClass: (ov?.slowQueryCount ?? 0) > 0 ? styles.dotOrange : styles.dotGreen,
      valueOrange: (ov?.slowQueryCount ?? 0) > 0,
    },
  ];

  // 数据源配置表
  const configRows = data
    ? [
        {
          key: data.dataSourceConfig.dataSourceName,
          name: data.dataSourceConfig.dataSourceName,
          maxConn: data.dataSourceConfig.maxActive,
          minIdle: data.dataSourceConfig.minIdle,
          timeout: `${data.dataSourceConfig.maxWaitMs / 1000} 秒`,
          slowThreshold: `${data.dataSourceConfig.slowSqlThresholdMs / 1000} 秒`,
        },
      ]
    : [];

  const configColumns: TableColumnsType<(typeof configRows)[number]> = [
    {
      title: '数据源名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (text: string) => <span className={styles.configName}>{text}</span>,
    },
    { title: '最大连接数', dataIndex: 'maxConn', key: 'maxConn', width: 120, render: (v: number) => <span className={styles.configValue}>{v}</span> },
    { title: '最小空闲', dataIndex: 'minIdle', key: 'minIdle', width: 120, render: (v: number) => <span className={styles.configValue}>{v}</span> },
    { title: '连接超时', dataIndex: 'timeout', key: 'timeout', width: 120, render: (v: string) => <span className={styles.configValue}>{v}</span> },
    { title: '慢 SQL 阈值', dataIndex: 'slowThreshold', key: 'slowThreshold', width: 120, render: (v: string) => <span className={styles.configValue}>{v}</span> },
  ];

  return (
    <div className={styles.dbPage}>
      {/* ============ 页面头部 ============ */}
      <div className={styles.pageHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}><DatabaseOutlined /></div>
          <div className={styles.headerText}>
            <div className={styles.breadcrumb}>MONITOR / DATABASE</div>
            <h2 className={styles.title}>数据库监控</h2>
            <Text className={styles.subtitle}>实时查看数据库连接池运行状态、SQL 性能与数据源配置</Text>
          </div>
        </div>
        <div className={styles.headerRight}>
          <Tag className={styles.statusTag} color={isHealthy ? 'success' : 'error'}>
            <span className={styles.statusDot} />{isHealthy ? '运行正常' : '服务异常'}
          </Tag>
          <Button icon={<ReloadOutlined />} onClick={() => void fetchData()}>刷新数据</Button>
          <Button type="primary" icon={<LinkOutlined />} onClick={() => window.open(DRUID_URL, '_blank')}>
            查看 Druid 详细监控
          </Button>
        </div>
      </div>

      {/* ============ 服务状态卡片 ============ */}
      <div className={styles.statusCard}>
        <div className={styles.statusBody}>
          <div className={styles.statusIcon}><DatabaseOutlined /></div>
          <div className={styles.statusInfo}>
            <div className={styles.statusRow}>
              <span className={styles.statusText}>{ov?.instanceMode ?? '-'}</span>
              <span className={styles.healthyBadge}>{ov?.healthStatus ?? '-'}</span>
            </div>
            <div className={styles.statusInstance}>
              {ov ? `${ov.poolName} ${ov.poolVersion} · ${ov.dataSourceName}` : '-'} · 最近检测于{' '}
              {lastUpdated || '-'}
            </div>
          </div>
          <Button type="link" className={styles.statusLink} onClick={() => window.open(DRUID_URL, '_blank')}>
            进入 Druid 监控
          </Button>
        </div>
      </div>

      {/* ============ 指标卡片 ============ */}
      <div className={styles.metricGrid}>
        {metrics.map((m) => (
          <div key={m.key} className={styles.metricCard}>
            <div className={styles.cardBody}>
              <div className={styles.cardHeader}>
                <div className={`${styles.metricIcon} ${m.iconClass}`}>{m.icon}</div>
                <div className={`${styles.metricDot} ${m.dotClass}`} />
              </div>
              <p className={styles.metricName}>{m.name}</p>
              <div className={`${styles.metricValue} ${m.valueOrange ? styles.metricValueOrange : ''}`}>
                {m.value}{m.unit && <span className={styles.unit}>{m.unit}</span>}
              </div>
              {m.progress != null && (
                <div className={styles.metricBar}>
                  <Progress percent={Math.min(100, m.progress)} strokeColor="#1677ff" trailColor="var(--search-bg)" showInfo={false} size="small" />
                </div>
              )}
              <div className={styles.metricDetail}>{m.detail}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ============ 中间布局 ============ */}
      <div className={styles.middleLayout}>
        {/* 数据库运行时数据 */}
        <div className={styles.panelCard}>
          <div className={styles.panelBody}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.panelTitle}>数据库运行时数据</p>
                <p className={styles.panelSubtitle}>{runtime?.dataSourceName ?? '-'} · 应用数据库连接池状态</p>
              </div>
              <Tag color="blue">{ov?.poolName ?? '-'}</Tag>
            </div>

            {/* 运行指标 */}
            <div className={styles.runtimeSection}>
              <div className={styles.runtimeRow}>
                <span className={styles.runtimeLabel}>连接池状态</span>
                <span className={styles.runtimeValue}>{runtime?.poolStatus ?? '-'}</span>
              </div>
              <div className={styles.runtimeRow}>
                <span className={styles.runtimeLabel}>平均响应时间</span>
                <span className={styles.runtimeValue}>{runtime?.averageResponseTimeMs ?? '-'} ms</span>
              </div>
              <div className={styles.runtimeRow}>
                <span className={styles.runtimeLabel}>活跃 / 空闲 / 最大 / 等待</span>
                <span className={styles.runtimeValue}>
                  {runtime ? `${runtime.activeConnections} / ${runtime.idleConnections} / ${runtime.maxConnections} / ${runtime.waitingThreads}` : '-'}
                </span>
              </div>
            </div>

            {/* 连接分布条 */}
            <div className={styles.connBar}>
              <div className={styles.connActive} style={{ width: `${((runtime?.activeConnections ?? 0) / (runtime?.maxConnections || 1)) * 100}%` }} />
              <div className={styles.connIdle} style={{ width: `${((runtime?.idleConnections ?? 0) / (runtime?.maxConnections || 1)) * 100}%` }} />
            </div>
            <div className={styles.connLegend}>
              <div className={styles.legendItem}><span className={styles.legendDot} style={{ background: '#14b8a6' }} />活跃 {runtime?.activeConnections ?? 0}</div>
              <div className={styles.legendItem}><span className={styles.legendDot} style={{ background: '#1677ff' }} />空闲 {runtime?.idleConnections ?? 0}</div>
              <div className={styles.legendItem}><span className={styles.legendDot} style={{ background: 'var(--search-bg)' }} />最大 {runtime?.maxConnections ?? 0}</div>
            </div>

            {/* 后端「近 5 分钟请求与查询概览」接口暂未实现，数据就绪后恢复以下区块
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-color)', margin: '20px 0 0' }}>请求与查询概览（近 5 分钟）</p>
            <div className={styles.reqGrid}>
              {reqOverview.map((item) => (
                <div key={item.label} className={styles.reqItem}>
                  <p className={styles.reqLabel}>{item.label}</p>
                  <div className={`${styles.reqValue} ${item.orange ? styles.reqValueOrange : ''}`}>
                    {item.value}{item.unit && <span className={styles.reqUnit}>{item.unit}</span>}
                  </div>
                </div>
              ))}
            </div>
            */}
          </div>
        </div>

        {/* 连接容量 */}
        <div className={styles.panelCard}>
          <div className={styles.panelBody}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.panelTitle}>连接容量</p>
                <p className={styles.panelSubtitle}>当前实例连接池分布</p>
              </div>
            </div>
            <CapacityChart
              active={runtime?.activeConnections ?? 0}
              idle={runtime?.idleConnections ?? 0}
              remaining={poolHealth?.remainingCapacity ?? 0}
              percent={ov?.connectionUsagePercent ?? 0}
            />
            <div className={styles.capacityLegend}>
              <div className={styles.capItem}>
                <div className={styles.capLeft}><span className={styles.capDot} style={{ background: '#14b8a6' }} />活跃连接</div>
                <span className={styles.capRight}>{runtime?.activeConnections ?? 0}</span>
              </div>
              <div className={styles.capItem}>
                <div className={styles.capLeft}><span className={styles.capDot} style={{ background: '#1677ff' }} />空闲连接</div>
                <span className={styles.capRight}>{runtime?.idleConnections ?? 0}</span>
              </div>
              <div className={styles.capItem}>
                <div className={styles.capLeft}><span className={styles.capDot} style={{ background: '#e8e8e8' }} />剩余容量</div>
                <span className={styles.capRight}>{poolHealth?.remainingCapacity ?? 0}</span>
              </div>
            </div>
            <div className={styles.healthStatus}>
              <p className={styles.healthLabel}>数据库连接池健康度</p>
              <span className={styles.healthValue}>{poolHealth?.healthLevel ?? '-'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ============ 数据源配置表 ============ */}
      <div className={styles.configCard}>
        <div className={styles.configHeader}>
          <div>
            <span className={styles.configTitle}>数据源配置</span>
            <div className={styles.configSubtitle}>当前应用数据源连接池参数</div>
          </div>
          <Button type="link">查看完整指标</Button>
        </div>
        <div className={styles.configBody}>
          <Table columns={configColumns} dataSource={configRows} rowKey="key" pagination={false} size="middle" />
        </div>
      </div>
    </div>
  );
};

export default DatasourceMonitor;
