import { Button, Card, Form, Input, message } from 'antd'
import { useAuthStore } from '../store/auth'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const login = useAuthStore(s => s.login)
  const register = useAuthStore(s => s.register)
  const nav = useNavigate()
  const onFinish = async (v: any) => {
    try {
      await login(v.username, v.password)
      nav('/tools')
    } catch (e: any) {
      message.error(e.message || '登录失败')
    }
  }
  const onRegister = async (v: any) => {
    try {
      await register(v.username, v.password)
      message.success('注册成功')
    } catch (e: any) {
      message.error(e.message || '注册失败')
    }
  }
  return (
    <Card title="登录" style={{ maxWidth: 400, margin: '40px auto' }}>
      <Form onFinish={onFinish} layout="vertical">
        <Form.Item name="username" label="用户名" rules={[{ required: true }]}> <Input /> </Form.Item>
        <Form.Item name="password" label="密码" rules={[{ required: true }]}> <Input.Password /> </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" style={{ marginRight: 8 }}>登录</Button>
          <Button onClick={() => onRegister((document.querySelector('form') as any).__formValues || {})}>注册</Button>
        </Form.Item>
      </Form>
    </Card>
  )
}

