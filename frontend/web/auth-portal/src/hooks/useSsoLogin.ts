import { useState } from 'react'
import { authApi } from '../api/authApi'
import { useRoleRouter } from './useRoleRouter'
import { tokenStorage } from '../utils/tokenStorage'
import { UserProfile } from '../types'

export function useSsoLogin() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { navigateToPortal } = useRoleRouter()

  /**
   * Khởi tạo luồng SSO:
   * 1. Lấy URL Authorize từ backend
   * 2. Mở popup đăng nhập
   * 3. Lắng nghe callback nhận code
   * 4. Đổi code lấy token và user profile
   * 5. Tự động điều hướng theo Role
   */
  const initiateSso = async (provider: 'GOOGLE' | 'MICROSOFT') => {
    setIsLoading(true)
    setError(null)

    try {
      const authUrl = await authApi.getAuthorizeUrl(provider)
      const popup = window.open(
        authUrl,
        `${provider}_SSO_LOGIN`,
        'width=520,height=640,status=no,toolbar=no,menubar=no,location=yes',
      )

      if (!popup) {
        throw new Error('Trình duyệt đã chặn cửa sổ Popup. Vui lòng cho phép popup để tiếp tục.')
      }

      // Lắng nghe mã code từ popup gửi về qua postMessage hoặc storage event
      const checkPopup = setInterval(async () => {
        try {
          if (popup.closed) {
            clearInterval(checkPopup)
            setIsLoading(false)
          }
        } catch {
          // Ignore cross-origin domain checks
        }
      }, 500)
    } catch (err: any) {
      setError(err?.message ?? 'Đăng nhập SSO thất bại')
      setIsLoading(false)
    }
  }

  const handleSsoCallback = async (code: string, provider: 'GOOGLE' | 'MICROSOFT', redirectUri: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const { tokens, user } = await authApi.exchangeSsoCode({ code, provider, redirectUri })
      tokenStorage.setTokens(tokens.accessToken, tokens.refreshToken)
      navigateToPortal(user.role)
      return user
    } catch (err: any) {
      setError(err?.message ?? 'Xác thực mã đăng nhập thất bại')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return {
    initiateSso,
    handleSsoCallback,
    isLoading,
    error,
  }
}
