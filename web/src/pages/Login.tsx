import React from 'react';
import { Button, Form, Input, message, Checkbox, Typography, ConfigProvider } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuthStore } from '../store/auth';
import { useNavigate, Link } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;

export default function Login() {
  const login = useAuthStore(s => s.login);
  const nav = useNavigate();
  const [form] = Form.useForm();

  const onFinish = async (v: any) => {
    try {
      await login(v.username, v.password);
      message.success('登录成功');
      nav('/tools');
    } catch (e: any) {
      message.error(e.message || '登录失败');
    }
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#001529',
        },
      }}
    >
      <style>
        {`
          input:-webkit-autofill,
          input:-webkit-autofill:hover,
          input:-webkit-autofill:focus,
          input:-webkit-autofill:active {
            -webkit-box-shadow: 0 0 0 1000px white inset !important;
            -webkit-text-fill-color: rgba(0, 0, 0, 0.88) !important;
            transition: background-color 5000s ease-in-out 0s;
          }
        `}
      </style>
      <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
        {/* Left Side */}
        <div
          style={{
            flex: 1.5,
            backgroundColor: '#001529',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            color: '#fff',
            padding: '0 50px',
            backgroundImage: 'linear-gradient(135deg, #001529 0%, #003a70 100%)',
          }}
        >
          <div style={{ maxWidth: 600, textAlign: 'left' }}>
            <Title style={{ color: '#fff', fontSize: '48px', marginBottom: '24px', fontWeight: 700 }}>
              社区共享工具管理系统
            </Title>
            <Paragraph style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '24px', marginBottom: '40px', fontWeight: 300 }}>
              让资源触手可及，让邻里更加亲近
            </Paragraph>
            <div style={{ height: '4px', width: '80px', backgroundColor: '#fff', borderRadius: '2px', marginBottom: '40px' }}></div>
            <Paragraph style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: '16px', lineHeight: '1.8' }}>
              这是一个专为社区打造的工具共享平台，旨在提高资源利用率，减少不必要的浪费。
              在这里，您可以轻松借用所需的工具，也可以将闲置的工具分享给邻居。
              让我们共同构建一个绿色、便捷、互助的现代化社区环境。
            </Paragraph>
          </div>
        </div>

        {/* Right Side */}
        <div
          style={{
            flex: 1,
            backgroundColor: '#fff',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'column'
          }}
        >
          <div style={{ width: '100%', maxWidth: 420, padding: '0 20px' }}>
            <div style={{ marginBottom: 40, textAlign: 'center' }}>
                <Title level={2} style={{ color: '#001529', margin: 0 }}>欢迎回来</Title>
                <Text type="secondary" style={{ fontSize: '16px' }}>请登录您的账号以继续</Text>
            </div>
            
            <Form
              form={form}
              onFinish={onFinish}
              layout="vertical"
              size="large"
              initialValues={{ remember: true }}
              requiredMark={false}
            >
              <Form.Item
                name="username"
                rules={[{ required: true, message: '请输入用户名' }]}
              >
                <Input 
                  prefix={<UserOutlined style={{ color: 'rgba(0,0,0,.25)' }} />} 
                  placeholder="请输入用户名" 
                  style={{ borderRadius: '6px', height: '50px' }}
                />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[{ required: true, message: '请输入密码' }]}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
                  placeholder="请输入密码"
                  style={{ borderRadius: '6px', height: '50px' }}
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Form.Item name="remember" valuePropName="checked" noStyle>
                    <Checkbox>自动登录</Checkbox>
                  </Form.Item>
                  <a style={{ color: '#001529' }} onClick={(e) => { e.preventDefault(); message.info('请联系管理员重置密码'); }}>
                    忘记密码？
                  </a>
                </div>
              </Form.Item>

              <Form.Item style={{ marginBottom: '24px' }}>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  block 
                  style={{ 
                    height: '50px', 
                    fontSize: '18px', 
                    fontWeight: 500,
                    borderRadius: '6px',
                    boxShadow: '0 4px 14px 0 rgba(0,21,41,0.3)' 
                  }}
                >
                  登 录
                </Button>
              </Form.Item>
              
              <div style={{ textAlign: 'center' }}>
                <Text type="secondary">还没有账号？ </Text>
                <Link to="/register" style={{ color: '#001529', fontWeight: 600, borderBottom: '1px solid #001529' }}>
                  注册新账号
                </Link>
              </div>
            </Form>
          </div>
          
          <div style={{ position: 'absolute', bottom: '20px', color: '#8c8c8c', fontSize: '12px' }}>
            © 2024 社区共享工具管理系统. All Rights Reserved.
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
}
