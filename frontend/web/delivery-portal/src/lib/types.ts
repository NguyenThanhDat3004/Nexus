// Types for delivery-portal
export type WorkspaceKind = 'training' | 'organization'
export type ChannelKind = 'public' | 'private' | 'project-common'
export type ChannelType = 'Text' | 'Discussions' | 'Decision' | 'Governance'

export interface CurrentUser {
  id: string
  name: string
  memberOf: string[]
}

export interface Project {
  id: string
  workspaceId: string
  key: string
  name: string
  memberIds: string[]
  updatedAt: string
}

export interface Notification {
  id: string
  projectId: string
  text: string
  createdAt: string
  read: boolean
}

export interface WorkspaceMember {
  id: string
  name: string
  email: string
  role: 'lead' | 'arch' | 'member' | 'admin' | 'guest'
  roleLabel: string
  avatar: string
  online?: boolean
}

export interface Channel {
  id: string
  workspaceId: string
  name: string
  displayName: string
  type: 'general' | 'project-memory' | 'personal-vault' | 'custom'
  kind?: ChannelKind
  ticketCount?: number
  badge?: string
  subtitle?: string
  description?: string
  chatEnabled?: boolean
  isReadOnly?: boolean
}

export interface RfcSigner {
  name: string
  avatar: string
}

export interface RfcCardData {
  rfcId: string
  title: string
  jiraIssue: string
  prNumber: string
  status: 'Confirmed & Locked' | 'Pending Confirmation' | 'Draft'
  items: string[]
  signers: RfcSigner[]
  timestamp: string
  hash: string
}

export interface VersionBlockInfo {
  version: string
  merkleBlock: string
  hash: string
}

export interface ChannelMessage {
  id: string
  channelId: string
  senderId?: string
  senderName: string
  senderRole: string
  senderAvatar: string
  senderHub?: string
  isSelf?: boolean
  timestamp: string
  content: string
  authorName?: string
  authorRole?: string
  text?: string
  createdAt?: string
  kind?: 'message' | 'announcement'
  rfcCard?: RfcCardData
  blockInfo?: VersionBlockInfo
}

export interface WorkspaceQuota {
  storageUsedBytes: number
  storageLimitBytes: number
  channelCount: number
  channelLimit: number
  memberCount: number
  memberLimit: number
}

export interface Workspace {
  id: string
  key?: string
  name: string
  slug: string
  kind?: WorkspaceKind
  description: string
  status: 'live' | 'ml-shard' | 'audit' | 'archived'
  statusBadge: string
  icon: string
  memberCount: number
  memberLimit?: number | null
  members: WorkspaceMember[]
  liveNodes: number
  pendingRfc: number
  createdAt: string
  lastUpdatedAt?: string
  requiresAdminToken?: boolean
  securityCode?: string
  jiraLinked?: boolean
  githubLinked?: boolean
  channels?: Channel[]
  quota?: WorkspaceQuota
}

export interface CreateWorkspacePayload {
  name: string
  slug: string
  description?: string
  members?: Array<{
    name: string
    role: 'lead' | 'arch' | 'member' | 'admin' | 'guest'
    roleLabel: string
    email?: string
  }>
  defaultChannels?: string[]
}

export interface CreateChannelPayload {
  name: string
  displayName: string
  type?: 'general' | 'project-memory' | 'personal-vault' | 'custom'
  subtitle?: string
}

export interface SendMessagePayload {
  content: string
  rfcCard?: RfcCardData
}

export interface CarouselAnnouncement {
  id: string
  type: 'error' | 'primary' | 'tertiary' | 'success'
  typeLabel: string
  tag: string
  title: string
  timeAgo: string
  linkText: string
}

export interface GitHubUser {
  login: string
  id: number
  avatar_url: string
  name: string
}

export interface GitHubRepo {
  id: number
  name: string
  full_name: string
  private: boolean
  html_url: string
}

export interface JiraProject {
  id: string
  key: string
  name: string
}

export interface JiraIssue {
  id: string
  key: string
  summary: string
  status: string
}
