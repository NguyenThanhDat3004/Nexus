import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { HealthController } from './interfaces/http/health.controller';
import { AuthModule } from './common/auth/auth.module';
import { globalProviders } from './common/common.providers';
import { PrismaModule } from './infrastructure/prisma/prisma.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true, load: [configuration] }),
    AuthModule,
    PrismaModule,
  ],
  controllers: [HealthController],
  providers: [...globalProviders],
})
export class AppModule {}
