import { Logger } from '@nestjs/common';

export type DeviceType = 'mobile' | 'desktop' | 'tablet';

const logger = new Logger('DeviceClassifier');

/**
 * Phân loại thiết bị thành 'mobile' | 'desktop' | 'tablet'.
 *
 * Lưu ý: User-Agent và các thuộc tính client có thể bị giả mạo.
 * Hàm phân loại này chỉ phục vụ luật đếm số lượng thiết bị đăng nhập đồng thời
 * (tối đa 3: 1 mobile + 1 desktop + 1 tablet), KHÔNG phải bằng chứng chống trộm.
 *
 * Quy tắc:
 * 1. UA chứa "iPad" -> tablet.
 * 2. UA chứa "iPhone" hoặc "Mobile" -> mobile. (Chú ý: điện thoại Android có
 *    "Mobile Safari" — "Mobile" + khoảng trắng, KHÔNG phải "Mobile/" như
 *    iPhone — nên phải kiểm tra "Mobile" không kèm dấu '/'.)
 * 3. UA chứa "Android" -> tablet (tablet Android; điện thoại Android đã rơi
 *    vào quy tắc 2 vì có "Mobile").
 * 4. UA chứa "Macintosh":
 *    - maxTouchPoints > 0 và screenWidth >= 768 -> tablet (iPad bật desktop mode).
 *    - maxTouchPoints > 0 và screenWidth < 768 -> mobile (iPhone bật desktop mode).
 *    - maxTouchPoints <= 0 -> desktop (Mac thật).
 * 5. Các trường hợp còn lại (UA lạ, UA trống): mặc định desktop + ghi log để review.
 */
export function classifyDevice(
  userAgent?: string | null,
  maxTouchPoints?: number | null,
  screenWidth?: number | null,
): DeviceType {
  const ua = userAgent?.trim() ?? '';
  const touch = typeof maxTouchPoints === 'number' ? maxTouchPoints : 0;
  const width = typeof screenWidth === 'number' ? screenWidth : 0;

  if (ua.includes('iPad')) {
    return 'tablet';
  }

  if (ua.includes('iPhone') || ua.includes('Mobile')) {
    return 'mobile';
  }

  // Tablet Android: điện thoại Android có "Mobile" trong UA nên đã rơi vào
  // quy tắc 2; còn lại UA chứa "Android" thì là tablet. Trước đây tablet
  // Android rơi xuống mặc định desktop, chiếm mất slot desktop (và điện thoại
  // Android cũng vậy, vì UA thật của nó là "Mobile Safari", không phải
  // "Mobile/" như iPhone).
  if (ua.includes('Android')) {
    return 'tablet';
  }

  if (ua.includes('Macintosh')) {
    if (touch > 0) {
      if (width >= 768) {
        return 'tablet';
      }
      return 'mobile';
    }
    return 'desktop';
  }

  logger.log(
    `User-Agent không xác định hoặc trống: "${ua}" (touch: ${touch}, screenWidth: ${width}). Mặc định phân loại là desktop.`,
  );
  return 'desktop';
}
