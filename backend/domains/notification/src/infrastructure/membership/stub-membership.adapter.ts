import { Injectable, Logger } from '@nestjs/common';
import { MembershipPort } from '../../application/ports/membership.port';

/**
 * TẠM THỜI. Khi Workspace service (Huy) có API membership, thay bằng HTTP call.
 * Fail-closed: mặc định TỪ CHỐI; chỉ cho phép tất cả khi NODE_ENV được đặt rõ là development/test.
 * (Quên đặt NODE_ENV trên server → vẫn từ chối, không mở toang.)
 */
@Injectable()
export class StubMembershipAdapter extends MembershipPort {
  private readonly logger = new Logger(StubMembershipAdapter.name);
  private readonly allowAll = ['development', 'test'].includes(process.env.NODE_ENV ?? '');

  async canAccessChannel(userId: string, channelId: string): Promise<boolean> {
    if (this.allowAll) this.logger.warn(`STUB membership: cho phép ${userId} vào ${channelId} (chưa kiểm tra thật)`);
    return this.allowAll;
  }
}
