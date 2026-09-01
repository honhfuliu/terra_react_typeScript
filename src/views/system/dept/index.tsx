import styles from './index.module.less';

import Search from '@/assets/svgs/Search.svg?react';
import Freshen from '@/assets/svgs/Freshen.svg?react';
import Add from '@/assets/svgs/Add.svg?react';
import Delete from '@/assets/svgs/Delete.svg?react';
import Update from '@/assets/svgs/Update.svg?react';
import Save from '@/assets/svgs/Save.svg?react';
import Expand from '@/assets/svgs/Expand.svg?react';
import {
  Button,
  Col,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Table,
  TableColumnsType,
  TreeSelect,
  Tag,
  InputNumber,
  Radio,
  App,
  Grid,
  Popconfirm,
} from 'antd';
import { useCallback, useEffect, useState } from 'react';
import {
  addDept,
  deleteDeptById,
  DeptAddType,
  deptList,
  DeptNode,
  deptOptions,
  DeptSearchType,
  DeptTable,
  getDeptById,
  updateBatchDeptSort,
} from '@/service/dept.ts';
import * as React from 'react';
import { removeEmptyChildren } from '@/utils/tree.ts';

const Dept: React.FC = () => {
  const { message } = App.useApp();
  const screens = Grid.useBreakpoint();
  const [deptTree, setDeptTree] = useState<DeptNode[]>([]);
  const [deptTreeList, setDeptTreeList] = useState<DeptTable[]>([]);
  // 展开折叠控制
  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  // 搜素表单获取
  const [searchForm] = Form.useForm<DeptSearchType>();
  // 搜素
  const handleSearch = async () => {
    getDeptList();
  };

  // 重置
  const handleResetSearch = async () => {
    searchForm.resetFields();
    await getDeptList();
  };
  // 获取表格所有key
  const getAllKeys = (list: DeptTable[]): React.Key[] => {
    return list.flatMap((item) => [
      item.deptId,
      ...(item.children ? getAllKeys(item.children) : []),
    ]);
  };
  // 展开折叠控制
  const handleExpandToggle = () => {
    if (isExpanded) {
      // 当前是展开状态 → 全部收起
      setExpandedRowKeys([]);
      setIsExpanded(false);
    } else {
      // 当前是收起状态 → 全部展开
      setExpandedRowKeys(getAllKeys(deptTreeList));
      setIsExpanded(true);
    }
  };
  // 表格顺序调整
  const handleSortChange = (value: number, record: DeptTable) => {
    console.log(value, record);
    const updateTreeData = (treeData: DeptTable[]): DeptTable[] => {
      return treeData.map((item) => {
        // 如果是当前匹配的节点，更新 sortOrder
        if (item.deptId === record.deptId) {
          return {
            ...item,
            sortOrder: value ?? 0,
          };
        }
        // 如果有子节点，递归更新
        if (item.children && item.children.length > 0) {
          return {
            ...item,
            children: updateTreeData(item.children),
          };
        }
        return item;
      });
    };

    setDeptTreeList((prev) => updateTreeData(prev));
  };
  // 保存排序
  const handleBatchSaveSort = async () => {
    console.log('deptTreeList', deptTreeList);
    try {
      await updateBatchDeptSort(deptTreeList);
      await getDeptList();
    } catch {
      /* empty */
    }
  };
  // 表格
  const columns: TableColumnsType<DeptTable> = [
    {
      title: '部门名称',
      dataIndex: 'deptName',
      key: 'deptName',
      width: 220,
      // 如果是树形表格，可以添加缩进
    },
    {
      title: '排序号',
      dataIndex: 'sortOrder',
      key: 'sortOrder',
      width: 180,
      align: 'center',
      render: (text: number, record: DeptTable) => {
        return (
          <InputNumber
            value={text}
            min={0}
            max={9999}
            mode="spinner"
            style={{ width: '150px' }}
            onChange={(value) => handleSortChange(value ?? 0, record)}
          />
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      align: 'center',
      render: (status: string) => (
        <Tag color={status === '1' ? 'success' : 'error'}>{status === '1' ? '启用' : '停用'}</Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 180,
      align: 'center',
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      fixed: 'right',
      render: (_, record) => (
        <Space className={styles.actionGroup} size="small">
          <Button
            className={styles.actionLink}
            type="link"
            size="small"
            icon={<Update width={16} height={16} />}
            onClick={() => getDeptByIdInfo(record.deptId)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除"
            description={`确定要删除 "${record.deptName}" 吗？`}
            onConfirm={() => handleDelete(record.deptId)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<Delete width={16} height={16} />}>
              删除
            </Button>
          </Popconfirm>

          <Button
            className={styles.actionLink}
            type="link"
            size="small"
            icon={<Add width={16} height={16} />}
            onClick={() => handleAddChild(record.deptId)}
          >
            添加子部门
          </Button>
        </Space>
      ),
    },
  ];

  // 展示数据获取
  const getDeptList = useCallback(async () => {
    try {
      const data = await deptList(searchForm.getFieldsValue());
      const treeData = removeEmptyChildren(data);
      setDeptTreeList(treeData);
    } catch {
      /* empty */
    }
  }, []);

  useEffect(() => {
    getDeptList();
  }, [getDeptList]);

  // 对话框
  const [isModalOpen, setIsModalOpen] = useState(false);

  const showModal = async () => {
    try {
      const data = await deptOptions();
      setDeptTree(data);
      setIsModalOpen(true);
    } catch {
      /* empty */
    }
  };

  // 获取表单内容
  const [deptForm] = Form.useForm<DeptAddType>();

  // 关闭弹窗
  const handleOk = async () => {
    let values: DeptAddType;
    try {
      values = await deptForm.validateFields();
    } catch (error) {
      console.log('表单校验失败：', error);
      return;
    }
    try {
      await addDept(values);
      message.success('操作成功');
      await getDeptList();
      setIsModalOpen(false);
      deptForm.resetFields();
    } catch (error) {
      console.error('新增部门失败：', error);
    }
  };

  // 关闭弹窗
  const handleCancel = () => {
    deptForm.resetFields();
    setIsModalOpen(false);
  };

  // 编辑数据获取
  const getDeptByIdInfo = async (id: number) => {
    try {
      const data = await getDeptById(id);
      deptForm.setFieldsValue({
        deptId: data.deptId,
        parentId: data.parentId === 0 ? undefined : data.parentId,
        deptName: data.deptName,
        sortOrder: data.sortOrder,
        status: data.status,
        leader: data.leader,
        phone: data.phone,
        email: data.email,
      });
      await showModal();
    } catch {
      /* empty */
    }
  };
  // 子部门添加
  const handleAddChild = async (id: number) => {
    deptForm.setFieldsValue({
      parentId: id,
    });
    await showModal();
  };
  // 删除
  const handleDelete = async (id: number) => {
    try {
      await deleteDeptById(id);
      message.success('操作成功');
      await getDeptList();
    } catch {
      /* empty */
    }
  };
  return (
    <div className={styles.layout}>
      <div className={styles.header}>
        <Form form={searchForm}>
          <Row gutter={[16, 12]}>
            <Col xs={24} sm={12} lg={8} xl={6}>
              <Form.Item<DeptSearchType> label={'部门名称'} name="deptName">
                <Input placeholder={'请输入部门名称'} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} lg={8} xl={6}>
              <Form.Item<DeptSearchType> label={'状态'} name="status">
                <Select
                  placeholder={'菜单状态'}
                  options={[
                    { value: 1, label: '启用' },
                    { value: 0, label: '停用' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} lg={8} xl={6}>
              <Space wrap>
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
              </Space>
            </Col>
          </Row>

          <Row className={styles.toolbar}>
            <Space wrap>
              <Button
                className={styles.toolButton}
                icon={<Add width={16} height={16} />}
                onClick={showModal}
              >
                新增
              </Button>
              <Button
                className={styles.toolButton}
                icon={<Save width={16} height={16} />}
                onClick={handleBatchSaveSort}
              >
                保存排序
              </Button>
              <Button
                className={styles.toolButton}
                icon={<Expand width={16} height={16} />}
                onClick={handleExpandToggle}
              >
                展开/折叠
              </Button>
            </Space>
          </Row>
        </Form>
      </div>

      <div className={styles.body}>
        <Table
          columns={columns}
          dataSource={deptTreeList}
          rowKey="deptId"
          pagination={false}
          scroll={{ x: 970 }}
          expandable={{
            expandedRowKeys,
            onExpandedRowsChange: (keys) => {
              setExpandedRowKeys([...keys]);
            },
          }}
        />
      </div>
      <div>
        <Modal
          width={screens.md ? 720 : 'calc(100vw - 32px)'}
          title="部门添加"
          closable={{ 'aria-label': 'Custom Close Button' }}
          open={isModalOpen}
          onCancel={handleCancel}
          footer={[
            <Button key="cancel" onClick={handleCancel}>
              取消
            </Button>,
            // 方式2：在 footer 中放置提交按钮（注意：按钮必须在 Form 内部）
            // 但这里按钮在 Form 外部，所以需要使用 form.submit()
            <Button key="submit" type="primary" onClick={handleOk}>
              确定
            </Button>,
          ]}
        >
          <div className={styles.modalBody}>
            <Form
              form={deptForm}
              initialValues={{
                status: '1',
              }}
            >
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <Form.Item name="deptId" hidden>
                    <Input />
                  </Form.Item>
                  <Form.Item<DeptAddType> label="上级部门" name="parentId">
                    <TreeSelect
                      style={{ width: '100%' }}
                      styles={{
                        popup: {
                          root: { maxHeight: 400, overflow: 'auto' },
                        },
                      }}
                      treeData={deptTree}
                      fieldNames={{
                        label: 'deptName',
                        value: 'deptId',
                        children: 'children',
                      }}
                      placeholder="请选择上级菜单"
                      treeDefaultExpandAll
                      onChange={(value, labelList, extra) => {
                        console.log(extra);
                        console.log(value);
                        console.log(labelList);
                      }}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item<DeptAddType>
                    label="部门名称"
                    name="deptName"
                    rules={[{ required: true, message: '部门名称不能为空!' }]}
                  >
                    <Input placeholder={'请输入部门名称'} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item<DeptAddType>
                    label="显示排序"
                    name="sortOrder"
                    rules={[{ required: true, message: '显示排序不能为空!' }]}
                  >
                    <InputNumber style={{ width: '100%' }} min={0} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item<DeptAddType> label="负责人" name="leader">
                    <Input placeholder={'请输入负责人名称'} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item<DeptAddType> label="联系电话" name="phone">
                    <Input placeholder={'请输入联系电话'} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item<DeptAddType> label="邮箱" name="email">
                    <Input placeholder={'请输入邮箱'} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item<DeptAddType> label="状态" name="status">
                    <Radio.Group
                      options={[
                        { value: '1', label: '正常' },
                        { value: '0', label: '停用' },
                      ]}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </div>
        </Modal>
      </div>
    </div>
  );
};
export default Dept;
