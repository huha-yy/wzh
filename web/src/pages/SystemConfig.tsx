import { Button, Card, Form, InputNumber, message } from 'antd'
import http from '../api/http'
import { useEffect } from 'react'

export default function SystemConfig() {
  const [form] = Form.useForm()
  const load = async () => {
    const res = await http.get('/system/config')
    form.setFieldsValue(res.data.data)
  }
  useEffect(() => { load() }, [])
  const save = async () => {
    await http.post('/system/config', form.getFieldsValue())
    message.success('已保存（运行时配置）')
  }
  return (
    <Card title="系统参数配置">
      <Form form={form} layout="vertical" style={{ maxWidth: 400 }}>
        <Form.Item name="jwtExpireMinutes" label="JWT过期分钟"> <InputNumber min={10} /> </Form.Item>
        <Form.Item name="defaultPageSize" label="分页默认条数"> <InputNumber min={10} /> </Form.Item>
        <Form.Item name="exportLimit" label="导出上限"> <InputNumber min={100} /> </Form.Item>
        <Button type="primary" onClick={save}>保存</Button>
      </Form>
    </Card>
  )
}

