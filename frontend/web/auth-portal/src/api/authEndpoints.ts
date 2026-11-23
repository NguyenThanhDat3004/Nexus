export const AUTH_ENDPOINTS = {
  AUTHORIZE_URL: '/api/v1/auth/sso/authorize-url',
  SSO_EXCHANGE: '/api/v1/auth/sso/callback',
  REFRESH_TOKEN: '/api/v1/auth/refresh-token',
  LOGOUT: '/api/v1/auth/logout',
  ME: '/api/v1/auth/me',
} as const
