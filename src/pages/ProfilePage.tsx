import { Avatar, Card, Descriptions, Tag, Typography } from 'antd'
import { UserOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

export default function ProfilePage() {
  return (
    <div>
      <Title level={4} style={{ marginBottom: '1em' }}>Hồ sơ</Title>
      <Card variant="borderless" style={{ borderRadius: '0.75em', maxWidth: '40em' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1em', marginBottom: '1.5em' }}>
          <Avatar size={64} icon={<UserOutlined />} style={{ background: '#4a9b6f' }} />
          <div>
            <Title level={5} style={{ marginBottom: 0 }}>Nguyễn Văn A</Title>
            <Text type="secondary">nguyenvana@email.com</Text>
            <div style={{ marginTop: '0.3em' }}>
              <Tag color="green">Đã xác minh</Tag>
            </div>
          </div>
        </div>
        <Descriptions column={1} size="middle">
          <Descriptions.Item label="Họ và tên">Nguyễn Văn A</Descriptions.Item>
          <Descriptions.Item label="Số điện thoại">0901 234 567</Descriptions.Item>
          <Descriptions.Item label="Email">nguyenvana@email.com</Descriptions.Item>
          <Descriptions.Item label="Tên cơ sở">Trang trại rau sạch Văn A</Descriptions.Item>
          <Descriptions.Item label="Địa chỉ">123 Đường Nông Nghiệp, TP. HCM</Descriptions.Item>
          <Descriptions.Item label="Sản phẩm cung cấp">Rau củ, Thịt, Hải sản</Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  )
}
