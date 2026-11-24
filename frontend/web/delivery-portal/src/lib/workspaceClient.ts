import {
  defaultMembers,
  mockChannels,
  mockGitHubRepos,
  mockGitHubUser,
  mockJiraIssues,
  mockJiraProjects,
  mockMessages,
  mockQuota,
  mockWorkspaces,
} from '../data/mockData'
import type {
  Channel,
  ChannelMessage,
  CreateChannelPayload,
  CreateWorkspacePayload,
  GitHubRepo,
  GitHubUser,
  JiraIssue,
  JiraProject,
  SendMessagePayload,
  Workspace,
  WorkspaceMember,
  WorkspaceQuota,
} from './types'

export interface IWorkspaceClient {
  getWorkspaces(): Promise<Workspace[]>
  getWorkspace(idOrSlug: string): Promise<Workspace>
  createWorkspace(payload: CreateWorkspacePayload): Promise<Workspace>
  updateWorkspace(id: string, patch: Partial<Workspace>): Promise<Workspace>
  deleteWorkspace(id: string): Promise<void>

  getChannels(workspaceId: string): Promise<Channel[]>
  getChannel(workspaceId: string, channelId: string): Promise<Channel>
  createChannel(workspaceId: string, payload: CreateChannelPayload): Promise<Channel>
  updateChannel(workspaceId: string, channelId: string, patch: Partial<Channel>): Promise<Channel>
  deleteChannel(workspaceId: string, channelId: string): Promise<void>

  getMessages(workspaceId: string, channelId: string): Promise<ChannelMessage[]>
  sendMessage(
    workspaceId: string,
    channelId: string,
    payload: SendMessagePayload,
  ): Promise<ChannelMessage>

  getMembers(workspaceId: string): Promise<WorkspaceMember[]>
  addMember(workspaceId: string, member: Partial<WorkspaceMember>): Promise<WorkspaceMember>
  removeMember(workspaceId: string, memberId: string): Promise<void>

  getQuota(workspaceId: string): Promise<WorkspaceQuota>

  getGitHubUser(): Promise<GitHubUser>
  getGitHubRepos(): Promise<GitHubRepo[]>
  getJiraProjects(): Promise<JiraProject[]>
  getJiraIssues(jql?: string): Promise<JiraIssue[]>
}

class MockWorkspaceClient implements IWorkspaceClient {
  private workspaces: Workspace[] = [...mockWorkspaces]
  private channels: Record<string, Channel[]> = { ...mockChannels }
  private messages: Record<string, ChannelMessage[]> = { ...mockMessages }

  async getWorkspaces(): Promise<Workspace[]> {
    return structuredClone(this.workspaces)
  }

  async getWorkspace(idOrSlug: string): Promise<Workspace> {
    const ws = this.workspaces.find((w) => w.id === idOrSlug || w.slug === idOrSlug)
    if (!ws) {
      throw new Error(`Workspace not found: ${idOrSlug}`)
    }
    return structuredClone(ws)
  }

