import { useEffect, useState } from 'react';
import { DictDataOption, getDictDataByType } from '@/service/dict';
import storage from '@/utils/storage.ts';

/**
 * 获取字典数据
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
      const cacheKey = `dict_${dictType}`;
      try {
        const cacheData = storage.get(cacheKey) as DictDataOption[] | null;
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
