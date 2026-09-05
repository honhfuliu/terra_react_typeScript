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
  TreeSelect,
} from 'antd';
import Search from '@/assets/svgs/Search.svg?react';
import Freshen from '@/assets/svgs/Freshen.svg?react';
import Add from '@/assets/svgs/Add.svg?react';
import Delete from '@/assets/svgs/Delete.svg?react';
import Update from '@/assets/svgs/Update.svg?react';
import Save from '@/assets/svgs/Save.svg?react';
import Expand from '@/assets/svgs/Expand.svg?react';
import { useCallback, useEffect, useState } from 'react';
import {
  addMenu,
  deleteMenuById,
  getMenuById,
  MenuAddType,
  menuList,
  MenuNode,
  menuOptions,
  MenuSearchType,
  MenuTable,
  updateBatchMenuSort,
} from '@/service/menu.ts';
import { removeEmptyChildren } from '@/utils/tree.ts';
import { useDict } from '@/hooks/useDict.ts';
import DictTag from '@/components/DictTag';
import { FilterOutlined } from '@ant-design/icons';

const Menu: React.FC = () => {
  const statusOptions = useDict('sys_status'); // 状态
  const menuTypeOptions = useDict('sys_menu_type'); // 菜单类型

  const { message } = App.useApp();
  const screens = Grid.useBreakpoint();
  // 上级菜单数据存储
  const [menuTree, setMenuTree] = useState<MenuNode[]>([]);
  // 菜单类型
  const [menuType, setMenuType] = useState<string>('M');
  // 搜素表单获取
  const [searchForm] = Form.useForm<MenuSearchType>();
  // 提交表单获取
  const [menuForm] = Form.useForm<MenuAddType>();
  // 表格数据存储
  const [menuTreeList, setMenuTreeList] = useState<MenuTable[]>([]);
  // 展开折叠控制
  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  // 搜素
  const handleSearch = async () => {
    await getMenuList();
  };

  // 重置
  const handleResetSearch = async () => {
    searchForm.resetFields();
    await getMenuList();
  };

  // 获取表格所有key
  const getAllKeys = (list: MenuTable[]): React.Key[] => {
    return list.flatMap((item) => [
      item.menuId,
      ...(item.children ? getAllKeys(item.children) : []),
    ]);
  };
  // 统计树形列表中的菜单总数（含子菜单）
  const countTreeNodes = (list: MenuTable[]): number => {
    return list.reduce(
      (total, item) => total + 1 + (item.children ? countTreeNodes(item.children) : 0),
      0,
    );
  };
  // 展开折叠控制
  const handleExpandToggle = () => {
    if (isExpanded) {
      // 当前是展开状态 → 全部收起
      setExpandedRowKeys([]);
      setIsExpanded(false);
    } else {
      // 当前是收起状态 → 全部展开
      setExpandedRowKeys(getAllKeys(menuTreeList));
      setIsExpanded(true);
    }
  };
  // 保存排序
  const handleSortChange = async (value: number, record: MenuTable) => {
    const updateTreeData = (treeData: MenuTable[]): MenuTable[] => {
      return treeData.map((item) => {
        // 如果是当前匹配的节点，更新 sortOrder
        if (item.menuId === record.menuId) {
          return {
            ...item,
            menuSort: value ?? 0,
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
    setMenuTreeList((prev) => updateTreeData(prev));
  };
  const columns: TableColumnsType<MenuTable> = [
    {
      title: '菜单名称',
      dataIndex: 'menuName',
      key: 'menuName',
      width: 200,
    },
    {
      title: '类型',
      dataIndex: 'menuType',
      key: 'menuType',
      width: 100,
      render: (status: string) => DictTag({ value: status, option: menuTypeOptions }),
      // render: (type: string) => {
      //   const typeMap: Record<string, { label: string; color: string }> = {
      //     M: {
      //       label: '目录',
      //       color: 'blue',
      //     },
      //     C: {
      //       label: '菜单',
      //       color: 'green',
      //     },
      //     B: {
      //       label: '按钮',
      //       color: 'orange',
      //     },
      //   };
      //
      //   const config = typeMap[type];
      //
      //   if (!config) {
      //     return type;
      //   }
      //
      //   return <Tag color={config.color}>{config.label}</Tag>;
      // },
    },
    {
      title: '排序',
      dataIndex: 'menuSort',
      key: 'menuSort',
      width: 160,
      render: (text: number, record: MenuTable) => {
        return (
          <InputNumber
            value={text}
            min={0}
            max={9999}
            mode="spinner"
            style={{ width: '140px' }}
            onChange={(value) => handleSortChange(value ?? 0, record)}
          />
        );
      },
    },
    {
      title: '权限标识',
      dataIndex: 'perms',
      key: 'perms',
      width: 180,
    },
    {
      title: '组件路径',
      dataIndex: 'component',
      key: 'component',
      width: 200,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => DictTag({ value: status, option: statusOptions }),
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
            onClick={() => getMenuByIdInfo(record.menuId)}
          >
            编辑
          </Button>
          {record.menuType !== 'B' && record.menuType !== 'F' && (
            <Button
              className={styles.actionLink}
              type="link"
              size="small"
              icon={<Add width={16} height={16} />}
              onClick={() => handleAddChild(record.menuId)}
            >
              添加子菜单
            </Button>
          )}
          <Popconfirm
            title="确认删除"
            description={`确定要删除「${record.menuName}」吗？`}
            onConfirm={() => handleDelete(record.menuId)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<Delete width={16} height={16} />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];
  // 添加子部门
  const handleAddChild = async (id: number) => {
    menuForm.setFieldsValue({
      parentId: id,
    });
    await showModal();
  };
  // 对话框
  const [isModalOpen, setIsModalOpen] = useState(false);

  const showModal = async () => {
    try {
      const data = await menuOptions(true);
      setMenuTree(data);
      menuForm.setFieldsValue({
        menuType: 'M',
        menuSort: 0,
        status: '1',
        visible: '1',
        keepAlive: '1',
        parentId: 0,
      });
      setIsModalOpen(true);
    } catch {
      /* empty */
    }
  };

  // 获取展示数据
  const getMenuList = useCallback(async () => {
    try {
      const data = await menuList(searchForm.getFieldsValue());
      const treeData = removeEmptyChildren(data);
      setMenuTreeList(treeData);
    } catch {
      /* empty */
    }
  }, []);

  useEffect(() => {
    getMenuList();
  }, [getMenuList]);

  const handleOk = async () => {
    let value: MenuAddType;
    try {
      value = await menuForm.validateFields();
      console.log(value);
    } catch (e) {
      console.log('表单校验失败：', e);
      return;
    }
    try {
      await addMenu(value);
      message.success('操作成功');
      setIsModalOpen(false);
      menuForm.resetFields();
      await getMenuList();
    } catch (e) {
      console.error('新增菜单失败：', e);
    }
  };
  // 关闭弹框
  const handleCancel = () => {
    menuForm.resetFields();
    setIsModalOpen(false);
  };
  // 编辑数据获取
  const getMenuByIdInfo = async (id: number) => {
    try {
      const data = await getMenuById(id);
      setMenuType(data.menuType);
      await showModal();
      menuForm.setFieldsValue(data);
    } catch (e) {
      console.error(e);
    }
  };

  // 删除
  const handleDelete = async (id: number) => {
    try {
      await deleteMenuById(id);
      message.success('操作成功');
      await getMenuList();
    } catch {
      /* empty */
    }
  };
  // 保存排序
  const handleBatchSaveSort = async () => {
    try {
      await updateBatchMenuSort(menuTreeList);
      message.success('操作成功');
      await getMenuList();
    } catch (e) {
      console.error(e);
    }
  };
  const totalMenuCount = countTreeNodes(menuTreeList);
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
            <span className={styles.cardSubtitle}>快速定位菜单信息</span>
          </div>
        </div>
        <div className={styles.searchCardBody}>
          <Form form={searchForm}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} lg={8} xl={7}>
                <Form.Item<MenuSearchType>
                  label={'菜单名称'}
                  name="menuName"
                  style={{ marginBottom: 0 }}
                >
                  <Input placeholder={'请输入菜单名称'} allowClear />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} lg={8} xl={7}>
                <Form.Item<MenuSearchType>
                  label={'状态'}
                  name="status"
                  style={{ marginBottom: 0 }}
                >
                  <Select
                    placeholder={'菜单状态'}
                    allowClear
                    options={statusOptions.map((item) => ({
                      label: item.dictLabel,
                      value: item.dictValue,
                    }))}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} lg={8} xl={10}>
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

      {/* 卡片二：菜单列表 */}
      <div className={styles.tableCard}>
        <div className={styles.tableCardHeader}>
          <div className={styles.titleBlock}>
            <span className={styles.cardTitle}>菜单列表</span>
            <span className={styles.cardSubtitle}>共 {totalMenuCount} 个菜单</span>
          </div>
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
        </div>
        <div className={styles.tableCardBody}>
          <Table
            columns={columns}
            dataSource={menuTreeList}
            rowKey="menuId"
            pagination={false}
            scroll={{ x: 1220 }}
            expandable={{
              expandedRowKeys,
              onExpandedRowsChange: (keys) => {
                setExpandedRowKeys([...keys]);
              },
            }}
          />
        </div>
      </div>

      <div>
        <div>
          <Modal
            width={screens.md ? 720 : 'calc(100vw - 32px)'}
            title="菜单管理"
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
              <Form form={menuForm}>
                <Row gutter={[16, 16]}>
                  <Col span={24}>
                    <Form.Item name="menuId" hidden>
                      <Input />
                    </Form.Item>
                    <Form.Item<MenuAddType> label="上级菜单" name="parentId">
                      <TreeSelect
                        style={{ width: '100%' }}
                        styles={{
                          popup: {
                            root: { maxHeight: 400, overflow: 'auto' },
                          },
                        }}
                        treeData={menuTree}
                        fieldNames={{
                          label: 'menuName',
                          value: 'menuId',
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
                  <Col span={24}>
                    <Form.Item<MenuAddType> label="菜单类型" name="menuType">
                      <Radio.Group
                        onChange={(e) => {
                          setMenuType(e.target.value);
                        }}
                        options={menuTypeOptions.map((item) => ({
                          label: item.dictLabel,
                          value: item.dictValue,
                        }))}
                      />
                    </Form.Item>
                  </Col>
                  {/* 菜单图标：目录、菜单 */}
                  {(menuType === 'M' || menuType === 'C') && (
                    <Col xs={24} md={12}>
                      <Form.Item<MenuAddType> label="菜单图标" name="icon">
                        <Input placeholder="请输入菜单图标" />
                      </Form.Item>
                    </Col>
                  )}
                  {/* 显示排序：目录、菜单 */}
                  <Col xs={24} md={12}>
                    <Form.Item<MenuAddType>
                      label="显示排序"
                      name="menuSort"
                      rules={[
                        {
                          required: true,
                          message: '显示排序不能为空!',
                        },
                      ]}
                    >
                      <InputNumber style={{ width: '100%' }} min={0} />
                    </Form.Item>
                  </Col>
                  {/* 菜单名称：三种类型都有 */}
                  <Col xs={24} md={12}>
                    <Form.Item<MenuAddType>
                      label="菜单名称"
                      name="menuName"
                      rules={[
                        {
                          required: true,
                          message: '菜单名称不能为空!',
                        },
                      ]}
                    >
                      <Input placeholder="请输入菜单名称" />
                    </Form.Item>
                  </Col>
                  {/* 路由名称：菜单 */}
                  {menuType === 'C' && (
                    <Col xs={24} md={12}>
                      <Form.Item<MenuAddType>
                        label="路由名称"
                        name="name"
                        tooltip={{
                          title:
                            '默认不填则和路由地址相同：如地址为：`user`，则名称为`User`（注意：为避免名字的冲突，特殊情况下请自定义，保证唯一性）',
                          placement: 'bottomLeft',
                        }}
                      >
                        <Input placeholder="请输入路由名称" />
                      </Form.Item>
                    </Col>
                  )}

                  {/* 路由地址：菜单 */}
                  {(menuType === 'M' || menuType === 'C') && (
                    <Col xs={24} md={12}>
                      <Form.Item<MenuAddType>
                        label="路由地址"
                        name="path"
                        tooltip={{
                          title: '访问的路由地址，如：user menu',
                          placement: 'bottomLeft',
                        }}
                        rules={[
                          {
                            required: true,
                            message: '路由地址不能为空!',
                          },
                        ]}
                      >
                        <Input placeholder="请输入路由地址" />
                      </Form.Item>
                    </Col>
                  )}
                  {/* 组件路径：菜单 */}
                  {menuType === 'C' && (
                    <Col xs={24} md={12}>
                      <Form.Item<MenuAddType>
                        label="组件路径"
                        name="component"
                        tooltip={{
                          title: '访问的组件路径，如：system/user/index，默认在 views 目录下',
                          placement: 'bottomLeft',
                        }}
                      >
                        <Input placeholder="请输入组件路径" />
                      </Form.Item>
                    </Col>
                  )}
                  {/* 权限字符：按钮 */}
                  {(menuType === 'F' || menuType === 'C') && (
                    <Col xs={24} md={12}>
                      <Form.Item<MenuAddType>
                        label="权限字符"
                        name="perms"
                        tooltip={{
                          title:
                            "控制器中定义的权限字符，如：@PreAuthorize(`@ss.hasPermi('system:user:list')`)",
                          placement: 'bottomLeft',
                        }}
                        rules={[
                          {
                            required: true,
                            message: '权限字符不能为空!',
                          },
                        ]}
                      >
                        <Input placeholder="请输入权限字符" />
                      </Form.Item>
                    </Col>
                  )}
                  {/* 是否缓存：菜单 */}
                  {menuType === 'C' && (
                    <Col xs={24} md={12}>
                      <Form.Item<MenuAddType>
                        label="是否缓存"
                        name="keepAlive"
                        tooltip={{
                          title:
                            '选择缓存则会被 keep-alive 缓存，需要匹配组件的 name 和路由地址保持一致',
                          placement: 'bottomLeft',
                        }}
                      >
                        <Radio.Group
                          options={[
                            { value: '1', label: '缓存' },
                            { value: '0', label: '不缓存' },
                          ]}
                        />
                      </Form.Item>
                    </Col>
                  )}
                  {/* 显示状态：菜单 */}
                  {(menuType === 'M' || menuType === 'C') && (
                    <Col xs={24} md={12}>
                      <Form.Item<MenuAddType>
                        label="显示状态"
                        name="visible"
                        tooltip={{
                          title: '选择不显示则路由不会出现在侧边栏，但仍然可以访问',
                          placement: 'bottomLeft',
                        }}
                      >
                        <Radio.Group
                          options={[
                            { value: '1', label: '显示' },
                            { value: '0', label: '不显示' },
                          ]}
                        />
                      </Form.Item>
                    </Col>
                  )}
                  {/* 菜单状态：目录、菜单 */}
                  <Col xs={24} md={12}>
                    <Form.Item<MenuAddType>
                      label="菜单状态"
                      name="status"
                      tooltip={{
                        title: '选择停用则路由不会出现在侧边栏，也不能被访问',
                        placement: 'bottomLeft',
                      }}
                    >
                      <Radio.Group
                        options={statusOptions.map((item) => ({
                          label: item.dictLabel,
                          value: item.dictValue,
                        }))}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Form>
            </div>
          </Modal>
        </div>
      </div>
    </div>
  );
};
export default Menu;
