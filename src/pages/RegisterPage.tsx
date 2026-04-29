import { useState } from 'react'
import {
  Alert,
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  Select,
  Steps,
  Typography,
} from 'antd'
import {
  BankOutlined,
  CheckCircleOutlined,
  ShopOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { useMutation } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import dayjs, { type Dayjs } from 'dayjs'
import { registerProvider, type Gender } from '@/services/provider.service'

const { Title, Text } = Typography

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

const GENDERS = [
  { value: 'MALE', label: 'Nam' },
  { value: 'FEMALE', label: 'Nữ' },
  { value: 'OTHER', label: 'Khác' },
  { value: 'UNSPECIFIED', label: 'Không xác định' },
]

interface Step1Values {
  fName: string
  lName: string
  email: string
  password: string
  confirmPassword: string
  dob: Dayjs
  pNum: string
  gender: Gender
}

interface Step2Values {
  bankId: string
  bankNum: string
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(0)
  const [step1Form] = Form.useForm<Step1Values>()
  const [step2Form] = Form.useForm<Step2Values>()
  const [step1Data, setStep1Data] = useState<Step1Values | null>(null)
  const [step2Data, setStep2Data] = useState<Step2Values | null>(null)

  const { mutate, isPending, isSuccess, error, reset } = useMutation({
    mutationFn: () => {
      if (!step1Data || !step2Data) throw new Error('Thiếu dữ liệu')
      return registerProvider({
        email: step1Data.email,
        password: step1Data.password,
        fName: step1Data.fName,
        lName: step1Data.lName,
        dob: dayjs(step1Data.dob).format('YYYY-MM-DD'),
        pNum: step1Data.pNum,
        gender: step1Data.gender,
        bankId: step2Data.bankId,
        bankNum: step2Data.bankNum,
      })
    },
    onSuccess: () => {
      setTimeout(() => navigate('/login?registered=1'), 3000)
    },
  })

  async function nextStep1() {
    try {
      const values = await step1Form.validateFields()
      setStep1Data(values)
      reset()
      setCurrentStep(1)
    } catch {}
  }

  async function nextStep2() {
    try {
      const values = await step2Form.validateFields()
      setStep2Data(values)
      reset()
      setCurrentStep(2)
    } catch {}
  }

  const selectedBank = BANKS.find((b) => b.value === step2Data?.bankId)
  const selectedGender = GENDERS.find((g) => g.value === step1Data?.gender)

  return (
    <Card
      style={{
        width: '100%',
        maxWidth: '36em',
        borderRadius: '1em',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
      }}
      variant="borderless"
    >
      {/* Header */}
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
          <ShopOutlined style={{ fontSize: '1.6em', color: '#4a9b6f' }} />
        </div>
        <Title level={3} style={{ marginBottom: '0.1em' }}>
          Đăng Ký Nhà Cung Cấp
        </Title>
        <Text type="secondary">Điền thông tin để gửi yêu cầu trở thành nhà cung cấp</Text>
      </div>

      {/* Step indicator */}
      <Steps
        current={currentStep}
        size="small"
        style={{ marginBottom: '2em' }}
        items={[
          { title: 'Tài khoản', icon: <UserOutlined /> },
          { title: 'Ngân hàng', icon: <BankOutlined /> },
          { title: 'Xác nhận', icon: <CheckCircleOutlined /> },
        ]}
      />

      {/* Success alert */}
      {isSuccess && (
        <Alert
          message="Yêu cầu đã được gửi, chờ xét duyệt"
          description="Tài khoản của bạn đang được tạo. Bạn sẽ được chuyển đến trang đăng nhập..."
          type="success"
          showIcon
          style={{ marginBottom: '1.2em', borderRadius: '0.5em' }}
        />
      )}

      {/* Error alert */}
      {error && !isSuccess && (
        <Alert
          message="Đăng ký thất bại"
          description="Email đã được sử dụng hoặc có lỗi xảy ra. Vui lòng kiểm tra lại."
          type="error"
          showIcon
          style={{ marginBottom: '1.2em', borderRadius: '0.5em' }}
        />
      )}

      {/* Step 1 — Account info */}
      {currentStep === 0 && (
        <Form form={step1Form} layout="vertical" size="large">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1em' }}>
            <Form.Item
              name="fName"
              label="Họ"
              rules={[{ required: true, message: 'Vui lòng nhập họ' }]}
            >
              <Input placeholder="Nguyễn" />
            </Form.Item>
            <Form.Item
              name="lName"
              label="Tên"
              rules={[{ required: true, message: 'Vui lòng nhập tên' }]}
            >
              <Input placeholder="Văn A" />
            </Form.Item>
          </div>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Vui lòng nhập email' },
              { type: 'email', message: 'Email không hợp lệ' },
            ]}
          >
            <Input placeholder="example@email.com" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Mật khẩu"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu' },
              { min: 6, message: 'Mật khẩu tối thiểu 6 ký tự' },
            ]}
          >
            <Input.Password placeholder="Nhập mật khẩu" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Xác nhận mật khẩu"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Vui lòng xác nhận mật khẩu' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) return Promise.resolve()
                  return Promise.reject(new Error('Mật khẩu không khớp'))
                },
              }),
            ]}
          >
            <Input.Password placeholder="Nhập lại mật khẩu" />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1em' }}>
            <Form.Item
              name="dob"
              label="Ngày sinh"
              rules={[{ required: true, message: 'Vui lòng chọn ngày sinh' }]}
            >
              <DatePicker
                style={{ width: '100%' }}
                format="DD/MM/YYYY"
                placeholder="Chọn ngày"
                disabledDate={(d) => d.isAfter(dayjs())}
              />
            </Form.Item>
            <Form.Item
              name="gender"
              label="Giới tính"
              rules={[{ required: true, message: 'Vui lòng chọn' }]}
            >
              <Select placeholder="Chọn" options={GENDERS} />
            </Form.Item>
          </div>

          <Form.Item
            name="pNum"
            label="Số điện thoại"
            rules={[
              { required: true, message: 'Vui lòng nhập số điện thoại' },
              { pattern: /^0\d{9}$/, message: 'Số điện thoại không hợp lệ (VD: 0901234567)' },
            ]}
          >
            <Input placeholder="0901234567" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              block
              style={{ height: '2.8em', fontSize: '1em' }}
              onClick={nextStep1}
            >
              Tiếp theo
            </Button>
          </Form.Item>
        </Form>
      )}

      {/* Step 2 — Bank info */}
      {currentStep === 1 && (
        <Form form={step2Form} layout="vertical" size="large">
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
            <div style={{ display: 'flex', gap: '1em' }}>
              <Button
                block
                style={{ height: '2.8em' }}
                onClick={() => setCurrentStep(0)}
              >
                Quay lại
              </Button>
              <Button
                type="primary"
                block
                style={{ height: '2.8em' }}
                onClick={nextStep2}
              >
                Tiếp theo
              </Button>
            </div>
          </Form.Item>
        </Form>
      )}

      {/* Step 3 — Confirm & submit */}
      {currentStep === 2 && step1Data && step2Data && (
        <div>
          <div
            style={{
              background: '#f6ffed',
              border: '1px solid #b7eb8f',
              borderRadius: '0.75em',
              padding: '1.2em 1.4em',
              marginBottom: '1.5em',
            }}
          >
            <Text
              strong
              style={{ display: 'block', marginBottom: '1em', color: '#4a9b6f', fontSize: '1.05em' }}
            >
              Xác nhận thông tin đăng ký
            </Text>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.75em 1.5em',
              }}
            >
              <div>
                <Text type="secondary" style={{ fontSize: '0.85em' }}>Họ</Text>
                <br />
                <Text strong>{step1Data.fName}</Text>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: '0.85em' }}>Tên</Text>
                <br />
                <Text strong>{step1Data.lName}</Text>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: '0.85em' }}>Email</Text>
                <br />
                <Text strong>{step1Data.email}</Text>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: '0.85em' }}>Điện thoại</Text>
                <br />
                <Text strong>{step1Data.pNum}</Text>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: '0.85em' }}>Ngày sinh</Text>
                <br />
                <Text strong>{dayjs(step1Data.dob).format('DD/MM/YYYY')}</Text>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: '0.85em' }}>Giới tính</Text>
                <br />
                <Text strong>{selectedGender?.label}</Text>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: '0.85em' }}>Ngân hàng</Text>
                <br />
                <Text strong>{selectedBank?.label}</Text>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: '0.85em' }}>Số tài khoản</Text>
                <br />
                <Text strong>{step2Data.bankNum}</Text>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1em' }}>
            <Button
              block
              style={{ height: '2.8em' }}
              onClick={() => setCurrentStep(1)}
              disabled={isPending || isSuccess}
            >
              Quay lại
            </Button>
            <Button
              type="primary"
              block
              style={{ height: '2.8em', fontSize: '1em' }}
              loading={isPending}
              disabled={isSuccess}
              onClick={() => mutate()}
            >
              Gửi đăng ký
            </Button>
          </div>
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: '1.5em' }}>
        <Text type="secondary">Đã có tài khoản? </Text>
        <Link to="/login">Đăng nhập</Link>
      </div>
    </Card>
  )
}
