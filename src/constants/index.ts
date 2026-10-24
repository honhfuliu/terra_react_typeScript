// ==================== 本地存储 Key ====================
export const STORAGE_KEY = {
  TOKEN: '$_token', // 登录令牌
  USER: '$_user', // 用户信息
  THEME: 'theme', // 主题
  DICT_CACHE_PREFIX: 'dict_', // 字典缓存 key 前缀（dict_ + 字典编码）
} as const;

// ==================== 字典编码（后端 dict_type）====================
export const DICT_TYPE = {
  SYS_STATUS: 'sys_status', // 通用状态：正常 / 停用
  SYS_SEX: 'sys_sex', // 性别
  SYS_TAG_COLOR: 'sys_tag_color', // 标签样式
  SYS_NOTICE_TYPE: 'sys_notice_type', // 公告类型
  SYS_NOTICE_STATUS: 'sys_notice_status', // 公告状态
  SYS_MENU_TYPE: 'sys_menu_type', // 菜单类型
  SYS_RESULT_STATUS: 'sys_result_status', // 操作 / 登录结果状态
  SYS_OPERATE_TYPE: 'sys_operate_type', // 操作类型
  SYS_OPERATE_MODULE: 'sys_operate_module', // 业务模块
} as const;

// ==================== 通用状态值 ====================
// 启用 / 正常 / 是（1）与停用 / 否（0）
export const COMMON_STATUS = {
  ENABLED: '1',
  DISABLED: '0',
} as const;

// 是否标记（Y / N）
export const WHETHER = {
  YES: 'Y',
  NO: 'N',
} as const;

// 执行结果（字典 sys_result_status）
export const RESULT_STATUS = {
  SUCCESS: '1', // 成功
  FAIL: '0', // 失败
} as const;

// ==================== 菜单类型（字典 sys_menu_type）====================
export const MENU_TYPE = {
  DIR: 'M', // 目录
  MENU: 'C', // 菜单
  EMBED: 'B', // 内嵌 / 外链
  BUTTON: 'F', // 按钮
} as const;

// ==================== 公告状态（字典 sys_notice_status）====================
export const NOTICE_STATUS = {
  DRAFT: '1', // 待发布
  PUBLISHED: '2', // 已发布
  OFFLINE: '3', // 已下架
} as const;

// ==================== HTTP / 请求 ====================
export const HTTP = {
  SUCCESS: 200, // 业务成功
  UNAUTHORIZED: 401, // 未登录 / Token 失效
  FORBIDDEN: 403, // 无权限
  TOKEN_HEADER: 'Authorization', // Token 请求头
  TOKEN_PREFIX: 'Bearer ', // Token 前缀
  REQUEST_TIMEOUT: 30000, // 请求超时时间（毫秒）
} as const;

// 后端路由数据中根布局节点的 component 标识
export const LAYOUT_COMPONENT = 'Layout';

// ==================== 分页 ====================
export const PAGINATION = {
  DEFAULT_PAGE_NUM: 1, // 默认页码
  DEFAULT_PAGE_SIZE: 10, // 默认每页条数
} as const;

// ==================== 日期格式 ====================
export const DATE_FORMAT = {
  DATE_TIME: 'YYYY-MM-DD HH:mm:ss', // 日期时间（与后端约定一致）
} as const;

// 即将超时阈值：Token 剩余有效时长小于 30 分钟
export const EXPIRING_THRESHOLD_SECONDS = 30 * 60;
