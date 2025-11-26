import { Card } from 'antd'
import { useEffect, useState } from 'react'
import http from '../api/http'
import ReactECharts from 'echarts-for-react'

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>({ statusCounts: {}, last7: {} })
  const load = async () => {
    const res = await http.get('/admin/stats')
    setStats(res.data.data)
  }
  useEffect(() => { load() }, [])
  const pieOpt = { series: [{ type: 'pie', data: Object.entries(stats.statusCounts).map(([k,v])=>({ name: k, value: v })) }] }
  const lineOpt = { xAxis: { type: 'category', data: Object.keys(stats.last7) }, yAxis: { type: 'value' }, series: [{ data: Object.values(stats.last7), type: 'line' }] }
  return (
    <div>
      <Card title="订单状态分布"><ReactECharts option={pieOpt} /></Card>
      <Card title="近7日订单趋势"><ReactECharts option={lineOpt} /></Card>
    </div>
  )
}

