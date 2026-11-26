export const NOTIFICATION_TYPES = ['project.updated', 'project.member_added', 'channel.created', 'channel.message_mentioned'] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

/** Event các service khác (Workspace, Collaboration...) gửi sang */
export interface NotificationEvent {
  event_id: string;
  event_type: NotificationType;
  occurred_at: string;
  actor_user_id?: string | null;
  project_id?: string | null;
  channel_id?: string | null;
  recipient_user_ids: string[];
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

/** Thông báo trả về cho FE */
export interface NotificationItem {
  notification_id: string;
  type: string;
  title: string;
  body: string;
  project_id: string | null;
  channel_id: string | null;
  created_at: string;
  read_at: string | null;
}

export interface NotificationPage{
  items: NotificationItem[];
  page: number;
  limit: number;
  total: number;
  has_more: boolean;
}