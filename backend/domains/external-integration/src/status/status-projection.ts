/**
 * Thẻ trạng thái Nexus — hình dạng mà Collaboration service sẽ hiển thị
 * trên tin nhắn Nexus (theo US-001 / FR-04: message gắn cờ -> Project Common Hub).
 *
 * Status projection = chiếu trạng thái từ hệ thống gốc (Jira issue, GitHub PR)
 * lên thẻ này. Service KHÔNG sửa dữ liệu gốc, KHÔNG sở hữu dữ liệu gốc —
 * thẻ chỉ là ảnh phản chiếu, nguồn thật vẫn nằm ở Jira/GitHub.
 */
export interface NexusStatusCard {
  /** Nguồn: jira | github. */
  source: 'jira' | 'github';
  /** Id ổn định phía nguồn, vd `issue:NEX-1024`, `pr:123`. */
  sourceId: string;
  kind: 'issue' | 'sprint' | 'pull_request' | 'push';
  title: string;
  /** Trạng thái thô phía nguồn, vd `In Progress`, `open`, `pushed`. */
  status: string;
  /** Nhãn tiếng Việt hiển thị trên thẻ. */
  statusLabel: string;
  /** Link về đối tượng gốc (mở Jira/GitHub). */
  url: string | null;
  /** Người gây ra thay đổi (nếu biết). */
  actor: string | null;
  updatedAt: string;
  /** Repo GitHub (chỉ khi source=github). */
  repository: string | null;
}
