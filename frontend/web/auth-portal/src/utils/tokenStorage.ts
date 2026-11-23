const FLASH_TICKET_COOKIE = 'nexus_sso_ticket'
const ACCESS_TOKEN_KEY = 'nexus_access_token'
const REFRESH_TOKEN_KEY = 'nexus_refresh_token'

export const tokenStorage = {
  /**
   * Lưu vé tạm thời (One-Time Flash Cookie) với thời gian sống nhận từ Backend (Single Source of Truth)
   */
  setFlashTicket(ticket: string, maxAgeSeconds: number = 180): void {
    document.cookie = `${FLASH_TICKET_COOKIE}=${encodeURIComponent(ticket)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`
  },

  /**
   * Đọc và XÓA NGAY LẬP TỨC vé khỏi Cookie (One-Time Consume)
   */
  consumeFlashTicket(): string | null {
    const cookies = document.cookie.split(';')
    for (const cookie of cookies) {
      const [key, value] = cookie.trim().split('=')
      if (key === FLASH_TICKET_COOKIE && value) {
        document.cookie = `${FLASH_TICKET_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; max-age=0; SameSite=Lax`
        return decodeURIComponent(value)
      }
    }
    return null
  },

  clearFlashTicket(): void {
    document.cookie = `${FLASH_TICKET_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; max-age=0; SameSite=Lax`
  },

  getAccessToken(): string | null {
    return this.consumeFlashTicket() || localStorage.getItem(ACCESS_TOKEN_KEY)
  },
  setAccessToken(token: string): void {
    this.setFlashTicket(token)
  },
  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY)
  },
  setRefreshToken(token: string): void {
    localStorage.setItem(REFRESH_TOKEN_KEY, token)
  },
  setTokens(accessToken: string, refreshToken: string): void {
    this.setFlashTicket(accessToken)
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  },
  clearTokens(): void {
    this.clearFlashTicket()
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  },
}
