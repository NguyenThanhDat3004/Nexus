import { Injectable, UnauthorizedException } from '@nestjs/common';
import { GithubService } from '../github/github.service';
import { JiraService } from '../jira/jira.service';

export interface WorkspaceIntegrationStatus {
  workspaceId: string;
  github: { linked: boolean; login: string | null };
  jira: { linked: boolean; displayName: string | null; siteUrl: string | null };
}

/**
 * Trạng thái liên kết của 1 workspace.
 *
 * ⚠️ STUB: hiện chưa có bảng liên kết workspace <-> tài khoản GitHub/Jira
 * (phần này thuộc Workspace Management / Membership service). Bản này trả
 * trạng thái liên kết của user demo đã OAuth — đủ để FE hiển thị "đã liên kết
 * / chưa liên kết" trong màn Dashboard Channel (ô "Đồng bộ Jira/GitHub").
 */
@Injectable()
export class StatusService {
  constructor(
    private readonly github: GithubService,
    private readonly jira: JiraService,
  ) {}

  async getWorkspaceStatus(workspaceId: string): Promise<WorkspaceIntegrationStatus> {
    let [githubLinked, jiraLinked] = await Promise.all([
      this.github.isLinked(),
      this.jira.isLinked(),
    ]);

    let githubLogin: string | null = null;
    if (githubLinked) {
      try {
        githubLogin = (await this.github.getCurrentUser()).login;
      } catch (err) {
        // Token chết (401) thì báo chưa liên kết — đừng để FE hiện "đã liên kết"
        // trong khi mọi gọi API đều 401. Lỗi khác (mạng, 429, 5xx) chỉ là tạm
        // thời: giữ linked=true, login=null.
        if (err instanceof UnauthorizedException) {
          githubLinked = false;
        }
        githubLogin = null;
      }
    }

    let jiraName: string | null = null;
    let jiraSite: string | null = null;
    if (jiraLinked) {
      try {
        const user = await this.jira.getCurrentUser();
        jiraName = user.displayName;
        jiraSite = (await this.jira.requireTokens()).siteUrl;
      } catch (err) {
        if (err instanceof UnauthorizedException) {
          jiraLinked = false;
        }
        jiraName = null;
        jiraSite = null;
      }
    }

    return {
      workspaceId,
      github: { linked: githubLinked, login: githubLogin },
      jira: { linked: jiraLinked, displayName: jiraName, siteUrl: jiraSite },
    };
  }
}
