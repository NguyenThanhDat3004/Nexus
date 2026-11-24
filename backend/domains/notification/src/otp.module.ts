import { Module } from '@nestjs/common';
import { OtpService } from './application/otp.service';
import { InternalOtpController } from './interfaces/http/internal-otp.controller';
import { MailModule } from './mail.module';

@Module({ imports: [MailModule], controllers: [InternalOtpController], providers: [OtpService] })
export class OtpModule {}