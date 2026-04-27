import { Outlet } from 'react-router-dom'
import { Layout } from 'antd'

export default function AuthLayout() {
  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f5f2' }}>
      <Layout.Content
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2em 1em',
        }}
      >
        <Outlet />
      </Layout.Content>
    </Layout>
  )
}
