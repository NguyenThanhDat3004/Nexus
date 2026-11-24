import { ArrayMaxSize, ArrayNotEmpty, IsArray, IsIn, IsISO8601, IsObject, IsOptional, IsString, Length } from 'class-validator';
import { NOTIFICATION_TYPES, NotificationEvent, NotificationType } from '../../../domain/notification';

export class NotificationEventDto implements NotificationEvent {
  @IsString() @Length(1, 64) event_id: string;
  @IsIn(NOTIFICATION_TYPES) event_type: NotificationType;
  @IsISO8601() occurred_at: string;
  @IsOptional() @IsString() @Length(1, 64) actor_user_id?: string | null;
  @IsOptional() @IsString() @Length(1, 64) project_id?: string | null;
  @IsOptional() @IsString() @Length(1, 64) channel_id?: string | null;
  @IsArray() @ArrayNotEmpty() @ArrayMaxSize(1000) @IsString({ each: true }) @Length(1, 64, { each: true }) recipient_user_ids: string[];
  @IsString() @Length(1, 200) title: string;
  @IsString() @Length(1, 2000) body: string;
  @IsOptional() @IsObject() data?: Record<string, unknown>;
}