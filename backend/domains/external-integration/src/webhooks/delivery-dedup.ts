import { Injectable, OnModuleDestroy } from '@nestjs/common';

/**
 * Quản lý chống xử lý trùng lặp webhook (deduplication) in-memory.
 *
 * - Lưu trữ Map<key, timestamp>
 * - TTL: 24 giờ
 * - Giới hạn: tối đa 10.000 key (vượt quá sẽ xóa key cũ nhất theo thứ tự Map)
 * - Quét dọn key hết hạn mỗi 1 giờ
 */
@Injectable()
export class DeliveryDedup implements OnModuleDestroy {
  private readonly store = new Map<string, number>();
  private readonly ttlMs = 24 * 60 * 60 * 1000; // 24 giờ
  private readonly maxKeys = 10_000;
  private readonly cleanupTimer: NodeJS.Timeout;

  constructor() {
    this.cleanupTimer = setInterval(() => this.cleanupExpired(), 60 * 60 * 1000);
    this.cleanupTimer.unref?.();
  }

  onModuleDestroy() {
    clearInterval(this.cleanupTimer);
  }

  /**
   * Kiểm tra xem key webhook đã được xử lý chưa.
   * Nếu trùng -> trả về true.
   * Nếu chưa trùng -> ghi nhận key vào Map và trả về false.
   */
  isDuplicate(key: string): boolean {
    const now = Date.now();
    const recordedAt = this.store.get(key);

    if (recordedAt !== undefined) {
      if (now - recordedAt < this.ttlMs) {
        return true;
      }
      // Đã hết hạn TTL
      this.store.delete(key);
    }

    // Vượt quá giới hạn 10.000 keys -> xóa key cũ nhất (đầu Map)
    if (this.store.size >= this.maxKeys) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey !== undefined) {
        this.store.delete(oldestKey);
      }
    }

    this.store.set(key, now);
    return false;
  }

  private cleanupExpired(): void {
    const now = Date.now();
    for (const [key, recordedAt] of this.store.entries()) {
      if (now - recordedAt >= this.ttlMs) {
        this.store.delete(key);
      }
    }
  }
}
