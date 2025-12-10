import { Button, Card, InputNumber, message, Table, Tag } from 'antd'
import http from '../api/http'
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'

type Code = { id: number; code: string; status: number; expireAt: string; usedAt?: string }

export default function PickupCodes() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState<Code[]>([])
  const [count, setCount] = useState<number>(5)
  const { hasAnyRole } = useAuthStore()
  const load = async () => {
    const res = await http.get(`/orders/${id}/pickup-codes`)
    setData(res.data.data || [])
  }
  useEffect(() => { load(); const t = setInterval(load, 8000); return () => clearInterval(t) }, [id])
  const batch = async () => {
    try {
      await http.post(`/orders/${id}/pickup-codes/batch`, null, { params: { count, expireDays: 2 } })
      message.success('批量生成成功')
      load()
    } catch (e: any) { message.error(e.message || '生成失败') }
  }
  const useCode = async (code: string) => {
    try {
      const res = await http.post(`/orders/pickup/${code}/use`)
      message.success(`领取成功，订单 ${res.data?.data?.id} 状态已更新`)
      load()
      setTimeout(() => navigate('/orders'), 300)
    } catch (e: any) {
      const msg = e?.response?.data?.message || e.message
      message.error(msg || '领取失败')
    }
  }
  return (
    <Card title={`订单 ${id} 领取码`} extra={hasAnyRole(['admin','maintainer']) ? (<div><InputNumber min={1} value={count} onChange={v => setCount(Number(v))} /> <Button onClick={batch} type="primary" style={{ marginLeft: 8 }}>批量生成</Button></div>) : undefined}>
      <Table rowKey="id" dataSource={data} pagination={false} columns={[
        { title: '领取码', dataIndex: 'code' },
        { title: '有效期', dataIndex: 'expireAt' },
        { title: '状态', dataIndex: 'status', render: (s:number) => <Tag color={s===1?'green':s===0?'blue':'red'}>{s===1?'已使用':s===0?'未使用':'过期'}</Tag> },
        { title: '使用时间', dataIndex: 'usedAt' },
        { title: '操作', render: (_:any, r:Code) => (hasAnyRole(['admin','maintainer']) && r.status===0 ? <Button type="primary" onClick={()=>useCode(r.code)}>使用领取码</Button> : null) }
      ]} />
    </Card>
  )
}
