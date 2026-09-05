import * as React from 'react';
import styles from './index.module.less';
import {
  App,
  Button,
  Col,
  DatePicker,
  Dropdown,
  Form,
  Grid,
  Input,
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
  TreeSelect,
} from 'antd';
import TextArea from 'antd/es/input/TextArea';
import { useEffect, useState } from 'react';
import Search from '@/assets/svgs/Search.svg?react';
import Add from '@/assets/svgs/Add.svg?react';
import Delete from '@/assets/svgs/Delete.svg?react';
import Download from '@/assets/svgs/Download.svg?react';
import Freshen from '@/assets/svgs/Freshen.svg?react';
import Update from '@/assets/svgs/Update.svg?react';
import Zuzhi from '@/assets/svgs/Zuzhi.svg?react';
import Left from '@/assets/svgs/Left.svg?react';
import Right from '@/assets/svgs/Right.svg?react';

import { TableRowSelection } from 'antd/es/table/interface';
import { DeptNode, deptOptions } from '@/service/dept.ts';
import { CaretDownOutlined, CaretUpOutlined, FilterOutlined } from '@ant-design/icons';
import {
  addUser,
  deleteUserByIds,
  getUserById,
  resetPassword,
  ResetPasswordType,
  UserAddType,
  userList,
  UserRow,
  UserSearchType,
} from '@/service/user.ts';
import { RoleNode, roleOptions } from '@/service/role.ts';
import { useDict } from '@/hooks/useDict.ts';
import DictTag from '@/components/DictTag';

