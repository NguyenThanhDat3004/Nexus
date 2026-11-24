import { IsEmail, IsISO8601, IsString, IsUrl, Length, MaxLength } from 'class-validator';

export class InvitationDto {
  @IsEmail() @MaxLength(254) to_email: string;
  @IsString() @Length(1, 100) inviter_name: string;
  @IsString() @Length(1, 100) project_name: string;
  @IsUrl({ require_tld: false, require_protocol: true, protocols: ['http', 'https'] }) @MaxLength(500) invite_link: string;
  @IsISO8601() expires_at: string;
}