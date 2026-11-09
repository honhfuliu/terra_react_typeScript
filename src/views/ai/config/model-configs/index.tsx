import * as React from 'react';
import styles from './index.module.less';
import {
  App,
  Button,
  Col,
  Form,
  Grid,
  Input,
  InputNumber,
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
import { COMMON_STATUS, DICT_TYPE, PAGINATION } from '@/constants';
import { getProviderOptions, ProviderOption } from '@/service/provider.ts';
import {
  deleteModel,
  getModelPage,
  getModelTypeOptions,
  ModelRow,
  saveModel,
} from '@/service/model.ts';
import { DictDataOption } from '@/service/dict.ts';
import DictTag from '@/components/DictTag';
import { useDict } from '@/hooks/useDict.ts';

// 筛选条件
interface ModelFilterValues {
  keyword?: string;
  modelType?: string;
  enabled?: string;
}

// 编辑弹窗表单字段
interface ModelFormValues {
  providerId?: number;
  modelType: string;
  modelCode: string;
  modelName: string;
  temperature?: number;
  maxTokens?: number;
  contextWindow?: number;
  remark?: string;
  enabled: string;
  isDefault: string;
}

// 数字格式化：4096 -> 4,096
const formatNumber = (value: number) => value.toLocaleString('en-US');

const ModelConfigs: React.FC = () => {
  const statusOptions = useDict(DICT_TYPE.SYS_STATUS); // 状态
  const { message } = App.useApp();
  const screens = Grid.useBreakpoint();

  // 模型列表（后端分页数据）
  const [models, setModels] = useState<ModelRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  // 当前页码
  const [currentPage, setCurrentPage] = useState<number>(PAGINATION.DEFAULT_PAGE_NUM);
  // 刷新标识：保存成功后重新拉取当前页
  const [refreshKey, setRefreshKey] = useState(0);

  // 筛选表单与已生效的筛选条件
  const [filterForm] = Form.useForm<ModelFilterValues>();
  const [filters, setFilters] = useState<ModelFilterValues>({});

  // 编辑弹窗
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [modelForm] = Form.useForm<ModelFormValues>();

  // 提供商下拉选项（来自 /ai/provider/options）
  const [providerOptions, setProviderOptions] = useState<ProviderOption[]>([]);
  // 模型类型下拉选项（来自 /ai/options/model-types）
  const [modelTypeOptions, setModelTypeOptions] = useState<DictDataOption[]>([]);
  useEffect(() => {
    getProviderOptions().then((data) => setProviderOptions(data));
    getModelTypeOptions().then((data) => setModelTypeOptions(data));
  }, []);

  // 分页查询模型列表（keyword 模糊匹配名称/编码，modelType、enabled 精确匹配）
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const data = await getModelPage({
          pageNum: currentPage,
          pageSize: PAGINATION.DEFAULT_PAGE_SIZE,
          keyword: filters.keyword?.trim() || undefined,
          modelType: filters.modelType || undefined,
          enabled: filters.enabled || undefined,
        });
        if (mounted) {
          setModels(data?.rows ?? []);
          setTotal(data?.total ?? 0);
        }
      } catch (e) {
        console.error('获取模型列表失败:', e);
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

  // 打开新增弹窗（表单回到默认值）
  const handleCreate = () => {
    setEditingId(null);
    modelForm.resetFields();
    setModalOpen(true);
  };

  // 打开编辑弹窗（回填当前行数据）
  const handleEdit = (record: ModelRow) => {
    setEditingId(record.id);
    modelForm.resetFields();
    modelForm.setFieldsValue({
      providerId: providerOptions.find((item) => item.providerName === record.providerName)?.id,
      modelType: record.modelType,
      modelCode: record.modelCode,
      modelName: record.modelName,
      temperature: record.temperature,
      maxTokens: record.maxTokens,
      contextWindow: record.contextWindow,
      remark: record.remark ?? undefined,
      enabled: record.enabled,
      isDefault: record.isDefault,
    });
    setModalOpen(true);
  };

  // 关闭弹窗
  const handleCancel = () => {
    setModalOpen(false);
    modelForm.resetFields();
  };

  // 保存配置：新增/修改共用同一接口，携带 id 时后端按修改处理
  const handleSave = async () => {
    let values: ModelFormValues;
    try {
      values = await modelForm.validateFields();
    } catch (e) {
      console.error('表单校验失败：', e);
      return;
    }
    try {
      await saveModel({
        id: editingId,
        providerId: values.providerId as number,
        modelType: values.modelType,
        modelCode: values.modelCode,
        modelName: values.modelName,
        temperature: values.temperature ?? 0,
        maxTokens: values.maxTokens ?? 0,
        contextWindow: values.contextWindow ?? 0,
        remark: values.remark,
        enabled: values.enabled,
        isDefault: values.isDefault,
      });
      message.success('操作成功');
      setModalOpen(false);
      modelForm.resetFields();
      // 保存成功后重新拉取当前页，保证列表与后端一致
      setRefreshKey((key) => key + 1);
    } catch (e) {
      console.error(e);
    }
  };

  // 删除模型
  const handleDelete = async (record: ModelRow) => {
    try {
      await deleteModel(record.id);
    } catch (e) {
      console.error(e);
      // 错误提示由响应拦截器统一处理
      return;
    }
    message.success('删除成功');
    // 当前页只剩一条且不是第一页时回退一页，否则刷新当前页
    if (models.length === 1 && currentPage > 1) {
      setCurrentPage((page) => page - 1);
    } else {
      setRefreshKey((key) => key + 1);
    }
  };

  // 表格列配置
  const columns: TableColumnsType<ModelRow> = [
    {
      title: '模型名称',
      dataIndex: 'modelName',
      key: 'modelName',
      width: 300,
      render: (_, record) => (
        <div className={styles.modelInfo}>
          <span className={styles.modelName}>{record.modelName}</span>
          <div className={styles.modelMeta}>
            <span className={styles.modelCode}>{record.modelCode}</span>
            {record.isDefault === COMMON_STATUS.ENABLED && (
              <span className={styles.defaultMark}>
                <Icon icon="mdi:star" size={12} />
                默认
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      title: '所属提供商',
      dataIndex: 'providerName',
      key: 'providerName',
      width: 140,
      render: (providerName: string) => <span className={styles.providerTag}>{providerName}</span>,
    },
    {
      title: '模型类型',
      dataIndex: 'modelType',
      key: 'modelType',
      width: 140,
      render: (modelType: string) => {
        return <DictTag value={modelType} option={modelTypeOptions} />;
      },
    },
    {
      title: '参数配置',
      dataIndex: 'temperature',
      key: 'temperature',
      width: 240,
      render: (temperature: number, record) => (
        <div className={styles.paramCell}>
          <span className={styles.paramMain}>温度 {temperature}</span>
          <span className={styles.paramSub}>
            最大输出{' '}
            {record.maxTokens !== null ? `${formatNumber(record.maxTokens)} tokens` : '不适用'}
          </span>
        </div>
      ),
    },
    {
      title: '上下文窗口',
      dataIndex: 'contextWindow',
      key: 'contextWindow',
      width: 180,
      render: (contextWindow: number) => (
        <span className={styles.contextWindow}>{formatNumber(contextWindow)} tokens</span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 110,
      render: (enabled: string) => <DictTag value={enabled} option={statusOptions} />,
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      width: 200,
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
          <Button
            type="link"
            size="small"
            icon={<Icon icon="mdi:pencil-outline" size={14} />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除"
            description={`确定要删除「${record.modelName}」吗？`}
            okText="确定"
            cancelText="取消"
            onConfirm={() => handleDelete(record)}
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<Icon icon="mdi:trash-can-outline" size={14} />}
            >
              删除
            </Button>
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
              <Icon icon="mdi:magnify" size={16} />
            </span>
            <span className={styles.cardTitle}>筛选条件</span>
            <span className={styles.cardSubtitle}>按模型名称、编码或能力类型查找</span>
          </div>
        </div>
        <div className={styles.searchCardBody}>
          <Form form={filterForm} className={styles.filterForm} onFinish={handleSearch}>
            <Form.Item name="keyword" className={styles.keywordItem}>
              <Input
                allowClear
                prefix={<Icon icon="mdi:magnify" size={16} />}
                placeholder="搜索模型名称或编码"
              />
            </Form.Item>
            <Form.Item name="modelType" className={styles.selectItem}>
              <Select
                allowClear
                placeholder="模型类型"
                options={modelTypeOptions.map((item) => ({
                  label: item.dictLabel,
                  value: item.dictValue,
                }))}
                popupMatchSelectWidth={false}
              />
            </Form.Item>
            <Form.Item name="enabled" className={styles.selectItem}>
              <Select
                allowClear
                placeholder="启用状态"
                popupMatchSelectWidth={false}
                options={statusOptions.map((item) => ({
                  label: item.dictLabel,
                  value: item.dictValue,
                }))}
              />
            </Form.Item>
            <Form.Item className={styles.filterActions}>
              <Space size={12}>
                <Button
                  type="primary"
                  icon={<Icon icon="mdi:magnify" size={16} />}
                  htmlType="submit"
                >
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

      {/* 卡片二：模型列表 */}
      <div className={styles.tableCard}>
        <div className={styles.tableCardHeader}>
          <div className={styles.titleBlock}>
            <span className={styles.cardTitle}>模型列表</span>
            <span className={styles.cardSubtitle}>
              共 {total} 个模型配置，默认模型以星标标识
            </span>
          </div>
          <Button type="primary" icon={<Icon icon="mdi:plus" size={16} />} onClick={handleCreate}>
            新增模型
          </Button>
        </div>
        <div className={styles.tableCardBody}>
          <Table<ModelRow>
            columns={columns}
            dataSource={models}
            rowKey="id"
            loading={loading}
            scroll={{ x: 1480 }}
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

      {/* 新增 / 编辑模型配置弹窗 */}
      <Modal
        title={editingId !== null ? '编辑模型配置' : '新增模型配置'}
        width={screens.md ? 860 : 'calc(100vw - 32px)'}
        open={modalOpen}
        onCancel={handleCancel}
        destroyOnHidden
        footer={[
          <Button key="cancel" onClick={handleCancel}>
            取消
          </Button>,
          <Button key="save" type="primary" onClick={handleSave}>
            保存配置
          </Button>,
        ]}
      >
        <div className={styles.modalBody}>
          <Form
            form={modelForm}
            layout="vertical"
            requiredMark
            initialValues={{
              enabled: COMMON_STATUS.ENABLED,
              isDefault: COMMON_STATUS.DISABLED,
            }}
          >
            <Row gutter={[16, 0]}>
              <Col xs={24} md={12}>
                <Form.Item<ModelFormValues>
                  label="所属提供商"
                  name="providerId"
                  rules={[{ required: true, message: '所属提供商不能为空!' }]}
                >
                  <Select
                    placeholder="请选择所属提供商"
                    showSearch
                    options={providerOptions.map((item) => ({
                      label: item.providerName,
                      value: item.id,
                    }))}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item<ModelFormValues>
                  label="模型类型"
                  name="modelType"
                  rules={[{ required: true, message: '模型类型不能为空!' }]}
                >
                  <Select
                    placeholder="请选择模型类型"
                    options={modelTypeOptions.map((item) => ({
                      label: item.dictLabel,
                      value: item.dictValue,
                    }))}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item<ModelFormValues>
                  label="模型编码"
                  name="modelCode"
                  rules={[{ required: true, message: '模型编码不能为空!' }]}
                >
                  <Input placeholder="例如：gpt-4o-mini" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item<ModelFormValues>
                  label="模型名称"
                  name="modelName"
                  rules={[{ required: true, message: '模型名称不能为空!' }]}
                >
                  <Input placeholder="例如：GPT-4o Mini" />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item<ModelFormValues> label="默认温度" name="temperature">
                  <InputNumber min={0} max={2} step={0.1} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item<ModelFormValues> label="最大输出 Token" name="maxTokens">
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item<ModelFormValues> label="上下文窗口" name="contextWindow">
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item<ModelFormValues> label="备注" name="remark">
                  <Input.TextArea rows={4} placeholder="描述该模型的使用场景" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item<ModelFormValues>
                  label="启用状态"
                  name="enabled"
                  rules={[{ required: true, message: '请选择启用状态' }]}
                >
                  <Radio.Group
                    options={statusOptions.map((item) => ({
                      label: item.dictLabel,
                      value: item.dictValue,
                    }))}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item<ModelFormValues>
                  label="设为默认模型"
                  name="isDefault"
                  rules={[{ required: true, message: '请选择是否设为默认模型' }]}
                >
                  <Radio.Group
                    options={[
                      { label: '是', value: COMMON_STATUS.ENABLED },
                      { label: '否', value: COMMON_STATUS.DISABLED },
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

export default ModelConfigs;
