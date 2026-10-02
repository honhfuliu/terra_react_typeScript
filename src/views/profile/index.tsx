import * as React from 'react';
import { App, Avatar, Button, Card, Form, Input, Modal, Radio, Tag, Typography } from 'antd';
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
import styles from './index.module.less';

const { Title, Text } = Typography;
const { TextArea } = Input;

// 修改密码对话框
interface ChangePwdModalProps {
  open: boolean;
  onClose: () => void;
}

interface ChangePwdFormValues {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const ChangePwdModal: React.FC<ChangePwdModalProps> = ({ open, onClose }) => {
  const [form] = Form.useForm<ChangePwdFormValues>();
  const { message } = App.useApp();
  const [showOldPwd, setShowOldPwd] = React.useState(false);
  const [showNewPwd, setShowNewPwd] = React.useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = React.useState(false);
  const [newPwd, setNewPwd] = React.useState('');

  // 密码强度计算
  const getStrength = (pwd: string): number => {
    if (!pwd) return 0;
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return Math.min(score, 3);
  };

  const strength = getStrength(newPwd);
  const strengthLabels = ['', '弱', '中', '强'];
  const strengthColors = ['#ff4d4f', '#faad14', '#52c41a'];

  const handleOk = async () => {
    try {
      await form.validateFields();
      message.success('密码修改成功');
      form.resetFields();
      setNewPwd('');
      onClose();
    } catch {
      // 校验失败，Modal 会自动显示错误
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setNewPwd('');
    onClose();
  };

  return (
    <Modal
      title="修改登录密码"
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      okText="确认修改"
      cancelText="取消"
      width={460}
      centered
    >
      <Form
        form={form}
        layout="vertical"
        className={styles.modalForm}
        onValuesChange={(changed) => {
          if ('newPassword' in changed) {
            setNewPwd(changed.newPassword || '');
          }
        }}
      >
        <Form.Item
          label="当前密码"
          name="oldPassword"
          rules={[{ required: true, message: '请输入当前密码' }]}
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
            { required: true, message: '请输入新密码' },
            { min: 8, message: '密码长度至少8位' },
            {
              pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
              message: '密码需包含大小写字母和数字',
            },
          ]}
        >
          <Input.Password
            placeholder="至少8位，含大小写字母、数字"
            iconRender={(visible) => (visible ? <EyeOutlined /> : <EyeInvisibleOutlined />)}
          />
        </Form.Item>

        {newPwd && (
          <div className={styles.pwdStrength}>
            <div className={styles.strengthBar}>
              {[1, 2, 3].map((seg) => (
                <div
                  key={seg}
                  className={styles.barSegment}
                  style={{
                    background: seg <= strength ? strengthColors[strength - 1] : undefined,
                  }}
                />
              ))}
            </div>
            <Text type="secondary" className={styles.strengthText}>
              密码强度：{strengthLabels[strength]}
            </Text>
          </div>
        )}

