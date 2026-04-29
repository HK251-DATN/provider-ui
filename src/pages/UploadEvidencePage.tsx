import { useState } from 'react'
import {
  Alert,
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  Progress,
  Select,
  Tabs,
  Typography,
  Upload,
  type UploadFile,
} from 'antd'
import { FileProtectOutlined, InboxOutlined, VideoCameraOutlined } from '@ant-design/icons'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import dayjs, { type Dayjs } from 'dayjs'
import { uploadCertificate, createVideoRecord, uploadVideoFile, getMyStatus } from '@/services/provider.service'

const { Title, Text } = Typography
const { TextArea } = Input

const CERT_TYPES = [
  { value: 'VIETGAP',           label: 'VietGAP (trồng trọt)' },
  { value: 'VIETGAP_LIVESTOCK', label: 'VietGAP (chăn nuôi)' },
  { value: 'GLOBALGAP',         label: 'GlobalGAP' },
  { value: 'HACCP',             label: 'HACCP' },
  { value: 'ISO_22000',         label: 'ISO 22000' },
  { value: 'OCOP',              label: 'OCOP (Mỗi xã một sản phẩm)' },
  { value: 'ATTP_MOH',          label: 'An toàn thực phẩm — Bộ Y tế' },
  { value: 'ATTP_MARD',         label: 'An toàn thực phẩm — Bộ Nông nghiệp' },
]

const VIDEO_TYPES = [
  { value: 'WORKING_ENVIRONMENT', label: 'Môi trường làm việc chung' },
  { value: 'GARDEN_FARM',         label: 'Vườn / trang trại' },
  { value: 'MEAT_PROCESSING',     label: 'Khu giết mổ / chế biến thịt' },
  { value: 'VEGETABLE_HARVEST',   label: 'Thu hoạch rau củ' },
  { value: 'STORAGE_FACILITY',    label: 'Kho / thiết bị bảo quản lạnh' },
  { value: 'OTHER',               label: 'Khác' },
]

interface CertForm {
  certificateType: string
  certificateNumber: string
  issuingAuthority: string
  issuedDate: Dayjs
  expiryDate?: Dayjs
}

interface VideoForm {
  videoType: string
  description?: string
}

