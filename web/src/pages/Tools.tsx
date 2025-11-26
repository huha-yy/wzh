import { Card, Input, Table } from 'antd'
import http from '../api/http'
import { useEffect, useState } from 'react'

type Tool = { id: number; name: string; modelSpec: string; rentalPrice: number; stockAvailable: number }

export default function Tools() {
  const [data, setData] = useState<Tool[]>([])
  const [keyword, setKeyword] = useState('')
  const fetch = async () => {
    const res = await http.get('/tools', { params: { page: 1, size: 20, keyword } })
    setData(res.data.data.records || [])
  }
  useEffect(() => { fetch() }, [])
  return (
    <Card title="工具目录" extra={<Input placeholder="关键词" value={keyword} onChange={e => setKeyword(e.target.value)} onPressEnter={fetch} /> }>
      <Table rowKey="id" dataSource={data} columns={[{ title: '名称', dataIndex: 'name' }, { title: '规格', dataIndex: 'modelSpec' }, { title: '日租价', dataIndex: 'rentalPrice' }, { title: '可用库存', dataIndex: 'stockAvailable' }]} pagination={false} />
    </Card>
  )
}

