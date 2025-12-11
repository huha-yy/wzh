import { Button, Card, Input, message, Table, Tag, InputNumber, Space, Select, Switch, Form } from 'antd'
import { useState, useEffect } from 'react'
import http from '../api/http'
import { useNavigate, useSearchParams, useParams } from 'react-router-dom'
import { useAuthStore } from '../store/auth'

export default function PickupUse() {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { orderId: orderIdParam } = useParams()
  const initialOrderId = orderIdParam ? Number(orderIdParam) : (searchParams.get('orderId') ? Number(searchParams.get('orderId')) : null)
  const [orderId, setOrderId] = useState<number | null>(initialOrderId)
  const [codes, setCodes] = useState<any[]>([])
  const [allCodes, setAllCodes] = useState<any[]>([])
  const [allTotal, setAllTotal] = useState(0)
  const [allPage, setAllPage] = useState(1)
  const [codesLoading, setCodesLoading] = useState(false)
  const [filterForm] = Form.useForm()
  const [count, setCount] = useState<number>(5)
  const { hasAnyRole } = useAuthStore()
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [orderOptions, setOrderOptions] = useState<any[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const submit = async () => {
    if (!code || code.length < 6) { message.error('请输入有效领取码'); return }
    try {
      setLoading(true)
      const res = await http.post(`/orders/pickup/${code}/use`)
      message.success(`领取成功，订单 ${res.data?.data?.id} 状态已更新`)
      setCode('')
      setTimeout(() => navigate('/orders'), 300)
    } catch (e: any) {
      const msg = e?.response?.data?.message || e.message
      message.error(msg || '领取失败')
    } finally {
      setLoading(false)
    }
  }
  const loadCodes = async (id: number) => {
    try {
      const res = await http.get(`/orders/${id}/pickup-codes`)
      setCodes(res.data.data || [])
    } catch (e: any) {
      const msg = e?.response?.data?.message || e.message
      message.error(msg || '加载领取码失败')
    }
  }
  const triggerLoad = async () => {
    if (!orderId) { message.error('请输入订单ID'); return }
    await loadCodes(orderId)
  }
  const batch = async () => {
    if (!orderId) { message.error('请输入订单ID'); return }
    try {
      await http.post(`/orders/${orderId}/pickup-codes/batch`, null, { params: { count, expireDays: 2 } })
      message.success('批量生成成功')
      await loadCodes(orderId)
    } catch (e: any) { const msg = e?.response?.data?.message || e.message; message.error(msg || '生成失败') }
  }
  const useCode = async (c: string) => {
    try {
      const res = await http.post(`/orders/pickup/${c}/use`)
      message.success(`领取成功，订单 ${res.data?.data?.id} 状态已更新`)
      if (orderId) await loadCodes(orderId)
      setTimeout(() => navigate('/orders'), 300)
    } catch (e: any) {
      const msg = e?.response?.data?.message || e.message
      message.error(msg || '领取失败')
    }
  }

  useEffect(() => {
    if (orderId) {
      loadCodes(orderId)
    }
  }, [orderId])

  const loadAllCodes = async (p:number) => {
    try {
      setCodesLoading(true)
      const vals = filterForm.getFieldsValue()
      const params:any = { page: p, size: 10 }
      if (vals.status !== undefined) params.status = vals.status
      if (vals.onlyValid) params.onlyValid = true
      if (vals.orderId) params.orderId = vals.orderId
      const res = await http.get('/orders/pickup-codes', { params })
      setAllCodes(res.data.data?.records || [])
      setAllTotal(res.data.data?.total || 0)
      setAllPage(p)
    } catch {} finally { setCodesLoading(false) }
  }
  useEffect(() => { filterForm.setFieldsValue({ status: 0, onlyValid: true }); loadAllCodes(1) }, [])

  useEffect(() => {
    const loadRecentOrders = async () => {
      try {
        setOrdersLoading(true)
        const res = await http.get('/orders', { params: { page: 1, size: 50, status: 1 } })
        const recs = res.data.data?.records || []
        setRecentOrders(recs)
        setOrderOptions(recs.map((o:any)=>({ value: o.id, label: `订单${o.id} / 用户${o.userId} / ${o.createdAt}` })))
        if (!orderId && recs.length > 0) {
          setOrderId(recs[0].id)
        }
      } catch {}
      finally { setOrdersLoading(false) }
    }
    loadRecentOrders()
  }, [])
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
      <Card title="领取交付" style={{ maxWidth: 640 }}>
        <Input placeholder="请输入领取码" value={code} onChange={e=>setCode(e.target.value)} onPressEnter={submit} />
        <div style={{ marginTop: 12 }}>
          <Button type="primary" onClick={submit} loading={loading}>使用领取码</Button>
        </div>
      </Card>
      <Card title="订单领取码管理" extra={hasAnyRole(['admin','maintainer']) ? (
        <Space>
          <Select loading={ordersLoading} style={{ minWidth: 280 }} placeholder="选择近期已通过订单" options={orderOptions} value={orderId as any} onChange={(v)=>setOrderId(Number(v))} />
          <Button onClick={triggerLoad}>刷新</Button>
          <InputNumber min={1} value={count} onChange={v => setCount(Number(v))} />
          <Button type="primary" onClick={batch}>批量生成</Button>
        </Space>
      ) : undefined}>
        <Table rowKey="id" dataSource={codes} pagination={false} columns={[
          { title: '领取码', dataIndex: 'code' },
          { title: '有效期', dataIndex: 'expireAt' },
          { title: '状态', render: (_:any, r:any) => {
            const expired = r.expireAt && new Date(r.expireAt).getTime() < Date.now()
            const used = r.status === 1
            const color = used ? 'green' : expired ? 'red' : 'blue'
            const text = used ? '已使用' : expired ? '已过期' : '未使用'
            return <Tag color={color}>{text}</Tag>
          } },
          { title: '使用时间', dataIndex: 'usedAt' },
          { title: '操作', render: (_:any, r:any) => {
            const expired = r.expireAt && new Date(r.expireAt).getTime() < Date.now()
            return (hasAnyRole(['admin','maintainer']) && r.status===0 && !expired) ? <Button type="primary" onClick={()=>useCode(r.code)}>使用领取码</Button> : null
          } }
        ]} />
        {hasAnyRole(['admin','maintainer']) && orderId && codes.length === 0 && (
          <div style={{ marginTop: 12 }}>
            <Button type="primary" onClick={batch}>为该订单生成 {count} 个领取码</Button>
          </div>
        )}
      </Card>
      <Card title="全部领取码">
        <Form form={filterForm} layout="inline" onFinish={()=>loadAllCodes(1)} style={{ marginBottom: 12 }}>
          <Form.Item name="status" label="状态">
            <Select allowClear style={{ width: 150 }} options={[{value:0,label:'未使用'},{value:1,label:'已使用'}]} />
          </Form.Item>
          <Form.Item name="onlyValid" valuePropName="checked">
            <Switch checkedChildren="仅未过期" unCheckedChildren="含过期" />
          </Form.Item>
          <Form.Item name="orderId" label="订单ID">
            <InputNumber min={1} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">查询</Button>
          </Form.Item>
        </Form>
        <Table rowKey="id" dataSource={allCodes} loading={codesLoading} pagination={{ current: allPage, pageSize: 10, total: allTotal, onChange: loadAllCodes }} columns={[
          { title: '订单ID', dataIndex: 'orderId' },
          { title: '领取码', dataIndex: 'code' },
          { title: '有效期', dataIndex: 'expireAt' },
          { title: '状态', render: (_:any, r:any) => {
            const expired = r.expireAt && new Date(r.expireAt).getTime() < Date.now()
            const used = r.status === 1
            const color = used ? 'green' : expired ? 'red' : 'blue'
            const text = used ? '已使用' : expired ? '已过期' : '未使用'
            return <Tag color={color}>{text}</Tag>
          } },
          { title: '使用时间', dataIndex: 'usedAt' },
          { title: '操作', render: (_:any, r:any) => {
            const expired = r.expireAt && new Date(r.expireAt).getTime() < Date.now()
            return (hasAnyRole(['admin','maintainer']) && r.status===0 && !expired) ? <Button onClick={()=>useCode(r.code)} type="primary">使用领取码</Button> : null
          } }
        ]} />
      </Card>
    </div>
  )
}
