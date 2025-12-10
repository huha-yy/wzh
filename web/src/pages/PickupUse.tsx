import { Button, Card, Input, message, Table, Tag, InputNumber, Space } from 'antd'
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
  const [count, setCount] = useState<number>(5)
  const { hasAnyRole } = useAuthStore()
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
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
      <Card title="领取交付" style={{ maxWidth: 640 }}>
        <Input placeholder="请输入领取码" value={code} onChange={e=>setCode(e.target.value)} onPressEnter={submit} />
        <div style={{ marginTop: 12 }}>
          <Button type="primary" onClick={submit} loading={loading}>使用领取码</Button>
        </div>
      </Card>
      <Card title="订单领取码管理" extra={hasAnyRole(['admin','maintainer']) ? <Space><InputNumber min={1} placeholder="订单ID" value={orderId ?? undefined} onChange={v => setOrderId(Number(v))} /> <Button onClick={triggerLoad}>加载</Button> <InputNumber min={1} value={count} onChange={v => setCount(Number(v))} /> <Button type="primary" onClick={batch}>批量生成</Button></Space> : undefined}>
        <Table rowKey="id" dataSource={codes} pagination={false} columns={[
          { title: '领取码', dataIndex: 'code' },
          { title: '有效期', dataIndex: 'expireAt' },
          { title: '状态', dataIndex: 'status', render: (s:number) => <Tag color={s===1?'green':s===0?'blue':'red'}>{s===1?'已使用':s===0?'未使用':'过期'}</Tag> },
          { title: '使用时间', dataIndex: 'usedAt' },
          { title: '操作', render: (_:any, r:any) => (hasAnyRole(['admin','maintainer']) && r.status===0 ? <Button type="primary" onClick={()=>useCode(r.code)}>使用领取码</Button> : null) }
        ]} />
      </Card>
    </div>
  )
}
