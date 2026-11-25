import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  NotFoundException,
  Param,
  UnauthorizedException,
} from '@nestjs/common';
import { SessionService } from '../session/session.service';
import {
  PIN_VERIFICATION_SERVICE,
  PinVerificationService,
} from '../pin/pin-verification.interface';

export interface DeleteDeviceDto {
  pin?: string;
}

@Controller('users/:userId/devices')
export class DevicesController {
  constructor(
    private readonly sessionService: SessionService,
    @Inject(PIN_VERIFICATION_SERVICE)
    private readonly pinVerificationService: PinVerificationService,
  ) {}

  @Get()
  async getDevices(@Param('userId') userId: string) {
    return this.sessionService.listDevices(userId);
  }

  @Delete(':sessionId')
  @HttpCode(HttpStatus.OK)
  async deleteDevice(
    @Param('userId') userId: string,
    @Param('sessionId') sessionId: string,
    @Body() body: DeleteDeviceDto,
  ) {
    if (!body || typeof body.pin !== 'string' || body.pin.trim() === '') {
      throw new BadRequestException('Thiếu mã PIN trong body');
    }

    // Kiểm tra session TRƯỚC khi kiểm tra PIN: trước đây PIN sai -> 401,
    // PIN đúng + session không tồn tại -> 404, nên kẻ tấn công dùng sessionId
    // giả để dò PIN đúng/sai qua mã lỗi (PIN oracle). Giờ sessionId giả luôn
    // trả 404 bất kể PIN đúng hay sai.
    const session = await this.sessionService.getSession(sessionId);
    if (!session || session.userId !== userId) {
      throw new NotFoundException(
        'Session không tồn tại hoặc không thuộc về người dùng',
      );
    }

    const isPinValid = await this.pinVerificationService.verifyPin(
      userId,
      body.pin,
    );
    if (!isPinValid) {
      throw new UnauthorizedException('Mã PIN không chính xác');
    }

    await this.sessionService.deleteSession(sessionId);
    return { success: true, message: 'Đã xóa session thành công' };
  }
}
