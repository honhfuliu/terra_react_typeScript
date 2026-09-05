import * as React from 'react';
import styles from './index.module.less';
import {
  App,
  Button,
  Checkbox,
  Col,
  DatePicker,
  Form,
  Grid,
  Input,
  InputNumber,
  Modal,
  PaginationProps,
  Popconfirm,
  Radio,
  Row,
  Select,
  Space,
  Table,
  TableColumnsType,
  Tree,
  TreeDataNode,
  TreeProps,
} from 'antd';
import Search from '@/assets/svgs/Search.svg?react';
import Add from '@/assets/svgs/Add.svg?react';
import Delete from '@/assets/svgs/Delete.svg?react';
import Download from '@/assets/svgs/Download.svg?react';
import Freshen from '@/assets/svgs/Freshen.svg?react';
import Update from '@/assets/svgs/Update.svg?react';
import { useEffect, useState } from 'react';
import TextArea from 'antd/es/input/TextArea';
import { MenuNode, menuOptions } from '@/service/menu.ts';
import {
  addRole,
  deleteRoleByIds,
  getRoleById,
  RoleAddType,
  roleList,
  RoleRow,
  RoleSearchType,
} from '@/service/role.ts';
import { TableRowSelection } from 'antd/es/table/interface';
import { useDict } from '@/hooks/useDict.ts';
import DictTag from '@/components/DictTag';
import { FilterOutlined } from '@ant-design/icons';

