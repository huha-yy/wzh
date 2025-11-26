import { Card, Input, Table } from 'antd'
import http from '../api/http'
import { useEffect, useState } from 'react'

export default function Logs() {
  const [keyword, setKeyword] = useState('')
  const [data, setData] = useState<string[]>([])
  const load = async () => {
    const res = await http.get('/system/logs', { params: { page: 1, size: 100, keyword } })
    setData(res.data.data || [])
  }
  useEffect(() => { load() }, [])
  return (
    <Card title="系统日志" extra={<Input placeholder="关键词" value={keyword} onChange={e=>setKeyword(e.target.value)} onPressEnter={load} /> }>
      <Table rowKey={r=>r} dataSource={data} pagination={false} columns={[{ title: '日志行', dataIndex: 'text', render: (_,r)=>r }]} />
    </Card>
  )
}

