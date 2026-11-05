// 下载工具
/**
 * 通用文件下载
 */
export const downloadFile = (blob: Blob, fileName: string) => {
  const url = window.URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;

  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);

  window.URL.revokeObjectURL(url);
};

/**
 * Excel 文件下载
 */
export const downloadExcel = (blob: Blob, fileName: string) => {
  const name = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;

  downloadFile(blob, name);
};

/**
 * 从 Content-Disposition 响应头解析文件名
 */
export const getFileNameFromDisposition = (disposition?: string): string | null => {
  if (!disposition) return null;
  // 优先匹配 RFC 5987 格式：filename*=UTF-8''xxx
  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match) {
    return decodeURIComponent(utf8Match[1]);
  }
  const match = disposition.match(/filename="?([^";]+)"?/i);
  if (match) {
    return decodeURIComponent(match[1]);
  }
  return null;
};
