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
  Tag,
} from 'antd';
import { useEffect, useState } from 'react';
import TextArea from 'antd/es/input/TextArea';
import SearchIcon from '@/assets/svgs/Search.svg?react';
import DictIcon from '@/assets/svgs/Dict.svg?react';
import AddIcon from '@/assets/svgs/Add.svg?react';
import UpdateIcon from '@/assets/svgs/Update.svg?react';
import DeleteIcon from '@/assets/svgs/Delete.svg?react';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import {
  addDictData,
  AddDictDataType,
  addDictType,
  AddDictType,
  deleteDictData,
  deleteDictType,
  dictDataListInfo,
  DictDataListTypeItem,
  DictListTypeItem,
  dictTypeListInfo,
  getDictDataInfo,
} from '@/service/dict.ts';
import { useDict } from '@/hooks/useDict.ts';
import DictTag from '@/components/DictTag';
import Auth from '@/components/Auth';

const Dict: React.FC = () => {
  const statusOptions = useDict('sys_status'); // 状态
  const tagColorOptions = useDict('sys_tag_color'); // 标签样式
  const { message } = App.useApp();
  // 搜索框内容
  const [searchText, setSearchText] = useState('');

  // 选中的字典类型
  const [activeDictId, setActiveDictId] = useState<number>();
  // 字典类型列表
  const [dictTypeRows, setDictTypeRows] = useState<DictListTypeItem[]>([]);
  // 字典值列表
  const [dictValueRows, setDictValueRows] = useState<DictDataListTypeItem[]>([]);

  // 字典添加对话框控制
  const [dictTypeModalOpen, setDictTypeModalOpen] = useState(false);
  const [dictTypeModalTitle, setDictTypeModalTitle] = useState('新增字典');
  // 字典值添加对话框控制
  const [dictDataModalOpen, setDictDataModalOpen] = useState(false);
  const [dictDataModalTitle, setDictDataModalTitle] = useState('新增字典值');

  // 响应式断点（对话框宽度自适应）
  const screens = Grid.useBreakpoint();
  // 字典添加/编辑表单
  const [dictForm] = Form.useForm<AddDictType>();
  // 字典值添加表单
  const [dictDataForm] = Form.useForm<AddDictDataType>();

  // 过滤后的字典目录（按名称或编码本地过滤动态数据）
  const filteredDictList = dictTypeRows.filter(
    (item) =>
      item.dictName.toLowerCase().includes(searchText.toLowerCase()) ||
      item.dictType.toLowerCase().includes(searchText.toLowerCase()),
  );

  // 当前选中的字典类型详情
  const activeDict = dictTypeRows.find((d) => d.dictId === activeDictId);

  // 字典值表格列配置
  const columns: TableColumnsType<DictDataListTypeItem> = [
    {
      title: '显示名称',
      dataIndex: 'dictLabel',
      key: 'dictLabel',
      width: 140,
    },
    {
      title: '字典值',
      dataIndex: 'dictValue',
      key: 'dictValue',
      width: 160,
      render: (value: string) => (
        <span
          style={{
            fontFamily: "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace",
            background: 'rgba(22, 119, 255, 0.08)',
            color: 'var(--primary-color)',
            padding: '2px 8px',
            borderRadius: 4,
            fontSize: 13,
          }}
        >
          {value}
        </span>
      ),
    },
    {
      title: '排序',
      dataIndex: 'dictSort',
      key: 'dictSort',
      width: 70,
      align: 'center',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      align: 'center',
      render: (status: string) => DictTag({ value: status, option: statusOptions }),
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      width: 140,
      ellipsis: true,
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      align: 'center',
      render: (_, record) => (
        <Space size={8} className={styles.actionLinks}>
          <Auth permission={'system:dict:data:edit'}>
            <Button
              type="link"
              size="small"
              icon={<UpdateIcon width={14} height={14} />}
              aria-label={`修改-${record.dictLabel}`}
              onClick={() => handleEditDictData(record)}
            >
              修改
            </Button>
          </Auth>
          <Auth permission={'system:dict:data:delete'}>
            <Popconfirm
              title="确认删除"
              description={`确定要删除「${record.dictLabel}」吗？`}
              okText="确定"
              cancelText="取消"
              onConfirm={() => handleDeleteDictData(record)}
            >
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteIcon width={14} height={14} />}
                aria-label={`删除-${record.dictLabel}`}
              >
                删除
              </Button>
            </Popconfirm>
          </Auth>
        </Space>
      ),
    },
  ];

  // 查询字典
  const getDictTypeList = async (dictTypeName?: string) => {
    try {
      const data = await dictTypeListInfo(dictTypeName);
      setDictTypeRows(data);
      console.log('res', data);
    } catch (e) {
      console.log('查询字典失败：', e);
    }
  };
  useEffect(() => {
    void getDictTypeList(searchText);
  }, []);

  // 数据加载后，若当前选中字典不存在，则默认选中第一个
  useEffect(() => {
    if (dictTypeRows.length > 0 && !dictTypeRows.some((item) => item.dictId === activeDictId)) {
      setActiveDictId(dictTypeRows[0].dictId);
    }
  }, [dictTypeRows, activeDictId]);

  // 切换选中字典时查询该字典的字典值列表
  useEffect(() => {
    if (activeDictId !== undefined) {
      void getDictDataListInfoById(activeDictId);
    }
  }, [activeDictId]);

  // 根据字典id获取到字典值
  const getDictDataListInfoById = async (id: number) => {
    try {
      const data = await dictDataListInfo(id);
      setDictValueRows(data);
    } catch (e) {
      console.error(e);
    }
  };

  // 字典添加
  const handleAddDictType = () => {
    dictForm.resetFields();
    setDictTypeModalTitle('新增字典');
    setDictTypeModalOpen(true);
  };
  // 编辑字典（回填当前选中字典）
  const handleEditDictType = () => {
    if (!activeDict) return;
    dictForm.setFieldsValue({
      dictId: activeDict.dictId,
      dictName: activeDict.dictName,
      dictType: activeDict.dictType,
      status: activeDict.status,
      remark: activeDict.remark,
    });
    setDictTypeModalTitle('编辑字典');
    setDictTypeModalOpen(true);
  };
  // 字典添加取消
  const handleAddDictTypeCancel = () => {
    setDictTypeModalOpen(false);
    dictForm.resetFields();
  };
  // 字典添加确定
  const handleAddDictTypeOk = async () => {
    let values: AddDictType;
    try {
      values = await dictForm.validateFields();
    } catch (e) {
      console.log('表单校验失败：', e);
      return;
    }
    try {
      // 新增/修改共用同一接口，携带 dictId 时后端按修改处理
      await addDictType(values);
      message.success('操作成功');
      setDictTypeModalOpen(false);
      dictForm.resetFields();
      void getDictTypeList();
    } catch (e) {
      console.error(e);
    }
  };

  // 删除字典类型（字典下存在字典值时不允许删除）
  const handleDeleteDictType = async () => {
    if (!activeDict) return;
    if (activeDict.count > 0) {
      message.warning(`该字典下存在 ${activeDict.count} 个字典值，请先删除全部字典值后再删除字典`);
      return;
    }
    try {
      await deleteDictType(activeDict.dictId);
      message.success('删除成功');
      void getDictTypeList();
    } catch (e) {
      console.error(e);
    }
  };

  // 字典值添加
  const handleAddDictData = () => {
    if (!activeDict) return;
    dictDataForm.resetFields();
    dictDataForm.setFieldsValue({
      dictId: activeDict.dictId,
      dictSort: activeDict.count + 1,
      isDefault: 'N',
      status: '1',
    });
    setDictDataModalTitle('新增字典值');
    setDictDataModalOpen(true);
  };
  // 字典值编辑（点击修改按钮时调用详情接口回显数据）
  const handleEditDictData = async (record: DictDataListTypeItem) => {
    try {
      const data = await getDictDataInfo(record.dictCode);
      dictDataForm.resetFields();
      dictDataForm.setFieldsValue({
        dictCode: data.dictCode,
        dictId: data.dictId,
        dictLabel: data.dictLabel,
        dictValue: data.dictValue,
        dictSort: data.dictSort,
        isDefault: data.isDefault,
        tagType: data.tagType || undefined,
        cssClass: data.cssClass,
        status: data.status,
        remark: data.remark,
      });
      setDictDataModalTitle('编辑字典值');
      setDictDataModalOpen(true);
    } catch (e) {
      console.error(e);
    }
  };
  // 字典值添加取消
  const handleAddDictDataCancel = () => {
    setDictDataModalOpen(false);
    dictDataForm.resetFields();
  };
  // 删除字典值
  const handleDeleteDictData = async (record: DictDataListTypeItem) => {
    try {
      await deleteDictData(record.dictCode);
      message.success('删除成功');
      // 刷新字典目录（更新字典值数量）与当前字典的字典值列表
      void getDictTypeList();
      if (activeDictId !== undefined) {
        void getDictDataListInfoById(activeDictId);
      }
    } catch (e) {
      console.error(e);
    }
  };
  // 字典值添加确定
  const handleAddDictDataOk = async () => {
    let values: AddDictDataType;
    try {
      values = await dictDataForm.validateFields();
    } catch (e) {
      console.log('表单校验失败：', e);
      return;
    }
    try {
      // 新增/修改共用同一接口，携带 dictCode 时后端按修改处理
      await addDictData(values);
      message.success('操作成功');
      setDictDataModalOpen(false);
      dictDataForm.resetFields();
      // 刷新字典目录（更新字典值数量）与当前字典的字典值列表
      void getDictTypeList();
      if (activeDictId !== undefined) {
        void getDictDataListInfoById(activeDictId);
      }
    } catch (e) {
      console.error(e);
    }
  };
  return (
    <>
      <Row gutter={[16, 16]} className={styles.layout}>
        {/* 左侧：字典目录面板 */}
        <Col xs={24} lg={7} xl={6} xxl={5}>
          <div className={styles.leftPanel}>
            <div className={styles.panelHeader}>
              <div className={styles.panelHeaderTitle}>
                字典目录
                <span className={styles.subtitle}>维护系统中的业务枚举</span>
              </div>
              <Auth permission={'system:dict:type:add'}>
                <div className={styles.addButton} title="新增字典" onClick={handleAddDictType}>
                  <AddIcon width={16} height={16} />
                </div>
              </Auth>
            </div>

            <div className={styles.searchWrap}>
              <Input
                prefix={<SearchIcon width={16} height={16} />}
                placeholder="搜索字典名称或编码"
                allowClear
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>

            <div className={styles.dictList}>
              {filteredDictList.map((item) => (
                <div
                  key={item.dictId}
                  className={`${styles.dictItem} ${activeDictId === item.dictId ? styles.active : ''}`}
                  onClick={() => setActiveDictId(item.dictId)}
                >
                  <div className={styles.dictIcon}>
                    <DictIcon />
                  </div>
                  <div className={styles.dictInfo}>
                    <div className={styles.dictName}>{item.dictName}</div>
                    <div className={styles.dictCode}>{item.dictType}</div>
                  </div>
                  <div className={styles.dictCount}>{item.count}</div>
                </div>
              ))}
            </div>
          </div>
        </Col>

        {/* 右侧：字典详情面板 */}
        <Col xs={24} lg={17} xl={18} xxl={19}>
          <div className={styles.rightPanel}>
            <div className={styles.detailHeader}>
              <div className={styles.detailTitle}>
                <div className={styles.titleMain}>{activeDict?.dictName ?? '请选择字典'}</div>
                <div className={styles.titleDesc}>
                  {activeDict ? `共 ${activeDict.count} 个字典值` : ''}
                </div>
              </div>
              <div className={styles.headerActions}>
                <Auth permission={'system:dict:type:edit'}>
                  <div className={styles.editButton}>
                    <Button icon={<EditOutlined />} onClick={handleEditDictType}>
                      编辑字典
                    </Button>
                  </div>
                </Auth>
                <Auth permission={'system:dict:data:add'}>
                  <div className={styles.addValueButton}>
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleAddDictData}>
                      添加字典值
                    </Button>
                  </div>
                </Auth>
                <Auth permission={'system:dict:type:delete'}>
                  <div className={styles.deleteButton}>
                    <Popconfirm
                      title="确认删除"
                      description={`确定要删除「${activeDict?.dictName ?? ''}」吗？`}
                      okText="确定"
                      cancelText="取消"
                      onConfirm={handleDeleteDictType}
                      disabled={!activeDict}
                    >
                      <Button danger icon={<DeleteOutlined />} disabled={!activeDict}>
                        删除字典
                      </Button>
                    </Popconfirm>
                  </div>
                </Auth>
              </div>
            </div>

            {activeDict && (
              <div className={styles.dictInfoBar}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>字典编码：</span>
                  <span className={`${styles.infoValue} ${styles.code}`}>
                    {activeDict.dictType}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>状态：</span>
                  <span className={styles.statusTag}>
                    <DictTag value={activeDict.status} option={statusOptions} />
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>修改时间：</span>
                  <span className={`${styles.infoValue} ${styles.time}`}>
                    {activeDict.updateTime}
                  </span>
                </div>
              </div>
            )}

            <div className={styles.tableSection}>
              <div className={styles.tableContainer}>
                <Table<DictDataListTypeItem>
                  columns={columns}
                  dataSource={dictValueRows}
                  rowKey="dictCode"
                  pagination={false}
                  scroll={{ x: 800 }}
                />
              </div>
            </div>
          </div>
        </Col>
      </Row>
      {/*字典添加/编辑*/}
      <div>
        <Modal
          title={dictTypeModalTitle}
          width={screens.md ? 520 : 'calc(100vw - 32px)'}
          open={dictTypeModalOpen}
          onCancel={handleAddDictTypeCancel}
          footer={[
            <Button key="cancel" onClick={handleAddDictTypeCancel}>
              取消
            </Button>,
            <Button key="submit" type="primary" onClick={handleAddDictTypeOk}>
              确定
            </Button>,
          ]}
        >
          <div className={styles.modalBody}>
            <Form layout="vertical" form={dictForm} initialValues={{ status: '1' }}>
              <Row gutter={[16, 0]}>
                <Col xs={24} md={12}>
                  <Form.Item name="dictId" hidden>
                    <Input />
                  </Form.Item>
                  <Form.Item<AddDictType>
                    label="字典名称"
                    name="dictName"
                    rules={[{ required: true, message: '字典名称不能为空!' }]}
                  >
                    <Input placeholder={'请输入字典名称'} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item<AddDictType>
                    label="字典编码"
                    name="dictType"
                    rules={[
                      { required: true, message: '字典编码不能为空!' },
                      {
                        pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/,
                        message: '编码仅支持字母、数字与下划线，且以字母开头!',
                      },
                    ]}
                  >
                    <Input placeholder={'请输入字典编码，如 user_status'} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item<AddDictType> label="状态" name="status">
                    <Radio.Group
                      options={statusOptions.map((item) => ({
                        label: item.dictLabel,
                        value: item.dictValue,
                      }))}
                    />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item<AddDictType> label="备注" name="remark">
                    <TextArea rows={4} placeholder={'请输入内容'} />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </div>
        </Modal>
      </div>

      <div>
        <Modal
          title={dictDataModalTitle}
          width={screens.md ? 640 : 'calc(100vw - 32px)'}
          open={dictDataModalOpen}
          onCancel={handleAddDictDataCancel}
          footer={[
            <Button key="cancel" onClick={handleAddDictDataCancel}>
              取消
            </Button>,
            <Button key="submit" type="primary" onClick={handleAddDictDataOk}>
              确定
            </Button>,
          ]}
        >
          <div className={styles.modalBody}>
            <Form
              layout="vertical"
              form={dictDataForm}
              initialValues={{ dictSort: 1, isDefault: 'N', status: '1' }}
            >
              <Row gutter={[16, 0]}>
                <Col xs={24} md={12}>
                  <Form.Item name="dictCode" hidden>
                    <Input />
                  </Form.Item>
                  <Form.Item name="dictId" hidden>
                    <Input />
                  </Form.Item>
                  <Form.Item<AddDictDataType>
                    label="数据标签"
                    name="dictLabel"
                    rules={[{ required: true, message: '数据标签不能为空!' }]}
                  >
                    <Input placeholder={'请输入数据标签'} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item<AddDictDataType>
                    label="数据键值"
                    name="dictValue"
                    rules={[{ required: true, message: '数据键值不能为空!' }]}
                  >
                    <Input placeholder={'请输入数据键值，如 active'} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item<AddDictDataType>
                    label="显示排序"
                    name="dictSort"
                    rules={[{ required: true, message: '显示排序不能为空!' }]}
                  >
                    <InputNumber min={0} max={9999} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item<AddDictDataType> label="是否默认" name="isDefault">
                    <Radio.Group
                      options={[
                        { value: 'Y', label: '是' },
                        { value: 'N', label: '否' },
                      ]}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item<AddDictDataType> label="标签样式" name="tagType">
                    <Select
                      placeholder={'请选择标签样式'}
                      allowClear
                      options={tagColorOptions.map((item) => ({
                        label: item.dictLabel,
                        value: item.dictValue,
                      }))}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item<AddDictDataType> label="样式属性" name="cssClass">
                    <Input placeholder={'请输入样式属性（可选）'} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item<AddDictDataType> label="状态" name="status">
                    <Radio.Group
                      options={statusOptions.map((item) => ({
                        label: item.dictLabel,
                        value: item.dictValue,
                      }))}
                    />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item<AddDictDataType> label="备注" name="remark">
                    <TextArea rows={4} placeholder={'请输入内容'} />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </div>
        </Modal>
      </div>
    </>
  );
};

export default Dict;
