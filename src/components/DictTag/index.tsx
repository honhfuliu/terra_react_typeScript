import * as React from 'react';
import { DictDataOption } from '@/service/dict.ts';
import { Tag } from 'antd';

interface DictTagProps {
  value: string;
  option: DictDataOption[];
}

const DictTag: React.FC<DictTagProps> = (props) => {
  const item = props.option.find((i) => i.dictValue === props.value);
  return <Tag color={item?.tagType || 'info'}>{item?.dictLabel || props.value}</Tag>;
};
export default DictTag;
