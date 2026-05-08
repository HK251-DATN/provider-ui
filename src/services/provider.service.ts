import { identityApi, backOfficeApi } from './api'

export type Gender = 'MALE' | 'FEMALE' | 'OTHER' | 'UNSPECIFIED'
export type VerificationStatus = 'UNVERIFIED' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED'

export interface ProviderRegisterPayload {
  email: string
  password: string
  fName: string
  lName: string
  dob: string
  pNum: string
  gender: Gender
  bankId: string
  bankNum: string
}

export interface ProviderRegisterResponse {
  type: string
  code: string
  message: string
  detail: {
    userId: number
    userEmail: string
    hashedPwd: string
    createdAt: string
    updatedAt: string
  } | null
  timestamp: string
}

export interface ProviderMeResponse {
  type: 'GOOD' | 'SKIP_AS_GOOD' | 'ERROR'
  code: string
  message: string
  detail: {
    providerId: number
    reputationPoint: number
    verificationStatus: VerificationStatus
    bankId: string
    bankNum: string
    userId: number
  } | null
  timestamp: string
}

export interface Certificate {
  certificateId: number
  providerId: number
  certificateType: string
  certificateNumber: string
  issuingAuthority: string
  issuedDate: string
  expiryDate: string | null
  documentUrl: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  reviewedBy: string | null
  reviewNote: string | null
  reviewedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface Video {
  videoId: number
  providerId: number
  videoType: string
  videoUrl: string
  description: string | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  reviewedBy: string | null
  reviewNote: string | null
  reviewedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface ProviderStatusResponse {
  type: string
  code: string
  message: string
  detail: {
    providerId: number
    verificationStatus: VerificationStatus
    certificates: Certificate[]
    videos: Video[]
  }
  timestamp: string
}

export interface ProviderLinkPayload {
  bankId: string
  bankNum: string
}

export interface ProviderLinkResponse {
  type: string
  code: string
  message: string
  detail: null
  timestamp: string
}

export async function registerProvider(payload: ProviderRegisterPayload): Promise<ProviderRegisterResponse> {
  const res = await identityApi.post<ProviderRegisterResponse>('/api/user/provider-register', payload)
  return res.data
}

export async function checkProviderMe(): Promise<ProviderMeResponse> {
  const res = await backOfficeApi.get<ProviderMeResponse>('/api/provider/me')
  return res.data
}

export async function getMyStatus(): Promise<ProviderStatusResponse> {
  const res = await backOfficeApi.get<ProviderStatusResponse>('/api/provider/my-status')
  return res.data
}

export async function linkProvider(payload: ProviderLinkPayload): Promise<ProviderLinkResponse> {
  const res = await identityApi.post<ProviderLinkResponse>('/api/user/provider-link', payload)
  return res.data
}

export async function uploadCertificate(formData: FormData): Promise<{ type: string; detail: Certificate }> {
  const res = await backOfficeApi.post('/api/provider/certificates', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

export async function createVideoRecord(payload: {
  videoType: string
  description?: string
}): Promise<{ type: string; detail: Video }> {
  const res = await backOfficeApi.post('/api/provider/videos', payload)
  return res.data
}

export async function uploadVideoFile(
  videoId: number,
  file: File,
  onProgress: (percent: number) => void,
): Promise<{ type: string; detail: Video }> {
  const fd = new FormData()
  fd.append('file', file)
  const res = await backOfficeApi.post(`/api/provider/videos/${videoId}/upload`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 0,
    onUploadProgress: (e) => {
      if (e.total) onProgress(Math.round((e.loaded / e.total) * 100))
    },
  })
  return res.data
}

export async function deleteCertificate(certificateId: number): Promise<void> {
  await backOfficeApi.delete(`/api/provider/certificates/${certificateId}`)
}

export async function deleteVideo(videoId: number): Promise<void> {
  await backOfficeApi.delete(`/api/provider/videos/${videoId}`)
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

export async function checkProviderMeWithRetry(retries: number): Promise<ProviderMeResponse> {
  let result = await checkProviderMe()
  let remaining = retries
  while (result.type === 'SKIP_AS_GOOD' && remaining > 0) {
    await sleep(1000)
    remaining--
    result = await checkProviderMe()
  }
  return result
}
