import { useState } from 'react'
import { Alert, Button, Card, Form, Input, Select, Tabs, Typography } from 'antd'
import { BankOutlined, LinkOutlined, LogoutOutlined, UserAddOutlined } from '@ant-design/icons'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { linkProvider, checkProviderMeWithRetry, getMyStatus, type VerificationStatus } from '@/services/provider.service'
import { useAuthStore } from '@/store/authStore'

const { Title, Text, Paragraph } = Typography

const BANKS = [
  { value: 'VIETCOMBANK', label: 'Vietcombank' },
  { value: 'VIETINBANK', label: 'VietinBank' },
  { value: 'BIDV', label: 'BIDV' },
  { value: 'AGRIBANK', label: 'Agribank' },
  { value: 'TECHCOMBANK', label: 'Techcombank' },
  { value: 'ACB', label: 'ACB' },
  { value: 'MBBANK', label: 'MB Bank' },
  { value: 'SACOMBANK', label: 'Sacombank' },
  { value: 'VPBANK', label: 'VPBank' },
  { value: 'TPBANK', label: 'TPBank' },
  { value: 'SHB', label: 'SHB' },
  { value: 'OCB', label: 'OCB' },
  { value: 'HDBANK', label: 'HDBank' },
  { value: 'EXIMBANK', label: 'Eximbank' },
]

const STATUS_ROUTES: Record<VerificationStatus, string> = {
  APPROVED:   '/dashboard',
  UNVERIFIED: '/upload-evidence',
  PENDING:    '/my-submissions',
  REJECTED:   '/my-submissions',
  SUSPENDED:  '/account-suspended',
}

interface LinkForm {
  bankId: string
  bankNum: string
}

export default function BecomeProviderPage() {
  const navigate = useNavigate()
  const { logout } = useAuthStore()
  const [form] = Form.useForm<LinkForm>()
  const [linking, setLinking] = useState(false)
  const [linkError, setLinkError] = useState<string | null>(null)

  const { mutate } = useMutation({
    mutationFn: (values: LinkForm) => linkProvider(values),
    onMutate: () => {
      setLinkError(null)
      setLinking(true)
    },
    onSuccess: async () => {
      // Wait 1.5 s for the Kafka event to be consumed by back-office
      await new Promise<void>((resolve) => setTimeout(resolve, 1500))

      try {
        // Retry up to 3 times (1 s apart) in case the provider profile is still being created
        const me = await checkProviderMeWithRetry(3)

        if (me.type !== 'GOOD' || me.detail === null) {
          setLinkError(
            'Liên kết thành công, nhưng hồ sơ nhà cung cấp chưa sẵn sàng. Vui lòng đăng nhập lại sau ít phút.',
          )
          setLinking(false)
          return
        }

        const statusRes = await getMyStatus()
        const dest = STATUS_ROUTES[statusRes.detail.verificationStatus]
        navigate(dest, {
          replace: true,
          state: { providerStatus: statusRes.detail },
        })
      } catch {
        setLinkError('Có lỗi xảy ra khi kiểm tra trạng thái. Vui lòng thử đăng nhập lại.')
        setLinking(false)
      }
    },
    onError: () => {
      setLinkError('Liên kết thất bại. Vui lòng kiểm tra lại thông tin hoặc đăng nhập lại.')
      setLinking(false)
    },
  })

  return (
    <Card
      style={{
        width: '100%',
        maxWidth: '32em',
        borderRadius: '1em',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
      }}
      variant="borderless"
    >
      <div style={{ textAlign: 'center', marginBottom: '1.5em' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '3.5em',
            height: '3.5em',
            borderRadius: '50%',
            background: '#eaf5ee',
            marginBottom: '0.75em',
          }}
        >
          <BankOutlined style={{ fontSize: '1.6em', color: '#4a9b6f' }} />
        </div>
        <Title level={3} style={{ marginBottom: '0.1em' }}>
          Trở Thành Nhà Cung Cấp
        </Title>
        <Text type="secondary">Tài khoản của bạn chưa được liên kết với hồ sơ nhà cung cấp</Text>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5em' }}>
        <Button
          icon={<LogoutOutlined />}
          type="text"
          danger
          onClick={() => { logout(); navigate('/login', { replace: true }) }}
        >
          Đăng xuất
        </Button>
      </div>

      {linkError && (
        <Alert
          message={linkError}
          type="error"
          showIcon
          style={{ marginBottom: '1.2em', borderRadius: '0.5em' }}
        />
      )}

      <Tabs
        defaultActiveKey="link"
        centered
        items={[
          {
            key: 'link',
            label: (
              <span>
                <LinkOutlined /> Tôi đã có tài khoản
              </span>
            ),
            children: (
              <div>
                <Paragraph type="secondary" style={{ marginBottom: '1.2em' }}>
                  Nếu bạn đã đăng ký làm nhà cung cấp trên hệ thống khác, hãy liên kết tài khoản
                  ngân hàng để hoàn tất.
                </Paragraph>

                <Form form={form} layout="vertical" size="large" onFinish={(v) => mutate(v)}>
                  <Form.Item
                    name="bankId"
                    label="Ngân hàng"
                    rules={[{ required: true, message: 'Vui lòng chọn ngân hàng' }]}
                  >
                    <Select
                      placeholder="Chọn ngân hàng"
                      options={BANKS}
                      showSearch
                      optionFilterProp="label"
                    />
                  </Form.Item>

                  <Form.Item
                    name="bankNum"
                    label="Số tài khoản ngân hàng"
                    rules={[
                      { required: true, message: 'Vui lòng nhập số tài khoản' },
                      { pattern: /^\d{6,20}$/, message: 'Số tài khoản chỉ gồm chữ số (6–20 ký tự)' },
                    ]}
                  >
                    <Input placeholder="Nhập số tài khoản" />
                  </Form.Item>

                  <Form.Item style={{ marginBottom: 0 }}>
                    <Button
                      type="primary"
                      htmlType="submit"
                      block
                      loading={linking}
                      style={{ height: '2.8em', fontSize: '1em' }}
                    >
                      {linking ? 'Đang liên kết và xác minh...' : 'Liên kết tài khoản'}
                    </Button>
                  </Form.Item>
                </Form>
              </div>
            ),
          },
          {
            key: 'register',
            label: (
              <span>
                <UserAddOutlined /> Tôi chưa có tài khoản
              </span>
            ),
            children: (
              <div style={{ textAlign: 'center', padding: '1em 0' }}>
                <Paragraph type="secondary">
                  Bạn chưa đăng ký làm nhà cung cấp? Hãy tạo tài khoản mới để bắt đầu quy trình
                  xét duyệt.
                </Paragraph>
                <Button
                  type="primary"
                  size="large"
                  style={{ height: '2.8em', fontSize: '1em', width: '100%' }}
                  onClick={() => navigate('/register')}
                >
                  Đăng ký tài khoản mới
                </Button>
              </div>
            ),
          },
        ]}
      />
    </Card>
  )
}
