import { AUTH_ENDPOINTS } from './authEndpoints'
import { ApiResponse, AuthTokens, SsoExchangePayload, UserProfile } from '../types'

const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL ?? 'http://localhost:8081'

export interface SsoBackendResponse {
  success: boolean
  accessToken: string
  refreshToken: string
  expiresIn: number
  user: {
    id: string
    email: string
    fullName: string
  }
}

export const authApi = {
  async getAuthorizeUrl(provider: 'GOOGLE' | 'MICROSOFT'): Promise<string> {
    const res = await fetch(
      `${GATEWAY_URL}${AUTH_ENDPOINTS.AUTHORIZE_URL}?provider=${provider}`,
      { method: 'GET', headers: { 'Content-Type': 'application/json' } },
    )
    if (!res.ok) throw new Error(`Lỗi khởi tạo đăng nhập SSO (${res.status})`)
    const body: ApiResponse<{ authorizationUrl: string }> = await res.json()
    return body.data.authorizationUrl
  },

  async exchangeSsoCode(payload: SsoExchangePayload): Promise<SsoBackendResponse> {
    const res = await fetch(`${GATEWAY_URL}${AUTH_ENDPOINTS.SSO_EXCHANGE}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error(`Xác thực mã SSO thất bại (${res.status})`)
    return await res.json()
  },

  async getCurrentUser(accessToken: string): Promise<UserProfile> {
    const res = await fetch(`${GATEWAY_URL}${AUTH_ENDPOINTS.ME}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })
    if (!res.ok) throw new Error(`Không thể lấy thông tin người dùng (${res.status})`)
    const body: ApiResponse<UserProfile> = await res.json()
    return body.data
  },

  async logout(refreshToken: string, accessToken?: string): Promise<void> {
    await fetch(`${GATEWAY_URL}${AUTH_ENDPOINTS.LOGOUT}`, {
      method: 'POST',
      headers: {
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    })
  },
}
