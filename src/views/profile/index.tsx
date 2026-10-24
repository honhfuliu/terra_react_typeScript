import * as React from 'react';
import {
  App,
  Avatar,
  Button,
  Card,
  Form,
  GetProp,
  Input,
  Modal,
  Radio,
  Tag,
  Typography,
  Upload,
  UploadProps,
} from 'antd';
import type { RadioChangeEvent } from 'antd';
import {
  CameraOutlined,
  CheckCircleFilled,
  EditOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  LockOutlined,
  LoginOutlined,
  MailOutlined,
  PhoneOutlined,
  SafetyOutlined,
} from '@ant-design/icons';
import {
  changePassword,
  getUserProfile,
  updateUserProfile,
  uploadAvatar,
  UserProfileType,
} from '@/service/user.ts';
import { useDict } from '@/hooks/useDict.ts';
import styles from './index.module.less';
import DictTag from '@/components/DictTag';
import storage from '@/utils/storage.ts';
import { COMMON_STATUS, DICT_TYPE, STORAGE_KEY } from '@/constants';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

// 修改密码表单值
interface ChangePwdFormValues {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

type FileType = Parameters<GetProp<UploadProps, 'beforeUpload'>>[0];

// 主页面
const Profile: React.FC = () => {
  const { message } = App.useApp();
  const sexOptions = useDict(DICT_TYPE.SYS_SEX);
  const statusOptions = useDict(DICT_TYPE.SYS_STATUS);
  const [changePwdOpen, setChangePwdOpen] = React.useState(false);
  // 接口返回的用户信息
  const [profile, setProfile] = React.useState<UserProfileType | null>(null);
  // 可编辑字段
  const [nickname, setNickname] = React.useState('');
  const [gender, setGender] = React.useState<string>('0');
  const [remark, setRemark] = React.useState('');
  const [pwdForm] = Form.useForm<ChangePwdFormValues>();
  const [imageUrl, setImageUrl] = React.useState<string>();
  // 保存修改 loading
  const [saving, setSaving] = React.useState(false);
  // 修改密码提交 loading
  const [pwdLoading, setPwdLoading] = React.useState(false);

  const navigate = useNavigate(); // 用于导航

  // 与后端 DTO 校验保持一致
  const MAX_NICKNAME_LEN = 64;
  const MAX_REMARK_LEN = 500;

  // 查询当前登录用户信息
  const fetchProfile = React.useCallback(async () => {
    try {
      const data = await getUserProfile();
      setProfile(data);
      setNickname(data.nickname || '');
      setGender(data.sex || '0');
      setRemark(data.remark || '');
      setImageUrl(data.avatar || '');
    } catch (e) {
      console.error(e);
    }
  }, []);

  React.useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

  const handleGenderChange = (e: RadioChangeEvent) => {
    setGender(e.target.value);
  };

  // 保存个人信息（昵称、性别、备注）
  const handleSave = async () => {
    const trimmedNickname = nickname.trim();
    if (!trimmedNickname) {
      message.warning('用户昵称不能为空');
      return;
    }
    setSaving(true);
    try {
      await updateUserProfile({
        nickname: trimmedNickname,
        sex: gender,
        remark: remark.trim() || '',
      });
      message.success('资料保存成功');
      // 重新拉取，刷新“最后更新”时间等信息
      await fetchProfile();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  // 修改密码：确认
  const handlePwdOk = async () => {
    let values;
    // 表单校验
    try {
      values = await pwdForm.validateFields();
    } catch (e) {
      // 表单校验失败，保持弹窗打开
      console.error(e);
      return;
    }
    // 请求修改密码
    try {
      setPwdLoading(true);
      await changePassword({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      });
      message.success('密码修改成功，请重新登录');
      pwdForm.resetFields();
      setChangePwdOpen(false);
      // 后续处理退出登录
      storage.remove(STORAGE_KEY.TOKEN);
      storage.remove(STORAGE_KEY.USER);
      navigate('/login', { replace: true });
    } catch (e) {
      console.error(e);
    } finally {
      setPwdLoading(false);
    }
  };

  // 修改密码：取消
  const handlePwdCancel = () => {
    pwdForm.resetFields();
    setChangePwdOpen(false);
  };

  // 上传文件检测
  const beforeUpload = (file: FileType) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
    if (!isJpgOrPng) {
      message.error('只允许上传 JPG 或 PNG 格式的图片');
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('图片必须小于 2MB!');
    }
    return isJpgOrPng && isLt2M;
  };
  // 上传文件
  const handleUpload: UploadProps['customRequest'] = async (options) => {
    const { file, onSuccess, onError } = options;
    try {
      const formData = new FormData();
      formData.append('avatar', file as File);
      const res = await uploadAvatar(formData);
      setImageUrl(res);
      console.log(res);
      onSuccess?.(res);
    } catch (error) {
      onError?.(error as Error);
    }
  };

  return (
    <div className={styles.profilePage}>
      {/* 页面头部 */}
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.breadcrumb}>ACCOUNT / PROFILE</div>
          <Title level={3} className={styles.title}>
            个人中心
          </Title>
          <Text type="secondary" className={styles.subtitle}>
            管理你的账号信息、联系方式与安全设置
          </Text>
        </div>
        <Tag
          icon={<CheckCircleFilled />}
          color={profile?.status === COMMON_STATUS.ENABLED ? 'success' : 'error'}
          className={styles.statusTag}
        >
          {profile?.status === COMMON_STATUS.ENABLED ? '账号正常' : '账号停用'}
        </Tag>
      </div>

      {/* 主体布局 */}
      <div className={styles.mainLayout}>
        {/* 左侧栏 */}
        <div className={styles.leftColumn}>
          {/* 用户信息卡片 */}
          <Card
            variant="borderless"
            className={`${styles.card} ${styles.userCard}`}
            styles={{ body: { padding: 0 } }}
          >
            <div className={styles.banner} />
            <div className={styles.avatarWrap}>
              <Avatar
                size={100}
                icon={<LoginOutlined />}
                src={`/upload/${imageUrl}`}
                className={styles.avatar}
              />
              <div className={styles.cameraIcon}>
                <Upload
                  name="avatar"
                  className="avatar-uploader"
                  showUploadList={false}
                  beforeUpload={beforeUpload}
                  customRequest={handleUpload}
                >
                  <CameraOutlined />
                </Upload>
              </div>
            </div>
            <div className={styles.userInfo}>
              <Title level={4} className={styles.userName}>
                {profile?.nickname || '-'}
              </Title>
              {/*<div className={styles.userMeta}>*/}
              {/*  <Text type="secondary">超级管理员</Text>*/}
              {/*</div>*/}
            </div>
            <div className={styles.divider} />
            <div className={styles.userStats}>
              <div className={styles.statItem}>
                <div className={styles.statLabel}>用户编号</div>
                <div className={styles.statValue}>{profile?.userId ?? '-'}</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statLabel}>加入时间</div>
                <div className={styles.statValue}>{profile?.createTime || '-'}</div>
              </div>
            </div>
          </Card>

          {/* 安全概览卡片 */}
          <Card
            variant="borderless"
            className={`${styles.card} ${styles.securityCard}`}
            styles={{ body: { padding: 0 } }}
          >
            <div className={styles.cardHeader}>
              <SafetyOutlined className={styles.headerIcon} />
              安全概览
            </div>
            <div className={styles.securityList}>
              <div className={styles.securityItem}>
                <div className={styles.itemLeft}>
                  <LockOutlined className={styles.itemIcon} />
                  <span className={styles.itemText}>登录密码</span>
                </div>
                <Tag color="success" className={styles.itemStatusTag}>
                  已设置
                </Tag>
              </div>
              <div className={styles.securityItem}>
                <div className={styles.itemLeft}>
                  <MailOutlined className={styles.itemIcon} />
                  <span className={styles.itemText}>邮箱设置</span>
                </div>
                <Tag
                  color={profile?.email ? 'success' : 'default'}
                  className={styles.itemStatusTag}
                >
                  {profile?.email ? '已设置' : '未设置'}
                </Tag>
              </div>
              <div className={styles.securityItem}>
                <div className={styles.itemLeft}>
                  <PhoneOutlined className={styles.itemIcon} />
                  <span className={styles.itemText}>手机设置</span>
                </div>
                <Tag
                  color={profile?.phone ? 'success' : 'default'}
                  className={styles.itemStatusTag}
                >
                  {profile?.phone ? '已设置' : '未设置'}
                </Tag>
              </div>
            </div>
            <Button
              block
              className={styles.changePwdBtn}
              icon={<LockOutlined />}
              onClick={() => setChangePwdOpen(true)}
            >
              修改登录密码
            </Button>
          </Card>
        </div>

        {/* 右侧栏 */}
        <div className={styles.rightColumn}>
          {/* 基本资料卡片 */}
          <Card
            variant="borderless"
            className={`${styles.card} ${styles.profileCard}`}
            styles={{ body: { padding: 0 } }}
          >
            <div className={styles.cardHeader}>
              <div className={styles.headerLeft}>
                <EditOutlined className={styles.headerIcon} />
                <span>基本资料</span>
              </div>
              <Text type="secondary" className={styles.headerRight}>
                最后更新：{profile?.updateTime || '-'}
              </Text>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.formGrid}>
                <div className={styles.formItem}>
                  <div className={styles.formLabel}>用户名</div>
                  <Input value={profile?.username || ''} readOnly />
                </div>

