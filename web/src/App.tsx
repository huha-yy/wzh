import { Layout, Menu } from 'antd'
import { Routes, Route, Link, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Tools from './pages/Tools'
import NewOrder from './pages/NewOrder'
import Orders from './pages/Orders'
import PickupCodes from './pages/PickupCodes'
import { useAuthStore } from './store/auth'
import AdminDashboard from './pages/AdminDashboard'
import SystemConfig from './pages/SystemConfig'
import Logs from './pages/Logs'

export default function App() {
  const token = useAuthStore(s => s.token)
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Header>
        <Menu theme="dark" mode="horizontal" items={[{ key: 'tools', label: <Link to="/tools">工具目录</Link> }, { key: 'order', label: <Link to="/order/new">下单</Link> }, { key: 'orders', label: <Link to="/orders">订单</Link> }, { key: 'admin', label: <Link to="/admin">管理</Link> }, { key: 'config', label: <Link to="/config">参数</Link> }, { key: 'logs', label: <Link to="/logs">日志</Link> }]} />
      </Layout.Header>
      <Layout.Content style={{ padding: 24 }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/tools" element={token ? <Tools /> : <Navigate to="/login" replace />} />
          <Route path="/order/new" element={token ? <NewOrder /> : <Navigate to="/login" replace />} />
          <Route path="/orders" element={token ? <Orders /> : <Navigate to="/login" replace />} />
          <Route path="/orders/:id/codes" element={token ? <PickupCodes /> : <Navigate to="/login" replace />} />
          <Route path="/admin" element={token ? <AdminDashboard /> : <Navigate to="/login" replace />} />
          <Route path="/config" element={token ? <SystemConfig /> : <Navigate to="/login" replace />} />
          <Route path="/logs" element={token ? <Logs /> : <Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/tools" replace />} />
        </Routes>
      </Layout.Content>
    </Layout>
  )
}
