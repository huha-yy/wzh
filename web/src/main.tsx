import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import 'antd/dist/reset.css'
import { App as AntdApp } from 'antd'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <AntdApp>
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <App />
    </BrowserRouter>
  </AntdApp>
)

