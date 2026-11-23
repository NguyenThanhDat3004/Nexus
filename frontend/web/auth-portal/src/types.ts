export type UserRole = 'CUSTOMER' | 'DEVELOPER' | 'BA' | 'QA' | 'ADMIN'

export interface UserProfile {
  id: string
  email: string
  fullName: string | null
  avatarUrl?: string | null
  role: UserRole
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED'
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  tokenType: 'Bearer'
  expiresIn: number
}

export interface SsoExchangePayload {
  code: string
  provider: 'GOOGLE' | 'MICROSOFT'
  redirectUri: string
}

export interface ApiResponse<T> {
  success: boolean
  code: number
  message: string
  data: T
  timestamp: string
}
