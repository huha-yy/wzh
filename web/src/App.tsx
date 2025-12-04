import { Layout, Menu, Button, Breadcrumb } from 'antd'
import { Routes, Route, Link, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { HomeOutlined, ToolOutlined, ShoppingCartOutlined, FileTextOutlined, SettingOutlined, UserOutlined, LogoutOutlined } from '@ant-design/icons'
import Login from './pages/Login'
import Register from './pages/Register'
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
  const { logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  
  const handleLogout = () => {
    logout()
    navigate('/login')
  }
  
  // 菜单项配置
  const menuItems = [
    { key: 'tools', icon: <ToolOutlined />, label: <Link to="/tools">工具目录</Link> },
    { key: 'order', icon: <ShoppingCartOutlined />, label: <Link to="/order/new">下单</Link> },
    { key: 'orders', icon: <FileTextOutlined />, label: <Link to="/orders">订单</Link> },
    { key: 'admin', icon: <UserOutlined />, label: <Link to="/admin">管理</Link> },
    { key: 'config', icon: <SettingOutlined />, label: <Link to="/config">参数</Link> },
    { key: 'logs', icon: <FileTextOutlined />, label: <Link to="/logs">日志</Link> }
  ]
  
  // 面包屑配置
  const getBreadcrumbItems = () => {
    const pathMap: Record<string, string> = {
      '/tools': '工具目录',
      '/order/new': '下单',
      '/orders': '订单',
      '/admin': '管理',
      '/config': '参数',
      '/logs': '日志'
    }
    
    const items = [
      { title: <Link to="/"><HomeOutlined /> 首页</Link> }
    ]
    
    const path = location.pathname
    if (pathMap[path]) {
      items.push({ title: <span>{pathMap[path]}</span> })
    }
    
    return items
  }
  
  // 如果未登录，只显示登录页面
  if (!token) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Layout.Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Layout.Content>
      </Layout>
    )
  }
  
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Sider width={250} theme="dark">
        <div style={{ 
          height: '64px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          color: 'white', 
          fontSize: '16px', 
          fontWeight: 'bold',
          borderBottom: '1px solid #f0f0f020'
        }}>
          社区共享工具管理系统
        </div>
        <Menu 
          theme="dark" 
          mode="inline" 
          items={menuItems} 
          style={{ border: 'none' }}
          defaultSelectedKeys={[location.pathname === '/order/new' ? 'order' : location.pathname.substring(1)]}
        />
      </Layout.Sider>
      <Layout>
        <Layout.Header style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '0 24px', 
          background: '#fff',
          borderBottom: '1px solid #f0f0f0'
        }}>
          <Breadcrumb items={getBreadcrumbItems()} />
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: '16px' }}>欢迎您</span>
            <Button type="text" icon={<LogoutOutlined />} onClick={handleLogout}>退出登录</Button>
          </div>
        </Layout.Header>
        <Layout.Content style={{ padding: 24 }}>
          <Routes>
            <Route path="/tools" element={<Tools />} />
            <Route path="/order/new" element={<NewOrder />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/orders/:id/codes" element={<PickupCodes />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/config" element={<SystemConfig />} />
            <Route path="/logs" element={<Logs />} />
            <Route path="*" element={<Navigate to="/tools" replace />} />
          </Routes>
        </Layout.Content>
      </Layout>
    </Layout>
  )
}
