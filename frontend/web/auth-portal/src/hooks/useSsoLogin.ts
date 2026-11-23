import { useState } from 'react'
import { authApi } from '../api/authApi'
import { useRoleRouter } from './useRoleRouter'
import { tokenStorage } from '../utils/tokenStorage'

export function useSsoLogin() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expiresIn, setExpiresIn] = useState<number>(0)
  const { navigateToPortal } = useRoleRouter()

  /**
   * Khởi tạo luồng SSO chuyển hướng TOÀN TRANG (Full-page Redirect):
   * - Mở ngay trên chính tab/trang hiện tại, không mở popup hay tab riêng
   * - Người dùng chọn tài khoản Google xong -> Google tự redirect về đúng tab này
   */
  const initiateSso = async (provider: 'GOOGLE' | 'MICROSOFT') => {
    setIsLoading(true)
    setError(null)

    try {
      const authUrl = await authApi.getAuthorizeUrl(provider)
      // Chuyển hướng ngay trên chính trang hiện tại
      window.location.href = authUrl
    } catch (err: any) {
      console.error('[SSO_INITIATE_ERROR] Lỗi khởi tạo SSO:', err)
      setError('Hệ thống xác thực tạm thời gián đoạn. Vui lòng thử lại sau ít phút.')
      setIsLoading(false)
    }
  }

  /**
   * Trao đổi code với Backend:
   * Backend lưu Redis và trả về token kèm expiresIn chuẩn xác.
   * BẮT BUỘC có expiresIn từ Backend, KHÔNG có giá trị fallback nào.
   */
  const handleSsoCallback = async (
    code: string,
    provider: 'GOOGLE' | 'MICROSOFT',
    redirectUri: string,
  ) => {
    setIsLoading(true)
    setError(null)
    try {
      // 1. Nhận response từ Backend
      const data = await authApi.exchangeSsoCode({
        code,
        provider,
        redirectUri,
      })

      // 2. Kiểm tra tính toàn vẹn: Backend bắt buộc phải trả về thời hạn expiresIn và token
      if (!data.expiresIn || data.expiresIn <= 0 || !data.accessToken) {
        throw new Error('Dữ liệu phiên xác thực từ máy chủ không hợp lệ (Missing expiresIn or Token)')
      }

      // 3. Kích hoạt bộ đếm thời gian và lưu Flash Cookie với đúng thời hạn của Backend
      setExpiresIn(data.expiresIn)
      tokenStorage.setFlashTicket(data.accessToken, data.expiresIn)

      // 4. Dọn sạch mã code trên URL
      if (typeof window !== 'undefined' && window.history) {
        window.history.replaceState({}, document.title, window.location.pathname)
      }

      // 5. Điều hướng sang workspace portal
      navigateToPortal('DEVELOPER')
      return data
    } catch (err: any) {
      tokenStorage.clearFlashTicket()
      console.error('[SSO_EXCHANGE_ERROR] Lỗi trao đổi code:', err)
      setError(err?.message || 'Mã đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.')
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
    expiresIn,
  }
}
