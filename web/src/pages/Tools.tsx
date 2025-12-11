import { Button, Card, Form, Input, InputNumber, Modal, Table, Tag, message, Select } from 'antd'
import http from '../api/http'
import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/auth'
import type { ColumnsType } from 'antd/es/table'

type Tool = { id: number; name: string; modelSpec: string; rentalPrice: number; deposit: number; status: number; stockTotal: number; stockAvailable: number; warehouseId: number; categoryId?: number; description?: string }
type Warehouse = { id: number; name: string }
type Category = { id: number; name: string; parentId?: number }

export default function Tools() {
  const [data, setData] = useState<Tool[]>([])
  const [keyword, setKeyword] = useState('')
  const [editing, setEditing] = useState<Tool | null>(null)
  const [editForm] = Form.useForm()
  const [adjusting, setAdjusting] = useState<Tool | null>(null)
  const [adjustForm] = Form.useForm()
  const [saving, setSaving] = useState(false)
  const { hasAnyRole } = useAuthStore()
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([])
  const [bulkAdjustOpen, setBulkAdjustOpen] = useState(false)
  const [bulkForm] = Form.useForm()
  const [addOpen, setAddOpen] = useState(false)
  const [addForm] = Form.useForm()
  const [importOpen, setImportOpen] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importErrors, setImportErrors] = useState<string[]>([])
  const fetch = async () => {
    try {
      const res = await http.get('/tools', { params: { page: 1, size: 20, keyword } })
      // 检查响应数据结构
      if (res.data && res.data.data && res.data.data.records) {
        setData(res.data.data.records)
      } else {
        console.error('API响应数据结构不正确:', res.data)
        setData([])
      }
    } catch (error) {
      console.error('获取工具列表失败:', error)
      setData([])
    }
  }
  useEffect(() => { fetch(); loadWarehouses(); loadCategories() }, [])
  const loadWarehouses = async () => {
    try {
      const res = await http.get('/warehouses')
      setWarehouses(res.data.data || [])
    } catch {}
  }
  const loadCategories = async () => {
    try {
      const res = await http.get('/categories')
      setCategories(res.data.data || [])
    } catch {}
  }
  const openEdit = (t: Tool) => {
    setEditing(t)
    editForm.setFieldsValue({ name: t.name, modelSpec: t.modelSpec, rentalPrice: t.rentalPrice, deposit: t.deposit, description: t.description, warehouseId: t.warehouseId, categoryId: t.categoryId })
  }
  const saveEdit = async () => {
    try {
      const vals = await editForm.validateFields()
      setSaving(true)
      const res = await http.put(`/tools/${editing!.id}`, vals)
      if (!res.data || res.data.code !== 0) { message.error(res.data?.message || '保存失败'); return }
      message.success('保存成功')
      setEditing(null)
      fetch()
    } catch (e: any) { message.error(e?.response?.data?.message || e.message || '保存失败') }
    finally { setSaving(false) }
  }
  const toggleStatus = async (t: Tool, status: number) => {
    try {
      const res = await http.post(`/tools/${t.id}/status`, null, { params: { status } })
      if (!res.data || res.data.code !== 0) { message.error(res.data?.message || '操作失败'); return }
      message.success('已更新')
      fetch()
    } catch (e: any) { message.error(e?.response?.data?.message || e.message || '操作失败') }
  }
  const openAdjust = (t: Tool) => { setAdjusting(t); adjustForm.setFieldsValue({ deltaTotal: 0, deltaAvailable: 0 }) }
  const saveAdjust = async () => {
    try {
      const vals = await adjustForm.validateFields()
      const res = await http.post(`/tools/${adjusting!.id}/stock/adjust`, null, { params: vals })
      if (!res.data || res.data.code !== 0) { message.error(res.data?.message || '调整失败'); return }
      message.success('调整成功')
      setAdjusting(null)
      fetch()
    } catch (e: any) { message.error(e?.response?.data?.message || e.message || '调整失败') }
  }
  const batchStatus = async (status: number) => {
    if (selectedRowKeys.length === 0) { message.warning('请先选择工具'); return }
    try {
      const res = await http.post('/tools/batch/status', { ids: selectedRowKeys, status })
      if (!res.data || res.data.code !== 0) { message.error(res.data?.message || '操作失败'); return }
      message.success(`已${status===1?'上架':'下架'}${res.data.data}个工具`)
      setSelectedRowKeys([])
      fetch()
    } catch (e: any) { message.error(e?.response?.data?.message || e.message || '操作失败') }
  }
  const openBulkAdjust = () => {
    if (selectedRowKeys.length === 0) { message.warning('请先选择工具'); return }
    setBulkAdjustOpen(true)
    bulkForm.setFieldsValue({ deltaTotal: 0, deltaAvailable: 0 })
  }
  const saveBulkAdjust = async () => {
    try {
      const vals = await bulkForm.validateFields()
      const res = await http.post('/tools/batch/stock/adjust', { ids: selectedRowKeys, deltaTotal: vals.deltaTotal, deltaAvailable: vals.deltaAvailable })
      if (!res.data || res.data.code !== 0) { message.error(res.data?.message || '调整失败'); return }
      message.success(`已调整${res.data.data}个工具库存`)
      setBulkAdjustOpen(false)
      setSelectedRowKeys([])
      fetch()
    } catch (e: any) { message.error(e?.response?.data?.message || e.message || '调整失败') }
  }
  const openAdd = () => {
    setAddOpen(true)
    addForm.setFieldsValue({ name:'', modelSpec:'', rentalPrice:0, deposit:0, warehouseId: undefined, categoryId: undefined, assetCode:'', stockTotal:0, stockAvailable:0, description:'' })
  }
  const saveAdd = async () => {
    try {
      const vals = await addForm.validateFields()
      if (vals.stockAvailable > vals.stockTotal) { message.error('可用库存不能大于总库存'); return }
      const res = await http.post('/tools', vals)
      if (!res.data || res.data.code !== 0) { message.error(res.data?.message || '新增失败'); return }
      message.success('新增成功')
      setAddOpen(false)
      fetch()
    } catch (e:any) { message.error(e?.response?.data?.message || e.message || '新增失败') }
  }
  const openImport = () => { setImportOpen(true); setImportErrors([]) }
  const doImport = async (file: File, dryRun: boolean) => {
    try {
      setImporting(true)
      const fd = new FormData()
      fd.append('file', file)
      fd.append('dryRun', String(dryRun))
      const res = await http.post('/tools/import', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      if (!res.data || res.data.code !== 0) { message.error(res.data?.message || '导入失败'); setImportErrors([]); return }
      const data = res.data.data || { success:0, failed:0, errors:[] }
      setImportErrors(data.errors || [])
      message.success(`导入成功：${data.success}，失败：${data.failed}`)
      if (!dryRun) { fetch() }
    } catch (e:any) { message.error(e?.response?.data?.message || e.message || '导入失败') }
    finally { setImporting(false) }
  }
  const columns: ColumnsType<Tool> = [
    { title: '名称', dataIndex: 'name' },
    { title: '规格', dataIndex: 'modelSpec' },
    { title: '仓库', dataIndex: 'warehouseId', render: (wid:number) => warehouses.find(w => w.id === wid)?.name || '-' },
    { title: '分类', dataIndex: 'categoryId', render: (cid?:number) => (cid ? (categories.find(c => c.id === cid)?.name || '-') : '-') },
    { title: '日租价', dataIndex: 'rentalPrice' },
    { title: '押金', dataIndex: 'deposit' },
    { title: '状态', dataIndex: 'status', render: (s:number) => <Tag color={s===1?'green':'red'}>{s===1?'上架':'下架'}</Tag> },
    { title: '总库存', dataIndex: 'stockTotal' },
    { title: '可用库存', dataIndex: 'stockAvailable' }
  ]
  if (hasAnyRole(['admin','maintainer'])) {
    columns.push({ title: '操作', render: (_:any, r:Tool) => (
      <div>
        <Button size="small" onClick={() => openEdit(r)}>编辑</Button>
        {r.status===1 ? (
          <Button size="small" style={{ marginLeft: 8 }} onClick={() => toggleStatus(r, 0)}>下架</Button>
        ) : (
          <Button size="small" style={{ marginLeft: 8 }} type="primary" onClick={() => toggleStatus(r, 1)}>上架</Button>
        )}
        <Button size="small" style={{ marginLeft: 8 }} onClick={() => openAdjust(r)}>库存调整</Button>
      </div>
    ) })
  }
  return (
    <Card title="工具目录" extra={<Input placeholder="关键词" value={keyword} onChange={e => setKeyword(e.target.value)} onPressEnter={fetch} /> }>
      {hasAnyRole(['admin','maintainer']) && (
        <div style={{ marginBottom: 12 }}>
          <Button size="small" type="primary" onClick={openAdd}>新增工具</Button>
          <Button size="small" style={{ marginLeft: 8 }} onClick={() => batchStatus(1)}>批量上架</Button>
          <Button size="small" style={{ marginLeft: 8 }} onClick={() => batchStatus(0)}>批量下架</Button>
          <Button size="small" style={{ marginLeft: 8 }} onClick={openBulkAdjust}>批量库存调整</Button>
          <Button size="small" style={{ marginLeft: 8 }} onClick={openImport}>批量导入(Excel)</Button>
        </div>
      )}
      <Table rowKey="id" dataSource={data} pagination={false} columns={columns}
             rowSelection={hasAnyRole(['admin','maintainer']) ? { selectedRowKeys, onChange: (keys) => setSelectedRowKeys(keys as number[]) } : undefined}
      />
      <Modal title="编辑工具" open={!!editing} onOk={saveEdit} onCancel={() => setEditing(null)} confirmLoading={saving} destroyOnHidden>
        <Form form={editForm} layout="vertical">
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}> 
            <Input />
          </Form.Item>
          <Form.Item name="modelSpec" label="规格"> 
            <Input />
          </Form.Item>
          <Form.Item name="rentalPrice" label="日租价" rules={[{ required: true, message: '请输入日租价' }]}> 
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="deposit" label="押金"> 
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="warehouseId" label="仓库">
            <Select allowClear options={warehouses.map(w => ({ value: w.id, label: w.name }))} />
          </Form.Item>
          <Form.Item name="categoryId" label="分类">
            <Select allowClear options={categories.map(c => ({ value: c.id, label: c.name }))} />
          </Form.Item>
          <Form.Item name="description" label="描述"> 
            <Input />
          </Form.Item>
        </Form>
      </Modal>
      <Modal title="新增工具" open={addOpen} onOk={saveAdd} onCancel={()=>setAddOpen(false)} destroyOnHidden>
        <Form form={addForm} layout="vertical">
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="modelSpec" label="规格">
            <Input />
          </Form.Item>
          <Form.Item name="assetCode" label="资产编码">
            <Input />
          </Form.Item>
          <Form.Item name="rentalPrice" label="日租价" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="deposit" label="押金">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="warehouseId" label="仓库">
            <Select allowClear options={warehouses.map(w => ({ value: w.id, label: w.name }))} />
          </Form.Item>
          <Form.Item name="categoryId" label="分类">
            <Select allowClear options={categories.map(c => ({ value: c.id, label: c.name }))} />
          </Form.Item>
          <Form.Item name="stockTotal" label="总库存" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="stockAvailable" label="可用库存" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
      <Modal title="批量导入(Excel)" open={importOpen} onCancel={()=>setImportOpen(false)} footer={null} destroyOnHidden>
        <Form layout="vertical" onFinish={(v)=>{}}>
          <Form.Item label="Excel文件格式">
            <div>表头建议包含：name, modelSpec, assetCode, rentalPrice, deposit, categoryId/categoryName, warehouseId/warehouseName, stockTotal, stockAvailable, description</div>
          </Form.Item>
          <Form.Item label="选择文件">
            <input type="file" accept=".xlsx" onChange={e=>{ const f=e.target.files?.[0]; if (f) doImport(f, true) }} />
          </Form.Item>
          {importErrors.length>0 && (
            <div style={{ maxHeight: 180, overflow: 'auto', background: '#fafafa', padding: 8, border: '1px solid #eee' }}>
              {importErrors.map((err,i)=>(<div key={i}>{err}</div>))}
            </div>
          )}
          <div style={{ marginTop: 12 }}>
            <Button type="primary" loading={importing} onClick={()=>{ /* no-op */ }}>校验结果已显示，上线导入请重新选择文件并取消校验</Button>
          </div>
        </Form>
      </Modal>
      <Modal title="库存调整" open={!!adjusting} onOk={saveAdjust} onCancel={() => setAdjusting(null)} destroyOnHidden>
        <Form form={adjustForm} layout="vertical">
          <Form.Item name="deltaTotal" label="总库存增减" rules={[{ required: true }]}> 
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="deltaAvailable" label="可用库存增减" rules={[{ required: true }]}> 
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
      <Modal title="批量库存调整" open={bulkAdjustOpen} onOk={saveBulkAdjust} onCancel={() => setBulkAdjustOpen(false)} destroyOnHidden>
        <Form form={bulkForm} layout="vertical">
          <Form.Item name="deltaTotal" label="总库存增减" rules={[{ required: true }]}> 
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="deltaAvailable" label="可用库存增减" rules={[{ required: true }]}> 
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}
