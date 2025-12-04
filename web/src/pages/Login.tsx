import { Button, Card, Form, Input, message } from 'antd'
import { useAuthStore } from '../store/auth'
import { useNavigate, Link } from 'react-router-dom'

export default function Login() {
  const login = useAuthStore(s => s.login)
  const nav = useNavigate()
  const [form] = Form.useForm()
  const onFinish = async (v: any) => {
    try {
      await login(v.username, v.password)
      nav('/tools')
    } catch (e: any) {
      message.error(e.message || '登录失败')
    }
  }
  return (
    <Card title="用户登录" style={{ maxWidth: 400, margin: '40px auto' }}>
      <Form form={form} onFinish={onFinish} layout="vertical">
        <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
          <Input placeholder="请输入用户名" />
        </Form.Item>
        <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}>
          <Input.Password placeholder="请输入密码" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" style={{ width: '100%' }}>
            登录
          </Button>
        </Form.Item>
        <Form.Item style={{ textAlign: 'center', marginBottom: 0 }}>
          还没有账号？<Link to="/register">立即注册</Link>
        </Form.Item>
      </Form>
    </Card>
  )
}

