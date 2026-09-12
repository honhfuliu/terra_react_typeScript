import * as React from 'react';
import styles from './index.module.less';
import { Button, Checkbox, CheckboxProps, Form, Input } from 'antd';
import Logo from '@/assets/images/logo.svg';
import { login, getCode, LoginFormType } from '@/service/auto.ts';
import Loading from '@/components/Loading';
import storage from '@/utils/storage.ts';
import { initPermission } from '@/permission';
import { useNavigate } from 'react-router-dom';
import { store } from '@/store';
import { getHomePath } from '@/router/helper.ts';
import { useEffect, useState } from 'react';

const Login: React.FC = () => {
  // 获取表单信息
  const [form] = Form.useForm<LoginFormType>();
  // 图形验证码：base64 图片 + 唯一标识（登录时回传后端校验）
  const [captchaImg, setCaptchaImg] = useState<string>('');
  const [captchaUuid, setCaptchaUuid] = useState<string>('');
  const [captchaEnabled, setCaptchaEnabled] = useState<boolean>(true);
  const [captchaLoading, setCaptchaLoading] = useState<boolean>(false);

  const onChange: CheckboxProps['onChange'] = (e) => {
    console.log(`checked = ${e.target.checked}`);
  };
  const navigate = useNavigate();

  // 获取图形验证码
  const fetchCaptcha = async () => {
    setCaptchaLoading(true);
    const result = await getCode();
    if (result) {
      setCaptchaEnabled(result.enabled);
      setCaptchaImg(result.img || '');
      setCaptchaUuid(result.uuid || '');
    }
    setCaptchaLoading(false);
  };

  // 页面加载时获取验证码
  useEffect(() => {
    fetchCaptcha();
  }, []);

  // 登录表单效验
  const handleLogin = async () => {
    let values: LoginFormType;
    try {
      values = await form.validateFields();
      console.log('获取到的表单数据：', values);
      // await loginApi(values);
    } catch (e) {
      console.log('表单验证失败', e);
      return;
    }
    try {
      const result = await login({ ...values, uuid: captchaUuid });
      if (result) {
        storage.set('$_token', result.token);
        const userInfo = {
          username: result.username,
          nickname: result.nickname,
        };
        storage.set('$_user', JSON.stringify(userInfo));
        await initPermission();
        // 根据后端返回的路由树，跳转到第一个可访问的页面
        // 无权限的页面后端不会下发，因此不会出现登录后跳转到无权限页面的情况
        const { routes } = store.getState().permission;
        const homePath = getHomePath(routes);
        navigate(homePath);
      } else {
        // 登录失败（含验证码错误）：清空验证码并刷新一张新的
        form.setFieldValue('code', '');
        fetchCaptcha();
      }
    } catch (e) {
      console.error(e);
      form.setFieldValue('code', '');
      fetchCaptcha();
    }
  };
  return (
    <>
      <div className={`${styles.loginPage} ${styles.techBg}`}>
        <div className={styles.loginCard}>
          <div className={styles.loginCardHeader}>
            <div className={styles.loginLogo}>
              <img src={Logo} alt="logo" className={styles.logoImage} />
            </div>

            <div className={styles.loginTitle}>
              <div className={styles.loginTitleMain}>后台管理</div>
              <div className={styles.loginTitleDesc}>ADMINISTRATION SYSTEM</div>
            </div>
          </div>

          <div className={styles.loginWelcome}>
            <div className={styles.loginWelcomeTitle}>欢迎登录</div>

            <div className={styles.loginWelcomeDesc}>请输入您的账号信息，进入管理工作台</div>
          </div>

          <div className={styles.loginForm}>
            <Form
              layout="vertical"
              form={form}
              initialValues={{ username: 'admin', password: 'admin123' }}
            >
              <Form.Item<LoginFormType>
                label="账号"
                name="username"
                rules={[{ required: true, message: '账号不能为空!' }]}
              >
                <Input placeholder={'请输入用户名'} />
              </Form.Item>
              <Form.Item<LoginFormType>
                label="密码"
                name="password"
                rules={[{ required: true, message: '密码不能为空!' }]}
              >
                <Input.Password placeholder={'请输入密码'} />
              </Form.Item>
              {/*
                验证码字段（后端 enabled=false 时整块隐藏）：
                外层 Form.Item（不带 name）负责 label 布局与错误提示渲染；
                内层 noStyle Form.Item 负责字段绑定与校验，错误会自动上报到外层展示。
              */}
              {captchaEnabled && (
                <Form.Item
                  label="验证码"
                  extra={
                    <span className={styles.loginFormCaptchaRefresh}>点击验证码图片可刷新</span>
                  }
                >
                  <div className={styles.loginFormCode}>
                    <Form.Item<LoginFormType>
                      name="code"
                      noStyle
                      rules={[{ required: true, message: '验证码不能为空!' }]}
                    >
                      <Input
                        className={styles.codeInput}
                        placeholder="请输入验证码"
                        maxLength={4}
                        autoComplete="off"
                      />
                    </Form.Item>
                    <div
                      className={styles.codeCaptcha}
                      title="点击刷新验证码"
                      onClick={fetchCaptcha}
                    >
                      {captchaImg ? (
                        <img
                          src={captchaImg}
                          alt="验证码"
                          className={`${styles.codeCaptchaImg} ${
                            captchaLoading ? styles.codeCaptchaLoading : ''
                          }`}
                        />
                      ) : (
                        <span className={styles.codeCaptchaText}>
                          {captchaLoading ? '加载中...' : '点击获取'}
                        </span>
                      )}
                    </div>
                  </div>
                </Form.Item>
              )}
            </Form>
          </div>

          <div className={styles.loginOptions}>
            <div className={styles.loginRemember}>
              <Checkbox onChange={onChange}>记住账号</Checkbox>
            </div>
          </div>

          <div className={styles.loginAction}>
            <Button type={'primary'} style={{ width: '100%' }} size={'large'} onClick={handleLogin}>
              登录
            </Button>
          </div>

          <div className={styles.loginFooter}>© 2026 terra · 后台管理</div>
        </div>

        <div>
          <Loading fullscreen={true} tip={'路由加载中'} />
        </div>
      </div>
    </>
  );
};
export default Login;
