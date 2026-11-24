import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { OtpService } from '../../application/otp.service';
import { InternalTokenGuard } from '../../common/auth/internal-token.guard';
import { SendOtpDto, VerifyOtpDto } from './dto/otp.dto';

/** Identity service (Đạt) gọi khi đăng ký bằng Google / cần xác thực OTP */
@Controller('internal/v1/otp')
@UseGuards(InternalTokenGuard)
export class InternalOtpController {
  constructor(private readonly otp: OtpService) {}

  @Post('send')
  @HttpCode(202)
  send(@Body() dto: SendOtpDto) {
    return this.otp.issue(dto.email, dto.purpose);
  }

  @Post('verify')
  @HttpCode(200)
  async verify(@Body() dto: VerifyOtpDto) {
    return { valid: await this.otp.verify(dto.email, dto.purpose, dto.code) };
  }
}