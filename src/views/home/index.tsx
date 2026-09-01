import * as React from 'react';
import { Table } from 'antd';
import { useEffect } from 'react';
import { getRouters } from '@/service/router.ts';

const Home: React.FC = () => {
  const columns = [
    {
      title: '编码',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: '屏幕宽度',
      dataIndex: 'width',
      key: 'width',
    },
  ];
  const dataSource = [
    {
      key: '1',
      code: 'xs',
      width: '< 576px',
    },
    {
      key: '2',
      code: 'sm',
      width: '≥ 576px',
    },
    {
      key: '3',
      code: 'md',
      width: '≥ 768px',
    },
    {
      key: '4',
      code: 'lg',
      width: '≥ 992px',
    },
    {
      key: '5',
      code: 'xl',
      width: '≥ 1200px',
    },
    {
      key: '6',
      code: 'xxl',
      width: '≥ 1600px',
    },
  ];

  return (
    <>
      <div></div>
      <div>
        <Table dataSource={dataSource} columns={columns} />;
      </div>
      <div>
        {Array(100)
          .fill(null)
          .map((_, index) => (
            <div key={index} style={{ color: 'var(--text-color)' }}>
              第 {index + 1} 项
            </div>
          ))}
      </div>
    </>
  );
};
export default Home;
