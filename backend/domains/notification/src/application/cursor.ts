import { BadRequestException } from '@nestjs/common';
import type { NotificationCursor } from '../domain/notification';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function encodeCursor(cursor: NotificationCursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString('base64url');
}

export function decodeCursor(raw: string | undefined): NotificationCursor | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'));
    if (typeof v?.created_at === 'string' && !Number.isNaN(Date.parse(v.created_at)) && typeof v?.notification_id === 'string' && UUID_RE.test(v.notification_id)) {
      return { created_at: v.created_at, notification_id: v.notification_id };
    }
  } catch {
    /* rơi xuống throw */
  }
  throw new BadRequestException('INVALID_CURSOR');
}