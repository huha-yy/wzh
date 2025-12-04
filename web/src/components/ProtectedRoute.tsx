import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import { Result, Button } from 'antd'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRoles?: string[]
  fallbackPath?: string
}

export default function ProtectedRoute({ children, requiredRoles = [], fallbackPath = '/tools' }: ProtectedRouteProps) {
  const { hasAnyRole } = useAuthStore()
  
  // 如果没有指定所需角色，则只检查是否已登录
  if (requiredRoles.length === 0) {
    return <>{children}</>
  }
  
  // 检查用户是否有任一所需角色
  if (hasAnyRole(requiredRoles)) {
    return <>{children}</>
  }
  
  // 如果没有权限，显示权限不足页面
  return (
    <Result
      status="403"
      title="403"
      subTitle="抱歉，您没有权限访问此页面。"
      extra={
        <Button type="primary" onClick={() => window.location.href = fallbackPath}>
          返回首页
        </Button>
      }
    />
  )
}