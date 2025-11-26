import { Button, Card, InputNumber, message, Table, Tag } from 'antd'
import http from '../api/http'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

type Code = { id: number; code: string; status: number; expireAt: string; usedAt?: string }

export default function PickupCodes() {
  const { id } = useParams()
  const [data, setData] = useState<Code[]>([])
  const [count, setCount] = useState<number>(5)
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
  return (
    <Card title={`订单 ${id} 领取码`} extra={<div><InputNumber min={1} value={count} onChange={v => setCount(Number(v))} /> <Button onClick={batch} type="primary" style={{ marginLeft: 8 }}>批量生成</Button></div>}>
      <Table rowKey="id" dataSource={data} pagination={false} columns={[{ title: '领取码', dataIndex: 'code' }, { title: '有效期', dataIndex: 'expireAt' }, { title: '状态', dataIndex: 'status', render: (s:number) => <Tag color={s===1?'green':s===0?'blue':'red'}>{s===1?'已使用':s===0?'未使用':'过期'}</Tag> }, { title: '使用时间', dataIndex: 'usedAt' }]} />
    </Card>
  )
}

