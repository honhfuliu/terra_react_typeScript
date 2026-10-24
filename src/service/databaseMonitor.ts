import request from '@/utils/request.ts';

// 数据库监控概览信息
export type DbOverviewInfo = {
  instanceMode: string; // 实例运行模式描述
  healthStatus: string; // 健康状态：HEALTHY / UNHEALTHY
  poolName: string; // 连接池名称
  poolVersion: string; // 连接池版本
  status: string; // 连接池状态
  dataSourceName: string; // 数据源名称
  connectionUsagePercent: number; // 连接使用率（%）
  activeConnections: number; // 活跃连接数
  maxConnections: number; // 最大连接数
  waitingThreads: number; // 等待连接的线程数
  idleConnections: number; // 空闲连接数
  slowQueryCount: number; // 慢查询数量
};

// 数据库运行时数据
export type DbRuntimeInfo = {
  dataSourceName: string; // 数据源名称
  poolStatus: string; // 连接池状态
  averageResponseTimeMs: number; // 平均响应时间（ms）
  activeConnections: number; // 活跃连接数
  idleConnections: number; // 空闲连接数
  maxConnections: number; // 最大连接数
  waitingThreads: number; // 等待线程数
};

// 连接池健康度
export type DbPoolHealthInfo = {
  activeConnections: number; // 活跃连接数
  idleConnections: number; // 空闲连接数
  remainingCapacity: number; // 剩余容量
  healthLevel: string; // 健康等级
};

// 数据源配置
export type DbDataSourceConfig = {
  dataSourceName: string; // 数据源名称
  maxActive: number; // 最大活跃连接数
  minIdle: number; // 最小空闲连接数
  maxWaitMs: number; // 最大等待时间（ms）
  slowSqlThresholdMs: number; // 慢 SQL 阈值（ms）
};

// 数据库监控概览（对应后端 /system/database/monitor/overview）
export type DatabaseOverview = {
  overview: DbOverviewInfo;
  runtime: DbRuntimeInfo;
  connectionPoolHealth: DbPoolHealthInfo;
  dataSourceConfig: DbDataSourceConfig;
};

// 数据库监控概览
export const databaseOverview = async () => {
  try {
    return await request.get<DatabaseOverview>('/system/database/monitor/overview');
  } catch (e) {
    console.error(e);
    throw e;
  }
};
