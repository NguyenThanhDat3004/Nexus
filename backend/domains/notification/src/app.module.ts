import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { HealthController } from './interfaces/http/health.controller';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true, cache: true, load: [configuration] })],
  controllers: [HealthController],
})
export class AppModule {}