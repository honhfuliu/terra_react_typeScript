import { useEffect, useState } from 'react';
import { DictDataOption, getDictDataByType } from '@/service/dict';
import storage from '@/utils/storage.ts';
import { STORAGE_KEY } from '@/constants';

const getCacheKey = (dictType: string) => `${STORAGE_KEY.DICT_CACHE_PREFIX}${dictType}`;

/**
 * 删除指定字典的本地缓存，下次使用时重新从服务端获取
 * @param dictType 字典编码
 */
export const removeDictCache = (dictType: string) => {
  if (!dictType) return;
  storage.remove(getCacheKey(dictType));
};

/**
 * 清除全部字典本地缓存，下次使用时重新从服务端获取
 */
export const clearDictCache = () => {
  Object.keys(localStorage)
    .filter((key) => key.startsWith(STORAGE_KEY.DICT_CACHE_PREFIX))
    .forEach((key) => storage.remove(key));
};

/**
 * 获取字典数据（带 localStorage 缓存）
 * @param dictType
 */
export const useDict = (dictType: string) => {
  const [options, setOptions] = useState<DictDataOption[]>([]);

  useEffect(() => {
    if (!dictType) {
      setOptions([]);
      return;
    }
    const getData = async () => {
      const cacheKey = getCacheKey(dictType);
      try {
        const cacheData = storage.get<DictDataOption[]>(cacheKey);
        if (cacheData) {
          setOptions(cacheData);
          return;
        }
        const data = await getDictDataByType(dictType);
        setOptions(data);
        storage.set(cacheKey, data);
      } catch (error) {
        console.error(`获取字典[${dictType}]失败:`, error);
        setOptions([]);
      }
    };

    void getData();
  }, [dictType]);

  return options;
};