  async createWorkspace(payload: CreateWorkspacePayload): Promise<Workspace> {
    const id = `ws-${Date.now()}`
    const members: WorkspaceMember[] = (payload.members || defaultMembers).map((m, idx) => ({
      id: `mem-${id}-${idx + 1}`,
      name: m.name,
      email: m.email || `${m.name.toLowerCase().replace(/\s+/g, '.')}@nexus.com`,
      role: m.role,
      roleLabel: m.roleLabel,
      avatar: m.name
        .split(' ')
        .map((p) => p[0])
        .slice(-2)
        .join('')
        .toUpperCase(),
      online: true,
    }))

    const newWs: Workspace = {
      id,
      name: payload.name,
      slug: payload.slug,
      description: payload.description || '',
      status: 'live',
      statusBadge: 'Live',
      icon: 'payments',
      memberCount: members.length,
      members,
      liveNodes: 1,
      pendingRfc: 0,
      createdAt: new Date().toISOString(),
    }

    this.workspaces.unshift(newWs)

    const defaultChannelNames = payload.defaultChannels || [
      'general',
      'project-memory',
      'personal-vault',
    ]

    const createdChannels: Channel[] = defaultChannelNames.map((chName) => ({
      id: `chan-${id}-${chName}`,
      workspaceId: id,
      name: chName,
      displayName: chName.replace('project-', '').replace('personal-', ''),
      type:
        chName === 'general'
          ? 'general'
          : chName === 'project-memory'
            ? 'project-memory'
            : chName === 'personal-vault'
              ? 'personal-vault'
              : 'custom',
      ticketCount: chName === 'general' ? 0 : undefined,
      badge: chName === 'project-memory' ? 'Sync' : chName === 'personal-vault' ? 'Bot' : undefined,
      subtitle:
        chName === 'general'
          ? 'Ticket Ledger Hub • Không có Thread'
          : chName === 'project-memory'
            ? 'RFC-3161 Merkle Live'
            : 'Private Task Bot',
      isReadOnly: chName === 'general',
    }))

    this.channels[id] = createdChannels

    for (const ch of createdChannels) {
      this.messages[ch.id] = [
        {
          id: `msg-${ch.id}-init`,
          channelId: ch.id,
          senderId: 'system',
          senderName: 'Nexus System',
          senderRole: 'Automated Service',
          senderAvatar: 'NX',
          timestamp: 'Just now',
          content: `Không gian làm việc ${newWs.name} đã được khởi tạo thành công tại #${ch.name}.`,
        },
      ]
    }

    return structuredClone(newWs)
  }

  async updateWorkspace(id: string, patch: Partial<Workspace>): Promise<Workspace> {
    const idx = this.workspaces.findIndex((w) => w.id === id)
    if (idx === -1) throw new Error(`Workspace not found: ${id}`)
    this.workspaces[idx] = { ...this.workspaces[idx], ...patch }
    return structuredClone(this.workspaces[idx])
  }

  async deleteWorkspace(id: string): Promise<void> {
    this.workspaces = this.workspaces.filter((w) => w.id !== id)
    delete this.channels[id]
  }

  async getChannels(workspaceId: string): Promise<Channel[]> {
    if (!this.channels[workspaceId]) {
      this.channels[workspaceId] = [
        {
          id: `chan-${workspaceId}-general`,
          workspaceId,
          name: 'general',
          displayName: 'general',
          type: 'general',
          ticketCount: 14,
          subtitle: 'Ticket Ledger Hub • Không có Thread',
          isReadOnly: true,
        },
        {
          id: `chan-${workspaceId}-memory`,
          workspaceId,
          name: 'project-memory',
          displayName: 'memory',
          type: 'project-memory',
          badge: 'Sync',
          subtitle: 'RFC-3161 Merkle Live',
          isReadOnly: false,
        },
        {
          id: `chan-${workspaceId}-vault`,
          workspaceId,
          name: 'personal-vault',
          displayName: 'personal',
          type: 'personal-vault',
          badge: 'Bot',
          subtitle: 'Private Task Bot',
          isReadOnly: false,
        },
      ]
    }
    return structuredClone(this.channels[workspaceId])
  }

  async getChannel(workspaceId: string, channelId: string): Promise<Channel> {
    const list = await this.getChannels(workspaceId)
    const ch = list.find((c) => c.id === channelId || c.name === channelId)
    if (!ch) throw new Error(`Channel not found: ${channelId}`)
    return structuredClone(ch)
  }

