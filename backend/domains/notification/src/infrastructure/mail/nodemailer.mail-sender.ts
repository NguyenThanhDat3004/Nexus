import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Transporter, createTransport } from 'nodemailer';
import { MailSender, OutgoingMail } from '../../application/ports/mail.ports';
import type { AppConfig } from '../../config/configuration';

@Injectable()
export class NodemailerMailSender extends MailSender implements OnModuleDestroy {
  private readonly transporter: Transporter;
  private readonly from: string;

  constructor(config: ConfigService<AppConfig, true>) {
    super();
    const mail = config.get('mail', { infer: true });
    this.from = mail.from;
    this.transporter = createTransport({
      host: mail.host,
      port: mail.port,
      secure: mail.secure,
      auth: mail.user ? { user: mail.user, pass: mail.pass } : undefined,
    });
  }

  async send(mail: OutgoingMail): Promise<void> {
    await this.transporter.sendMail({ from: this.from, ...mail });
  }

  onModuleDestroy() {
    this.transporter.close();
  }
}