export default function UploadEvidencePage() {
  const navigate = useNavigate()
  const [certForm] = Form.useForm<CertForm>()
  const [videoForm] = Form.useForm<VideoForm>()
  const [certFile, setCertFile] = useState<UploadFile | null>(null)
  const [videoFile, setVideoFile] = useState<UploadFile | null>(null)
  const [certFileError, setCertFileError] = useState(false)
  const [videoFileError, setVideoFileError] = useState(false)
  const [videoUploadPhase, setVideoUploadPhase] = useState<'idle' | 'creating' | 'uploading' | 'done'>('idle')
  const [videoUploadPercent, setVideoUploadPercent] = useState(0)

  async function afterUpload() {
    const statusRes = await getMyStatus()
    navigate('/my-submissions', {
      replace: true,
      state: { providerStatus: statusRes.detail },
    })
  }

  const certMutation = useMutation({
    mutationFn: async (values: CertForm) => {
      if (!certFile?.originFileObj) {
        setCertFileError(true)
        throw new Error('no file')
      }
      const fd = new FormData()
      fd.append('certificateType', values.certificateType)
      fd.append('certificateNumber', values.certificateNumber)
      fd.append('issuingAuthority', values.issuingAuthority)
      fd.append('issuedDate', dayjs(values.issuedDate).format('YYYY-MM-DD'))
      if (values.expiryDate) {
        fd.append('expiryDate', dayjs(values.expiryDate).format('YYYY-MM-DD'))
      }
      fd.append('file', certFile.originFileObj)
      return uploadCertificate(fd)
    },
    onSuccess: afterUpload,
  })

  const videoMutation = useMutation({
    mutationFn: async (values: VideoForm) => {
      if (!videoFile?.originFileObj) {
        setVideoFileError(true)
        throw new Error('no file')
      }

      // Step 1 — save metadata, get videoId
      setVideoUploadPhase('creating')
      const createRes = await createVideoRecord({
        videoType: values.videoType,
        description: values.description,
      })
      const videoId = createRes.detail.videoId

      // Step 2 — transfer the file with progress tracking
      setVideoUploadPhase('uploading')
      setVideoUploadPercent(0)
      const uploadRes = await uploadVideoFile(videoId, videoFile.originFileObj, (pct) => {
        setVideoUploadPercent(pct)
      })

      setVideoUploadPhase('done')
      return uploadRes
    },
    onSuccess: afterUpload,
    onError: () => {
      setVideoUploadPhase('idle')
      setVideoUploadPercent(0)
    },
  })

  const videoSubmitting = videoMutation.isPending
  const showVideoProgress = videoUploadPhase === 'creating' || videoUploadPhase === 'uploading'

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
          <FileProtectOutlined style={{ fontSize: '1.6em', color: '#4a9b6f' }} />
        </div>
        <Title level={3} style={{ marginBottom: '0.1em' }}>
          Tải Lên Hồ Sơ Chứng Minh
        </Title>
        <Text type="secondary">
          Tải lên chứng chỉ hoặc video thực tế để được xét duyệt trở thành nhà cung cấp
        </Text>
      </div>

      <Tabs
        defaultActiveKey="certificate"
        centered
        items={[
          {
            key: 'certificate',
            label: (
              <span>
                <FileProtectOutlined /> Chứng chỉ
              </span>
            ),
            children: (
              <div>
                {certMutation.isError && !(certMutation.error as Error).message.includes('no file') && (
                  <Alert
                    message="Tải lên thất bại. Vui lòng thử lại."
                    type="error"
                    showIcon
                    style={{ marginBottom: '1em', borderRadius: '0.5em' }}
                  />
                )}

                <Form
                  form={certForm}
                  layout="vertical"
                  size="large"
                  onFinish={(v) => { setCertFileError(false); certMutation.mutate(v) }}
                >
                  <Form.Item
                    name="certificateType"
                    label="Loại chứng chỉ"
                    rules={[{ required: true, message: 'Vui lòng chọn loại chứng chỉ' }]}
                  >
                    <Select placeholder="Chọn loại chứng chỉ" options={CERT_TYPES} />
                  </Form.Item>

                  <Form.Item
                    name="certificateNumber"
                    label="Số chứng chỉ"
                    rules={[{ required: true, message: 'Vui lòng nhập số chứng chỉ' }]}
                  >
                    <Input placeholder="VD: VG-2024-001234" />
                  </Form.Item>

                  <Form.Item
                    name="issuingAuthority"
                    label="Cơ quan cấp"
                    rules={[{ required: true, message: 'Vui lòng nhập tên cơ quan cấp' }]}
                  >
                    <Input placeholder="VD: Cục Trồng trọt" />
                  </Form.Item>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1em' }}>
                    <Form.Item
                      name="issuedDate"
                      label="Ngày cấp"
                      rules={[{ required: true, message: 'Vui lòng chọn ngày cấp' }]}
                    >
                      <DatePicker
                        style={{ width: '100%' }}
                        format="DD/MM/YYYY"
                        placeholder="Chọn ngày"
                        disabledDate={(d) => d.isAfter(dayjs())}
                      />
                    </Form.Item>

                    <Form.Item name="expiryDate" label="Ngày hết hạn (nếu có)">
                      <DatePicker
                        style={{ width: '100%' }}
                        format="DD/MM/YYYY"
                        placeholder="Không bắt buộc"
                        disabledDate={(d) => d.isBefore(dayjs())}
                      />
                    </Form.Item>
                  </div>

                  <Form.Item label="File chứng chỉ (ảnh hoặc PDF)" required>
                    <Upload.Dragger
                      accept=".jpg,.jpeg,.png,.pdf"
                      maxCount={1}
                      beforeUpload={(file) => {
                        setCertFile({ uid: file.uid, name: file.name, originFileObj: file } as UploadFile)
                        setCertFileError(false)
                        return false
                      }}
                      onRemove={() => setCertFile(null)}
                      fileList={certFile ? [certFile] : []}
                      style={{ borderColor: certFileError ? '#ff4d4f' : undefined }}
                    >
                      <p className="ant-upload-drag-icon">
                        <InboxOutlined style={{ color: '#4a9b6f' }} />
                      </p>
                      <p style={{ margin: '0.3em 0' }}>Kéo thả hoặc click để chọn file</p>
                      <p style={{ fontSize: '0.85em', color: '#999' }}>JPG, PNG, PDF — tối đa 10 MB</p>
                    </Upload.Dragger>
                    {certFileError && (
                      <Text type="danger" style={{ fontSize: '0.85em' }}>
                        Vui lòng chọn file chứng chỉ
                      </Text>
                    )}
                  </Form.Item>

                  <Form.Item style={{ marginBottom: 0 }}>
                    <Button
                      type="primary"
                      htmlType="submit"
                      block
                      loading={certMutation.isPending}
                      style={{ height: '2.8em', fontSize: '1em' }}
                    >
                      Gửi chứng chỉ
                    </Button>
                  </Form.Item>
                </Form>
              </div>
            ),
          },
          {
            key: 'video',
            label: (
              <span>
                <VideoCameraOutlined /> Video thực tế
              </span>
            ),
            children: (
              <div>
                <Alert
                  message="Dành cho nhà cung cấp chưa có chứng chỉ chính thức"
                  description="Quay video thực tế về vườn, chuồng trại, hoặc kho bảo quản để minh chứng chất lượng sản phẩm."
                  type="info"
                  showIcon
                  style={{ marginBottom: '1em', borderRadius: '0.5em' }}
                />

                {videoMutation.isError && !(videoMutation.error as Error).message.includes('no file') && (
                  <Alert
                    message="Tải lên thất bại. Vui lòng thử lại."
                    type="error"
                    showIcon
                    style={{ marginBottom: '1em', borderRadius: '0.5em' }}
                  />
                )}

                <Form
                  form={videoForm}
                  layout="vertical"
                  size="large"
                  onFinish={(v) => { setVideoFileError(false); videoMutation.mutate(v) }}
                >
                  <Form.Item
                    name="videoType"
                    label="Loại video"
                    rules={[{ required: true, message: 'Vui lòng chọn loại video' }]}
                  >
                    <Select placeholder="Chọn loại video" options={VIDEO_TYPES} />
                  </Form.Item>

                  <Form.Item name="description" label="Mô tả nội dung video (không bắt buộc)">
                    <TextArea
                      placeholder="VD: Vườn rau hữu cơ tại Đà Lạt, tưới bằng nước giếng sạch"
                      rows={3}
                    />
                  </Form.Item>

                  <Form.Item label="File video" required>
                    <Upload.Dragger
                      accept="video/*"
                      maxCount={1}
                      disabled={videoSubmitting}
                      beforeUpload={(file) => {
                        setVideoFile({ uid: file.uid, name: file.name, originFileObj: file } as UploadFile)
                        setVideoFileError(false)
                        return false
                      }}
                      onRemove={() => setVideoFile(null)}
                      fileList={videoFile ? [videoFile] : []}
                      style={{ borderColor: videoFileError ? '#ff4d4f' : undefined }}
                    >
                      <p className="ant-upload-drag-icon">
                        <InboxOutlined style={{ color: '#4a9b6f' }} />
                      </p>
                      <p style={{ margin: '0.3em 0' }}>Kéo thả hoặc click để chọn video</p>
                      <p style={{ fontSize: '0.85em', color: '#999' }}>MP4, MOV, AVI — tối đa 200 MB</p>
                    </Upload.Dragger>
                    {videoFileError && (
                      <Text type="danger" style={{ fontSize: '0.85em' }}>
                        Vui lòng chọn file video
                      </Text>
                    )}
                  </Form.Item>

                  {/* Upload progress — only visible while submitting */}
                  {showVideoProgress && (
                    <div style={{ marginBottom: '1em' }}>
                      <Text type="secondary" style={{ fontSize: '0.88em' }}>
                        {videoUploadPhase === 'creating'
                          ? 'Đang lưu thông tin...'
                          : `Đang tải lên video — ${videoUploadPercent}%`}
                      </Text>
                      <Progress
                        percent={videoUploadPhase === 'uploading' ? videoUploadPercent : 0}
                        status="active"
                        strokeColor="#4a9b6f"
                        style={{ marginTop: '0.3em' }}
                      />
                    </div>
                  )}

                  <Form.Item style={{ marginBottom: 0 }}>
                    <Button
                      type="primary"
                      htmlType="submit"
                      block
                      loading={videoSubmitting}
                      disabled={videoSubmitting}
                      style={{ height: '2.8em', fontSize: '1em' }}
                    >
                      {videoSubmitting ? 'Đang xử lý...' : 'Gửi video'}
                    </Button>
                  </Form.Item>
                </Form>
              </div>
            ),
          },
        ]}
      />
    </Card>
  )
}
