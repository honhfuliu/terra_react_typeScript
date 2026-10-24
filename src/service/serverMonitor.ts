import request from '@/utils/request.ts';

// 服务器资源信息（CPU / 内存 / 磁盘，内存单位 GB）
export type ServerInfo = {
  cpuCores: number; // CPU 核心数
  cpuUsage: number; // CPU 使用率（%）
  memoryUsed: number; // 已用内存（GB）
  memoryTotal: number; // 总内存（GB）
  memoryUsage: number; // 内存使用率（%）
  diskUsed: number; // 已用磁盘（GB）
  diskTotal: number; // 总磁盘（GB）
  diskUsage: number; // 磁盘使用率（%）
};

// JVM 运行信息（内存单位 MB，运行时间单位毫秒）
export type JvmInfo = {
  heapUsed: number; // 堆内存已用（MB）
  heapMax: number; // 堆内存上限（MB）
  heapUsage: number; // 堆内存使用率（%）
  threadCount: number; // 线程数
  gcCount: number; // GC 次数
  nonHeapUsed: number; // 非堆内存（MB）
  uptime: number; // JVM 运行时间（毫秒）
};

// 应用服务信息（运行时间单位毫秒）
export type ApplicationInfo = {
  applicationName: string; // 应用名称
  activeProfile: string; // 激活的环境配置
  port: number; // 端口
  status: string; // 服务状态：UP / DOWN
  uptime: number; // 运行时间（毫秒）
  totalRequests: number; // 累计请求数
  averageResponseTime: number; // 平均响应时间（ms）
};

// 服务监控概览（对应后端 /system/monitor/server/overview）
export type ServerOverview = {
  server: ServerInfo;
  jvm: JvmInfo;
  application: ApplicationInfo;
};

// 服务监控概览
export const serverOverview = async () => {
  try {
    return await request.get<ServerOverview>('/system/monitor/server/overview');
  } catch (e) {
    console.error(e);
    throw e;
  }
};
