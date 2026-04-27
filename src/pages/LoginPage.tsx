import { Alert, Button, Card, Checkbox, Form, Input, Typography } from 'antd'
import { LockOutlined, MailOutlined, ShopOutlined } from '@ant-design/icons'
import { useMutation } from '@tanstack/react-query'
import { useNavigate, Link } from 'react-router-dom'
import { loginRequest } from '@/services/auth.service'
import { useAuthStore } from '@/store/authStore'

const { Title, Text } = Typography

interface LoginForm {
  email: string
  password: string
  remember: boolean
}

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuthStore()

  const { mutate, isPending, error } = useMutation({
    mutationFn: (values: LoginForm) =>
      loginRequest({ email: values.email, password: values.password }),
    onSuccess: (data) => {
      login(
        {
          id: data.detail.user.id,
          email: data.detail.user.email,
          roles: data.detail.roles,
          permissions: data.detail.permissions.split(','),
        },
        data.detail.accessToken,
      )
      navigate('/dashboard', { replace: true })
    },
  })

  const errorMessage = error
    ? 'Email hoặc mật khẩu không đúng. Vui lòng thử lại.'
    : null

  return (
    <Card
      style={{ width: '100%', maxWidth: '26em', borderRadius: '1em', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}
      variant="borderless"
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2em' }}>
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
          <ShopOutlined style={{ fontSize: '1.6em', color: '#4a9b6f' }} />
        </div>
        <Title level={3} style={{ marginBottom: '0.1em' }}>
          Nhà Cung Cấp
        </Title>
        <Text type="secondary">Đăng nhập để quản lý đơn hàng của bạn</Text>
      </div>

      {errorMessage && (
        <Alert
          message={errorMessage}
          type="error"
          showIcon
          style={{ marginBottom: '1.2em', borderRadius: '0.5em' }}
        />
      )}

      <Form<LoginForm>
        layout="vertical"
        initialValues={{ remember: true }}
        onFinish={(values) => mutate(values)}
        size="large"
      >
        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: 'Vui lòng nhập email' },
            { type: 'email', message: 'Email không hợp lệ' },
          ]}
        >
          <Input prefix={<MailOutlined />} placeholder="example@email.com" />
        </Form.Item>

        <Form.Item
          name="password"
          label="Mật khẩu"
          rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="Nhập mật khẩu" />
        </Form.Item>

        <Form.Item name="remember" valuePropName="checked" style={{ marginBottom: '1.2em' }}>
          <Checkbox>Nhớ đăng nhập</Checkbox>
        </Form.Item>

        <Form.Item style={{ marginBottom: '0.8em' }}>
          <Button
            type="primary"
            htmlType="submit"
            block
            loading={isPending}
            style={{ height: '2.8em', fontSize: '1em' }}
          >
            Đăng nhập
          </Button>
        </Form.Item>
      </Form>

      <div style={{ textAlign: 'center', marginTop: '0.5em' }}>
        <Text type="secondary">Chưa có tài khoản? </Text>
        <Link to="/register">Đăng ký ngay</Link>
      </div>
    </Card>
  )
}
