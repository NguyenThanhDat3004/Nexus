/**
 * Bộ nhớ cache in-memory generic có TTL (Time To Live).
 *
 * - Giới hạn tối đa 500 keys (quá thì xóa key cũ nhất theo thứ tự Map).
 * - Hỗ trợ get, set, delete, clear.
 */
export class TtlCache<T> {
  private readonly store = new Map<string, { value: T; expiresAt: number }>();
  private readonly maxKeys: number;

  constructor(maxKeys = 500) {
    this.maxKeys = maxKeys;
  }

  get(key: string): T | undefined {
    const item = this.store.get(key);
    if (!item) return undefined;

    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      return undefined;
    }

    return item.value;
  }

  set(key: string, value: T, ttlMs: number): void {
    if (this.store.size >= this.maxKeys && !this.store.has(key)) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey !== undefined) {
        this.store.delete(oldestKey);
      }
    }

    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}
