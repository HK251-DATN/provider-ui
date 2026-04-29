import { Button, Card, Typography } from 'antd'
import { StopOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

const { Title, Paragraph } = Typography

export default function AccountSuspendedPage() {
  const navigate = useNavigate()
  const { logout } = useAuthStore()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <Card
      style={{ width: '100%', maxWidth: '28em', borderRadius: '1em', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}
      variant="borderless"
    >
      <div style={{ textAlign: 'center', padding: '1em 0' }}>
        <StopOutlined style={{ fontSize: '3em', color: '#f5222d', marginBottom: '0.4em' }} />
        <Title level={3} style={{ color: '#f5222d' }}>Tài Khoản Bị Tạm Khóa</Title>
        <Paragraph type="secondary">
          Tài khoản nhà cung cấp của bạn đã bị tạm khóa. Vui lòng liên hệ bộ phận hỗ trợ để
          biết thêm chi tiết.
        </Paragraph>
        <Button danger onClick={handleLogout} size="large" style={{ marginTop: '0.5em' }}>
          Đăng xuất
        </Button>
      </div>
    </Card>
  )
}