                <div className={styles.formItem}>
                  <div className={styles.formLabel}>
                    <span className={styles.required}>*</span>用户昵称
                  </div>
                  <Input
                    value={nickname}
                    maxLength={MAX_NICKNAME_LEN}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="请输入用户昵称"
                  />
                </div>

                <div className={styles.formItem}>
                  <div className={styles.formLabel}>邮箱</div>
                  <Input value={profile?.email || ''} readOnly prefix={<MailOutlined />} />
                </div>

                <div className={styles.formItem}>
                  <div className={styles.formLabel}>手机号</div>
                  <Input value={profile?.phone || ''} readOnly prefix={<PhoneOutlined />} />
                </div>

                <div className={styles.formItem}>
                  <div className={styles.formLabel}>性别</div>
                  <Radio.Group value={gender} onChange={handleGenderChange}>
                    {sexOptions.map((item) => (
                      <Radio key={item.dictValue} value={item.dictValue}>
                        {item.dictLabel}
                      </Radio>
                    ))}
                  </Radio.Group>
                </div>

                <div className={styles.formItem}>
                  <div className={styles.formLabel}>账号状态</div>
                  <DictTag value={profile?.status} option={statusOptions} />
                </div>

                <div className={`${styles.formItem} ${styles.fullWidth}`}>
                  <div className={styles.formLabel}>个人备注</div>
                  <Input.TextArea
                    allowClear
                    autoSize={{ minRows: 2, maxRows: 6 }}
                    maxLength={MAX_REMARK_LEN}
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    placeholder="请输入个人备注信息"
                  />
                </div>
              </div>

