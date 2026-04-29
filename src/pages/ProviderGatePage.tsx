import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Spin, Typography } from 'antd'
import { checkProviderMeWithRetry, getMyStatus, type VerificationStatus } from '@/services/provider.service'

const { Text } = Typography

const STATUS_ROUTES: Record<VerificationStatus, string> = {
  APPROVED:   '/dashboard',
  UNVERIFIED: '/upload-evidence',
  PENDING:    '/my-submissions',
  REJECTED:   '/my-submissions',
  SUSPENDED:  '/account-suspended',
}

export default function ProviderGatePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const justRegistered: boolean = (location.state as { justRegistered?: boolean } | null)?.justRegistered ?? false
  const [statusText, setStatusText] = useState('Đang kiểm tra tài khoản...')

  useEffect(() => {
    let cancelled = false

    async function run() {
      try {
        const retries = justRegistered ? 3 : 0
        const me = await checkProviderMeWithRetry(retries)

        if (cancelled) return

        if (me.type !== 'GOOD' || me.detail === null) {
          navigate('/become-provider', { replace: true })
          return
        }

        setStatusText('Đang tải trạng thái xác minh...')
        const statusRes = await getMyStatus()
        if (cancelled) return

        const dest = STATUS_ROUTES[statusRes.detail.verificationStatus]
        navigate(dest, {
          replace: true,
          state: { providerStatus: statusRes.detail },
        })
      } catch {
        if (!cancelled) navigate('/become-provider', { replace: true })
      }
    }

    run()
    return () => { cancelled = true }
  }, [])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1em',
        minHeight: '100vh',
      }}
    >
      <Spin size="large" />
      <Text type="secondary" style={{ fontSize: '1.05em' }}>
        {statusText}
      </Text>
    </div>
  )
}
