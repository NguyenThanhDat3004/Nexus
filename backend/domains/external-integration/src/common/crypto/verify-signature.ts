import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Xác thực chữ ký webhook HMAC-SHA256 trên body GỐC (Buffer).
 *
 * GitHub: header `X-Hub-Signature-256`, định dạng `sha256=<hex>`.
 * Jira (webhook admin có secret): header `X-Hub-Signature`, định dạng `sha256=<hex>`.
 *
 * Quy tắc:
 * - Tính HMAC trên ĐÚNG byte body nhận được — không parse rồi stringify lại.
 * - So sánh bằng timingSafeEqual (chống tấn công đo thời gian).
 * - Thiếu header hoặc thiếu secret => KHÔNG tin (fail-closed).
 */
export function verifyHmacSha256(
  rawBody: Buffer,
  signatureHeader: string | string[] | undefined,
  secret: string,
): boolean {
  if (!secret || !signatureHeader || Array.isArray(signatureHeader)) {
    return false;
  }
  const match = /^sha256=([0-9a-f]{64})$/i.exec(signatureHeader.trim());
  if (!match) return false;

  const expected = `sha256=${createHmac('sha256', secret).update(rawBody).digest('hex')}`;
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(signatureHeader.trim(), 'utf8');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Lấy body gốc từ request Express (đã gắn express.raw() ở main.ts). */
export function getRawBody(req: { body?: unknown }): Buffer | null {
  if (Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === 'string') return Buffer.from(req.body, 'utf8');
  return null;
}
