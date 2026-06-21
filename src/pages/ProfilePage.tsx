import { Avatar, Card, Descriptions, Tag, Typography, Spin, Alert } from 'antd'
import { UserOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { checkProviderMe } from '@/services/provider.service'

const { Title, Text } = Typography

const GENDER_LABEL: Record<string, string> = {
  MALE: 'Nam',
  FEMALE: 'Nữ',
  OTHER: 'Khác',
  UNSPECIFIED: 'Không xác định',
}

const VERIFICATION_STATUS_LABEL: Record<string, string> = {
  UNVERIFIED: 'Chưa xác minh',
  PENDING: 'Đang chờ',
  APPROVED: 'Đã xác minh',
  REJECTED: 'Bị từ chối',
  SUSPENDED: 'Đình chỉ',
}

const VERIFICATION_STATUS_COLOR: Record<string, string> = {
  UNVERIFIED: 'default',
  PENDING: 'orange',
  APPROVED: 'green',
  REJECTED: 'red',
  SUSPENDED: 'volcano',
}

export default function ProfilePage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['provider-me'],
    queryFn: checkProviderMe,
  })

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '3em' }}>
        <Spin size="large" />
      </div>
    )
  }

  if (isError || !data || data.type !== 'GOOD' || !data.detail) {
    return <Alert type="error" message="Không thể tải thông tin hồ sơ. Vui lòng thử lại." />
  }

  const p = data.detail
  const fullName = `${p.fName} ${p.lName}`.trim()
  const statusLabel = VERIFICATION_STATUS_LABEL[p.verificationStatus] ?? p.verificationStatus
  const statusColor = VERIFICATION_STATUS_COLOR[p.verificationStatus] ?? 'default'

  return (
    <div>
      <Title level={4} style={{ marginBottom: '1em' }}>Hồ sơ</Title>
      <Card variant="borderless" style={{ borderRadius: '0.75em', maxWidth: '45em' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1em', marginBottom: '1.5em' }}>
          <Avatar
            size={72}
            src={p.avtUrl || undefined}
            icon={!p.avtUrl ? <UserOutlined /> : undefined}
            style={{ background: '#4a9b6f', flexShrink: 0 }}
          />
          <div>
            <Title level={5} style={{ marginBottom: 0 }}>{fullName}</Title>
            <Text type="secondary">{p.email}</Text>
            <div style={{ marginTop: '0.4em' }}>
              <Tag color={statusColor}>{statusLabel}</Tag>
            </div>
          </div>
        </div>

        <Descriptions column={1} size="middle" labelStyle={{ fontWeight: 500 }}>
          <Descriptions.Item label="Họ và tên">{fullName}</Descriptions.Item>
          <Descriptions.Item label="Email">{p.email}</Descriptions.Item>
          <Descriptions.Item label="Số điện thoại">{p.pNum}</Descriptions.Item>
          <Descriptions.Item label="Ngày sinh">{p.dob}</Descriptions.Item>
          <Descriptions.Item label="Giới tính">{GENDER_LABEL[p.gender] ?? p.gender}</Descriptions.Item>
          {/* <Descriptions.Item label="Tên cơ sở">{p.facilityName ?? '—'}</Descriptions.Item> */}
          {/* <Descriptions.Item label="Địa chỉ">{p.address ?? '—'}</Descriptions.Item> */}
          {/* <Descriptions.Item label="Sản phẩm cung cấp">{p.productsSupplied ?? '—'}</Descriptions.Item> */}
          <Descriptions.Item label="Ngân hàng">{p.bankId}</Descriptions.Item>
          <Descriptions.Item label="Số tài khoản">{p.bankNum}</Descriptions.Item>
          <Descriptions.Item label="Điểm uy tín">{p.reputationPoint}</Descriptions.Item>
          <Descriptions.Item label="Phương thức xác minh">{p.verificationMethod}</Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  )
}
