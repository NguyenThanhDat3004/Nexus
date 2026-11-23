import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { HealthController } from './interfaces/http/health.controller';
import { AuthModule } from './common/auth/auth.module';
import { globalProviders } from './common/common.providers';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true, cache: true, load: [configuration] })],
  controllers: [HealthController],
  providers: [...globalProviders]
})
export class AppModule {}