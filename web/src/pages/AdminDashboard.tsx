import { Card, Table, Tag, Space } from 'antd'
import { useEffect, useState } from 'react'
import http from '../api/http'
import ReactECharts from 'echarts-for-react'

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>({ statusCounts: {}, last7: {} })
  const [low, setLow] = useState<any[]>([])
  const [maintStats, setMaintStats] = useState<any>({ typeCounts: {}, last7Scheduled: {}, last7Completed: {} })
  const load = async () => {
    const res = await http.get('/admin/stats')
    setStats(res.data.data)
    const lowRes = await http.get('/tools/low-stock', { params: { page: 1, size: 20, threshold: 5 } })
    setLow(lowRes.data.data?.records || [])
    const ms = await http.get('/maintenance/stats')
    setMaintStats(ms.data.data || { typeCounts: {}, last7Scheduled: {}, last7Completed: {} })
  }
  useEffect(() => { load() }, [])
  const statusColors: Record<string, string> = {
    '0': '#999999',
    '1': '#1677ff',
    '2': '#722ed1',
    '3': '#faad14',
    '4': '#13c2c2',
    '5': '#52c41a',
    '6': '#f5222d'
  }
  const maintTypeColors: Record<string, string> = {
    '1': '#52c41a',  // 巡检 - 绿色
    '2': '#f5222d',  // 维修 - 红色
    '3': '#1677ff'   // 保养 - 蓝色
  }
  const maintTypeNames: Record<string, string> = {
    '1': '巡检',
    '2': '维修',
    '3': '保养'
  }
  const pieData = Object.entries(stats.statusCounts).map(([k, v]) => ({ name: k, value: v, itemStyle: { color: statusColors[k] } }))
  const pieOpt = { series: [{ type: 'pie', data: pieData }] }
  const lineOpt = { xAxis: { type: 'category', data: Object.keys(stats.last7) }, yAxis: { type: 'value' }, series: [{ data: Object.values(stats.last7), type: 'line' }] }
  const maintTypeData = Object.entries(maintStats.typeCounts || {}).map(([k,v])=>({ name: maintTypeNames[k] || k, value: v, itemStyle: { color: maintTypeColors[k] } }))
  const maintTypeOpt = { series: [{ type: 'pie', data: maintTypeData }] }
  const maintTrendOpt = {
    xAxis: { type: 'category', data: Object.keys(maintStats.last7Scheduled||{}) },
    yAxis: { type: 'value' },
    series: [
      { name: '安排', data: Object.values(maintStats.last7Scheduled||{}), type: 'line', itemStyle: { color: '#1677ff' }, lineStyle: { color: '#1677ff' } },
      { name: '完成', data: Object.values(maintStats.last7Completed||{}), type: 'line', itemStyle: { color: '#52c41a' }, lineStyle: { color: '#52c41a' } }
    ]
  }
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
      <Card title="维护/巡检类型分布" extra={
        <Space size={8} wrap>
          <Tag color="green">1 巡检</Tag>
          <Tag color="red">2 维修</Tag>
          <Tag color="blue">3 保养</Tag>
        </Space>
      }><ReactECharts option={maintTypeOpt} /></Card>
      <Card title="近7日维护/巡检趋势" extra={
        <Space size={8}>
          <Tag color="blue">安排</Tag>
          <Tag color="green">完成</Tag>
        </Space>
      }><ReactECharts option={maintTrendOpt} /></Card>
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
