import { Module } from '@nestjs/common';
import { MailService } from './application/mail.service';
import { MailLogRepository, MailSender } from './application/ports/mail.ports';
import { NodemailerMailSender } from './infrastructure/mail/nodemailer.mail-sender';
import { PrismaMailLogRepository } from './infrastructure/prisma/prisma-mail-log.repository';
import { InternalMailController } from './interfaces/http/internal-mail.controller';

@Module({
  controllers: [InternalMailController],
  providers: [
    MailService,
    { provide: MailSender, useClass: NodemailerMailSender },
    { provide: MailLogRepository, useClass: PrismaMailLogRepository },
  ],
  exports: [MailService],
})
export class MailModule {}