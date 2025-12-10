import { Card, Table, Tag, Space, Form, Select, DatePicker, InputNumber, Button } from 'antd'
import { useEffect, useState } from 'react'
import http from '../api/http'
import ReactECharts from 'echarts-for-react'

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>({ statusCounts: {}, last7: {} })
  const [low, setLow] = useState<any[]>([])
  const [maintStats, setMaintStats] = useState<any>({ typeCounts: {}, last7Scheduled: {}, last7Completed: {} })
  const [maintList, setMaintList] = useState<any[]>([])
  const [maintTotal, setMaintTotal] = useState(0)
  const [maintPage, setMaintPage] = useState(1)
  const [maintLoading, setMaintLoading] = useState(false)
  const [maintForm] = Form.useForm()
  const [userOptions, setUserOptions] = useState<any[]>([])
  const [userMap, setUserMap] = useState<Record<number,string>>({})
  const load = async () => {
    const res = await http.get('/admin/stats')
    setStats(res.data.data)
    const lowRes = await http.get('/tools/low-stock', { params: { page: 1, size: 20, threshold: 5 } })
    setLow(lowRes.data.data?.records || [])
    const ms = await http.get('/maintenance/stats')
    setMaintStats(ms.data.data || { typeCounts: {}, last7Scheduled: {}, last7Completed: {} })
    await loadMaint(1)
    try {
      const users = await http.get('/admin/users', { params: { page: 1, size: 200, status: 1 } })
      const recs = users.data.data?.records || []
      setUserOptions(recs.map((u:any)=>({ value: u.id, label: u.realName || u.username })))
      const map:Record<number,string> = {}
      recs.forEach((u:any)=>{ map[u.id] = u.realName || u.username })
      setUserMap(map)
    } catch {}
  }
  useEffect(() => { load() }, [])
  const loadMaint = async (p:number) => {
    setMaintLoading(true)
    const vals = maintForm.getFieldsValue()
    const [start, end] = vals.range || []
    const params:any = { page: p, size: 10 }
    if (vals.type) params.type = vals.type
    if (vals.handledBy) params.handledBy = vals.handledBy
    if (vals.toolId) params.toolId = vals.toolId
    if (vals.orderId) params.orderId = vals.orderId
    if (start) params.start = start.toISOString().slice(0,19)
    if (end) params.end = end.toISOString().slice(0,19)
    const ml = await http.get('/maintenance/records', { params })
    setMaintList(ml.data.data?.records || [])
    setMaintTotal(ml.data.data?.total || 0)
    setMaintPage(p)
    setMaintLoading(false)
  }
  const statusColors: Record<string, string> = {
    '0': '#999999',
    '1': '#1677ff',
    '2': '#722ed1',
    '3': '#faad14',
    '4': '#13c2c2',
    '5': '#52c41a',
    '6': '#f5222d'
  }
  const pieData = Object.entries(stats.statusCounts).map(([k, v]) => ({ name: k, value: v, itemStyle: { color: statusColors[k] } }))
  const pieOpt = { series: [{ type: 'pie', data: pieData }] }
  const lineOpt = { xAxis: { type: 'category', data: Object.keys(stats.last7) }, yAxis: { type: 'value' }, series: [{ data: Object.values(stats.last7), type: 'line' }] }
  const maintTypeOpt = { series: [{ type: 'pie', data: Object.entries(maintStats.typeCounts || {}).map(([k,v])=>({ name: k, value: v })) }] }
  const maintTrendOpt = { xAxis: { type: 'category', data: Object.keys(maintStats.last7Scheduled||{}) }, yAxis: { type: 'value' }, series: [{ name: '安排', data: Object.values(maintStats.last7Scheduled||{}), type: 'line' }, { name: '完成', data: Object.values(maintStats.last7Completed||{}), type: 'line' }] }
  return (
    <div>
      <Card title="订单状态分布" extra={
        <Space size={8} wrap>
          <Tag>0 待审核</Tag>
          <Tag color="blue">1 已通过</Tag>
          <Tag color="purple">2 已领取</Tag>
          <Tag color="gold">3 已申请归还</Tag>
          <Tag color="cyan">4 已安排验收</Tag>
          <Tag color="green">5 已完成</Tag>
          <Tag color="red">6 已取消</Tag>
        </Space>
      }><ReactECharts option={pieOpt} /></Card>
      <Card title="近7日订单趋势"><ReactECharts option={lineOpt} /></Card>
      <Card title="维护/巡检类型分布"><ReactECharts option={maintTypeOpt} /></Card>
      <Card title="近7日维护/巡检趋势"><ReactECharts option={maintTrendOpt} /></Card>
      <Card title="近期维护/巡检任务">
        <Form form={maintForm} layout="inline" onFinish={() => loadMaint(1)} style={{ marginBottom: 12 }}>
          <Form.Item name="type" label="类型">
            <Select allowClear style={{ width: 150 }} options={[{value:1,label:'巡检'},{value:2,label:'维修'},{value:3,label:'保养'}]} />
          </Form.Item>
          <Form.Item name="handledBy" label="责任人">
            <Select allowClear style={{ width: 180 }} options={userOptions} />
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
          <Form.Item>
            <Button type="primary" htmlType="submit">查询</Button>
          </Form.Item>
        </Form>
        <Table rowKey="id" dataSource={maintList} loading={maintLoading} pagination={{ current: maintPage, pageSize: 10, total: maintTotal, onChange: loadMaint }}
               columns={[
                 { title: '标题', dataIndex: 'title' },
                 { title: '类型', dataIndex: 'type', render: (t:number) => ({1:'巡检',2:'维修',3:'保养'}[t]||t) },
                 { title: '结果', dataIndex: 'result', render: (r:number) => r ? ({1:'合格',2:'不合格',3:'已修复'}[r]||r) : '-' },
                 { title: '工具ID', dataIndex: 'toolId' },
                 { title: '明细ID', dataIndex: 'orderItemId' },
                 { title: '责任人', dataIndex: 'handledBy', render: (id:number) => userMap[id] || id },
                 { title: '计划时间', dataIndex: 'scheduledAt' },
                 { title: '完成时间', dataIndex: 'completedAt' }
               ]}
        />
      </Card>
      <Card title={`低库存预警（阈值<=5）`}>
        <Table rowKey="id" dataSource={low} pagination={false}
               columns={[
                 { title: '名称', dataIndex: 'name' },
                 { title: '规格', dataIndex: 'modelSpec' },
                 { title: '状态', dataIndex: 'status', render: (s:number) => <Tag color={s===1?'green':'red'}>{s===1?'上架':'下架'}</Tag> },
                 { title: '可用库存', dataIndex: 'stockAvailable' }
               ]}
        />
      </Card>
    </div>
  )
}
