import { BadGatewayException, BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppConfig } from '../config/configuration';
import { InvitationMail, invitationTemplate, otpTemplate } from '../infrastructure/mail/templates';
import { MailLogRepository, MailSender, MailTemplateName, OutgoingMail } from './ports/mail.ports';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly allowedOrigins: string[];

  constructor(
    private readonly sender: MailSender,
    private readonly logs: MailLogRepository,
    config: ConfigService<AppConfig, true>,
  ) {
    this.allowedOrigins = config.get('webOrigin', { infer: true });
  }

  async sendInvitation(to: string, input: InvitationMail): Promise<void> {
    this.assertAllowedLink(input.invite_link);
    await this.deliver('INVITATION', { to, ...invitationTemplate(input) });
  }

  async sendOtp(to: string, code: string, ttlSeconds: number): Promise<void> {
    await this.deliver('OTP', { to, ...otpTemplate(code, ttlSeconds) });
  }

  /** Link trong mail chỉ được trỏ về FE của Nexus → không ai dùng service này để gửi link lừa đảo */
  private assertAllowedLink(link: string) {
    let origin: string;
    try {
      origin = new URL(link).origin;
    } catch {
      throw new BadRequestException('INVALID_INVITE_LINK');
    }
    if (!this.allowedOrigins.includes(origin)) throw new BadRequestException('INVITE_LINK_NOT_ALLOWED');
  }

  private async deliver(template: MailTemplateName, mail: OutgoingMail) {
    try {
      await this.sender.send(mail);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Gửi mail ${template} thất bại: ${message}`); // KHÔNG log nội dung mail (có thể chứa OTP)
      await this.record(mail.to, template, 'FAILED', message.slice(0, 500));
      throw new BadGatewayException('MAIL_DELIVERY_FAILED');
    }
    await this.record(mail.to, template, 'SENT');
  }

  private async record(to: string, template: MailTemplateName, status: 'SENT' | 'FAILED', error?: string) {
    // Ghi log lỗi KHÔNG được làm hỏng việc gửi mail
    await this.logs.record({ recipient_email: to, template, status, error }).catch((e: unknown) => this.logger.error(`Ghi mail_logs lỗi: ${String(e)}`));
  }
}