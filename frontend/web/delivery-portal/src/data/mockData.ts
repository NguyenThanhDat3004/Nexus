import type {
  CarouselAnnouncement,
  Channel,
  ChannelMessage,
  CurrentUser,
  GitHubRepo,
  GitHubUser,
  JiraIssue,
  JiraProject,
  Notification,
  Project,
  Workspace,
  WorkspaceMember,
  WorkspaceQuota,
} from '../lib/types'

// User hiện tại (mock): Huy — chỉ cộng tác 2 project dưới đây.
export const currentUser: CurrentUser = {
  id: 'u-huy',
  name: 'Huy',
  memberOf: ['p-nexus', 'p-training-01'],
}

export const defaultMembers: WorkspaceMember[] = [
  {
    id: 'u-huy',
    name: 'Huy',
    email: 'huy@nexus.com',
    role: 'lead',
    roleLabel: 'Delivery Member',
    avatar: 'H',
    online: true,
  },
  {
    id: 'u-dat',
    name: 'Đạt',
    email: 'dat@nexus.com',
    role: 'admin',
    roleLabel: 'Login SSO + PIN',
    avatar: 'Đ',
    online: true,
  },
  {
    id: 'u-phuc',
    name: 'Phúc',
    email: 'phuc@nexus.com',
    role: 'member',
    roleLabel: 'Login Google + PIN',
    avatar: 'P',
    online: true,
  },
]

export const workspaces: Workspace[] = [
  {
    id: 'w-nexus',
    key: 'nexus',
    slug: 'nexus',
    name: 'Nexus',
    kind: 'organization',
    description:
      'Hạ tầng monorepo DDD, quản lý context kiến trúc và kết nối Jira/GitHub.',
    status: 'live',
    statusBadge: 'Organization',
    icon: 'payments',
    memberLimit: null,
    memberCount: 3,
    members: defaultMembers,
    lastUpdatedAt: '2026-11-16',
    requiresAdminToken: true,
    securityCode: '••••••',
    jiraLinked: true,
    githubLinked: false, // chờ Đạt đăng ký GitHub OAuth App
    liveNodes: 8,
    pendingRfc: 0,
    createdAt: '2026-11-16T00:00:00Z',
  },
  {
    id: 'w-training',
    key: 'training-01',
    slug: 'training-01',
    name: 'Training — Onboarding',
    kind: 'training',
    description:
      'Workspace đào tạo nhân sự và quy trình onboard (giới hạn 30 người, tự đóng sau 14 ngày không update).',
    status: 'audit',
    statusBadge: 'Training (Sắp đóng)',
    icon: 'precision_manufacturing',
    memberLimit: 30,
    memberCount: 1,
    members: [defaultMembers[0]],
    lastUpdatedAt: '2026-11-10', // >14 ngày? mock hiện cảnh báo "sắp đóng"
    requiresAdminToken: false,
    jiraLinked: false,
    githubLinked: false,
    liveNodes: 2,
    pendingRfc: 0,
    createdAt: '2026-11-10T00:00:00Z',
  },
]

export const mockWorkspaces: Workspace[] = workspaces

export const projects: Project[] = [
  {
    id: 'p-nexus',
    workspaceId: 'w-nexus',
    key: 'NEX',
    name: 'Nexus — Collaboration Platform',
    memberIds: ['u-huy', 'u-dat', 'u-phuc'],
    updatedAt: '2026-11-16',
  },
  {
    id: 'p-training-01',
    workspaceId: 'w-training',
    key: 'TRN-01',
    name: 'Training — Onboarding',
    memberIds: ['u-huy'],
    updatedAt: '2026-11-10',
  },
  // Project này Huy KHÔNG tham gia — dashboard phải giấu nó (BR-02).
  {
    id: 'p-other-team',
    workspaceId: 'w-nexus',
    key: 'OTH',
    name: 'Team khác — không thuộc Huy',
    memberIds: ['u-khac'],
    updatedAt: '2026-11-15',
  },
]

export const channels: Channel[] = [
  {
    id: 'c-general',
    workspaceId: 'w-nexus',
    name: 'general',
    displayName: 'general',
    type: 'general',
    kind: 'public',
    description: 'Thông báo chung — không chat',
    subtitle: 'Thông báo chung — không chat',
    chatEnabled: false,
    isReadOnly: true,
    ticketCount: 1,
  },
  {
    id: 'c-common',
    workspaceId: 'w-nexus',
    name: 'project-common',
    displayName: 'project-common',
    type: 'project-memory',
    kind: 'project-common',
    description: 'Project Common Hub — nội dung đã duyệt mới đưa sang',
    subtitle: 'Project Common Hub — nội dung đã duyệt mới đưa sang',
    badge: 'Sync',
    chatEnabled: true,
    isReadOnly: false,
  },
  {
    id: 'c-dev',
    workspaceId: 'w-nexus',
    name: 'dev-team',
    displayName: 'dev-team',
    type: 'custom',
    kind: 'private',
    description: 'Channel riêng team dev (FR-08)',
    subtitle: 'Channel riêng team dev (FR-08)',
    badge: 'Dev',
    chatEnabled: true,
    isReadOnly: false,
  },
  {
    id: 'c-ba',
    workspaceId: 'w-nexus',
    name: 'ba-team',
    displayName: 'ba-team',
    type: 'custom',
    kind: 'private',
    description: 'Channel riêng team BA',
    subtitle: 'Channel riêng team BA',
    badge: 'BA',
    chatEnabled: true,
    isReadOnly: false,
  },
  {
    id: 'c-trn-general',
    workspaceId: 'w-training',
    name: 'general',
    displayName: 'general',
    type: 'general',
    kind: 'public',
    description: 'Thông báo chung — không chat',
    subtitle: 'Thông báo chung — không chat',
    chatEnabled: false,
    isReadOnly: true,
  },
]

