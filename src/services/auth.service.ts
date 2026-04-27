import { identityApi } from './api'

export interface LoginPayload {
  email: string
  password: string
}

export interface LoginResponse {
  type: string
  code: string
  message: string
  detail: {
    permissions: string
    roles: string
    accessToken: string
    user: {
      id: string
      email: string
    }
  }
}

export async function loginRequest(payload: LoginPayload): Promise<LoginResponse> {
  const res = await identityApi.post<LoginResponse>('/api/user/login', payload)
  return res.data
}
