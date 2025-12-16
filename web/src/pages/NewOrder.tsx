import { Button, Card, Form, InputNumber, message, Select, Modal, Space, Input, Divider } from 'antd'
import http from '../api/http'
import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/auth'

type Tool = { id: number; name: string; rentalPrice: number; deposit?: number; warehouseId: number; status: number; stockAvailable?: number }
type Category = { id: number; name: string }
type Warehouse = { id: number; name: string }

export default function NewOrder() {
  const [tools, setTools] = useState<Tool[]>([])
  const [selectedToolId, setSelectedToolId] = useState<number | null>(null)
  const [form] = Form.useForm()
  const [categories, setCategories] = useState<Category[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [filters, setFilters] = useState<{ keyword?: string; categoryId?: number; warehouseId?: number }>({})
  const [createdOrderId, setCreatedOrderId] = useState<number | null>(null)
  const userProfile = useAuthStore(s => s.userProfile)
  useEffect(() => { load() }, [])
  const load = async () => {
    try {
      const res = await http.get('/tools', { params: { page: 1, size: 100, categoryId: filters.categoryId, warehouseId: filters.warehouseId, keyword: filters.keyword } })
      setTools((res.data.data.records || []).map((r: any) => ({ id: r.id, name: r.name, rentalPrice: r.rentalPrice, deposit: r.deposit, warehouseId: r.warehouseId, status: r.status, stockAvailable: r.stockAvailable })))
    } catch {}
    try {
      const cats = await http.get('/categories')
      setCategories(cats.data.data || [])
    } catch {}
    try {
      const whs = await http.get('/warehouses')
      setWarehouses(whs.data.data || [])
    } catch {}
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
      setCreatedOrderId(res.data?.data?.id || null)
    } catch (e: any) {
      const msg = e?.response?.data?.message || e.message
      message.error(msg === 'stock not enough' ? '库存不足，请调整数量' : (msg || '下单失败'))
    }
  }
  const confirmSubmit = async () => {
    try {
      const vals = await form.validateFields()
      const tool = tools.find(t => t.id === vals.toolId)
      const price = tool?.rentalPrice || 0
      const dep = tool?.deposit || 0
      const est = price * vals.quantity * vals.days + dep * vals.quantity
      Modal.confirm({
        title: '确认提交订单',
        content: `工具：${tool?.name || vals.toolId}
数量：${vals.quantity}
天数：${vals.days}
日租价：¥${price.toFixed(2)}
押金（每件）：¥${dep.toFixed(2)}
预计总金额：¥${est.toFixed(2)}`,
        okText: '确认提交',
        cancelText: '取消',
        onOk: () => onFinish(vals)
      })
    } catch {}
  }
  const selectedTool = tools.find(t => t.id === selectedToolId)
  const quantity = Form.useWatch('quantity', form)
  const days = Form.useWatch('days', form)
  const total = ((selectedTool?.rentalPrice || 0) * (Number(quantity) || 0) * (Number(days) || 0)) + ((selectedTool?.deposit || 0) * (Number(quantity) || 0))
  return (
    <Card title="创建订单" style={{ maxWidth: 640 }}>
      <Space style={{ marginBottom: 12 }}>
        <Select allowClear placeholder="分类" style={{ width: 160 }} options={categories.map(c=>({ value: c.id, label: c.name }))} value={filters.categoryId as any} onChange={(v)=>setFilters(s=>({ ...s, categoryId: v }))} />
        <Select allowClear placeholder="仓库" style={{ width: 160 }} options={warehouses.map(w=>({ value: w.id, label: w.name }))} value={filters.warehouseId as any} onChange={(v)=>setFilters(s=>({ ...s, warehouseId: v }))} />
        <Input allowClear placeholder="搜索工具关键字" style={{ width: 200 }} value={filters.keyword} onChange={(e)=>setFilters(s=>({ ...s, keyword: e.target.value }))} />
        <Button onClick={load}>筛选</Button>
      </Space>
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item name="toolId" label="工具" rules={[{ required: true }]} extra={selectedTool ? `当前可用库存：${selectedTool.stockAvailable || 0}` : undefined}>
          <Select showSearch filterOption={(input, option)=> (option?.label as string).toLowerCase().includes(input.toLowerCase())} onChange={v => setSelectedToolId(v)} options={tools.map(t => ({ value: t.id, label: `${t.name} / ¥${t.rentalPrice}${t.status!==1?'（已下架）':''}${(t.stockAvailable||0)<=0?'（无库存）':''}`, disabled: t.status!==1 || (t.stockAvailable||0)<=0 }))} />
        </Form.Item>
        <Form.Item name="quantity" label="数量" rules={[{ required: true }]} extra={selectedTool ? `最多可租用：${selectedTool.stockAvailable || 0} 件` : undefined}> 
          <InputNumber min={1} max={tools.find(t => t.id === selectedToolId)?.stockAvailable || undefined} />
        </Form.Item>
        <Form.Item name="days" label="天数" rules={[{ required: true }]}> 
          <InputNumber min={1} />
        </Form.Item>
        <Divider style={{ margin: '8px 0' }} />
        <div style={{ fontSize: 14 }}>
          日租价：{selectedTool ? `¥${selectedTool.rentalPrice.toFixed(2)}` : '-'}，押金（每件）：{selectedTool ? `¥${(selectedTool.deposit || 0).toFixed(2)}` : '-'}，
          预计总金额：{selectedTool && quantity && days ? `¥${total.toFixed(2)}` : '-'}
        </div>
        <Form.Item>
          <Button type="primary" onClick={confirmSubmit}>提交订单</Button>
        </Form.Item>
        {createdOrderId && (
          <Space>
            <Button onClick={()=>window.location.href='/orders'}>查看订单</Button>
            <Button onClick={()=>{ form.resetFields(); setSelectedToolId(null); setCreatedOrderId(null) }}>继续下单</Button>
          </Space>
        )}
      </Form>
    </Card>
  )
}
