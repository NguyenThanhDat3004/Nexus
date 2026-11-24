import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { MailService } from '../../application/mail.service';
import { InternalTokenGuard } from '../../common/auth/internal-token.guard';
import { InvitationDto } from './dto/invitation.dto';

@Controller('internal/v1/mails')
@UseGuards(InternalTokenGuard)
export class InternalMailController {
  constructor(private readonly mail: MailService) {}

  @Post('invitation')
  @HttpCode(202)
  async invitation(@Body() dto: InvitationDto) {
    const { to_email, ...content } = dto;
    await this.mail.sendInvitation(to_email, content);
    return { sent: true };
  }
}