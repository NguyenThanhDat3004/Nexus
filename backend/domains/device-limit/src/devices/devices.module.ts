import { Module } from '@nestjs/common';
import { DevicesController } from './devices.controller';
import { SessionModule } from '../session/session.module';
import { PinModule } from '../pin/pin.module';

@Module({
  imports: [SessionModule, PinModule],
  controllers: [DevicesController],
})
export class DevicesModule {}
