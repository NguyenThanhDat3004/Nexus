import { Injectable, Logger } from '@nestjs/common';
import { DeviceSummary, SessionService } from '../session/session.service';

export interface CheckDeviceLimitResult {
  allowed: boolean;
  existingSessionId?: string;
  devices?: DeviceSummary[];
}

@Injectable()
export class DeviceLimitService {
  private readonly logger = new Logger(DeviceLimitService.name);

  constructor(private readonly sessionService: SessionService) {}

  /**
   * Kiểm tra giới hạn thiết bị khi login:
   * - Đọc 1 lần danh sách session cùng loại (getSessionsByClass, đã lazy-cleanup
   *   session hết hạn) thay vì đếm rồi đọc riêng 2 lần — trước đây 2 lần đọc
   *   Redis riêng biệt có thể cho kết quả mâu thuẫn (409 kèm danh sách rỗng).
   * - Nếu chưa có session nào cùng loại -> allowed: true
   * - Nếu có session cùng loại và fingerprint TRÙNG -> allowed: true, existingSessionId = session đó
   * - Nếu có session cùng loại nhưng fingerprint KHÁC -> allowed: false, devices = danh sách device cùng loại đó
   */
  async checkDeviceLimit(
    userId: string,
    deviceClass: 'mobile' | 'desktop' | 'tablet',
    deviceFingerprint: string,
  ): Promise<CheckDeviceLimitResult> {
    const sessions = await this.sessionService.getSessionsByClass(
      userId,
      deviceClass,
    );

    if (sessions.length === 0) {
      return { allowed: true };
    }

    const matchingSession = sessions.find(
      (s) => s.deviceFingerprint === deviceFingerprint,
    );

    if (matchingSession) {
      return {
        allowed: true,
        existingSessionId: matchingSession.sessionId,
      };
    }

    const devices: DeviceSummary[] = sessions.map((s) => ({
      sessionId: s.sessionId,
      deviceClass: s.deviceClass,
      deviceLabel: s.deviceLabel,
      lastSeenAt: s.lastSeenAt,
    }));

    return {
      allowed: false,
      devices,
    };
  }
}
