import { Button, Card, DatePicker, Form, InputNumber, Select, Table, Tag, Drawer, message, Descriptions, Divider, Space, Modal, Input } from 'antd'
import http from '../api/http'
import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/auth'

type Order = { id: number; userId: number; status: number; totalAmount: number; createdAt: string }
type OrderItem = { id: number; toolId: number; quantity: number; rentalDays: number; amount: number }
type PickupCode = { id: number; code: string; status: number; expireAt: string; usedAt?: string }

export default function Orders() {
  const [form] = Form.useForm()
  const [data, setData] = useState<Order[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [detail, setDetail] = useState<any>(null)
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [scheduleOrderId, setScheduleOrderId] = useState<number | null>(null)
  const [scheduleAt, setScheduleAt] = useState<any>(null)
  const [scheduleInspectorId, setScheduleInspectorId] = useState<number | null>(null)
  const [scheduleNote, setScheduleNote] = useState<string>('')
  const [inspectors, setInspectors] = useState<any[]>([])
  const statusMap: any = { 0: '待审核', 1: '已通过', 2: '已领取', 3: '已申请归还', 4: '已安排验收', 5: '已完成', 6: '已取消' }
  const userProfile = useAuthStore(s => s.userProfile)
  const { hasAnyRole, hasRole } = useAuthStore()

  const fetch = async (p = 1) => {
    setLoading(true)
    const vals = form.getFieldsValue()
    const [start, end] = vals.range || []
    const res = await http.get('/orders', {
      params: {
        page: p,
        size: 20,
        startDate: start ? start.toISOString().slice(0, 19) : undefined,
        endDate: end ? end.toISOString().slice(0, 19) : undefined,
        status: vals.status,
        userId: vals.userId
      }
    })
    setData(res.data.data.records || [])
    setTotal(res.data.data.total || 0)
    setPage(p)
    setLoading(false)
  }

  useEffect(() => { fetch(1) }, [])

  const openDetail = async (id: number) => {
    const res = await http.get(`/orders/${id}`)
    setDetail(res.data.data)
  }

  const approve = async (id: number) => {
    try {
      await http.post(`/orders/${id}/approve`)
      message.success('审核通过，已生成领取码')
      fetch(page)
    } catch (e: any) {
      const msg = e?.response?.data?.message || e.message
      message.error(msg || '审核失败')
    }
  }

  const exportExcel = async () => {
    const vals = form.getFieldsValue()
    const [start, end] = vals.range || []
    const res = await http.get('/orders/export', {
      params: {
        startDate: start ? start.toISOString().slice(0, 19) : undefined,
        endDate: end ? end.toISOString().slice(0, 19) : undefined,
        status: vals.status,
        userId: vals.userId
      },
      responseType: 'blob'
    })
    const url = window.URL.createObjectURL(res.data)
    const a = document.createElement('a')
    a.href = url
    a.download = 'orders.xlsx'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const applyReturn = async (id: number) => {
    try {
      await http.post(`/orders/${id}/apply-return`)
      message.success('已申请归还')
      fetch(page)
    } catch (e: any) {
      const msg = e?.response?.data?.message || e.message
      message.error(msg || '操作失败')
    }
  }

  const scheduleInspection = async (id: number) => {
    setScheduleOrderId(id)
    setScheduleAt(null)
    setScheduleOpen(true)
    if (hasRole('admin')) {
      try {
        const res = await http.get('/admin/users', { params: { page: 1, size: 100, status: 1 } })
        const list = (res.data.data.records || []).filter((u:any)=>Array.isArray(u.roles) && (u.roles.includes('maintainer') || u.roles.includes('admin')))
        setInspectors(list.map((u:any)=>({ value: u.id, label: u.realName || u.username })))
      } catch {}
    }
  }

  const doSchedule = async () => {
    if (!scheduleOrderId) { setScheduleOpen(false); return }
    try {
      const t = scheduleAt ? scheduleAt.toISOString().slice(0,19) : new Date().toISOString().slice(0,19)
      const params:any = { scheduledAt: t }
      if (hasRole('admin')) {
        if (!scheduleInspectorId) { message.error('请选择验收责任人'); return }
        params.inspectorId = scheduleInspectorId
      }
      if (scheduleNote && scheduleNote.trim().length > 0) params.note = scheduleNote.trim()
      await http.post(`/maintenance/orders/${scheduleOrderId}/schedule`, null, { params })
      message.success('已安排验收')
      setScheduleOpen(false)
      setScheduleOrderId(null)
      setScheduleInspectorId(null)
      setScheduleNote('')
      fetch(page)
    } catch (e: any) {
      const msg = e?.response?.data?.message || e.message
      message.error(msg || '操作失败')
    }
  }

  const acceptItem = async (itemId: number, qualified: boolean) => {
    try {
      await http.post(`/maintenance/inspection/complete`, { orderItemId: itemId, qualified })
      message.success(qualified ? '验收合格' : '验收不合格')
      if (detail) openDetail(detail.order.id)
      fetch(page)
    } catch (e: any) {
      const msg = e?.response?.data?.message || e.message
      message.error(msg || '操作失败')
    }
  }

  const cancelOrder = async (id: number) => {
    try {
      await http.post(`/orders/${id}/cancel`)
      message.success('订单已取消')
      fetch(page)
    } catch (e: any) {
      const msg = e?.response?.data?.message || e.message
      message.error(msg || '操作失败')
    }
  }

  return (
    <Card title="订单列表" extra={hasRole('admin') ? <Button onClick={exportExcel}>导出Excel</Button> : undefined}>
      <Form form={form} layout="inline" onFinish={() => fetch(1)}>
        <Form.Item name="range" label="日期范围">
          <DatePicker.RangePicker showTime />
        </Form.Item>
        <Form.Item name="status" label="状态">
          <Select allowClear style={{ width: 150 }} options={[0,1,2,3,4,5,6].map(v=>({value:v,label:statusMap[v]}))} />
        </Form.Item>
        <Form.Item name="userId" label="用户ID">
          <InputNumber min={1} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">查询</Button>
        </Form.Item>
      </Form>
      <Table rowKey="id" loading={loading} dataSource={data} pagination={{ current: page, pageSize: 20, total, onChange: fetch }}
             columns={[
               { title: '订单ID', dataIndex: 'id' },
               { title: '用户ID', dataIndex: 'userId' },
               { title: '状态', dataIndex: 'status', render: (s:number) => <Tag>{statusMap[s]}</Tag> },
               { title: '金额', dataIndex: 'totalAmount' },
               { title: '创建时间', dataIndex: 'createdAt' },
              { title: '操作', render: (_:any, r:Order) => (
                <div>
                  <Button onClick={() => openDetail(r.id)}>详情</Button>
                  
                  {hasAnyRole(['admin','maintainer']) && r.status === 1 && (
                    <Button style={{ marginLeft: 8 }} onClick={() => window.location.href = `/pickup/use`}>领取交付</Button>
                  )}
                  {hasAnyRole(['admin','maintainer']) && r.status === 3 && (
                    <Button style={{ marginLeft: 8 }} onClick={() => scheduleInspection(r.id)}>安排验收</Button>
                  )}
                  {hasAnyRole(['admin','maintainer']) && r.status === 0 && (
                    <Button type="primary" style={{ marginLeft: 8 }} onClick={() => approve(r.id)}>审核通过并生成码</Button>
                  )}
                </div>
              ) }
             ]} />
      <Drawer open={!!detail} onClose={() => setDetail(null)} width={720} title="订单详情">
        {detail && (
          <div>
            <Descriptions bordered size="small" column={2} style={{ marginBottom: 12 }}>
              <Descriptions.Item label="订单ID">{detail.order.id}</Descriptions.Item>
              <Descriptions.Item label="状态"><Tag>{statusMap[detail.order.status]}</Tag></Descriptions.Item>
              <Descriptions.Item label="金额">{detail.order.totalAmount}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{detail.order.createdAt}</Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">明细</Divider>
            <Table
              size="small"
              rowKey="id"
              pagination={false}
              dataSource={detail.items as OrderItem[]}
              columns={[
                { title: '工具ID', dataIndex: 'toolId' },
                { title: '数量', dataIndex: 'quantity' },
                { title: '天数', dataIndex: 'rentalDays' },
                { title: '金额', dataIndex: 'amount' },
                { title: '操作', render: (_:any, i:OrderItem) => (
                  hasAnyRole(['admin','maintainer']) && detail.order.status === 4 ? (
                    <Space size={8}>
                      <Button size="small" onClick={() => acceptItem(i.id, true)}>验收合格</Button>
                      <Button size="small" danger onClick={() => acceptItem(i.id, false)}>验收不合格</Button>
                    </Space>
                  ) : null
                ) }
              ]}
            />

            <Divider orientation="left">领取码</Divider>
            <Table
              size="small"
              rowKey="id"
              pagination={false}
              dataSource={detail.codes as PickupCode[]}
              columns={[
                { title: '领取码', dataIndex: 'code' },
                { title: '有效期', dataIndex: 'expireAt' },
                { title: '状态', dataIndex: 'status', render: (s:number) => <Tag color={s===1?'green':s===0?'blue':'red'}>{s===1?'已使用':s===0?'未使用':'过期'}</Tag> },
                { title: '使用时间', dataIndex: 'usedAt' }
              ]}
            />

            <Divider />
            <Space>
              {hasAnyRole(['admin','maintainer']) && detail.order.status === 0 && (
                <Button type="primary" onClick={() => approve(detail.order.id)}>审核通过并生成码</Button>
              )}
              {hasAnyRole(['admin','resident']) && detail.order.status === 2 && (
                <Button onClick={() => applyReturn(detail.order.id)}>申请归还</Button>
              )}
              {hasAnyRole(['admin','maintainer']) && detail.order.status === 3 && (
                <Button onClick={() => scheduleInspection(detail.order.id)}>安排验收</Button>
              )}
              {hasAnyRole(['admin','resident']) && (detail.order.status === 0 || detail.order.status === 1) && (
                <Button danger onClick={() => cancelOrder(detail.order.id)}>取消订单</Button>
              )}
            </Space>
          </div>
        )}
      </Drawer>
      <Modal title="安排验收" open={scheduleOpen} onOk={doSchedule} onCancel={() => setScheduleOpen(false)} destroyOnClose>
        <Form layout="vertical">
          <Form.Item label="验收时间">
            <DatePicker showTime style={{ width: '100%' }} value={scheduleAt} onChange={v => setScheduleAt(v)} />
          </Form.Item>
          {hasRole('admin') && (
            <Form.Item label="验收责任人">
              <Select options={inspectors} placeholder="请选择验收责任人" value={scheduleInspectorId as any} onChange={(v)=>setScheduleInspectorId(Number(v))} />
            </Form.Item>
          )}
          <Form.Item label="备注">
            <Input.TextArea rows={3} placeholder="可填写验收说明或注意事项" value={scheduleNote} onChange={e=>setScheduleNote(e.target.value)} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}

