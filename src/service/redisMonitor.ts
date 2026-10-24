import request from '@/utils/request.ts';

// Redis 实例信息
export type RedisInstanceInfo = {
  instanceName: string; // 实例名称
  status: string; // 实例状态：UP / DOWN
  lastCheckTime: string; // 最近检测时间（ISO 格式）
  version: string; // Redis 版本
  uptimeSeconds: number; // 运行时长（秒）
  address: string; // 连接地址
  memoryUsagePercent: number; // 内存使用率（%）
  usedMemoryBytes: number; // 已用内存（字节）
  maxMemoryBytes: number; // 内存上限（字节）
  hitRate: number; // 命中率（%）
  connectedClients: number; // 当前连接数
  peakConnections: number | null; // 峰值连接数
  qps: number | null; // 每秒请求数
  qpsChangePercent: number | null; // QPS 较上分钟变化（%）
};

// Redis 健康度信息
export type RedisHealthInfo = {
  score: number; // 健康评分（0-100）
  level: string; // 健康等级：GOOD / WARN / BAD
  message: string; // 健康描述
  deductionReasons: string[]; // 扣分原因
};

// Redis 缓存统计信息
export type RedisStatsInfo = {
  keyCount: number; // 键数量
  expiredKeys: number; // 过期键数量
  blockedClients: number; // 阻塞客户端数量
  evictionPolicy: string; // 淘汰策略
};

// Redis 命令统计行
export type RedisCommandStat = {
  commandName: string; // 命令名称
  calls: number; // 调用次数
  percentage: number; // 调用占比（%）
  avgTimeMs: number; // 平均耗时（ms）
};

// Redis 监控概览（对应后端 /system/monitor/redis/overview）
export type RedisOverview = {
  instance: RedisInstanceInfo;
  health: RedisHealthInfo;
  stats: RedisStatsInfo;
  commandStats: RedisCommandStat[];
};

// Redis 监控概览
export const redisOverview = async () => {
  try {
    return await request.get<RedisOverview>('/system/monitor/redis/overview');
  } catch (e) {
    console.error(e);
    throw e;
  }
};
