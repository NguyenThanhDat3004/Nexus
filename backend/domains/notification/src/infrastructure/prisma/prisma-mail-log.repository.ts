import { Injectable } from '@nestjs/common';
import { MailLogRepository } from '../../application/ports/mail.ports';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaMailLogRepository extends MailLogRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async record(entry: Parameters<MailLogRepository['record']>[0]) {
    await this.prisma.mailLog.create({ data: entry });
  }
}