const Role: React.FC = () => {
  const statusOptions = useDict('sys_status'); // 状态
  const { message } = App.useApp();
  // 菜单数据存储
  const [menuTree, setMenuTree] = useState<TreeDataNode[]>([]);
  // 当前展开的节点 key 集合。
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
  const [autoExpandParent, setAutoExpandParent] = useState<boolean>(true);
  const [isTreeExpanded, setIsTreeExpanded] = useState(false);
  const [checkedKeys, setCheckedKeys] = useState<React.Key[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);
  // Ant Design 中 checkStrictly=false 才开启父子节点联动。
  const [checkStrictly, setCheckStrictly] = useState(false);
  const screens = Grid.useBreakpoint();
  //提交表单数据
  const [roleForm] = Form.useForm<RoleAddType>();
  // 查询表单数据
  const [searchForm] = Form.useForm<RoleSearchType>();
  const [roleData, setRoleDate] = useState<RoleRow[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]); // 选中key存储

  const { RangePicker } = DatePicker;

  const columns: TableColumnsType<RoleRow> = [
    {
      title: '角色编号',
      dataIndex: 'roleId',
      key: 'roleId',
    },
    {
      title: '角色名称',
      dataIndex: 'roleName',
      key: 'roleName',
    },
    {
      title: '权限字符',
      dataIndex: 'roleKey',
      key: 'roleKey',
    },
    {
      title: '显示顺序',
      dataIndex: 'sort',
      key: 'sort',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => DictTag({ value: status, option: statusOptions }),
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
    },
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<Update width={16} height={16} />}
            onClick={() => getRoleByIdInfo(record.roleId)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除"
            description={`确定要删除「${record.roleName}」吗？`}
            onConfirm={() => handleDelete(record.roleId)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" icon={<Delete width={16} height={16} />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];
  // 删除
  const handleDelete = async (id: number) => {
    try {
      await deleteRoleByIds([id]);
      message.success('操作成功');
      await getRoleList(pagination.current, pagination.pageSize);
    } catch (e) {
      console.error(e);
    }
  };
  // 修改
  const getRoleByIdInfo = async (id: number) => {
    try {
      const data = await getRoleById(id);
      roleForm.setFieldsValue(data);
      setCheckedKeys(data.menuPermissions);
      await showModal();
    } catch (e) {
      console.error(e);
    }
  };

  // 列表数据获取
  const getRoleList = async (pageNum: number, pageSize: number) => {
    const searchParams = searchForm.getFieldsValue();
    const params: RoleSearchType = {
      ...searchParams,
      pageNum,
      pageSize,
    };
    if (searchParams.createTime && Array.isArray(searchParams.createTime)) {
      params.startTime = searchParams.createTime[0].format('YYYY-MM-DD HH:mm:ss');
      params.endTime = searchParams.createTime[1].format('YYYY-MM-DD HH:mm:ss');
      delete params.createTime;
    }
    console.log(params);
    try {
      const data = await roleList(params);
      console.log(data);
      setRoleDate(data.rows);
      setPagination((prev) => ({
        ...prev,
        total: data.total,
      }));
    } catch (e) {
      console.error(e);
    }
  };
  useEffect(() => {
    getRoleList(1, 10);
  }, []);

  // 对话框
  const [isModalOpen, setIsModalOpen] = useState(false);

  const showModal = async () => {
    try {
      const data = await menuOptions(false);
      const convertMenuTree = (data: MenuNode[]): TreeDataNode[] => {
        return data.map((item) => ({
          key: item.menuId,
          title: item.menuName,
          children: item.children ? convertMenuTree(item.children) : undefined,
        }));
      };
      setMenuTree(convertMenuTree(data));
      setIsModalOpen(true);
    } catch (e) {
      console.error(e);
    }
  };

  const handleOk = async () => {
    let value: RoleAddType;
    try {
      value = await roleForm.validateFields();
      console.log(value);
    } catch (e) {
      console.log('表单校验失败：', e);
      return;
    }
    try {
      await addRole(value);
      message.success('操作成功');
      setIsModalOpen(false);
      roleForm.resetFields();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCancel = () => {
    roleForm.resetFields();
    setIsModalOpen(false);
  };
  // 多行选择处理
  const rowSelection: TableRowSelection<RoleRow> = {
    onChange: (selectedRowKeys, selectedRows) => {
      setSelectedRowKeys(selectedRowKeys);
      console.log(`selectedRowKeys: ${selectedRowKeys}`, 'selectedRows: ', selectedRows);
    },
    getCheckboxProps: () => ({ disabled: false }),
  };

  // 用户手动展开/收起节点时，同步“展开全部”复选框的选中状态，不影响菜单勾选结果。
  const onExpand: TreeProps['onExpand'] = (expandedKeysValue) => {
    setExpandedKeys(expandedKeysValue);
    setIsTreeExpanded(getAllTreeKeys(menuTree).every((key) => expandedKeysValue.includes(key)));
    setAutoExpandParent(false);
  };

  // 获取菜单树中所有节点的 key
  const getAllTreeKeys = (treeData: TreeDataNode[]): React.Key[] => {
    return treeData.flatMap((item) => [
      item.key,
      ...(item.children ? getAllTreeKeys(item.children) : []),
    ]);
  };

  // “展开全部”只控制 expandedKeys；权限勾选状态 checkedKeys 保持不变。
  const handleExpandAllChange = (expanded: boolean) => {
    setIsTreeExpanded(expanded);
    setExpandedKeys(expanded ? getAllTreeKeys(menuTree) : []);
    setAutoExpandParent(false);
  };

  // “全选”仅批量更新菜单权限的勾选 key。
  const handleCheckAllChange = (checked: boolean) => {
    // 更新 Tree
    setCheckedKeys(checked ? getAllTreeKeys(menuTree) : []);
  };

  // Ant Design 的 checkStrictly 与父子联动语义相反：false 表示父子联动。
  const handleLinkageChange = (linked: boolean) => {
    setCheckStrictly(!linked);
  };

  // Tree 勾选事件：兼容联动与非联动两种返回值结构，统一保存已勾选 key。
  const onCheck: TreeProps['onCheck'] = (checkedKeysValue) => {
    if (Array.isArray(checkedKeysValue)) {
      setCheckedKeys(checkedKeysValue);
    } else {
      setCheckedKeys(checkedKeysValue.checked);
    }
  };

  useEffect(() => {
    console.log('checkedKeys', checkedKeys);
    roleForm.setFieldValue('menuPermissions', checkedKeys);
  }, [checkedKeys]);
  // Tree 节点点击事件
  const onSelect: TreeProps['onSelect'] = (selectedKeysValue) => {
    setSelectedKeys(selectedKeysValue);
  };
  const allTreeKeys = getAllTreeKeys(menuTree);
  const isAllChecked = allTreeKeys.length > 0 && checkedKeys.length === allTreeKeys.length;

  // 搜索
  const handleSearch = async () => {
    setPagination((prev) => ({
      ...prev,
      current: 1,
    }));
    await getRoleList(1, pagination.pageSize);
  };
  // 重置
  const handleResetSearch = async () => {
    searchForm.resetFields();
    setPagination((prev) => ({
      ...prev,
      current: 1,
      pageSize: 10,
    }));
    await getRoleList(1, 10);
  };

  // 分页处理
  const onChange: PaginationProps['onChange'] = async (page, pageSize) => {
    setPagination((prev) => ({
      ...prev,
      current: page,
      pageSize: pageSize,
    }));
    await getRoleList(page, pageSize);
    console.log('Page: ', page);
    console.log('pageSize: ', pageSize);
  };
  // 批量删除
  const handleDeleteBatch = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要删除的角色');
      return;
    }
    try {
      await deleteRoleByIds(selectedRowKeys);
      message.success('操作成功');
      await getRoleList(pagination.current, pagination.pageSize);
    } catch (e) {
      console.error(e);
    }
  };
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
            <span className={styles.cardSubtitle}>快速定位角色信息</span>
          </div>
        </div>
        <div className={styles.searchCardBody}>
          <Form form={searchForm}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} lg={8} xl={5}>
                <Form.Item<RoleSearchType>
                  label={'角色名称'}
                  name="name"
                  style={{ marginBottom: 0 }}
                >
                  <Input placeholder={'请输入角色名称'} allowClear />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} lg={8} xl={5}>
                <Form.Item<RoleSearchType>
                  label={'权限字符'}
                  name="roleKey"
                  style={{ marginBottom: 0 }}
                >
                  <Input placeholder={'请输入权限字符'} allowClear />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} lg={8} xl={4}>
                <Form.Item<RoleSearchType>
                  label={'状态'}
                  name="status"
                  style={{ marginBottom: 0 }}
                >
                  <Select
                    placeholder={'角色状态'}
                    allowClear
                    options={statusOptions.map((item) => ({
                      label: item.dictLabel,
                      value: item.dictValue,
                    }))}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} lg={8} xl={5}>
                <Form.Item<RoleSearchType>
                  label={'创建时间'}
                  name="createTime"
                  style={{ marginBottom: 0 }}
                >
                  <RangePicker showTime style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col xs={24} lg={8} xl={5}>
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

      {/* 卡片二：角色列表 */}
      <div className={styles.tableCard}>
        <div className={styles.tableCardHeader}>
          <div className={styles.titleBlock}>
            <span className={styles.cardTitle}>角色列表</span>
            <span className={styles.cardSubtitle}>共 {pagination.total} 个角色</span>
          </div>
          <Space wrap>
            <Button
              className={styles.toolButton}
              onClick={showModal}
              icon={<Add width={16} height={16} />}
            >
              新增
            </Button>
            <Popconfirm
              title="确认删除"
              description={`确定要删除吗？`}
              onConfirm={handleDeleteBatch}
              okText="确定"
              cancelText="取消"
            >
              <Button className={styles.toolButton} icon={<Delete width={16} height={16} />}>
                删除
              </Button>
            </Popconfirm>
            <Button className={styles.toolButton} icon={<Download width={16} height={16} />}>
              导出
            </Button>
          </Space>
        </div>
        <div className={styles.tableCardBody}>
          <Table
            rowSelection={{ type: 'checkbox', ...rowSelection }}
            columns={columns}
            rowKey={'roleId'}
            dataSource={roleData}
            scroll={{
              x: 900,
            }}
            pagination={{
              current: pagination.current, // 当前页码
              pageSize: pagination.pageSize, // 每页条数
              total: pagination.total, // 总条数
              showSizeChanger: true, // 显示每页条数切换器
              showQuickJumper: true, // 显示快速跳转
              pageSizeOptions: ['10', '20', '50', '100'], // 每页条数选项
              showTotal: (total) => `共 ${total} 条`, // 显示总数
              onChange: (page, pageSize) => onChange(page, pageSize),
            }}
          />
        </div>
      </div>

      <div>
        <Modal
          title="角色管理"
          width={screens.md ? 760 : 'calc(100vw - 32px)'}
          closable={{ 'aria-label': 'Custom Close Button' }}
          open={isModalOpen}
          onCancel={handleCancel}
          footer={[
            <Button key="cancel" onClick={handleCancel}>
              取消
            </Button>,
            <Button key="submit" type="primary" onClick={handleOk}>
              确定
            </Button>,
          ]}
        >
          <div className={styles.modalBody}>
            <Form layout="vertical" initialValues={{ status: '1', sort: 0 }} form={roleForm}>
              <Row gutter={[16, 0]}>
                <Col xs={24} md={12}>
                  <Form.Item name="roleId" hidden>
                    <Input />
                  </Form.Item>
                  <Form.Item<RoleAddType>
                    label="角色名称"
                    name="roleName"
                    rules={[{ required: true, message: '角色名称不能为空!' }]}
                  >
                    <Input placeholder={'请输入角色名称'} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item<RoleAddType>
                    label="权限字符"
                    name="roleKey"
                    rules={[{ required: true, message: '权限字符不能为空!' }]}
                  >
                    <Input placeholder={'请输入权限字符'} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item<RoleAddType>
                    label="角色顺序"
                    name="sort"
                    rules={[{ required: true, message: '角色顺序不能为空!' }]}
                  >
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item<RoleAddType> label="状态" name="status">
                    <Radio.Group
                      options={statusOptions.map((item) => ({
                        label: item.dictLabel,
                        value: item.dictValue,
                      }))}
                    />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item<RoleAddType> label="菜单权限" name="menuPermissions">
                    <div className={styles.permissionPanel}>
                      <div className={styles.permissionToolbar}>
                        <Checkbox
                          checked={isTreeExpanded}
                          onChange={(event) => handleExpandAllChange(event.target.checked)}
                        >
                          展开全部
                        </Checkbox>
                        <Checkbox
                          checked={isAllChecked}
                          onChange={(event) => handleCheckAllChange(event.target.checked)}
                        >
                          全选
                        </Checkbox>
                        <Checkbox
                          checked={!checkStrictly}
                          onChange={(event) => handleLinkageChange(event.target.checked)}
                        >
                          父子联动
                        </Checkbox>
                      </div>
                      <div className={styles.treePanel}>
                        <Tree
                          checkable
                          treeData={menuTree}
                          onExpand={onExpand}
                          expandedKeys={expandedKeys}
                          autoExpandParent={autoExpandParent}
                          onCheck={onCheck}
                          checkedKeys={checkedKeys}
                          checkStrictly={checkStrictly}
                          onSelect={onSelect}
                          selectedKeys={selectedKeys}
                        />
                      </div>
                    </div>
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item<RoleAddType> label="备注" name="remark">
                    <TextArea rows={4} placeholder={'请输入内容'} />
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
export default Role;
