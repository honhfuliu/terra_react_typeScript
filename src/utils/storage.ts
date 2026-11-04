// 浏览器缓存
const storage = {
  set<T>(key: string, value: T) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  get<T>(key: string): T | null {
    const value = localStorage.getItem(key);
    if (!value) {
      return null;
    }
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as unknown as T; // 解析失败，当作原始字符串返回
    }
  },
  remove(key: string) {
    localStorage.removeItem(key);
  },

  // 新增 Session 存储
  setSession<T>(key: string, value: T) {
    sessionStorage.setItem(key, JSON.stringify(value));
  },

  getSession<T>(key: string): T | null {
    const value = sessionStorage.getItem(key);
    if (!value) return null;

    try {
      return JSON.parse(value) as T;
    } catch {
      return value as unknown as T;
    }
  },

  removeSession(key: string) {
    sessionStorage.removeItem(key);
  },
};
export default storage;
