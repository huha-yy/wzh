import { useEffect, useState } from 'react'
import { Button, Card, Form, Input, Modal, Select, Table, message, Popconfirm } from 'antd'
import http from '../api/http'

type Category = { id: number; name: string; parentId?: number; description?: string }

export default function AdminCategories() {
  const [data, setData] = useState<Category[]>([])
  const [editing, setEditing] = useState<Category | null>(null)
  const [form] = Form.useForm()
  const fetch = async () => {
    const res = await http.get('/categories')
    setData(res.data.data || [])
  }
  useEffect(() => { fetch() }, [])
  const openEdit = (c?: Category) => {
    setEditing(c || { id: 0, name: '' })
    form.setFieldsValue(c || { name: '', parentId: undefined, description: '' })
  }
  const save = async () => {
    try {
      const vals = await form.validateFields()
      if (!editing) return
      if (editing.id && editing.id !== 0) {
        const res = await http.put(`/categories/${editing.id}`, vals)
        if (!res.data || res.data.code !== 0) { message.error(res.data?.message || '保存失败'); return }
      } else {
        const res = await http.post('/categories', vals)
        if (!res.data || res.data.code !== 0) { message.error(res.data?.message || '保存失败'); return }
      }
      message.success('保存成功')
      setEditing(null)
      fetch()
    } catch (e: any) { message.error(e?.response?.data?.message || e.message || '保存失败') }
  }
  const remove = async (c: Category) => {
    try {
      const res = await http.delete(`/categories/${c.id}`)
      if (!res.data || res.data.code !== 0) { message.error(res.data?.message || '删除失败'); return }
      message.success('已删除')
      fetch()
    } catch (e: any) { message.error(e?.response?.data?.message || e.message || '删除失败') }
  }
  const parentOptions = data.map(d => ({ value: d.id, label: d.name }))
  return (
    <Card title="分类管理" extra={<Button type="primary" onClick={()=>openEdit()}>新增分类</Button>}>
      <Table rowKey="id" dataSource={data} pagination={false}
             columns={[
               { title: '名称', dataIndex: 'name' },
               { title: '父级', dataIndex: 'parentId', render: (pid?:number) => (pid ? (data.find(d => d.id === pid)?.name || '-') : '-') },
               { title: '描述', dataIndex: 'description' },
               { title: '操作', render: (_:any, r:Category) => (
                 <div>
                   <Button size="small" onClick={()=>openEdit(r)}>编辑</Button>
                   <Popconfirm title="确认删除该分类？" onConfirm={()=>remove(r)} okText="删除" cancelText="取消">
                     <Button size="small" danger style={{ marginLeft: 8 }}>删除</Button>
                   </Popconfirm>
                 </div>
               ) }
             ]}
      />
      <Modal title={editing && editing.id!==0 ? '编辑分类' : '新增分类'} open={!!editing} onOk={save} onCancel={()=>setEditing(null)} destroyOnHidden>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="parentId" label="父级分类">
            <Select allowClear options={parentOptions} />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}
