import { useEffect, useState } from 'react'
import { Button, Card, Form, Input, Modal, Table, message, Popconfirm } from 'antd'
import http from '../api/http'

type Warehouse = { id: number; name: string; address?: string; contactName?: string; contactPhone?: string }

export default function AdminWarehouses() {
  const [data, setData] = useState<Warehouse[]>([])
  const [keyword, setKeyword] = useState('')
  const [editing, setEditing] = useState<Warehouse | null>(null)
  const [form] = Form.useForm()
  const fetch = async () => {
    const res = await http.get('/warehouses', { params: { name: keyword || undefined } })
    setData(res.data.data || [])
  }
  useEffect(() => { fetch() }, [])
  const openEdit = (w?: Warehouse) => {
    setEditing(w || { id: 0, name: '' })
    form.setFieldsValue(w || { name: '', address: '', contactName: '', contactPhone: '' })
  }
  const save = async () => {
    try {
      const vals = await form.validateFields()
      if (!editing) return
      if (editing.id && editing.id !== 0) {
        const res = await http.put(`/warehouses/${editing.id}`, vals)
        if (!res.data || res.data.code !== 0) { message.error(res.data?.message || '保存失败'); return }
      } else {
        const res = await http.post('/warehouses', vals)
        if (!res.data || res.data.code !== 0) { message.error(res.data?.message || '保存失败'); return }
      }
      message.success('保存成功')
      setEditing(null)
      fetch()
    } catch (e: any) { message.error(e?.response?.data?.message || e.message || '保存失败') }
  }
  const remove = async (w: Warehouse) => {
    try {
      const res = await http.delete(`/warehouses/${w.id}`)
      if (!res.data || res.data.code !== 0) { message.error(res.data?.message || '删除失败'); return }
      message.success('已删除')
      fetch()
    } catch (e: any) { message.error(e?.response?.data?.message || e.message || '删除失败') }
  }
  return (
    <Card title="仓库管理" extra={<div><Input placeholder="名称" value={keyword} onChange={e=>setKeyword(e.target.value)} onPressEnter={fetch} style={{ width: 200, marginRight: 8 }} /><Button type="primary" onClick={()=>openEdit()}>新增仓库</Button></div>}>
      <Table rowKey="id" dataSource={data} pagination={false}
             columns={[
               { title: '名称', dataIndex: 'name' },
               { title: '地址', dataIndex: 'address' },
               { title: '联系人', dataIndex: 'contactName' },
               { title: '电话', dataIndex: 'contactPhone' },
               { title: '操作', render: (_:any, r:Warehouse) => (
                 <div>
                   <Button size="small" onClick={()=>openEdit(r)}>编辑</Button>
                   <Popconfirm title="确认删除该仓库？" onConfirm={()=>remove(r)} okText="删除" cancelText="取消">
                     <Button size="small" danger style={{ marginLeft: 8 }}>删除</Button>
                   </Popconfirm>
                 </div>
               ) }
             ]}
      />
      <Modal title={editing && editing.id!==0 ? '编辑仓库' : '新增仓库'} open={!!editing} onOk={save} onCancel={()=>setEditing(null)} destroyOnHidden>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="address" label="地址">
            <Input />
          </Form.Item>
          <Form.Item name="contactName" label="联系人">
            <Input />
          </Form.Item>
          <Form.Item name="contactPhone" label="电话" rules={[{ validator: (_, v) => { if (!v) return Promise.resolve(); return /^1[3-9]\d{9}$/.test(v) ? Promise.resolve() : Promise.reject(new Error('联系电话格式不正确')); } }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}
