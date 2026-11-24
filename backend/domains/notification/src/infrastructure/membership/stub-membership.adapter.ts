import { Injectable, Logger } from '@nestjs/common';
import { MembershipPort } from '../../application/ports/membership.port';

/**
 * TẠM THỜI. Khi Workspace service (Huy) có API membership, thay bằng HTTP call.
 * Mặc định TỪ CHỐI ở production; chỉ cho phép tất cả khi không phải production để dev/demo.
 */
@Injectable()
export class StubMembershipAdapter extends MembershipPort {
  private readonly logger = new Logger(StubMembershipAdapter.name);
  private readonly allowAll = process.env.NODE_ENV !== 'production';

  async canAccessChannel(userId: string, channelId: string): Promise<boolean> {
    if (this.allowAll) this.logger.warn(`STUB membership: cho phép ${userId} vào ${channelId} (chưa kiểm tra thật)`);
    return this.allowAll;
  }
}
