import * as React from 'react';
import styles from './index.module.less';
import {
  App,
  Button,
  Col,
  Form,
  Grid,
  Input,
  Modal,
  Popconfirm,
  Radio,
  Row,
  Select,
  Space,
  Table,
  TableColumnsType,
} from 'antd';
import { useEffect, useState } from 'react';
import Icon from '@/components/Icon';
import { PAGINATION } from '@/constants';
import {
  deleteProvider,
  getProtocolOptions,
  getProviderPage,
  ProtocolOption,
  ProviderRow,
  SaveProviderParams,
  saveProvider,
} from '@/service/provider.ts';
import Auth from '@/components/Auth';

// 新增/编辑弹窗表单字段：直接复用后端入参类型（表单不含 id）
type ProviderFormValues = Omit<SaveProviderParams, 'id'>;

// 筛选条件
interface ProviderFilterValues {
  keyword?: string;
  protocol?: string;
}

const Provider: React.FC = () => {
  const { message } = App.useApp();
  const screens = Grid.useBreakpoint();

  // 提供商列表（后端分页数据）
  const [providers, setProviders] = useState<ProviderRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  // 当前页码
  const [currentPage, setCurrentPage] = useState<number>(PAGINATION.DEFAULT_PAGE_NUM);
  // 刷新标识：保存成功后重新拉取当前页
  const [refreshKey, setRefreshKey] = useState(0);

  // 筛选表单与已生效的筛选条件
  const [filterForm] = Form.useForm<ProviderFilterValues>();
  const [filters, setFilters] = useState<ProviderFilterValues>({});

  // 新增/编辑弹窗
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [providerForm] = Form.useForm<ProviderFormValues>();

  // 接入协议可选项（来自后端 /ai/options/protocols）
  const [protocolOptions, setProtocolOptions] = useState<ProtocolOption[]>([]);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await getProtocolOptions();
        if (mounted) setProtocolOptions(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error('获取接入协议列表失败:', e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // 分页查询提供商列表（keyword 模糊匹配编码/名称，protocol 精确匹配）
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const data = await getProviderPage({
          pageNum: currentPage,
          pageSize: PAGINATION.DEFAULT_PAGE_SIZE,
          keyword: filters.keyword?.trim() || undefined,
          protocol: filters.protocol || undefined,
        });
        if (mounted) {
          setProviders(data?.rows ?? []);
          setTotal(data?.total ?? 0);
        }
      } catch (e) {
        console.error('获取提供商列表失败:', e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [currentPage, filters, refreshKey]);

  // 查询：应用筛选条件并回到第一页
  const handleSearch = () => {
    setFilters(filterForm.getFieldsValue());
    setCurrentPage(PAGINATION.DEFAULT_PAGE_NUM);
  };

  // 重置：清空筛选条件
  const handleReset = () => {
    filterForm.resetFields();
    setFilters({});
    setCurrentPage(PAGINATION.DEFAULT_PAGE_NUM);
  };

  // 打开新增弹窗
  const handleCreate = () => {
    setEditingId(null);
    providerForm.resetFields();
    providerForm.setFieldsValue({
      protocol: protocolOptions[0]?.value,
      enabled: '1',
      isDefault: '0',
    });
    setModalOpen(true);
  };

  // 打开编辑弹窗（回填当前行数据）
  const handleEdit = (record: ProviderRow) => {
    console.log('record', record);
    setEditingId(record.id);
    providerForm.resetFields();
    providerForm.setFieldsValue({
      providerName: record.providerName,
      providerCode: record.providerCode,
      apiBaseUrl: record.apiBaseUrl,
      protocol: record.protocol,
      apiKey: record.apiKey,
      remark: record.remark,
      enabled: record.enabled,
      isDefault: record.isDefault,
    });
    setModalOpen(true);
  };

  // 关闭弹窗
  const handleCancel = () => {
    setModalOpen(false);
    providerForm.resetFields();
  };

  // 保存配置：调用 /ai/provider，id 为 null 时新增，有值则修改
  const handleSave = async () => {
    let values: ProviderFormValues;
    try {
      values = await providerForm.validateFields();
    } catch {
      return;
    }

    setSaving(true);
    const payload: SaveProviderParams = {
      id: editingId,
      providerCode: values.providerCode.trim(),
      providerName: values.providerName.trim(),
      apiBaseUrl: values.apiBaseUrl.trim(),
      protocol: values.protocol,
      enabled: values.enabled,
      apiKey: values.apiKey?.trim() ?? '',
      isDefault: values.isDefault,
      remark: values.remark?.trim() ?? '',
    };
    try {
      await saveProvider(payload);
    } catch {
      // 错误提示由响应拦截器统一处理
      return;
    } finally {
      setSaving(false);
    }

    message.success(editingId !== null ? '配置已更新' : '配置已保存');
    setModalOpen(false);
    providerForm.resetFields();
    // 保存成功后重新拉取当前页，保证列表与后端一致
    setRefreshKey((key) => key + 1);
  };

  // 删除提供商
  const handleDelete = async (record: ProviderRow) => {
    try {
      await deleteProvider(record.id);
    } catch (e) {
      console.error(e);
      // 错误提示由响应拦截器统一处理
      return;
    }
    message.success('删除成功');
    // 当前页只剩一条且不是第一页时回退一页，否则刷新当前页
    if (providers.length === 1 && currentPage > 1) {
      setCurrentPage((page) => page - 1);
    } else {
      setRefreshKey((key) => key + 1);
    }
  };

  // 表格列配置
  const columns: TableColumnsType<ProviderRow> = [
    {
      title: '提供商',
      dataIndex: 'providerName',
      key: 'providerName',
      width: 190,
      render: (_, record) => (
        <div className={styles.providerInfo}>
          <span className={styles.providerName}>{record.providerName}</span>
          <span className={styles.providerCode}>{record.providerCode}</span>
        </div>
      ),
    },
    {
      title: 'API 地址',
      dataIndex: 'apiBaseUrl',
      key: 'apiBaseUrl',
      width: 320,
      render: (apiBaseUrl: string) => <span className={styles.apiUrl}>{apiBaseUrl}</span>,
    },
    {
      title: '接入协议',
      dataIndex: 'protocol',
      key: 'protocol',
      width: 170,
      render: (protocol: string) => <span className={styles.protocolTag}>{protocol}</span>,
    },
    {
      title: 'API Key',
      dataIndex: 'apiKey',
      key: 'apiKey',
      width: 220,
      render: (apiKey: string) =>
        apiKey ? (
          <div className={styles.apiKeyCell}>
            <Icon icon="mdi:key-variant" size={14} className={styles.apiKeyIcon} />
            <span className={styles.apiKeyText}>{apiKey}</span>
          </div>
        ) : (
          <span className={styles.apiKeyEmpty}>本地服务，无需密钥</span>
        ),
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 130,
      render: (enabled: string, record) => (
        <div className={styles.statusCell}>
          <span
            className={`${styles.statusBadge} ${
              enabled === '1' ? styles.statusEnabled : styles.statusDisabled
            }`}
          >
            {enabled === '1' ? '已启用' : '已停用'}
          </span>
          {record.isDefault === '1' && (
            <span className={styles.defaultBadge}>
              <Icon icon="mdi:star" size={12} />
              默认
            </span>
          )}
        </div>
      ),
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      width: 170,
      ellipsis: true,
    },
    {
      title: '操作',
      key: 'action',
      width: 170,
      fixed: 'right',
      align: 'center',
      render: (_, record) => (
        <Space size={12} className={styles.actionLinks}>
          <Auth permission={'ai:provider:edit'}>
            <Button
              type="link"
              size="small"
              icon={<Icon icon="mdi:pencil-outline" size={14} />}
              onClick={() => handleEdit(record)}
            >
              编辑
            </Button>
          </Auth>
          <Popconfirm
            title="确认删除"
            description={`确定要删除「${record.providerName}」吗？`}
            okText="确定"
            cancelText="取消"
            onConfirm={() => handleDelete(record)}
          >
            <Auth permission={'ai:provider:delete'}>
              <Button
                type="link"
                size="small"
                danger
                icon={<Icon icon="mdi:trash-can-outline" size={14} />}
              >
                删除
              </Button>
            </Auth>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.layout}>
      {/* 卡片一：筛选条件 */}
      <div className={styles.searchCard}>
        <div className={styles.searchCardHeader}>
          <div className={styles.titleWrap}>
            <span className={styles.titleIcon}>
              <Icon icon="mdi:filter-variant" size={16} />
            </span>
            <span className={styles.cardTitle}>筛选条件</span>
            <span className={styles.cardSubtitle}>按名称或接入协议快速查找</span>
          </div>
        </div>
        <div className={styles.searchCardBody}>
          <Form form={filterForm} className={styles.filterForm} onFinish={handleSearch}>
            <Form.Item name="keyword" className={styles.keywordItem}>
              <Input
                allowClear
                prefix={<Icon icon="mdi:magnify" size={16} />}
                placeholder="搜索提供商名称或编码"
              />
            </Form.Item>
            <Form.Item name="protocol" className={styles.protocolItem}>
              <Select
                allowClear
                placeholder="接入协议"
                options={protocolOptions}
                popupMatchSelectWidth={false}
              />
            </Form.Item>
            <Form.Item className={styles.filterActions}>
              <Space size={12}>
                <Button icon={<Icon icon="mdi:magnify" size={16} />} htmlType="submit">
                  查询
                </Button>
                <Button icon={<Icon icon="mdi:refresh" size={16} />} onClick={handleReset}>
                  重置
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </div>
      </div>

      {/* 卡片二：提供商列表 */}
      <div className={styles.tableCard}>
        <div className={styles.tableCardHeader}>
          <div className={styles.titleBlock}>
            <span className={styles.cardTitle}>提供商列表</span>
            <span className={styles.cardSubtitle}>共 {total} 个配置，API Key 仅展示脱敏信息</span>
          </div>
          <Auth permission={'ai:provider:add'}>
            <Button type="primary" icon={<Icon icon="mdi:plus" size={16} />} onClick={handleCreate}>
              新增提供商
            </Button>
          </Auth>
        </div>
        <div className={styles.tableCardBody}>
          <Table<ProviderRow>
            columns={columns}
            dataSource={providers}
            rowKey="id"
            loading={loading}
            scroll={{ x: 1370 }}
            pagination={{
              current: currentPage,
              pageSize: PAGINATION.DEFAULT_PAGE_SIZE,
              total,
              showTotal: (count) => `共 ${count} 条`,
              onChange: (page) => setCurrentPage(page),
            }}
          />
        </div>
      </div>

      {/* 新增/编辑模型提供商弹窗 */}
      <Modal
        title={editingId !== null ? '编辑模型提供商' : '新增模型提供商'}
        width={screens.md ? 800 : 'calc(100vw - 32px)'}
        open={modalOpen}
        onCancel={handleCancel}
        destroyOnHidden
        footer={[
          <Button key="cancel" onClick={handleCancel}>
            取消
          </Button>,
          <Button key="save" type="primary" loading={saving} onClick={handleSave}>
            保存配置
          </Button>,
        ]}
      >
        <div className={styles.modalBody}>
          <Form form={providerForm} layout="vertical" requiredMark>
            <Row gutter={24}>
              <Col xs={24} md={12}>
                <Form.Item<ProviderFormValues>
                  label="提供商名称"
                  name="providerName"
                  rules={[{ required: true, message: '请输入提供商名称' }]}
                >
                  <Input placeholder="例如：OpenAI" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item<ProviderFormValues>
                  label="提供商编码"
                  name="providerCode"
                  rules={[
                    { required: true, message: '请输入提供商编码' },
                    {
                      pattern: /^[a-z][a-z0-9_-]*$/,
                      message: '编码仅支持小写字母、数字、中划线或下划线，且以字母开头',
                    },
                  ]}
                >
                  <Input placeholder="例如：openai" />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item<ProviderFormValues>
                  label="API 地址"
                  name="apiBaseUrl"
                  rules={[
                    { required: true, message: '请输入 API 地址' },
                    { type: 'url', message: '请输入合法的 URL 地址' },
                  ]}
                >
                  <Input placeholder="https://api.example.com/v1" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item<ProviderFormValues>
                  label="接入协议"
                  name="protocol"
                  rules={[{ required: true, message: '请选择接入协议' }]}
                >
                  <Select placeholder="请选择接入协议" options={protocolOptions} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item<ProviderFormValues> label="API Key" name="apiKey">
                  <Input.Password placeholder="请输入 API Key" />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item<ProviderFormValues> label="备注" name="remark">
                  <Input.TextArea rows={4} placeholder="描述该提供商的使用场景" />
                </Form.Item>
              </Col>
              <Col xs={12} md={5}>
                <Form.Item<ProviderFormValues>
                  label="启用状态"
                  name="enabled"
                  rules={[{ required: true, message: '请选择启用状态' }]}
                >
                  <Radio.Group
                    options={[
                      { label: '启用', value: '1' },
                      { label: '停用', value: '0' },
                    ]}
                  />
                </Form.Item>
              </Col>
              <Col xs={12} md={5}>
                <Form.Item<ProviderFormValues>
                  label="设为默认"
                  name="isDefault"
                  rules={[{ required: true, message: '请选择是否默认' }]}
                >
                  <Radio.Group
                    options={[
                      { label: '是', value: '1' },
                      { label: '否', value: '0' },
                    ]}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </div>
      </Modal>
    </div>
  );
};

export default Provider;
