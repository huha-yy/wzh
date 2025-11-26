import { Button, Card, DatePicker, Form, InputNumber, Select, Table, Tag, Drawer } from 'antd'
import http from '../api/http'
import { useEffect, useState } from 'react'

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
  const statusMap: any = { 0: '待审核', 1: '已通过', 2: '已领取', 3: '已申请归还', 4: '已安排验收', 5: '已完成', 6: '已取消' }

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

  return (
    <Card title="订单列表" extra={<Button onClick={exportExcel}>导出Excel</Button>}>
      <Form form={form} layout="inline" onFinish={() => fetch(1)}>
        <Form.Item name="range" label="日期范围"> <DatePicker.RangePicker showTime /> </Form.Item>
        <Form.Item name="status" label="状态"> <Select allowClear style={{ width: 150 }} options={[0,1,2,3,4,5,6].map(v=>({value:v,label:statusMap[v]}))} /> </Form.Item>
        <Form.Item name="userId" label="用户ID"> <InputNumber min={1} /> </Form.Item>
        <Form.Item> <Button type="primary" htmlType="submit">查询</Button> </Form.Item>
      </Form>
      <Table rowKey="id" loading={loading} dataSource={data} pagination={{ current: page, pageSize: 20, total, onChange: fetch }}
             columns={[{ title: '订单ID', dataIndex: 'id' }, { title: '用户ID', dataIndex: 'userId' }, { title: '状态', dataIndex: 'status', render: (s:number) => <Tag>{statusMap[s]}</Tag> }, { title: '金额', dataIndex: 'totalAmount' }, { title: '创建时间', dataIndex: 'createdAt' }, { title: '操作', render: (_, r) => <Button onClick={() => openDetail(r.id)}>详情</Button> }]} />
      <Drawer open={!!detail} onClose={() => setDetail(null)} width={600} title="订单详情">
        {detail && (
          <div>
            <p>订单ID：{detail.order.id}</p>
            <p>状态：{statusMap[detail.order.status]}</p>
            <p>金额：{detail.order.totalAmount}</p>
            <h4>明细</h4>
            {(detail.items as OrderItem[]).map(i => (<p key={i.id}>工具ID:{i.toolId} 数量:{i.quantity} 天数:{i.rentalDays} 金额:{i.amount}</p>))}
            <h4>领取码</h4>
            {(detail.codes as PickupCode[]).map(c => (<p key={c.id}>码:{c.code} 状态:{c.status===1?'已使用':c.status===0?'未使用':'过期'} 有效期:{c.expireAt}</p>))}
            <Button type="link" onClick={() => window.location.href = `/orders/${detail.order.id}/codes`}>领取码管理</Button>
          </div>
        )}
      </Drawer>
    </Card>
  )
}

