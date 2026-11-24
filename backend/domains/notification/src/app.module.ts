import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { HealthController } from './interfaces/http/health.controller';
import { AuthModule } from './common/auth/auth.module';
import { globalProviders } from './common/common.providers';
import { PrismaModule } from './infrastructure/prisma/prisma.service';
import { NotificationModule } from './notification.module';
import { MailModule } from './mail.module';
import { RedisModule } from './infrastructure/redis/redis.module';
import { OtpModule } from './otp.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true, load: [configuration] }),
    AuthModule,
    PrismaModule,
    NotificationModule,
    MailModule,
    RedisModule,
    OtpModule
  ],
  controllers: [HealthController],
  providers: [...globalProviders],
})
export class AppModule {}