const User: React.FC = () => {
  const sexOptions = useDict('sys_sex'); // 性别状态
  const statusOptions = useDict('sys_status'); // 状态
  const { message } = App.useApp();
  const screens = Grid.useBreakpoint();
  const [deptTree, setDeptTree] = useState<TreeDataNode[]>([]); // 部门树结构
  // 左侧树收起/展开状态
  const [treeCollapsed, setTreeCollapsed] = useState(false);
  // 搜索表单
  const [searchForm] = Form.useForm<UserSearchType>();
  // 新增/编辑表单
  const [userForm] = Form.useForm<UserAddType>();
  // 重置密码表单
  const [resetPasswordForm] = Form.useForm<ResetPasswordType>();
  // 表格数据
  const [userListData, setUserListData] = useState<UserRow[]>([]);

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  // 弹窗状态
  const [modalOpen, setModalOpen] = useState(false);
  const [resetPasswordModalOpen, setResetPasswordModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('新增用户');

  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]); //展开折叠控制
  const [isTreeExpanded, setIsTreeExpanded] = useState(false);
  const { RangePicker } = DatePicker;

  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);
  //角色数据
  const [roleOptionsList, setRoleOptionsList] = useState<RoleNode[]>([]);
  const [isEdit, setIsEdit] = useState<boolean>(false);

  // 打开新增弹窗
  const handleAdd = async () => {
    userForm.resetFields();
    userForm.setFieldsValue({
      status: '1',
      sex: '0',
      password: '123456',
      deptId: selectedKeys?.[0],
    } as Partial<UserAddType>);
    await getRoleOptions();
    setModalTitle('新增用户');
    setModalOpen(true);
    setIsEdit(false);
  };
  // 角色数据加载
  const getRoleOptions = async () => {
    try {
      const data = await roleOptions();
      setRoleOptionsList(data);
    } catch (e) {
      console.error(e);
    }
  };

  // 打开编辑弹窗（修改 / 查看 共用回填）
  const handleEdit = async (id: number) => {
    try {
      const data = await getUserById(id);
      await getRoleOptions();
      userForm.setFieldsValue({
        userId: data.userId,
        nickname: data.nickname,
        deptId: data.deptId,
        phone: data.phone,
        email: data.email,
        sex: data.sex,
        status: data.status,
        roleIds: data.roleIds,
        remark: data.remark,
      });
      setIsEdit(true);
      setModalTitle('编辑用户');
      setModalOpen(true);
    } catch (e) {
      console.error(e);
    }
  };

  // 弹窗确定（静态：仅校验并提示）
  const handleModalOk = async () => {
    let values: UserAddType;
    try {
      values = await userForm.validateFields();
    } catch (e) {
      console.error(e);
      return;
    }
    try {
      await addUser(values);
      message.success('操作成功');
      setModalOpen(false);
      userForm.resetFields();
      await getUserList(pagination.current, pagination.pageSize);
    } catch (e) {
      console.error(e);
    }
  };

  const handleModalCancel = () => {
    setModalOpen(false);
    userForm.resetFields();
  };

  // 单条删除（本地删除）
  const handleDelete = async (id: number) => {
    try {
      await deleteUserByIds([id]);
      message.success('操作成功');
      await getUserList(pagination.current, pagination.pageSize);
    } catch (e) {
      console.error(e);
    }
  };

  // 批量删除
  const handleDeleteBatch = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要删除的用户');
      return;
    }
    try {
      await deleteUserByIds(selectedRowKeys);
      message.success('操作成功');
      await getUserList(pagination.current, pagination.pageSize);
    } catch (e) {
      console.error(e);
    }
  };

  // 关闭重置密码
  const handleResetPasswordModalCancel = async () => {
    setResetPasswordModalOpen(false);
    resetPasswordForm.resetFields();
  };
  // 重置密码提交
  const handleResetPasswordSubmit = async () => {
    let values: ResetPasswordType;
    try {
      values = await resetPasswordForm.validateFields();
    } catch (e) {
      console.log('表单校验失败：', e);
      return;
    }
    try {
      await resetPassword(values);
      message.success('操作成功');
      setResetPasswordModalOpen(false);
      resetPasswordForm.resetFields();
    } catch (e) {
      console.error(e);
    }
  };

  // 重置密码
  const handleResetPassword = async (row: UserRow) => {
    setResetPasswordModalOpen(true);
    resetPasswordForm.setFieldsValue({
      userId: row.userId,
      username: row.username,
    });
  };

  // 表格选中行处理
  const rowSelection: TableRowSelection<UserRow> = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys),
    getCheckboxProps: () => ({ disabled: false }),
  };

  const columns: TableColumnsType<UserRow> = [
    { title: '用户编号', dataIndex: 'userId', key: 'userId', width: 90 },
    { title: '用户名称', dataIndex: 'username', key: 'username', width: 120 },
    { title: '用户昵称', dataIndex: 'nickname', key: 'nickname', width: 120 },
    { title: '部门', dataIndex: 'deptName', key: 'deptName', width: 200 },
    { title: '手机号', dataIndex: 'phone', key: 'phone', width: 130 },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status: string) => DictTag({ value: status, option: statusOptions }),
    },
    { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 170 },
    {
      title: '操作',
      key: 'action',
      width: 220,
      fixed: 'right',
      render: (_, record) => (
        <Space size={0}>
          {/* 常用操作 */}
          <Button
            type="link"
            size="small"
            icon={<Update width={16} height={16} />}
            onClick={() => handleEdit(record.userId)}
          >
            修改
          </Button>

          <Popconfirm
            title="确认删除"
            description={`确定要删除「${record.nickname}」吗？`}
            onConfirm={() => handleDelete(record.userId)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" icon={<Delete width={16} height={16} />}>
              删除
            </Button>
          </Popconfirm>

          {/* 更多操作 */}
          <Dropdown
            menu={{
              items: [
                {
                  key: 'resetPassword',
                  label: (
                    <Button type="link" size="small">
                      重置密码
                    </Button>
                  ),
                },
              ],
              onClick: ({ key }) => {
                switch (key) {
                  case 'resetPassword':
                    handleResetPassword(record);
                    break;
                }
              },
            }}
          >
            <Button type="link" size="small">
              更多
            </Button>
          </Dropdown>
        </Space>
      ),
    },
  ];

  // 部门树加载
  const loadMenuTree = async () => {
    const data = await deptOptions();
    const convertMenuTree = (data: DeptNode[]): TreeDataNode[] => {
      return data.map((item) => ({
        key: item.deptId,
        value: item.deptId,
        title: item.deptName,
        children: item.children ? convertMenuTree(item.children) : undefined,
      }));
    };
    setDeptTree(convertMenuTree(data));
  };
  // 列表数据加载
  const getUserList = async (pageNum: number, pageSize: number, deptId?: React.Key) => {
    const searchParams = searchForm.getFieldsValue();
    const params: UserSearchType = {
      ...searchParams,
      deptId,
      pageNum,
      pageSize,
    };
    if (searchParams.createTime && Array.isArray(searchParams.createTime)) {
      params.startTime = searchParams.createTime[0].format('YYYY-MM-DD HH:mm:ss');
      params.endTime = searchParams.createTime[1].format('YYYY-MM-DD HH:mm:ss');
      delete params.createTime;
    }
    try {
      const data = await userList(params);
      setUserListData(data.rows);
      setPagination((prev) => ({
        ...prev,
        total: data.total,
      }));

      console.log(data);
    } catch (e) {
      console.error(e);
    }
  };
  useEffect(() => {
    void loadMenuTree();
    void getUserList(1, 10);
  }, []);

  // 分页处理
  const onChange: PaginationProps['onChange'] = async (page, pageSize) => {
    setPagination((prev) => ({
      ...prev,
      current: page,
      pageSize: pageSize,
    }));
    await getUserList(page, pageSize, selectedKeys?.[0]);
  };

  // 获取菜单树中所有节点的 key
  const getAllTreeKeys = (treeData: TreeDataNode[]): React.Key[] => {
    return treeData.flatMap((item) => [
      item.key,
      ...(item.children ? getAllTreeKeys(item.children) : []),
    ]);
  };
  // 全部展开
  const handleExpandAll = () => {
    setIsTreeExpanded(true);
    setExpandedKeys(getAllTreeKeys(deptTree));
  };
  // 全部折叠
  const handleCollapseAll = () => {
    setIsTreeExpanded(false);
    setExpandedKeys([]);
  };
  // 选中节点
  const handleSelect: TreeProps['onSelect'] = async (keys) => {
    console.log(keys);
    setSelectedKeys(keys);
    await getUserList(1, pagination.pageSize, keys?.[0]);
  };
  // 重置
  const handleResetSearch = async () => {
    searchForm.resetFields();
    setPagination((prev) => ({
      ...prev,
      current: 1,
      pageSize: 10,
    }));
    setSelectedKeys([]);
    await getUserList(1, 10);
  };
  // 搜索
  const handleSearch = async () => {
    setPagination((prev) => ({
      ...prev,
      current: 1,
    }));
    await getUserList(1, pagination.pageSize, selectedKeys?.[0]);
  };
  return (
    <div className={styles.layout}>
      <div className={styles.container}>
        {/* 左侧：组织机构树 */}
        <div className={treeCollapsed ? styles.leftPanelCollapsed : styles.leftPanel}>
          <div className={styles.panelHeader}>
            <div className={styles.panelHeaderTitle}>
              <Zuzhi width={16} height={16} />
              <div>组织机构</div>
            </div>
            <div className={styles.panelHeaderButton}>
              <div
                className={styles.iconWrapper}
                onClick={() => {
                  if (isTreeExpanded) {
                    handleCollapseAll();
                  } else {
                    handleExpandAll();
                  }
                }}
              >
                {isTreeExpanded ? (
                  <CaretDownOutlined style={{ fontSize: 12 }} />
                ) : (
                  <CaretUpOutlined style={{ fontSize: 12 }} />
                )}
              </div>
              <div className={styles.iconWrapper} onClick={() => loadMenuTree()}>
                <Freshen width={12} height={12} />
              </div>
            </div>
          </div>
          <div className={styles.panelBody}>
            <Tree
              treeData={deptTree}
              // defaultExpandAll
              showLine={{ showLeafIcon: false }}
              expandedKeys={expandedKeys}
              onExpand={(keys) => setExpandedKeys(keys)}
              onSelect={handleSelect}
              selectedKeys={selectedKeys}
            />
          </div>
        </div>

        {/* 中间：收起/展开按钮 */}
        <div className={styles.toggleWrap}>
          <Button
            type="text"
            size="small"
            className={styles.toggleBtn}
            onClick={() => setTreeCollapsed((prev) => !prev)}
            aria-label={treeCollapsed ? '展开组织机构' : '收起组织机构'}
          >
            {treeCollapsed ? <Right width={12} height={12} /> : <Left width={12} height={12} />}
          </Button>
        </div>

        {/* 右侧：搜索 + 工具栏 + 表格 */}
        <div className={styles.rightPanel}>
          {/* 卡片一：筛选条件 */}
          <div className={styles.searchCard}>
            <div className={styles.searchCardHeader}>
              <div className={styles.titleWrap}>
                <span className={styles.titleIcon}>
                  <FilterOutlined />
                </span>
                <span className={styles.cardTitle}>筛选条件</span>
                <span className={styles.cardSubtitle}>快速定位用户信息</span>
              </div>
            </div>
            <div className={styles.searchCardBody}>
              <Form form={searchForm}>
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12} lg={8} xl={5}>
                    <Form.Item name="userId" hidden>
                      <Input />
                    </Form.Item>
                    <Form.Item<UserSearchType>
                      label={'用户名称'}
                      name="username"
                      style={{ marginBottom: 0 }}
                    >
                      <Input placeholder={'请输入用户名称'} allowClear />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12} lg={8} xl={5}>
                    <Form.Item<UserSearchType>
                      label={'手机号码'}
                      name="phone"
                      style={{ marginBottom: 0 }}
                    >
                      <Input placeholder={'请输入手机号码'} allowClear />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12} lg={8} xl={4}>
                    <Form.Item<UserSearchType>
                      label={'状态'}
                      name="status"
                      style={{ marginBottom: 0 }}
                    >
                      <Select
                        placeholder={'用户状态'}
                        allowClear
                        options={statusOptions.map((item) => ({
                          label: item.dictLabel,
                          value: item.dictValue,
                        }))}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12} lg={8} xl={5}>
                    <Form.Item<UserSearchType>
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
                        onClick={() => handleSearch()}
                      >
                        搜索
                      </Button>
                      <Button
                        icon={<Freshen width={16} height={16} />}
                        onClick={() => handleResetSearch()}
                      >
                        重置
                      </Button>
                    </div>
                  </Col>
                </Row>
              </Form>
            </div>
          </div>

          {/* 卡片二：用户列表 */}
          <div className={styles.tableCard}>
            <div className={styles.tableCardHeader}>
              <div className={styles.titleBlock}>
                <span className={styles.cardTitle}>用户列表</span>
                <span className={styles.cardSubtitle}>共 {pagination.total} 个用户</span>
              </div>
              <Space wrap>
                <Button
                  className={styles.toolButton}
                  icon={<Add width={16} height={16} />}
                  onClick={handleAdd}
                >
                  新增
                </Button>
                <Popconfirm
                  title="确认删除"
                  description="确定要删除选中的用户吗？"
                  onConfirm={handleDeleteBatch}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button className={styles.toolButton} icon={<Delete width={16} height={16} />}>
                    删除
                  </Button>
                </Popconfirm>
                <Button
                  className={styles.toolButton}
                  icon={<Download width={16} height={16} />}
                  // onClick={() => handleTodo('导入')}
                >
                  导入
                </Button>
                <Button
                  className={styles.toolButton}
                  icon={<Download width={16} height={16} />}
                  // onClick={() => handleTodo('导出')}
                >
                  导出
                </Button>
              </Space>
            </div>
            <div className={styles.tableCardBody}>
              <Table
                rowSelection={{ type: 'checkbox', ...rowSelection }}
                columns={columns}
                rowKey="userId"
                dataSource={userListData}
                scroll={{ x: 1100 }}
                pagination={{
                  current: pagination.current,
                  pageSize: pagination.pageSize,
                  total: pagination.total,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  pageSizeOptions: ['10', '20', '50', '100'],
                  showTotal: (total) => `共 ${total} 条`,
                  onChange: (page, pageSize) => onChange(page, pageSize),
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 新增 / 编辑 用户弹窗 */}
      <Modal
        title={modalTitle}
        width={screens.md ? 760 : 'calc(100vw - 32px)'}
        open={modalOpen}
        onCancel={handleModalCancel}
        footer={[
          <Button key="cancel" onClick={handleModalCancel}>
            取消
          </Button>,
          <Button key="submit" type="primary" onClick={handleModalOk}>
            确定
          </Button>,
        ]}
      >
        <div className={styles.modalBody}>
          <Form layout="vertical" form={userForm} initialValues={{ status: '1', sex: '0' }}>
            <Row gutter={[16, 0]}>
              <Col xs={24} md={12}>
                <Form.Item name="userId" hidden>
                  <Input />
                </Form.Item>
                <Form.Item<UserAddType>
                  label="用户昵称"
                  name="nickname"
                  rules={[{ required: true, message: '用户昵称不能为空!' }]}
                >
                  <Input placeholder={'请输入用户昵称'} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item<UserAddType>
                  label="归属部门"
                  name="deptId"
                  rules={[{ required: true, message: '请选择归属部门!' }]}
                >
                  <TreeSelect
                    treeData={deptTree}
                    treeDefaultExpandAll
                    placeholder={'请选择归属部门'}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item<UserAddType> label="手机号码" name="phone">
                  <Input placeholder={'请输入手机号码'} maxLength={11} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item<UserAddType>
                  label="邮箱"
                  name="email"
                  rules={[{ type: 'email', message: '邮箱格式不正确!' }]}
                >
                  <Input placeholder={'请输入邮箱'} />
                </Form.Item>
              </Col>
              {!isEdit && (
                <Col xs={24} md={12}>
                  <Form.Item<UserAddType>
                    label="用户名称"
                    name="username"
                    rules={[{ required: true, message: '用户名称不能为空!' }]}
                  >
                    <Input placeholder={'请输入用户名称'} />
                  </Form.Item>
                </Col>
              )}
              {!isEdit && (
                <Col xs={24} md={12}>
                  <Form.Item<UserAddType>
                    label="用户密码"
                    name="password"
                    rules={[{ required: true, message: '用户密码不能为空!' }]}
                  >
                    <Input.Password placeholder={'请输入用户密码'} />
                  </Form.Item>
                </Col>
              )}
              <Col xs={24} md={12}>
                <Form.Item<UserAddType> label="用户性别" name="sex">
                  <Radio.Group
                    options={sexOptions.map((item) => ({
                      label: item.dictLabel,
                      value: item.dictValue,
                    }))}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item<UserAddType> label="状态" name="status">
                  <Radio.Group
                    options={statusOptions.map((item) => ({
                      label: item.dictLabel,
                      value: item.dictValue,
                    }))}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item<UserAddType> label="角色" name="roleIds">
                  <Select
                    mode="multiple"
                    placeholder={'请选择角色'}
                    options={roleOptionsList}
                    fieldNames={{
                      label: 'roleName',
                      value: 'roleId',
                    }}
                  />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item<UserAddType> label="备注" name="remark">
                  <TextArea rows={4} placeholder={'请输入内容'} />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </div>
      </Modal>

      <Modal
        title={'重置密码'}
        width={400}
        open={resetPasswordModalOpen}
        onCancel={handleResetPasswordModalCancel}
        footer={[
          <Button key="cancel" onClick={handleResetPasswordModalCancel}>
            取消
          </Button>,
          <Button key="submit" type="primary" onClick={handleResetPasswordSubmit}>
            确定
          </Button>,
        ]}
      >
        <div>
          <Form form={resetPasswordForm}>
            <Row gutter={[16, 0]}>
              <Col span={24}>
                <Form.Item name="userId" hidden>
                  <Input />
                </Form.Item>
                <Form.Item<ResetPasswordType>
                  label="用户名称"
                  name="username"
                  rules={[{ required: true, message: '用户名称不能为空!' }]}
                >
                  <Input placeholder={'请输入用户名称'} disabled />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item<ResetPasswordType>
                  label="用户密码"
                  name="password"
                  rules={[{ required: true, message: '用户密码不能为空!' }]}
                >
                  <Input placeholder={'请输入用户密码'} />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </div>
      </Modal>
    </div>
  );
};
export default User;