  async createChannel(workspaceId: string, payload: CreateChannelPayload): Promise<Channel> {
    const list = await this.getChannels(workspaceId)
    const newChan: Channel = {
      id: `chan-${workspaceId}-${payload.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      workspaceId,
      name: payload.name,
      displayName: payload.displayName || payload.name,
      type: payload.type || 'custom',
      subtitle: payload.subtitle,
      isReadOnly: false,
    }
    list.push(newChan)
    this.channels[workspaceId] = list
    this.messages[newChan.id] = []
    return structuredClone(newChan)
  }

  async updateChannel(
    workspaceId: string,
    channelId: string,
    patch: Partial<Channel>,
  ): Promise<Channel> {
    const list = await this.getChannels(workspaceId)
    const idx = list.findIndex((c) => c.id === channelId)
    if (idx === -1) throw new Error(`Channel not found: ${channelId}`)
    list[idx] = { ...list[idx], ...patch }
    this.channels[workspaceId] = list
    return structuredClone(list[idx])
  }

  async deleteChannel(workspaceId: string, channelId: string): Promise<void> {
    const list = await this.getChannels(workspaceId)
    this.channels[workspaceId] = list.filter((c) => c.id !== channelId)
    delete this.messages[channelId]
  }

  async getMessages(_workspaceId: string, channelId: string): Promise<ChannelMessage[]> {
    if (!this.messages[channelId]) {
      this.messages[channelId] = []
    }
    return structuredClone(this.messages[channelId])
  }

  async sendMessage(
    _workspaceId: string,
    channelId: string,
    payload: SendMessagePayload,
  ): Promise<ChannelMessage> {
    if (!this.messages[channelId]) {
      this.messages[channelId] = []
    }
    const newMsg: ChannelMessage = {
      id: `msg-${Date.now()}`,
      channelId,
      senderId: 'u-huy',
      senderName: 'Huy',
      senderRole: 'Delivery Member',
      senderAvatar: 'H',
      isSelf: true,
      timestamp: 'Vừa xong',
      content: payload.content,
      rfcCard: payload.rfcCard,
    }
    this.messages[channelId].push(newMsg)
    return structuredClone(newMsg)
  }

  async getMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    const ws = await this.getWorkspace(workspaceId)
    return ws.members || []
  }

  async addMember(
    workspaceId: string,
    member: Partial<WorkspaceMember>,
  ): Promise<WorkspaceMember> {
    const ws = await this.getWorkspace(workspaceId)
    const newMember: WorkspaceMember = {
      id: `mem-${Date.now()}`,
      name: member.name || 'Thành viên mới',
      email: member.email || 'member@nexus.com',
      role: member.role || 'member',
      roleLabel: member.roleLabel || 'Member',
      avatar: (member.name || 'TM')
        .split(' ')
        .map((p) => p[0])
        .slice(-2)
        .join('')
        .toUpperCase(),
      online: true,
    }
    ws.members.push(newMember)
    ws.memberCount = ws.members.length
    return structuredClone(newMember)
  }

  async removeMember(workspaceId: string, memberId: string): Promise<void> {
    const ws = await this.getWorkspace(workspaceId)
    ws.members = ws.members.filter((m) => m.id !== memberId)
    ws.memberCount = ws.members.length
  }

  async getQuota(_workspaceId: string): Promise<WorkspaceQuota> {
    return structuredClone(mockQuota)
  }

  async getGitHubUser(): Promise<GitHubUser> {
    return structuredClone(mockGitHubUser)
  }

  async getGitHubRepos(): Promise<GitHubRepo[]> {
    return structuredClone(mockGitHubRepos)
  }

  async getJiraProjects(): Promise<JiraProject[]> {
    return structuredClone(mockJiraProjects)
  }

  async getJiraIssues(_jql?: string): Promise<JiraIssue[]> {
    return structuredClone(mockJiraIssues)
  }
}

class RealWorkspaceClient implements IWorkspaceClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/+$/, '')
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    })
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}))
      throw new Error(errBody.message || `Request failed with status ${res.status}`)
    }
    return res.json()
  }

  getWorkspaces(): Promise<Workspace[]> {
    return this.request<Workspace[]>('/api/v1/workspaces')
  }

  getWorkspace(id: string): Promise<Workspace> {
    return this.request<Workspace>(`/api/v1/workspaces/${id}`)
  }

  createWorkspace(payload: CreateWorkspacePayload): Promise<Workspace> {
    return this.request<Workspace>('/api/v1/workspaces', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }

  updateWorkspace(id: string, patch: Partial<Workspace>): Promise<Workspace> {
    return this.request<Workspace>(`/api/v1/workspaces/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    })
  }

  async deleteWorkspace(id: string): Promise<void> {
    await this.request<void>(`/api/v1/workspaces/${id}`, { method: 'DELETE' })
  }

  getChannels(workspaceId: string): Promise<Channel[]> {
    return this.request<Channel[]>(`/api/v1/workspaces/${workspaceId}/channels`)
  }

  getChannel(workspaceId: string, channelId: string): Promise<Channel> {
    return this.request<Channel>(`/api/v1/workspaces/${workspaceId}/channels/${channelId}`)
  }

  createChannel(workspaceId: string, payload: CreateChannelPayload): Promise<Channel> {
    return this.request<Channel>(`/api/v1/workspaces/${workspaceId}/channels`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }

  updateChannel(
    workspaceId: string,
    channelId: string,
    patch: Partial<Channel>,
  ): Promise<Channel> {
    return this.request<Channel>(`/api/v1/workspaces/${workspaceId}/channels/${channelId}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    })
  }

  async deleteChannel(workspaceId: string, channelId: string): Promise<void> {
    await this.request<void>(`/api/v1/workspaces/${workspaceId}/channels/${channelId}`, {
      method: 'DELETE',
    })
  }

  getMessages(workspaceId: string, channelId: string): Promise<ChannelMessage[]> {
    return this.request<ChannelMessage[]>(
      `/api/v1/workspaces/${workspaceId}/channels/${channelId}/messages`,
    )
  }

  sendMessage(
    workspaceId: string,
    channelId: string,
    payload: SendMessagePayload,
  ): Promise<ChannelMessage> {
    return this.request<ChannelMessage>(
      `/api/v1/workspaces/${workspaceId}/channels/${channelId}/messages`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
    )
  }

  getMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    return this.request<WorkspaceMember[]>(`/api/v1/workspaces/${workspaceId}/members`)
  }

  addMember(workspaceId: string, member: Partial<WorkspaceMember>): Promise<WorkspaceMember> {
    return this.request<WorkspaceMember>(`/api/v1/workspaces/${workspaceId}/members`, {
      method: 'POST',
      body: JSON.stringify(member),
    })
  }

  async removeMember(workspaceId: string, memberId: string): Promise<void> {
    await this.request<void>(`/api/v1/workspaces/${workspaceId}/members/${memberId}`, {
      method: 'DELETE',
    })
  }

  getQuota(workspaceId: string): Promise<WorkspaceQuota> {
    return this.request<WorkspaceQuota>(`/api/v1/workspaces/${workspaceId}/quota`)
  }

  getGitHubUser(): Promise<GitHubUser> {
    return this.request<GitHubUser>('/api/v1/integrations/github/user')
  }

  getGitHubRepos(): Promise<GitHubRepo[]> {
    return this.request<GitHubRepo[]>('/api/v1/integrations/github/repos')
  }

  getJiraProjects(): Promise<JiraProject[]> {
    return this.request<JiraProject[]>('/api/v1/integrations/jira/projects')
  }

  getJiraIssues(jql?: string): Promise<JiraIssue[]> {
    const q = jql ? `?jql=${encodeURIComponent(jql)}` : ''
    return this.request<JiraIssue[]>(`/api/v1/integrations/jira/issues${q}`)
  }
}

const useMock = import.meta.env.VITE_USE_MOCK_WORKSPACE !== 'false'

export const workspaceClient: IWorkspaceClient = useMock
  ? new MockWorkspaceClient()
  : new RealWorkspaceClient()
