import * as React from 'react';
import styles from './index.module.less';

import Search from '@/assets/svgs/Search.svg?react';
import Freshen from '@/assets/svgs/Freshen.svg?react';
import Download from '@/assets/svgs/Download.svg?react';
import {
  Button,
  Col,
  DatePicker,
  Form,
  Input,
  PaginationProps,
  Row,
  Select,
  Table,
  TableColumnsType,
} from 'antd';
import { useEffect, useState } from 'react';
import { FilterOutlined } from '@ant-design/icons';
import { loginLogList, LoginLogRow, LoginLogSearchType } from '@/service/loginLog.ts';
import { useDict } from '@/hooks/useDict.ts';
import DictTag from '@/components/DictTag';

const { RangePicker } = DatePicker;

// 登录成功状态值（后端 CHAR(1)：1 成功 0 失败）
const STATUS_SUCCESS = '1';

const Loginlog: React.FC = () => {
  const statusOptions = useDict('sys_result_status'); // 状态
  const [searchForm] = Form.useForm<LoginLogSearchType>();

  // 表格数据
  const [dataList, setDataList] = useState<LoginLogRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  // 服务端分页
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // 查询登录日志列表
  const fetchList = async (pageNum: number, pageSize: number) => {
    const searchValues = searchForm.getFieldsValue();
    const params: LoginLogSearchType = {
      ...searchValues,
      pageNum,
      pageSize,
    };
    // 登录时间范围转换为后端需要的 startTime / endTime 字符串（按所选时分秒精确传递）
    if (searchValues.loginTime && searchValues.loginTime.length === 2) {
      const [start, end] = searchValues.loginTime;
      params.startTime = start.format('YYYY-MM-DD HH:mm:ss');
      params.endTime = end.format('YYYY-MM-DD HH:mm:ss');
      delete params.loginTime;
    }

    setLoading(true);
    try {
      const data = await loginLogList(params);
      setDataList(data.rows || []);
      setPagination((prev) => ({
        ...prev,
        current: pageNum,
        pageSize,
        total: data.total || 0,
      }));
    } catch (e) {
      console.error(e);
      setDataList([]);
      setPagination((prev) => ({ ...prev, current: pageNum, pageSize, total: 0 }));
    } finally {
      setLoading(false);
    }
  };

  // 首次加载
  useEffect(() => {
    void fetchList(1, 10);
  }, []);

  // 搜索：回到第一页
  const handleSearch = () => {
    void fetchList(1, pagination.pageSize);
  };

  // 重置：清空筛选条件并重新查询
  const handleResetSearch = () => {
    searchForm.resetFields();
    void fetchList(1, pagination.pageSize);
  };

  // 翻页
  const handlePageChange: PaginationProps['onChange'] = (page, pageSize) => {
    void fetchList(page, pageSize);
  };

  // 表格列配置
  const columns: TableColumnsType<LoginLogRow> = [
    {
      title: '登录账号',
      dataIndex: 'username',
      key: 'username',
      width: 130,
      render: (text: string) => <span className={styles.accountName}>{text}</span>,
    },
    {
      title: 'IP 地址',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      width: 150,
      render: (text: string) => <span className={styles.ipTag}>{text}</span>,
    },
    {
      title: '登录位置',
      dataIndex: 'loginLocation',
      key: 'loginLocation',
      width: 120,
    },
    {
      title: '浏览器',
      dataIndex: 'browser',
      key: 'browser',
      width: 120,
    },
    {
      title: '操作系统',
      dataIndex: 'os',
      key: 'os',
      width: 130,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => DictTag({ value: status, option: statusOptions }),
    },
    {
      title: '操作信息',
      dataIndex: 'message',
      key: 'message',
      width: 140,
      render: (text: string, record) => (
        <span className={record.status === STATUS_SUCCESS ? styles.msgSuccess : styles.msgFail}>
          {text}
        </span>
      ),
    },
    {
      title: '登录时间',
      dataIndex: 'loginTime',
      key: 'loginTime',
      width: 180,
      render: (text: string) => <span className={styles.timeCell}>{text}</span>,
    },
  ];

  return (
    <div className={styles.layout}>
      {/* 卡片一：筛选条件 */}
      <div className={styles.searchCard}>
        <div className={styles.searchCardHeader}>
          <div className={styles.titleWrap}>
            <span className={styles.titleIcon}>
              <FilterOutlined />
            </span>
            <span className={styles.cardTitle}>筛选条件</span>
            <span className={styles.cardSubtitle}>按账号、状态和时间快速查询</span>
          </div>
        </div>
        <div className={styles.searchCardBody}>
          <Form form={searchForm}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} lg={8} xl={6}>
                <Form.Item<LoginLogSearchType>
                  label={'登录账号'}
                  name="username"
                  style={{ marginBottom: 0 }}
                >
                  <Input placeholder={'请输入登录账号'} allowClear />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} lg={8} xl={5}>
                <Form.Item<LoginLogSearchType>
                  label={'登录状态'}
                  name="status"
                  style={{ marginBottom: 0 }}
                >
                  <Select
                    placeholder={'全部状态'}
                    allowClear
                    options={statusOptions.map((item) => ({
                      label: item.dictLabel,
                      value: item.dictValue,
                    }))}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} lg={8} xl={7}>
                <Form.Item<LoginLogSearchType>
                  label={'登录时间'}
                  name="loginTime"
                  style={{ marginBottom: 0 }}
                >
                  <RangePicker showTime style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col xs={24} lg={8} xl={6}>
                <div className={styles.searchActions}>
                  <Button
                    type="primary"
                    icon={<Search width={16} height={16} />}
                    onClick={handleSearch}
                  >
                    搜索
                  </Button>
                  <Button icon={<Freshen width={16} height={16} />} onClick={handleResetSearch}>
                    重置
                  </Button>
                </div>
              </Col>
            </Row>
          </Form>
        </div>
      </div>

      {/* 卡片二：登录记录 */}
      <div className={styles.tableCard}>
        <div className={styles.tableCardHeader}>
          <div className={styles.titleBlock}>
            <span className={styles.cardTitle}>登录记录</span>
            <span className={styles.cardSubtitle}>展示最近的用户登录行为及设备信息</span>
          </div>
          <Button className={styles.toolButton} icon={<Download width={16} height={16} />}>
            导出日志
          </Button>
        </div>
        <div className={styles.tableCardBody}>
          <Table
            columns={columns}
            dataSource={dataList}
            rowKey="id"
            loading={loading}
            scroll={{ x: 1070 }}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 条`,
              onChange: handlePageChange,
            }}
          />
        </div>
      </div>
    </div>
  );
};
export default Loginlog;
