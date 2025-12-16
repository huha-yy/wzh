import { Card, Table, Form, Select, DatePicker, InputNumber, Button, Space, Modal, Input, Tag, message } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import http from '../api/http'
import { useAuthStore } from '../store/auth'

type MaintRecord = {
  id?: number
  toolId?: number
  orderItemId?: number
  type?: number
  result?: number
  title?: string
  description?: string
  handledBy?: number
  scheduledAt?: string
  completedAt?: string
}

export default function MaintenanceDashboard() {
  const userProfile = useAuthStore(s => s.userProfile)
  const { hasAnyRole } = useAuthStore()
  const [form] = Form.useForm()
  const [data, setData] = useState<MaintRecord[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<any[]>([])
  const [userMap, setUserMap] = useState<Record<number, string>>({})
  const [addOpen, setAddOpen] = useState(false)
  const [addForm] = Form.useForm()
  const [completeOpen, setCompleteOpen] = useState(false)
  const [completeForm] = Form.useForm()
  const [currentRecord, setCurrentRecord] = useState<MaintRecord | null>(null)

  const canManage = hasAnyRole(['admin', 'maintainer'])

  const typeOptions = [
    { value: 1, label: '巡检' },
    { value: 2, label: '维修' },
    { value: 3, label: '保养' }
  ]

  const resultOptionsByType: Record<number, { value: number; label: string }[]> = useMemo(() => ({
    1: [
      { value: 1, label: '合格' },
      { value: 2, label: '不合格' }
    ],
    2: [
      { value: 3, label: '已修复' }
    ],
    3: [
      { value: 1, label: '合格' }
    ]
  }), [])

  const loadUsers = async () => {
    try {
      const res = await http.get('/admin/users', { params: { page: 1, size: 200, status: 1 } })
      const recs = res.data.data?.records || []
      const list = recs.filter((u:any)=>Array.isArray(u.roles) && (u.roles.includes('maintainer') || u.roles.includes('admin')))
      setUsers(list.map((u:any)=>({ value: u.id, label: u.realName || u.username })))
      const map:Record<number,string> = {}
      list.forEach((u:any)=>{ map[u.id] = u.realName || u.username })
      setUserMap(map)
    } catch {}
  }

  const fetch = async (p=1) => {
    setLoading(true)
    const vals = form.getFieldsValue()
    const [start, end] = vals.range || []
    const params:any = { page: p, size: 10 }
    if (vals.type) params.type = vals.type
    if (vals.toolId) params.toolId = vals.toolId
    if (vals.orderId) params.orderId = vals.orderId
    if (vals.handledBy) params.handledBy = vals.handledBy
    if (start) params.start = start.toISOString().slice(0,19)
    if (end) params.end = end.toISOString().slice(0,19)
    const res = await http.get('/maintenance/records', { params })
    let records:MaintRecord[] = res.data.data?.records || []
    if (vals.onlyUncompleted) {
      records = records.filter(r => !r.completedAt)
    }
    setData(records)
    setTotal(res.data.data?.total || 0)
    setPage(p)
    setLoading(false)
  }

  useEffect(() => {
    loadUsers()
    // 不自动设置默认查询条件，显示全部数据
    fetch(1)
  }, [userProfile])

  const openAdd = () => {
    setAddOpen(true)
    const defaults:any = {}
    if (userProfile?.id) defaults.handledBy = userProfile.id
    defaults.type = 1
    addForm.setFieldsValue(defaults)
  }
  const submitAdd = async () => {
    const vals = await addForm.validateFields()
    const body:MaintRecord = {
      toolId: vals.toolId ? Number(vals.toolId) : undefined,
      orderItemId: vals.orderItemId ? Number(vals.orderItemId) : undefined,
      type: Number(vals.type),
      title: vals.title || (vals.type===2 ? 'repair' : vals.type===3 ? 'maintain' : 'inspection'),
      description: vals.description,
      handledBy: vals.handledBy ? Number(vals.handledBy) : (userProfile ? userProfile.id : undefined),
      scheduledAt: vals.scheduledAt ? vals.scheduledAt.toISOString().slice(0,19) : undefined
    }
    try {
      await http.post('/maintenance', body)
      message.success('创建成功')
      setAddOpen(false)
      fetch(page)
    } catch (e:any) {
      const msg = e?.response?.data?.message || e.message
      message.error(msg || '创建失败')
    }
  }

  const openComplete = (r:MaintRecord) => {
    setCurrentRecord(r)
    setCompleteOpen(true)
  }
  useEffect(() => {
    if (!addOpen) {
      addForm.resetFields()
    }
  }, [addOpen])
  useEffect(() => {
    if (completeOpen) {
      completeForm.resetFields()
    }
  }, [completeOpen])
  const submitComplete = async () => {
    if (!currentRecord) { setCompleteOpen(false); return }
    const vals = await completeForm.validateFields()
    const body:MaintRecord = {
      toolId: currentRecord.toolId,
      orderItemId: currentRecord.orderItemId,
      type: currentRecord.type,
      result: Number(vals.result),
      title: currentRecord.type===2 ? 'repair-complete' : currentRecord.type===3 ? 'maintain-complete' : 'inspection-complete',
      description: vals.note,
      handledBy: currentRecord.handledBy || (userProfile ? userProfile.id : undefined),
      completedAt: new Date().toISOString().slice(0,19)
    }
    try {
      await http.post('/maintenance', body)
      message.success('已标记完成')
      setCompleteOpen(false)
      setCurrentRecord(null)
      fetch(page)
    } catch (e:any) {
      const msg = e?.response?.data?.message || e.message
      message.error(msg || '操作失败')
    }
  }

  const handleDelete = (r:MaintRecord) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除这条维护记录吗？删除后无法恢复。`,
      okText: '确认',
      cancelText: '取消',
      okType: 'danger',
      onOk: async () => {
        try {
          await http.delete(`/maintenance/records/${r.id}`)
          message.success('删除成功')
          fetch(page)
        } catch (e:any) {
          const msg = e?.response?.data?.message || e.message
          message.error(msg || '删除失败')
        }
      }
    })
  }

  return (
    <div>
      <Card title="维护工作台" extra={canManage ? <Button type="primary" onClick={openAdd}>新增维护记录</Button> : undefined}>
        <Form form={form} layout="inline" onFinish={() => fetch(1)} style={{ marginBottom: 12 }}>
          <Form.Item name="type" label="类型">
            <Select allowClear style={{ width: 150 }} options={typeOptions} />
          </Form.Item>
          <Form.Item name="handledBy" label="责任人">
            <Select allowClear options={users} style={{ width: 180 }} />
          </Form.Item>
          <Form.Item name="toolId" label="工具ID">
            <InputNumber min={1} style={{ width: 150 }} />
          </Form.Item>
          <Form.Item name="orderId" label="订单ID">
            <InputNumber min={1} style={{ width: 150 }} />
          </Form.Item>
          <Form.Item name="range" label="时间范围">
            <DatePicker.RangePicker showTime />
          </Form.Item>
          <Form.Item name="onlyUncompleted" label="状态">
            <Select style={{ width: 150 }} options={[{value:true,label:'仅未完成'},{value:false,label:'全部'}]} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">查询</Button>
          </Form.Item>
        </Form>
        <Table rowKey="id" dataSource={data} loading={loading} pagination={{ current: page, pageSize: 10, total, onChange: fetch }}
               columns={[
                 { title: '标题', dataIndex: 'title' },
                 { title: '类型', dataIndex: 'type', render: (t:number) => ({1:'巡检',2:'维修',3:'保养'}[t]||t) },
                 { title: '结果', dataIndex: 'result', render: (r:number) => r ? ({1:'合格',2:'不合格',3:'已修复'}[r]||r) : '-' },
                 { title: '工具ID', dataIndex: 'toolId' },
                 { title: '明细ID', dataIndex: 'orderItemId' },
                 { title: '责任人', dataIndex: 'handledBy', render: (id:number) => (id && userMap[id]) ? userMap[id] : (id || '-') },
                 { title: '计划时间', dataIndex: 'scheduledAt' },
                 { title: '完成时间', dataIndex: 'completedAt' },
                 { title: '状态', render: (_:any, r:MaintRecord) => <Tag color={r.completedAt ? 'green' : 'gold'}>{r.completedAt ? '已完成' : '未完成'}</Tag> },
                 { title: '操作', render: (_:any, r:MaintRecord) => (
                   <Space size={8}>
                     {canManage && !r.completedAt ? <Button onClick={() => openComplete(r)} type="primary">标记完成</Button> : null}
                     {canManage ? <Button onClick={() => handleDelete(r)} danger>删除</Button> : null}
                   </Space>
                 ) }
               ]}
        />
      </Card>

      <Modal open={addOpen} title="新增维护记录" onOk={submitAdd} onCancel={() => setAddOpen(false)} destroyOnHidden>
        <Form form={addForm} layout="vertical">
          <Form.Item name="type" label="类型" rules={[{ required: true }]}>
            <Select options={typeOptions} />
          </Form.Item>
          <Form.Item name="toolId" label="工具ID">
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="orderItemId" label="订单明细ID">
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="handledBy" label="责任人">
            <Select allowClear options={users} />
          </Form.Item>
          <Form.Item name="scheduledAt" label="计划时间">
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="title" label="标题">
            <Input />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal open={completeOpen} title="标记完成" onOk={submitComplete} onCancel={() => setCompleteOpen(false)} destroyOnHidden>
        <Form form={completeForm} layout="vertical">
          <Form.Item name="result" label="结果" rules={[{ required: true }]}>
            <Select options={currentRecord?.type ? (resultOptionsByType[currentRecord.type] || []) : []} />
          </Form.Item>
          <Form.Item name="note" label="备注">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