export const mockChannels: Record<string, Channel[]> = {
  'w-nexus': channels.filter((c) => c.workspaceId === 'w-nexus'),
  'w-training': channels.filter((c) => c.workspaceId === 'w-training'),
}

export const notifications: Notification[] = [
  {
    id: 'n1',
    projectId: 'p-nexus',
    text: 'Đạt cập nhật spec login SSO + Google (16/11)',
    createdAt: '2026-11-16',
    read: false,
  },
  {
    id: 'n2',
    projectId: 'p-nexus',
    text: 'Nhắc deadline mock FE: 25/11',
    createdAt: '2026-11-16',
    read: false,
  },
  {
    id: 'n3',
    projectId: 'p-training-01',
    text: 'Workspace training sắp đóng (14 ngày không update)',
    createdAt: '2026-11-16',
    read: true,
  },
]

export const channelMessages: ChannelMessage[] = [
  {
    id: 'm-general-1',
    channelId: 'c-general',
    senderId: 'system',
    senderName: 'Hệ thống',
    senderRole: 'Thông báo',
    senderAvatar: 'HT',
    timestamp: '16/11 09:00',
    content:
      'Nhắc deadline mock FE: 25/11 — 3 màn: Home spaces, Create Workspace, Dashboard Channel.',
    authorName: 'Hệ thống',
    authorRole: 'Thông báo',
    text: 'Nhắc deadline mock FE: 25/11 — 3 màn: Home spaces, Create Workspace, Dashboard Channel.',
    createdAt: '16/11 09:00',
    kind: 'announcement',
  },
  {
    id: 'm-common-1',
    channelId: 'c-common',
    senderId: 'u-dat',
    senderName: 'Đạt',
    senderRole: 'Login SSO + PIN',
    senderAvatar: 'Đ',
    timestamp: '17/11 22:52',
    content:
      'PR #11 merge xong: khung monorepo DDD đã có — backend/domains, database/init-databases.sql, scripts/branch-guard.sh. Frontend vẫn chỉ có README, chưa có thư mục web/delivery-portal.',
    authorName: 'Đạt',
    authorRole: 'Login SSO + PIN',
    text: 'PR #11 merge xong: khung monorepo DDD đã có — backend/domains, database/init-databases.sql, scripts/branch-guard.sh. Frontend vẫn chỉ có README, chưa có thư mục web/delivery-portal.',
    createdAt: '17/11 22:52',
  },
  {
    id: 'm-common-2',
    channelId: 'c-common',
    senderId: 'u-phuc',
    senderName: 'Phúc',
    senderRole: 'Login Google + PIN',
    senderAvatar: 'P',
    timestamp: '17/11 23:10',
    content:
      'Mình nhận login Google + PIN và notification service (websocket + SSE). Mail invite làm sau — queue trước, Kafka tính sau.',
    authorName: 'Phúc',
    authorRole: 'Login Google + PIN',
    text: 'Mình nhận login Google + PIN và notification service (websocket + SSE). Mail invite làm sau — queue trước, Kafka tính sau.',
    createdAt: '17/11 23:10',
  },
  {
    id: 'm-common-3',
    channelId: 'c-common',
    senderId: 'u-huy',
    senderName: 'Huy',
    senderRole: 'Delivery Member',
    senderAvatar: 'H',
    isSelf: true,
    timestamp: '18/11 09:06',
    content:
      'FE mock: Home spaces làm lại theo Stitch xong, Create Workspace chờ tick chấp nhận. Màn tiếp theo là Dashboard Channel theo ảnh mẫu — deadline 25/11.',
    authorName: 'Huy',
    authorRole: 'Delivery Member',
    text: 'FE mock: Home spaces làm lại theo Stitch xong, Create Workspace chờ tick chấp nhận. Màn tiếp theo là Dashboard Channel theo ảnh mẫu — deadline 25/11.',
    createdAt: '18/11 09:06',
  },
  {
    id: 'm-dev-1',
    channelId: 'c-dev',
    senderId: 'u-huy',
    senderName: 'Huy',
    senderRole: 'Delivery Member',
    senderAvatar: 'H',
    isSelf: true,
    timestamp: '17/11 15:20',
    content:
      'Channel dev-team: chỉ team dev thấy (FR-08). Tin nhắn ở đây không đẩy sang project-common trừ khi đã duyệt.',
    authorName: 'Huy',
    authorRole: 'Delivery Member',
    text: 'Channel dev-team: chỉ team dev thấy (FR-08). Tin nhắn ở đây không đẩy sang project-common trừ khi đã duyệt.',
    createdAt: '17/11 15:20',
  },
  {
    id: 'm-ba-1',
    channelId: 'c-ba',
    senderId: 'u-phuc',
    senderName: 'Phúc',
    senderRole: 'Login Google + PIN',
    senderAvatar: 'P',
    timestamp: '17/11 15:40',
    content:
      'Channel ba-team: BA trao đổi spec ở đây, quyết định đã chốt mới đưa sang #project-common.',
    authorName: 'Phúc',
    authorRole: 'Login Google + PIN',
    text: 'Channel ba-team: BA trao đổi spec ở đây, quyết định đã chốt mới đưa sang #project-common.',
    createdAt: '17/11 15:40',
  },
  {
    id: 'm-trn-1',
    channelId: 'c-trn-general',
    senderId: 'system',
    senderName: 'Hệ thống',
    senderRole: 'Thông báo',
    senderAvatar: 'HT',
    timestamp: '16/11 09:00',
    content:
      'Workspace training sắp đóng (14 ngày không update, hạn 24/11) — xem lại trước hạn.',
    authorName: 'Hệ thống',
    authorRole: 'Thông báo',
    text: 'Workspace training sắp đóng (14 ngày không update, hạn 24/11) — xem lại trước hạn.',
    createdAt: '16/11 09:00',
    kind: 'announcement',
  },
]

