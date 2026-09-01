import * as React from 'react';
import styles from './index.module.less';
import { Card, Tag } from '@yth/ui';
const GlobalEncodingConfiguration: React.FC = () => {
  return (
    <div className={styles.encoding_layout}>
      <div>
        <Card
          items={[{ key: 1, label: '主键编码规则配置', children: [] }]}
          activeKey={[]} // 空数组 = 全部不展开
        />
      </div>
      <div className={styles.container}>
        <div className={styles.subtitle}>
          <div>编码元素 </div>
          {/*<div>点击下方标签添加编码元素</div>*/}
        </div>
      </div>
    </div>
  );
};
export default GlobalEncodingConfiguration;
