import { Button, Card, Form, InputNumber, message, Select, Modal } from 'antd'
import http from '../api/http'
import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/auth'

type Tool = { id: number; name: string; rentalPrice: number; warehouseId: number; status: number; stockAvailable?: number }

export default function NewOrder() {
  const [tools, setTools] = useState<Tool[]>([])
  const [selectedToolId, setSelectedToolId] = useState<number | null>(null)
  const [form] = Form.useForm()
  const userProfile = useAuthStore(s => s.userProfile)
  useEffect(() => { load() }, [])
  const load = async () => {
    const res = await http.get('/tools', { params: { page: 1, size: 100 } })
    setTools((res.data.data.records || []).map((r: any) => ({ id: r.id, name: r.name, rentalPrice: r.rentalPrice, warehouseId: r.warehouseId, status: r.status, stockAvailable: r.stockAvailable })))
  }
  const onFinish = async (v: any) => {
    try {
      const tool = tools.find(t => t.id === v.toolId)
      const unitPrice = tool?.rentalPrice || 0
      if (!tool) { message.error('请选择有效工具'); return }
      if (tool.status !== 1) { message.error('该工具已下架，无法下单'); return }
      if ((tool.stockAvailable || 0) <= 0) { message.error('该工具库存不足，无法下单'); return }
      if ((tool.stockAvailable || 0) < v.quantity) { message.error(`该工具库存不足，最多可租用${tool.stockAvailable}件`); return }
      const res = await http.post('/orders', { toolId: v.toolId, warehouseId: tool?.warehouseId, quantity: v.quantity, rentalDays: v.days, unitPrice })
      if (!res.data || res.data.code !== 0) {
        const msg = res.data?.message
        message.error(msg === 'stock not enough' ? '库存不足，请调整数量' : (msg || '下单失败'))
        return
      }
      message.success('下单成功，待审核')
      form.resetFields()
      setSelectedToolId(null)
    } catch (e: any) {
      const msg = e?.response?.data?.message || e.message
      message.error(msg === 'stock not enough' ? '库存不足，请调整数量' : (msg || '下单失败'))
    }
  }
  const confirmSubmit = async () => {
    try {
      const vals = await form.validateFields()
      const tool = tools.find(t => t.id === vals.toolId)
      Modal.confirm({
        title: '确认提交订单',
        content: `工具：${tool?.name || vals.toolId}，数量：${vals.quantity}，天数：${vals.days}`,
        okText: '确认提交',
        cancelText: '取消',
        onOk: () => onFinish(vals)
      })
    } catch {}
  }
  const selectedTool = tools.find(t => t.id === selectedToolId)
  return (
    <Card title="创建订单" style={{ maxWidth: 520 }}>
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item name="toolId" label="工具" rules={[{ required: true }]} extra={selectedTool ? `当前可用库存：${selectedTool.stockAvailable || 0}` : undefined}>
          <Select onChange={v => setSelectedToolId(v)} options={tools.map(t => ({ value: t.id, label: `${t.name} / ¥${t.rentalPrice}${t.status!==1?'（已下架）':''}${(t.stockAvailable||0)<=0?'（无库存）':''}`, disabled: t.status!==1 || (t.stockAvailable||0)<=0 }))} />
        </Form.Item>
        <Form.Item name="quantity" label="数量" rules={[{ required: true }]} extra={selectedTool ? `最多可租用：${selectedTool.stockAvailable || 0} 件` : undefined}> 
          <InputNumber min={1} max={tools.find(t => t.id === selectedToolId)?.stockAvailable || undefined} />
        </Form.Item>
        <Form.Item name="days" label="天数" rules={[{ required: true }]}> 
          <InputNumber min={1} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" onClick={confirmSubmit}>提交订单</Button>
        </Form.Item>
      </Form>
    </Card>
  )
}
