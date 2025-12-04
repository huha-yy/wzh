import { Button, Card, Form, Input, message } from 'antd'
import { useAuthStore } from '../store/auth'
import { useNavigate, Link } from 'react-router-dom'

export default function Register() {
  const register = useAuthStore(s => s.register)
  const nav = useNavigate()
  const [form] = Form.useForm()
  
  const onFinish = async (values: any) => {
    try {
      await register(values.username, values.password, values.realName, values.phone)
      message.success('注册成功，请登录')
      nav('/login')
    } catch (e: any) {
      message.error(e.message || '注册失败')
    }
  }
  
  return (
    <Card title="用户注册" style={{ maxWidth: 400, margin: '40px auto' }}>
      <Form form={form} onFinish={onFinish} layout="vertical">
        <Form.Item 
          name="username" 
          label="用户名" 
          rules={[
            { required: true, message: '请输入用户名' },
            { min: 3, max: 20, message: '用户名长度必须在3-20个字符之间' }
          ]}
        >
          <Input placeholder="请输入用户名" />
        </Form.Item>
        
        <Form.Item 
          name="password" 
          label="密码" 
          rules={[
            { required: true, message: '请输入密码' },
            { min: 6, max: 20, message: '密码长度必须在6-20个字符之间' }
          ]}
        >
          <Input.Password placeholder="请输入密码" />
        </Form.Item>
        
        <Form.Item 
          name="confirmPassword" 
          label="确认密码" 
          dependencies={['password']}
          rules={[
            { required: true, message: '请确认密码' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve()
                }
                return Promise.reject(new Error('两次输入的密码不一致'))
              },
            }),
          ]}
        >
          <Input.Password placeholder="请再次输入密码" />
        </Form.Item>
        
        <Form.Item 
          name="realName" 
          label="真实姓名" 
          rules={[
            { required: true, message: '请输入真实姓名' },
            { min: 2, max: 10, message: '真实姓名长度必须在2-10个字符之间' }
          ]}
        >
          <Input placeholder="请输入真实姓名" />
        </Form.Item>
        
        <Form.Item 
          name="phone" 
          label="手机号码" 
          rules={[
            { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码' }
          ]}
        >
          <Input placeholder="请输入手机号码（可选）" />
        </Form.Item>
        
        <Form.Item>
          <Button type="primary" htmlType="submit" style={{ width: '100%' }}>
            注册
          </Button>
        </Form.Item>
        
        <Form.Item style={{ textAlign: 'center', marginBottom: 0 }}>
          已有账号？<Link to="/login">立即登录</Link>
        </Form.Item>
      </Form>
    </Card>
  )
}