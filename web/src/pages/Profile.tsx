import { Button, Card, Form, Input, Modal, Tabs, message } from 'antd'
import http from '../api/http'
import { useEffect, useState } from 'react'

type UserProfile = {
  id: number
  username: string
  realName?: string
  phone?: string
  address?: string
  status: number
  roles: string[]
}

export default function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [profileForm] = Form.useForm()
  const [passwordForm] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const fetchProfile = async () => {
    try {
      const res = await http.get('/user/profile')
      if (res.data && res.data.code === 0) {
        setProfile(res.data.data)
        profileForm.setFieldsValue({
          realName: res.data.data.realName || '',
          phone: res.data.data.phone || '',
          address: res.data.data.address || ''
        })
      }
    } catch (error) {
      console.error('获取个人资料失败:', error)
      message.error('获取个人资料失败')
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  const handleUpdateProfile = async () => {
    try {
      const values = await profileForm.validateFields()
      setLoading(true)
      const res = await http.put('/user/profile', values)
      if (res.data && res.data.code === 0) {
        message.success('个人资料更新成功')
        fetchProfile()
      } else {
        message.error(res.data?.message || '更新失败')
      }
    } catch (error: any) {
      message.error(error?.response?.data?.message || error.message || '更新失败')
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async () => {
    try {
      const values = await passwordForm.validateFields()
      if (values.newPassword !== values.confirmPassword) {
        message.error('两次输入的新密码不一致')
        return
      }
      setLoading(true)
      const res = await http.put('/user/password', {
        oldPassword: values.oldPassword,
        newPassword: values.newPassword
      })
      if (res.data && res.data.code === 0) {
        message.success('密码修改成功')
        passwordForm.resetFields()
      } else {
        message.error(res.data?.message || '修改失败')
      }
    } catch (error: any) {
      message.error(error?.response?.data?.message || error.message || '修改失败')
    } finally {
      setLoading(false)
    }
  }

  const getRoleNames = (roles: string[]) => {
    const roleMap: Record<string, string> = {
      resident: '居民',
      admin: '管理员',
      maintainer: '维护人员'
    }
    return roles.map(r => roleMap[r] || r).join('、')
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Card title="个人中心">
        {profile && (
          <div style={{ marginBottom: 24 }}>
            <p><strong>用户名：</strong>{profile.username}</p>
            <p><strong>角色：</strong>{getRoleNames(profile.roles)}</p>
            <p><strong>账户状态：</strong>{profile.status === 1 ? '正常' : '已禁用'}</p>
          </div>
        )}

        <Tabs
          items={[
            {
              key: 'profile',
              label: '个人资料',
              children: (
                <Form form={profileForm} layout="vertical" onFinish={handleUpdateProfile}>
                  <Form.Item
                    name="realName"
                    label="真实姓名"
                    rules={[{ required: false }]}
                  >
                    <Input placeholder="请输入真实姓名" />
                  </Form.Item>

                  <Form.Item
                    name="phone"
                    label="联系电话"
                    rules={[
                      { required: false },
                      { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号码' }
                    ]}
                  >
                    <Input placeholder="请输入联系电话" />
                  </Form.Item>

                  <Form.Item
                    name="address"
                    label="常用地址"
                    rules={[{ required: false }]}
                  >
                    <Input.TextArea
                      placeholder="请输入常用地址"
                      rows={3}
                    />
                  </Form.Item>

                  <Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading}>
                      保存修改
                    </Button>
                  </Form.Item>
                </Form>
              )
            },
            {
              key: 'password',
              label: '修改密码',
              children: (
                <Form form={passwordForm} layout="vertical" onFinish={handleChangePassword}>
                  <Form.Item
                    name="oldPassword"
                    label="原密码"
                    rules={[{ required: true, message: '请输入原密码' }]}
                  >
                    <Input.Password placeholder="请输入原密码" />
                  </Form.Item>

                  <Form.Item
                    name="newPassword"
                    label="新密码"
                    rules={[
                      { required: true, message: '请输入新密码' },
                      { min: 6, message: '密码长度至少为6位' }
                    ]}
                  >
                    <Input.Password placeholder="请输入新密码（至少6位）" />
                  </Form.Item>

                  <Form.Item
                    name="confirmPassword"
                    label="确认新密码"
                    rules={[
                      { required: true, message: '请再次输入新密码' },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue('newPassword') === value) {
                            return Promise.resolve()
                          }
                          return Promise.reject(new Error('两次输入的密码不一致'))
                        }
                      })
                    ]}
                  >
                    <Input.Password placeholder="请再次输入新密码" />
                  </Form.Item>

                  <Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading}>
                      修改密码
                    </Button>
                  </Form.Item>
                </Form>
              )
            }
          ]}
        />
      </Card>
    </div>
  )
}
