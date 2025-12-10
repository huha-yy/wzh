import { useEffect, useState } from 'react'
import { Button, Card, Form, Input, Select, Table, Tag, message, Modal, Popconfirm } from 'antd'
import http from '../api/http'

type Role = { id: number; code: string; name: string }
type UserItem = { id: number; username: string; realName: string; phone: string; status: number; roles: string[] }

export default function AdminUsers() {
  const [form] = Form.useForm()
  const [editForm] = Form.useForm()
  const [data, setData] = useState<UserItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [roles, setRoles] = useState<Role[]>([])
  const [editing, setEditing] = useState<UserItem | null>(null)
  const [saving, setSaving] = useState(false)
  const roleIdByCode = (code: string) => roles.find(r => r.code === code)?.id

  const loadRoles = async () => {
    const res = await http.get('/admin/roles')
    setRoles(res.data.data || [])
  }
  const fetch = async (p = 1) => {
    setLoading(true)
    const vals = form.getFieldsValue()
    const res = await http.get('/admin/users', { params: { page: p, size: 20, username: vals.username, status: vals.status } })
    setData(res.data.data?.records || [])
    setTotal(res.data.data?.total || 0)
    setPage(p)
    setLoading(false)
  }
  useEffect(() => { loadRoles(); fetch(1) }, [])

  const setStatus = async (u: UserItem, status: number) => {
    await http.post(`/admin/users/${u.id}/status`, null, { params: { status } })
    message.success('状态已更新')
    fetch(page)
  }
  const assignRole = async (u: UserItem, roleId: number) => {
    await http.post(`/admin/users/${u.id}/roles/${roleId}`)
    message.success('角色已分配')
    fetch(page)
  }
  const revokeRole = async (u: UserItem, roleCode: string) => {
    const rid = roleIdByCode(roleCode)
    if (!rid) return
    await http.delete(`/admin/users/${u.id}/roles/${rid}`)
    message.success('角色已撤销')
    fetch(page)
  }

  const openEdit = (u: UserItem) => {
    setEditing(u)
    editForm.setFieldsValue({ username: u.username, realName: u.realName, phone: u.phone })
  }
  const saveEdit = async () => {
    try {
      const vals = await editForm.validateFields()
      setSaving(true)
      const res = await http.post(`/admin/users/${editing!.id}`, vals)
      if (res.data && typeof res.data.code !== 'undefined' && res.data.code !== 0) {
        message.error(res.data.message || '保存失败')
        return
      }
      message.success('保存成功')
      setEditing(null)
      fetch(page)
    } catch (e: any) {
      message.error(e?.response?.data?.message || e.message || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card title="用户/角色管理">
      <Form form={form} layout="inline" onFinish={() => fetch(1)}>
        <Form.Item name="username" label="用户名"><Input placeholder="请输入用户名" /></Form.Item>
        <Form.Item name="status" label="状态"><Select allowClear style={{ width: 140 }} options={[{value:1,label:'启用'},{value:0,label:'禁用'}]} /></Form.Item>
        <Form.Item><Button type="primary" htmlType="submit">查询</Button></Form.Item>
      </Form>
      <Table rowKey="id" loading={loading} dataSource={data} pagination={{ current: page, pageSize: 20, total, onChange: fetch }}
             columns={[
               { title: '用户名', dataIndex: 'username' },
               { title: '姓名', dataIndex: 'realName' },
               { title: '电话', dataIndex: 'phone' },
               { title: '状态', dataIndex: 'status', render: (s:number) => <Tag color={s===1?'green':'gray'}>{s===1?'启用':'禁用'}</Tag> },
              { title: '角色', dataIndex: 'roles', render: (rs:string[], r:UserItem) => (
                <div>
                  {rs.map(code => (
                    <span key={code} style={{ marginRight: 8 }}>
                      <Tag>{code}</Tag>
                      <Popconfirm title="确认撤销该角色？" onConfirm={()=>revokeRole(r, code)} okText="撤销" cancelText="取消">
                        <Button size="small" type="link">撤销</Button>
                      </Popconfirm>
                    </span>
                  ))}
                  <Select placeholder="分配角色" style={{ width: 160 }} onChange={val => assignRole(r, val)} options={roles.map(ro=>({value:ro.id,label:ro.name}))} />
                </div>
              ) },
               { title: '操作', render: (_:any, r:UserItem) => (
                 <div>
                  {r.status===1 ? (
                    <Popconfirm title="确认禁用该用户？" onConfirm={() => setStatus(r, 0)} okText="禁用" cancelText="取消">
                      <Button size="small">禁用</Button>
                    </Popconfirm>
                  ) : (
                    <Button size="small" type="primary" onClick={() => setStatus(r, 1)}>启用</Button>
                  )}
                    <Button size="small" style={{ marginLeft: 8 }} onClick={() => openEdit(r)}>编辑</Button>
                 </div>
               ) }
             ]}
      />
      <Modal title="编辑用户" open={!!editing} onOk={saveEdit} onCancel={() => setEditing(null)} confirmLoading={saving} destroyOnHidden>
        <Form form={editForm} layout="vertical">
          <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input placeholder="请输入用户名" />
          </Form.Item>
          <Form.Item name="realName" label="姓名">
            <Input placeholder="请输入姓名" />
          </Form.Item>
          <Form.Item name="phone" label="电话" rules={[{ validator: (_, v) => { if (!v) return Promise.resolve(); return /^1[3-9]\d{9}$/.test(v) ? Promise.resolve() : Promise.reject(new Error('请输入有效手机号')); } }]}>
            <Input placeholder="请输入电话" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}
