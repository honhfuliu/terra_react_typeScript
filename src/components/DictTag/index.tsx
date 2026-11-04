import type { ReactElement } from 'react';
import { DictDataOption } from '@/service/dict.ts';
import { Tag } from 'antd';

interface DictTagProps {
  value: string | undefined;
  option: DictDataOption[];
}

const DictTag = (props: DictTagProps): ReactElement => {
  if (!props.value) {
    return <Tag>-</Tag>;
  }
  const item = props.option.find((i) => i.dictValue === props.value);
  return <Tag color={item?.tagType || 'info'}>{item?.dictLabel || props.value}</Tag>;
};
export default DictTag;