              <div className={styles.formFooter}>
                <Text type="secondary" className={styles.tip}>
                  修改资料后将记录到操作日志
                </Text>
                <Button type="primary" size="large" loading={saving} onClick={handleSave}>
                  保存修改
                </Button>
              </div>
            </div>
          </Card>

          {/* 最近登录卡片 */}
          <Card
            variant="borderless"
            className={`${styles.card} ${styles.loginCard}`}
            styles={{ body: { padding: 0 } }}
          >
            <div className={styles.cardHeader}>
              <LoginOutlined className={styles.headerIcon} />
              <span>最近登录</span>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.loginItem}>
                <Text strong>本次登录：</Text>
                <Text type="secondary">
                  {profile?.lastLoginInfo || profile?.lastLoginTime || '-'}
                </Text>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* 修改密码对话框 */}
      <Modal
        title="修改登录密码"
        open={changePwdOpen}
        onOk={handlePwdOk}
        onCancel={handlePwdCancel}
        okText="确认修改"
        cancelText="取消"
        width={460}
        centered
        confirmLoading={pwdLoading}
      >
        <Form form={pwdForm} layout="vertical" className={styles.modalForm}>
          <Form.Item
            label="当前密码"
            name="oldPassword"
            rules={[{ required: true, message: '原密码不能为空' }]}
          >
            <Input.Password
              placeholder="请输入当前登录密码"
              iconRender={(visible) => (visible ? <EyeOutlined /> : <EyeInvisibleOutlined />)}
            />
          </Form.Item>

          <Form.Item
            label="新密码"
            name="newPassword"
            rules={[
              { required: true, message: '新密码不能为空' },
              { min: 6, max: 100, message: '新密码长度需在6-100个字符之间' },
            ]}
          >
            <Input.Password
              placeholder="请输入新密码（6-100个字符）"
              iconRender={(visible) => (visible ? <EyeOutlined /> : <EyeInvisibleOutlined />)}
            />
          </Form.Item>

          <Form.Item
            label="确认新密码"
            name="confirmPassword"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '确认密码不能为空' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password
              placeholder="请再次输入新密码"
              iconRender={(visible) => (visible ? <EyeOutlined /> : <EyeInvisibleOutlined />)}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Profile;
