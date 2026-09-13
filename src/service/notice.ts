import request from '@/utils/request.ts';
import { Dayjs } from 'dayjs';

// 公告新增 / 编辑参数
// id 为空表示新增，不为空表示修改
export type NoticeSaveParams = {
  id?: number;
  title: string; // 公告标题（必填，最大 200）
  noticeType: string; // 公告类型：NOTICE 通知 / ANNOUNCEMENT 公告（必填）
  content: string; // 公告内容（必填，富文本 HTML）
  summary?: string; // 公告摘要（最大 500）
};

// 公告列表行
export type NoticeRow = {
  id: number;
  title: string; // 公告标题
  noticeType: string; // 公告类型
  status: string; // 状态：1 待发布、2 已发布、3 已下线
  isTop?: string; // 是否置顶
  publishTime?: string | null; // 发布时间
  expireTime?: string | null; // 失效时间
  viewCount?: number; // 浏览次数
  summary?: string; // 公告摘要
  content?: string; // 公告内容（富文本 HTML）
};

// 公告详情（GET /system/notice/{id} 返回）
export type NoticeDetail = {
  id: number; // 公告 ID
  title: string; // 公告标题
  noticeType: string; // 公告类型：NOTICE / ANNOUNCEMENT
  summary?: string; // 公告摘要
  content?: string; // 公告内容（富文本 HTML）
  publishTime?: string | null; // 发布时间（未发布为 null）
  expireTime?: string | null; // 失效时间（未设置为 null）
  viewCount?: number; // 浏览次数
};

// 公告列表查询参数
export type NoticeSearchParams = {
  title?: string; // 公告标题（模糊查询）
  noticeType?: string; // 公告类型
  status?: string; // 状态
  publishTime?: [Dayjs, Dayjs]; // 表单中的发布时间范围（提交时转换）
  startTime?: string; // 发布时间-开始（yyyy-MM-dd HH:mm:ss）
  endTime?: string; // 发布时间-结束（yyyy-MM-dd HH:mm:ss）
  pageNum: number; // 当前页
  pageSize: number; // 每页条数
};

// 分页返回
export type NoticePageResult = {
  rows: NoticeRow[];
  total: number;
};

// 新增 / 编辑公告（id 有值走修改逻辑）
export const saveNotice = async (data: NoticeSaveParams) => {
  try {
    return await request.post<void>('/system/notice', data);
  } catch (e) {
    console.error(e);
    throw e;
  }
};

// 公告列表
export const noticeList = async (params: NoticeSearchParams) => {
  try {
    return await request.get<NoticePageResult>('/system/notice/list', { params });
  } catch (e) {
    console.error(e);
    throw e;
  }
};

// 公告详情（查看详情 / 编辑回显）
export const getNotice = async (id: number) => {
  try {
    return await request.get<NoticeDetail>(`/system/notice/${id}`);
  } catch (e) {
    console.error(e);
    throw e;
  }
};

// 删除公告
export const deleteNotice = async (id: number) => {
  try {
    return await request.post<void>(`/system/notice/delete/${id}`);
  } catch (e) {
    console.error(e);
    throw e;
  }
};

// 置顶公告（仅置顶，已置顶的公告前端不展示入口）
export const topNotice = async (id: number) => {
  try {
    return await request.post<void>(`/system/notice/top/${id}`);
  } catch (e) {
    console.error(e);
    throw e;
  }
};

// 批量发布公告（请求体为 id 数组，如 [3, 5, 8]）
export const publishNotices = async (ids: number[]) => {
  try {
    return await request.post<void>('/system/notice/publish', ids);
  } catch (e) {
    console.error(e);
    throw e;
  }
};

// 下架公告（仅已发布 status=2 的公告可下架）
export const offlineNotice = async (id: number) => {
  try {
    return await request.post<void>(`/system/notice/offline/${id}`);
  } catch (e) {
    console.error(e);
    throw e;
  }
};
