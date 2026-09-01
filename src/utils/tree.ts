/**
 * 递归移除树节点中为空的 children
 *
 * @param list 树形数据
 * @returns 处理后的树形数据
 */
export const removeEmptyChildren = <T extends { children?: T[] }>(list: T[]): T[] => {
  return list.map((item) => {
    const newItem = { ...item };

    if (newItem.children && newItem.children.length > 0) {
      newItem.children = removeEmptyChildren(newItem.children);
    } else {
      delete newItem.children;
    }

    return newItem;
  });
};
