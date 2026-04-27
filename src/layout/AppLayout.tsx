import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Avatar, Typography, Button, Dropdown } from 'antd'
import {
  DashboardOutlined,
  HistoryOutlined,
  ShoppingOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ShopOutlined,
} from '@ant-design/icons'
import { useAuthStore } from '@/store/authStore'

const { Sider, Header, Content } = Layout
const { Text } = Typography

const NAV_ITEMS = [
  { key: '/dashboard',  icon: <DashboardOutlined />, label: 'Tổng quan' },
  { key: '/giao-dich',  icon: <HistoryOutlined />,   label: 'Lịch sử giao dịch' },
  { key: '/nhu-cau',    icon: <ShoppingOutlined />,  label: 'Nhu cầu sản phẩm' },
  { key: '/profile',    icon: <UserOutlined />,       label: 'Hồ sơ' },
]

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { user, logout } = useAuthStore()

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      danger: true,
      onClick: () => {
        logout()
        navigate('/login')
      },
    },
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        trigger={null}
        width="14em"
        collapsedWidth="4.5em"
        style={{ position: 'fixed', height: '100vh', left: 0, top: 0, zIndex: 100 }}
      >
        {/* Logo */}
        <div
          style={{
            height: '4em',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? 0 : '0 1.2em',
            gap: '0.6em',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <ShopOutlined style={{ color: '#4a9b6f', fontSize: '1.4em' }} />
          {!collapsed && (
            <Text strong style={{ color: '#fff', fontSize: '1em', whiteSpace: 'nowrap' }}>
              Nhà cung cấp
            </Text>
          )}
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[pathname]}
          items={NAV_ITEMS}
          onClick={({ key }) => navigate(key)}
          style={{ marginTop: '0.5em', border: 'none' }}
        />
      </Sider>

      <Layout style={{ marginLeft: collapsed ? '4.5em' : '14em', transition: 'margin 0.2s' }}>
        <Header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 99,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 1.5em',
            background: '#fff',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            height: '4em',
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: '1em' }}
          />
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6em', cursor: 'pointer' }}>
              <Avatar src={user?.avatar} icon={<UserOutlined />} style={{ background: '#4a9b6f' }} />
              <Text style={{ fontSize: '0.95em' }}>{user?.name ?? 'Nhà cung cấp'}</Text>
            </div>
          </Dropdown>
        </Header>

        <Content style={{ padding: '1.5em', minHeight: 'calc(100vh - 4em)' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