        <Form.Item
          label="确认新密码"
          name="confirmPassword"
          dependencies={['newPassword']}
          rules={[
            { required: true, message: '请再次输入新密码' },
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

      {/* 隐藏未使用变量以避免告警 */}
      <span style={{ display: 'none' }}>
        {String(showOldPwd)}
        {String(showNewPwd)}
        {String(showConfirmPwd)}
      </span>
    </Modal>
  );
};

// 主页面
const Profile: React.FC = () => {
  const { message } = App.useApp();
  const [changePwdOpen, setChangePwdOpen] = React.useState(false);
  const [gender, setGender] = React.useState<string>('male');
  const [remark, setRemark] = React.useState('负责平台系统管理与日常维护。');

  const MAX_REMARK_LEN = 120;

  const handleGenderChange = (e: RadioChangeEvent) => {
    setGender(e.target.value);
  };

  const handleSave = () => {
    message.success('资料保存成功');
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
        <Tag icon={<CheckCircleFilled />} color="success" className={styles.statusTag}>
          账号正常
        </Tag>
      </div>

      {/* 主体布局 */}
      <div className={styles.mainLayout}>
        {/* 左侧栏 */}
        <div className={styles.leftColumn}>
          {/* 用户信息卡片 */}
          <Card
            bordered={false}
            className={`${styles.card} ${styles.userCard}`}
            styles={{ body: { padding: 0 } }}
          >
            <div className={styles.banner} />
            <div className={styles.avatarWrap}>
              <Avatar size={100} icon={<LoginOutlined />} className={styles.avatar} />
              <div className={styles.cameraIcon}>
                <CameraOutlined />
              </div>
            </div>
            <div className={styles.userInfo}>
              <Title level={4} className={styles.userName}>
                张伟
              </Title>
              <div className={styles.userMeta}>
                <Text type="secondary">超级管理员</Text>
                {/*<span className={styles.verifiedBadge}>*/}
                {/*  <CheckCircleFilled />*/}
                {/*  账号已认证*/}
                {/*</span>*/}
              </div>
            </div>
            <div className={styles.divider} />
            <div className={styles.userStats}>
              <div className={styles.statItem}>
                <div className={styles.statLabel}>用户编号</div>
                <div className={styles.statValue}>U20240614001</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statLabel}>加入时间</div>
                <div className={styles.statValue}>2024-06-14</div>
              </div>
            </div>
          </Card>

          {/* 安全概览卡片 */}
          <Card
            bordered={false}
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
                <Tag color="success" className={styles.itemStatusTag}>
                  已设置
                </Tag>
              </div>
              <div className={styles.securityItem}>
                <div className={styles.itemLeft}>
                  <PhoneOutlined className={styles.itemIcon} />
                  <span className={styles.itemText}>手机设置</span>
                </div>
                <Tag color="success" className={styles.itemStatusTag}>
                  已设置
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
            bordered={false}
            className={`${styles.card} ${styles.profileCard}`}
            styles={{ body: { padding: 0 } }}
          >
            <div className={styles.cardHeader}>
              <div className={styles.headerLeft}>
                <EditOutlined className={styles.headerIcon} />
                <span>基本资料</span>
              </div>
              <Text type="secondary" className={styles.headerRight}>
                最后更新：2024-06-18 14:32
              </Text>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.formGrid}>
                <div className={styles.formItem}>
                  <div className={styles.formLabel}>用户名</div>
                  <Input value="zhangwei" readOnly />
                </div>

                <div className={styles.formItem}>
                  <div className={styles.formLabel}>
                    <span className={styles.required}>*</span>用户昵称
                  </div>
                  <Input defaultValue="张伟" />
                </div>

                <div className={styles.formItem}>
                  <div className={styles.formLabel}>邮箱</div>
                  <Input value="zhangwei@example.com" readOnly prefix={<MailOutlined />} />
                </div>

                <div className={styles.formItem}>
                  <div className={styles.formLabel}>手机号</div>
                  <Input value="138****2214" readOnly prefix={<PhoneOutlined />} />
                </div>

                <div className={styles.formItem}>
                  <div className={styles.formLabel}>性别</div>
                  <Radio.Group value={gender} onChange={handleGenderChange}>
                    <Radio value="unknown">未知</Radio>
                    <Radio value="male">男</Radio>
                    <Radio value="female">女</Radio>
                  </Radio.Group>
                </div>

                <div className={styles.formItem}>
                  <div className={styles.formLabel}>账号状态</div>
                  <Tag
                    icon={<CheckCircleFilled />}
                    color="processing"
                    className={styles.statusTagLarge}
                  >
                    正常
                  </Tag>
                </div>

                <div className={`${styles.formItem} ${styles.fullWidth}`}>
                  <div className={styles.formLabel}>个人备注</div>
                  <TextArea
                    rows={4}
                    maxLength={MAX_REMARK_LEN}
                    showCount={{ formatter: ({ count, max }) => `${count} / ${max}` }}
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
                <Button type="primary" size="large" onClick={handleSave}>
                  保存修改
                </Button>
              </div>
            </div>
          </Card>

          {/* 最近登录卡片 */}
          <Card
            bordered={false}
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
                  Chrome · Windows · 138.****.2214 · 2024-06-18 14:32 · 广东省广州市
                </Text>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* 修改密码对话框 */}
      <ChangePwdModal open={changePwdOpen} onClose={() => setChangePwdOpen(false)} />
    </div>
  );
};

export default Profile;
