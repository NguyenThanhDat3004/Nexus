/**
 * Kho lưu token OAuth.
 *
 * ⚠️ STUB — LƯU TRONG BỘ NHỚ, CHỈ DÙNG CHO DEV.
 * Token lưu ở đây sẽ MẤT khi service restart. Kho thật sẽ do Identity service
 * (Spring Boot, cổng 8081) quản lý sau: lưu mã hóa trong PostgreSQL, gắn với
 * user Nexus, có refresh + revoke. KHÔNG đưa implementation này lên production.
 */
export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number; // epoch ms
  scope?: string;
  /** Jira 3LO: cloudId của site lấy từ /oauth/token/accessible-resources. */
  cloudId?: string;
  /** Jira 3LO: site đã cấp quyền (vd 3004nguyenthanhdat.atlassian.net). */
  siteUrl?: string;
}

export interface TokenStore {
  save(provider: 'github' | 'jira', userId: string, tokens: OAuthTokens): Promise<void>;
  get(provider: 'github' | 'jira', userId: string): Promise<OAuthTokens | null>;
  delete(provider: 'github' | 'jira', userId: string): Promise<void>;
}

/** Implementation trong bộ nhớ — placeholder, xem ghi chú ở trên. */
export class InMemoryTokenStore implements TokenStore {
  private readonly store = new Map<string, OAuthTokens>();

  private key(provider: 'github' | 'jira', userId: string): string {
    return `${provider}:${userId}`;
  }

  async save(
    provider: 'github' | 'jira',
    userId: string,
    tokens: OAuthTokens,
  ): Promise<void> {
    this.store.set(this.key(provider, userId), tokens);
  }

  async get(
    provider: 'github' | 'jira',
    userId: string,
  ): Promise<OAuthTokens | null> {
    return this.store.get(this.key(provider, userId)) ?? null;
  }

  async delete(provider: 'github' | 'jira', userId: string): Promise<void> {
    this.store.delete(this.key(provider, userId));
  }
}
