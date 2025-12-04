import { Button, Card, Form, InputNumber, message, Select } from 'antd'
import http from '../api/http'
import { useEffect, useState } from 'react'

type Tool = { id: number; name: string; rentalPrice: number; warehouseId: number }

export default function NewOrder() {
  const [tools, setTools] = useState<Tool[]>([])
  useEffect(() => { load() }, [])
  const load = async () => {
    const res = await http.get('/tools', { params: { page: 1, size: 100 } })
    setTools((res.data.data.records || []).map((r: any) => ({ id: r.id, name: r.name, rentalPrice: r.rentalPrice, warehouseId: r.warehouseId })))
  }
  const onFinish = async (v: any) => {
    try {
      const tool = tools.find(t => t.id === v.toolId)
      const unitPrice = tool?.rentalPrice || 0
      await http.post('/orders', { userId: 1, toolId: v.toolId, warehouseId: tool?.warehouseId, quantity: v.quantity, rentalDays: v.days, unitPrice })
      message.success('下单成功，待审核')
    } catch (e: any) {
      message.error(e.message || '下单失败')
    }
  }
  return (
    <Card title="创建订单" style={{ maxWidth: 520 }}>
      <Form layout="vertical" onFinish={onFinish}>
        <Form.Item name="toolId" label="工具" rules={[{ required: true }]}>
          <Select options={tools.map(t => ({ value: t.id, label: `${t.name} / ¥${t.rentalPrice}` }))} />
        </Form.Item>
        <Form.Item name="quantity" label="数量" rules={[{ required: true }]}>
          <InputNumber min={1} />
        </Form.Item>
        <Form.Item name="days" label="天数" rules={[{ required: true }]}>
          <InputNumber min={1} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">提交订单</Button>
        </Form.Item>
      </Form>
    </Card>
  )
}