export const mockMessages: Record<string, ChannelMessage[]> = {
  'c-general': channelMessages.filter((m) => m.channelId === 'c-general'),
  'c-common': channelMessages.filter((m) => m.channelId === 'c-common'),
  'c-dev': channelMessages.filter((m) => m.channelId === 'c-dev'),
  'c-ba': channelMessages.filter((m) => m.channelId === 'c-ba'),
  'c-trn-general': channelMessages.filter((m) => m.channelId === 'c-trn-general'),
}

export const mockAnnouncements: CarouselAnnouncement[] = [
  {
    id: 'ann-1',
    type: 'primary',
    typeLabel: 'SPEC MỚI',
    tag: '[NEXUS]',
    title: 'Đạt cập nhật spec login SSO + Google (16/11)',
    timeAgo: '16/11',
    linkText: 'Xem spec',
  },
  {
    id: 'ann-2',
    type: 'error',
    typeLabel: 'DEADLINE',
    tag: '[MOCK FE]',
    title:
      'Nhắc deadline mock FE: 25/11 — 3 màn: Home spaces, Create Workspace, Dashboard Channel.',
    timeAgo: '16/11',
    linkText: 'Chi tiết',
  },
  {
    id: 'ann-3',
    type: 'tertiary',
    typeLabel: 'CẢNH BÁO',
    tag: '[TRAINING]',
    title:
      'Workspace training sắp đóng (14 ngày không update, hạn 24/11) — xem lại trước hạn.',
    timeAgo: '16/11',
    linkText: 'Kiểm tra',
  },
  {
    id: 'ann-4',
    type: 'primary',
    typeLabel: 'MONOREPO',
    tag: '[MERGE]',
    title:
      'PR #11 merge xong: khung monorepo DDD backend/domains, database và scripts.',
    timeAgo: '17/11',
    linkText: 'Xem commit',
  },
]

export const mockQuota: WorkspaceQuota = {
  storageUsedBytes: 1073741824, // 1GB
  storageLimitBytes: 10737418240, // 10GB
  channelCount: 4,
  channelLimit: 20,
  memberCount: 3,
  memberLimit: 30,
}

export const mockGitHubUser: GitHubUser = {
  login: 'nguyenthanhdat',
  id: 102488,
  avatar_url: 'https://avatars.githubusercontent.com/u/102488',
  name: 'Nguyễn Thành Đạt',
}

export const mockGitHubRepos: GitHubRepo[] = [
  {
    id: 1,
    name: 'Nexus',
    full_name: 'NguyenThanhDat3004/Nexus',
    private: false,
    html_url: 'https://github.com/NguyenThanhDat3004/Nexus',
  },
]

export const mockJiraProjects: JiraProject[] = [
  {
    id: 'proj-1',
    key: 'NEX',
    name: 'Nexus — Collaboration Platform',
  },
]

export const mockJiraIssues: JiraIssue[] = [
  {
    id: 'issue-1',
    key: 'NEX-1',
    summary: 'Khởi tạo monorepo DDD và cấu trúc dự án',
    status: 'Done',
  },
  {
    id: 'issue-2',
    key: 'NEX-2',
    summary: 'Xây dựng 3 màn hình mock FE delivery-portal (deadline 25/11)',
    status: 'In Progress',
  },
]
