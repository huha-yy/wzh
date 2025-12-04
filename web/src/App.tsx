import { Layout, Menu, Button, Breadcrumb } from 'antd'
import { useEffect } from 'react'
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
import AdminUsers from './pages/AdminUsers'
import SystemConfig from './pages/SystemConfig'
import Logs from './pages/Logs'
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  const token = useAuthStore(s => s.token)
  const userProfile = useAuthStore(s => s.userProfile)
  const { logout, hasRole, hasAnyRole, fetchUserProfile } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  
  useEffect(() => {
    if (token && !userProfile) {
      fetchUserProfile()
    }
  }, [token])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }
  
  // 菜单项配置
  const allMenuItems = [
    { key: 'tools', icon: <ToolOutlined />, label: <Link to="/tools">工具目录</Link>, roles: ['admin', 'resident', 'maintainer'] },
    { key: 'order', icon: <ShoppingCartOutlined />, label: <Link to="/order/new">下单</Link>, roles: ['admin', 'resident'] },
    { key: 'orders', icon: <FileTextOutlined />, label: <Link to="/orders">订单</Link>, roles: ['admin', 'resident', 'maintainer'] },
    { key: 'admin', icon: <UserOutlined />, label: <Link to="/admin">管理</Link>, roles: ['admin'] },
    { key: 'users', icon: <UserOutlined />, label: <Link to="/admin/users">用户管理</Link>, roles: ['admin'] },
    { key: 'config', icon: <SettingOutlined />, label: <Link to="/config">参数</Link>, roles: ['admin'] },
    { key: 'logs', icon: <FileTextOutlined />, label: <Link to="/logs">日志</Link>, roles: ['admin'] }
  ]
  
  // 根据用户角色过滤菜单项
  const menuItems = allMenuItems.filter(item => hasAnyRole(item.roles))
  
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
            <span style={{ marginRight: '16px' }}>{userProfile ? `欢迎你，${userProfile.username}` : '欢迎你'}</span>
            <Button type="text" icon={<LogoutOutlined />} onClick={handleLogout}>退出登录</Button>
          </div>
        </Layout.Header>
        <Layout.Content style={{ padding: 24 }}>
          <Routes>
            <Route path="/tools" element={<ProtectedRoute requiredRoles={["admin","resident","maintainer"]}><Tools /></ProtectedRoute>} />
            <Route path="/order/new" element={<ProtectedRoute requiredRoles={["admin","resident"]}><NewOrder /></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute requiredRoles={["admin","resident","maintainer"]}><Orders /></ProtectedRoute>} />
            <Route path="/orders/:id/codes" element={<ProtectedRoute requiredRoles={["admin","resident","maintainer"]}><PickupCodes /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute requiredRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute requiredRoles={["admin"]}><AdminUsers /></ProtectedRoute>} />
            <Route path="/config" element={<ProtectedRoute requiredRoles={["admin"]}><SystemConfig /></ProtectedRoute>} />
            <Route path="/logs" element={<ProtectedRoute requiredRoles={["admin"]}><Logs /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/tools" replace />} />
          </Routes>
        </Layout.Content>
      </Layout>
    </Layout>
  )
}
