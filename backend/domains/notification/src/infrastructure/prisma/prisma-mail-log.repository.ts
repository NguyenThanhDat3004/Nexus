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

  deleteOlderThan(cutoff: Date, limit: number) {
    return this.prisma.$executeRaw`
      DELETE FROM mail_logs WHERE mail_id IN (
        SELECT mail_id FROM mail_logs
        WHERE created_at < ${cutoff}
        ORDER BY created_at
        LIMIT ${limit}
      )`;
  }
}