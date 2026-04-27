import { Card, Typography } from 'antd'
import { ShopOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

export default function RegisterPage() {
  return (
    <Card style={{ width: '100%', maxWidth: '32em', borderRadius: '1em' }} variant="borderless">
      <div style={{ textAlign: 'center', marginBottom: '1.5em' }}>
        <ShopOutlined style={{ fontSize: '2.5em', color: '#4a9b6f' }} />
        <Title level={3} style={{ marginTop: '0.3em', marginBottom: '0.1em' }}>
          Đăng Ký Nhà Cung Cấp
        </Title>
        <Text type="secondary">Tạo tài khoản và gửi hồ sơ chứng minh</Text>
      </div>
      <Text type="secondary" style={{ fontSize: '0.9em' }}>
        — Trang đăng ký (Task 3) —
      </Text>
    </Card>
  )
}
