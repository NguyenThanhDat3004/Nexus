import { Injectable, Logger } from '@nestjs/common';
import { NexusStatusCard } from '../status/status-projection';

/**
 * Nhận event webhook rồi chiếu trạng thái sang thẻ Nexus (status projection).
 *
 * Nguyên tắc: service này CHỈ ĐỌC trạng thái từ GitHub/Jira rồi chiếu lên
 * thẻ tin nhắn Nexus. Nó KHÔNG sửa dữ liệu gốc ở 2 hệ thống kia (trừ endpoint
 * ghi trạng thái Jira đã gắn cờ cần team xác nhận).
 *
 * Tính chất webhook cần nhớ:
 * - GitHub/Jira có thể gửi trùng 1 event nhiều lần -> xử lý phải idempotent
 *   (dựa vào X-GitHub-Delivery / webhookEventId của Jira). Bản này mới chỉ
 *   log + trả về card; tầng lưu/trùng lặp sẽ do Collaboration service giữ.
 * - Phải trả 2xx NHANH (GitHub chờ tối đa 10s, Jira cũng giới hạn) — việc
 *   nặng (gọi API khác, ghi DB) phải đưa vào queue sau, không làm trong
 *   handler. Bản này chỉ tính toán card đồng bộ, chưa gọi API ngoài.
 */
@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  /** Event GitHub: pull_request (opened) / push. */
  handleGithubEvent(event: string, action: string | undefined, payload: any): NexusStatusCard | null {
    if (event === 'pull_request') {
      const pr = payload?.pull_request;
      if (!pr) return null;
      this.logger.log(`GitHub pull_request ${action ?? '?'}: ${pr.html_url}`);
      // Chỉ chiếu khi PR mở mới / cập nhật — các action khác chỉ log.
      if (action !== 'opened' && action !== 'synchronize' && action !== 'reopened') return null;
      return {
        source: 'github',
        sourceId: `pr:${pr.id}`,
        kind: 'pull_request',
        title: pr.title,
        status: pr.state, // open | closed
        statusLabel: action === 'opened' ? 'PR mới mở' : `PR ${action}`,
        url: pr.html_url,
        actor: pr.user?.login ?? null,
        updatedAt: pr.updated_at,
        repository: payload?.repository?.full_name ?? null,
      };
    }
    if (event === 'push') {
      const head = payload?.head_commit;
      this.logger.log(`GitHub push ${payload?.ref} @ ${payload?.repository?.full_name}`);
      if (!head) return null;
      return {
        source: 'github',
        sourceId: `push:${payload?.after ?? head.id}`,
        kind: 'push',
        title: head.message?.split('\n')[0] ?? 'Commit mới',
        status: 'pushed',
        statusLabel: `Push lên ${payload?.ref ?? ''}`,
        url: head.url,
        actor: payload?.pusher?.name ?? payload?.sender?.login ?? null,
        updatedAt: head.timestamp,
        repository: payload?.repository?.full_name ?? null,
      };
    }
    this.logger.log(`GitHub event chưa xử lý: ${event}`);
    return null;
  }

  /** Event Jira: jira:issue_updated / jira:sprint_* (định dạng webhook Jira Cloud). */
  handleJiraEvent(webhookEvent: string | undefined, payload: any): NexusStatusCard | null {
    if (webhookEvent === 'jira:issue_updated') {
      const issue = payload?.issue;
      if (!issue) return null;
      const status = issue?.fields?.status?.name ?? 'unknown';
      this.logger.log(`Jira issue_updated: ${issue.key} -> ${status}`);
      return {
        source: 'jira',
        sourceId: `issue:${issue.key}`,
        kind: 'issue',
        title: issue.fields?.summary ?? issue.key,
        status,
        statusLabel: `Issue ${issue.key} → ${status}`,
        url: `${payload?.issue?.self ?? ''}`.replace('/rest/api/3/issue/', '/browse/'),
        actor: payload?.user?.displayName ?? null,
        updatedAt: issue.fields?.updated ?? new Date().toISOString(),
        repository: null,
      };
    }
    if (webhookEvent?.startsWith('jira:sprint_')) {
      const sprint = payload?.sprint;
      this.logger.log(`Jira ${webhookEvent}: sprint ${sprint?.name ?? sprint?.id ?? '?'}`);
      return {
        source: 'jira',
        sourceId: `sprint:${sprint?.id ?? 'unknown'}`,
        kind: 'sprint',
        title: sprint?.name ?? 'Sprint',
        status: webhookEvent.replace('jira:sprint_', ''),
        statusLabel: `Sprint ${sprint?.name ?? ''} — ${webhookEvent}`,
        url: null,
        actor: payload?.user?.displayName ?? null,
        updatedAt: new Date().toISOString(),
        repository: null,
      };
    }
    this.logger.log(`Jira event chưa xử lý: ${webhookEvent ?? '?'}`);
    return null;
  }
}
