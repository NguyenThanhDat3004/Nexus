import { IsEmail, IsIn, Matches, MaxLength } from 'class-validator';
import { OTP_PURPOSES, OtpPurpose } from '../../../application/otp.service';

export class SendOtpDto {
  @IsEmail() @MaxLength(254) email: string;
  @IsIn(OTP_PURPOSES) purpose: OtpPurpose;
}

export class VerifyOtpDto extends SendOtpDto {
  @Matches(/^\d{6}$/) code: string;
}