import { useRef, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Alert,
  Button,
  Card,
  Modal,
  Popconfirm,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd'
import {
  ClockCircleOutlined,
  DeleteOutlined,
  EyeOutlined,
  FileProtectOutlined,
  PlusOutlined,
  VideoCameraOutlined,
  WarningOutlined,
  LogoutOutlined,
} from '@ant-design/icons'
import { useMutation } from '@tanstack/react-query'
import {
  deleteCertificate,
  deleteVideo,
  getMyStatus,
  type Certificate,
  type ProviderStatusResponse,
  type Video,
  type VerificationStatus,
} from '@/services/provider.service'
import { useAuthStore } from '@/store/authStore'

const { Title, Text } = Typography

type StatusDetail = ProviderStatusResponse['detail']

interface PreviewState {
  open: boolean
  kind: 'cert' | 'video'
  url: string
  title: string
}

const PROVIDER_STATUS_INFO: Record<VerificationStatus, { label: string; color: string }> = {
  PENDING:    { label: 'Đang chờ xét duyệt', color: 'orange' },
  REJECTED:   { label: 'Bị từ chối — cần nộp lại', color: 'red' },
  UNVERIFIED: { label: 'Chưa xác minh', color: 'default' },
  APPROVED:   { label: 'Đã duyệt', color: 'green' },
  SUSPENDED:  { label: 'Bị tạm khóa', color: 'red' },
}

const ITEM_STATUS_INFO: Record<string, { label: string; color: string }> = {
  PENDING:  { label: 'Chờ duyệt', color: 'orange' },
  APPROVED: { label: 'Đã duyệt', color: 'green' },
  REJECTED: { label: 'Bị từ chối', color: 'red' },
}

const CERT_TYPE_LABELS: Record<string, string> = {
  VIETGAP:           'VietGAP (trồng trọt)',
  VIETGAP_LIVESTOCK: 'VietGAP (chăn nuôi)',
  GLOBALGAP:         'GlobalGAP',
  HACCP:             'HACCP',
  ISO_22000:         'ISO 22000',
  OCOP:              'OCOP',
  ATTP_MOH:          'ATTP — Bộ Y tế',
  ATTP_MARD:         'ATTP — Bộ Nông nghiệp',
}

const VIDEO_TYPE_LABELS: Record<string, string> = {
  WORKING_ENVIRONMENT: 'Môi trường làm việc',
  GARDEN_FARM:         'Vườn / trang trại',
  MEAT_PROCESSING:     'Khu giết mổ / chế biến',
  VEGETABLE_HARVEST:   'Thu hoạch rau củ',
  STORAGE_FACILITY:    'Kho / bảo quản lạnh',
  OTHER:               'Khác',
}

function isPdf(url: string) {
  return url.toLowerCase().split('?')[0].endsWith('.pdf')
}

export default function MySubmissionsPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const initial = (location.state as { providerStatus?: StatusDetail } | null)?.providerStatus
  const [providerStatus, setProviderStatus] = useState<StatusDetail | undefined>(initial)
  const [preview, setPreview] = useState<PreviewState>({ open: false, kind: 'cert', url: '', title: '' })

  const verificationStatus = providerStatus?.verificationStatus ?? 'PENDING'
  const statusInfo = PROVIDER_STATUS_INFO[verificationStatus]
  const isRejected = verificationStatus === 'REJECTED'

  async function refetch() {
    const res = await getMyStatus()
    setProviderStatus(res.detail)
  }

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  const STATUS_ROUTES: Record<VerificationStatus, string> = {
    APPROVED:   '/dashboard',
    UNVERIFIED: '/upload-evidence',
    PENDING:    '/my-submissions',
    REJECTED:   '/my-submissions',
    SUSPENDED:  '/account-suspended',
  }

  useEffect(() => {
    if (verificationStatus === 'APPROVED' || verificationStatus === 'SUSPENDED') return

    pollingRef.current = setInterval(async () => {
      try {
        const res = await getMyStatus()
        const newStatus = res.detail.verificationStatus

        if (newStatus !== verificationStatus) {
          setProviderStatus(res.detail)
          message.info(`Trạng thái mới: ${PROVIDER_STATUS_INFO[newStatus]?.label ?? newStatus}`)

          if (newStatus === 'APPROVED' || newStatus === 'SUSPENDED') {
            if (pollingRef.current) clearInterval(pollingRef.current)
            navigate(STATUS_ROUTES[newStatus], {
              replace: true,
              state: { providerStatus: res.detail },
            })
          }
        }
      } catch {
      }
    }, 5000)

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [verificationStatus])

  function openCertPreview(cert: Certificate) {
    setPreview({
      open: true,
      kind: 'cert',
      url: cert.documentUrl,
      title: CERT_TYPE_LABELS[cert.certificateType] ?? cert.certificateType,
    })
  }

  function openVideoPreview(vid: Video) {
    setPreview({
      open: true,
      kind: 'video',
      url: vid.videoUrl,
      title: VIDEO_TYPE_LABELS[vid.videoType] ?? vid.videoType,
    })
  }

  useEffect(() => {
    refetch()
  }, [])

  const deleteCertMutation = useMutation({
    mutationFn: (id: number) => deleteCertificate(id),
    onSuccess: refetch,
  })

  const deleteVideoMutation = useMutation({
    mutationFn: (id: number) => deleteVideo(id),
    onSuccess: refetch,
  })

  const certs: Certificate[] = providerStatus?.certificates ?? []
  const videos: Video[] = providerStatus?.videos ?? []
  const isEmpty = certs.length === 0 && videos.length === 0

  return (
    <>
      <Card
        style={{
          width: '100%',
          maxWidth: '40em',
          borderRadius: '1em',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        }}
        variant="borderless"
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.2em', position: 'relative' }}>
          <Button
            icon={<LogoutOutlined />}
            size="small"
            style={{ position: 'absolute', right: 0, top: 0 }}
            onClick={handleLogout}
          >
            Đăng xuất
          </Button>
          <ClockCircleOutlined
            style={{ fontSize: '2.5em', color: isRejected ? '#f5222d' : '#fa8c16', marginBottom: '0.3em' }}
          />
          <Title level={3} style={{ marginBottom: '0.3em' }}>
            Hồ Sơ Của Tôi
          </Title>
          <Tag color={statusInfo.color} style={{ fontSize: '0.95em', padding: '0.2em 0.8em' }}>
            {statusInfo.label}
          </Tag>
        </div>

        {/* Rejection notice */}
        {isRejected && (
          <Alert
            icon={<WarningOutlined />}
            message="Hồ sơ bị từ chối"
            description="Một hoặc nhiều tài liệu không được chấp nhận. Hãy xem lý do bên dưới, xóa tài liệu không hợp lệ và tải lên lại."
            type="error"
            showIcon
            style={{ marginBottom: '1.2em', borderRadius: '0.5em' }}
          />
        )}

        {/* Certificates */}
        {certs.length > 0 && (
          <div style={{ marginBottom: '1em' }}>
            <Text strong style={{ fontSize: '1em', display: 'flex', alignItems: 'center', gap: '0.4em', marginBottom: '0.6em' }}>
              <FileProtectOutlined /> Chứng chỉ ({certs.length})
            </Text>
            {certs.map((cert) => {
              const itemStatus = ITEM_STATUS_INFO[cert.status] ?? ITEM_STATUS_INFO['PENDING']
              return (
                <Card
                  key={cert.certificateId}
                  size="small"
                  style={{
                    marginBottom: '0.75em',
                    borderRadius: '0.5em',
                    borderColor: cert.status === 'REJECTED' ? '#ffccc7' : undefined,
                    background: cert.status === 'REJECTED' ? '#fff2f0' : undefined,
                  }}
                  extra={
                    <div style={{ display: 'flex', gap: '0.2em' }}>
                      <Tooltip title="Xem tài liệu">
                        <Button
                          type="text"
                          icon={<EyeOutlined />}
                          size="small"
                          onClick={() => openCertPreview(cert)}
                        />
                      </Tooltip>
                      <Popconfirm
                        title="Xóa chứng chỉ này?"
                        description="Thao tác này không thể hoàn tác."
                        onConfirm={() => deleteCertMutation.mutate(cert.certificateId)}
                        okText="Xóa"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true }}
                      >
                        <Tooltip title="Xóa">
                          <Button
                            danger
                            type="text"
                            icon={<DeleteOutlined />}
                            loading={deleteCertMutation.isPending && deleteCertMutation.variables === cert.certificateId}
                            size="small"
                          />
                        </Tooltip>
                      </Popconfirm>
                    </div>
                  }
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <Text
                        strong
                        style={{ cursor: 'pointer', color: '#4a9b6f' }}
                        onClick={() => openCertPreview(cert)}
                      >
                        {CERT_TYPE_LABELS[cert.certificateType] ?? cert.certificateType}
                      </Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '0.88em' }}>Số: {cert.certificateNumber}</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '0.88em' }}>Cơ quan cấp: {cert.issuingAuthority}</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '0.88em' }}>
                        Ngày cấp: {cert.issuedDate}
                        {cert.expiryDate ? ` — Hết hạn: ${cert.expiryDate}` : ' — Không hết hạn'}
                      </Text>
                    </div>
                    <Tag color={itemStatus.color} style={{ marginLeft: '0.5em', whiteSpace: 'nowrap' }}>
                      {itemStatus.label}
                    </Tag>
                  </div>
                  {cert.reviewNote && (
                    <Alert
                      description={`Lý do từ chối: ${cert.reviewNote}`}
                      type="error"
                      style={{ marginTop: '0.6em', borderRadius: '0.4em', padding: '0.4em 0.8em' }}
                    />
                  )}
                </Card>
              )
            })}
          </div>
        )}

        {/* Videos */}
        {videos.length > 0 && (
          <div style={{ marginBottom: '1em' }}>
            <Text strong style={{ fontSize: '1em', display: 'flex', alignItems: 'center', gap: '0.4em', marginBottom: '0.6em' }}>
              <VideoCameraOutlined /> Video thực tế ({videos.length})
            </Text>
            {videos.map((vid) => {
              const itemStatus = ITEM_STATUS_INFO[vid.status] ?? ITEM_STATUS_INFO['PENDING']
              return (
                <Card
                  key={vid.videoId}
                  size="small"
                  style={{
                    marginBottom: '0.75em',
                    borderRadius: '0.5em',
                    borderColor: vid.status === 'REJECTED' ? '#ffccc7' : undefined,
                    background: vid.status === 'REJECTED' ? '#fff2f0' : undefined,
                  }}
                  extra={
                    <div style={{ display: 'flex', gap: '0.2em' }}>
                      <Tooltip title="Xem video">
                        <Button
                          type="text"
                          icon={<EyeOutlined />}
                          size="small"
                          onClick={() => openVideoPreview(vid)}
                        />
                      </Tooltip>
                      <Popconfirm
                        title="Xóa video này?"
                        description="Thao tác này không thể hoàn tác."
                        onConfirm={() => deleteVideoMutation.mutate(vid.videoId)}
                        okText="Xóa"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true }}
                      >
                        <Tooltip title="Xóa">
                          <Button
                            danger
                            type="text"
                            icon={<DeleteOutlined />}
                            loading={deleteVideoMutation.isPending && deleteVideoMutation.variables === vid.videoId}
                            size="small"
                          />
                        </Tooltip>
                      </Popconfirm>
                    </div>
                  }
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <Text
                        strong
                        style={{ cursor: 'pointer', color: '#4a9b6f' }}
                        onClick={() => openVideoPreview(vid)}
                      >
                        {VIDEO_TYPE_LABELS[vid.videoType] ?? vid.videoType}
                      </Text>
                      {vid.description && (
                        <>
                          <br />
                          <Text type="secondary" style={{ fontSize: '0.88em' }}>{vid.description}</Text>
                        </>
                      )}
                    </div>
                    <Tag color={itemStatus.color} style={{ marginLeft: '0.5em', whiteSpace: 'nowrap' }}>
                      {itemStatus.label}
                    </Tag>
                  </div>
                  {vid.reviewNote && (
                    <Alert
                      description={`Lý do từ chối: ${vid.reviewNote}`}
                      type="error"
                      style={{ marginTop: '0.6em', borderRadius: '0.4em', padding: '0.4em 0.8em' }}
                    />
                  )}
                </Card>
              )
            })}
          </div>
        )}

        {/* Empty state */}
        {isEmpty && (
          <div style={{ textAlign: 'center', padding: '1em 0' }}>
            <Text type="secondary">Chưa có tài liệu nào được tải lên.</Text>
          </div>
        )}

        {/* Upload more button */}
        <Button
          type={isRejected ? 'primary' : 'default'}
          icon={<PlusOutlined />}
          block
          style={{ height: '2.6em', marginTop: '0.5em' }}
          onClick={() => navigate('/upload-evidence')}
        >
          {isRejected ? 'Tải lên tài liệu mới' : 'Tải lên thêm tài liệu'}
        </Button>
      </Card>

      {/* Preview modal */}
      <Modal
        open={preview.open}
        title={preview.title}
        onCancel={() => setPreview((p) => ({ ...p, open: false }))}
        footer={
          <Button
            href={preview.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            Mở trong tab mới
          </Button>
        }
        width="90%"
        style={{ maxWidth: '56em' }}
        styles={{ body: { padding: '0.5em 0', maxHeight: '75vh', overflowY: 'auto' } }}
        destroyOnHidden
      >
        {preview.kind === 'video' ? (
          <video
            controls
            style={{ width: '100%', borderRadius: '0.5em', maxHeight: '65vh' }}
          >
            <source src={preview.url} />
            Trình duyệt của bạn không hỗ trợ phát video.
          </video>
        ) : isPdf(preview.url) ? (
          <iframe
            src={preview.url}
            style={{ width: '100%', height: '65vh', border: 'none', borderRadius: '0.5em' }}
            title={preview.title}
          />
        ) : (
          <img
            src={preview.url}
            alt={preview.title}
            style={{ width: '100%', borderRadius: '0.5em', objectFit: 'contain' }}
          />
        )}
      </Modal>
    </>
  )
}
