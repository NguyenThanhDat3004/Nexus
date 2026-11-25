import { Module } from '@nestjs/common';
import { DeviceLimitService } from './device-limit.service';
import { DeviceLimitController } from './device-limit.controller';
import { SessionModule } from '../session/session.module';

@Module({
  imports: [SessionModule],
  providers: [DeviceLimitService],
  controllers: [DeviceLimitController],
  exports: [DeviceLimitService],
})
export class DeviceLimitModule {}
