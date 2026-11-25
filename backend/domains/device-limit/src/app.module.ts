import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { RedisModule } from './redis/redis.module';
import { HealthModule } from './health/health.module';
import { SessionModule } from './session/session.module';
import { PinModule } from './pin/pin.module';
import { DevicesModule } from './devices/devices.module';
import { DeviceLimitModule } from './device-limit/device-limit.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    RedisModule,
    HealthModule,
    SessionModule,
    PinModule,
    DevicesModule,
    DeviceLimitModule,
  ],
})
export class AppModule {}


