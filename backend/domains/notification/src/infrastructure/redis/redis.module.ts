import { Global, Inject, Module, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import type { AppConfig } from '../../config/configuration';

export const REDIS = Symbol('REDIS');

@Global()
@Module({
  providers: [
    {
      provide: REDIS,
      inject: [ConfigService],
      // lazyConnect: chỉ kết nối khi có lệnh đầu tiên → service vẫn khởi động khi Redis chưa chạy
      useFactory: (config: ConfigService<AppConfig, true>) =>
        new Redis({ ...config.get('redis', { infer: true }), lazyConnect: true, maxRetriesPerRequest: 2 }),
    },
  ],
  exports: [REDIS],
})
export class RedisModule implements OnModuleDestroy {
  constructor(@Inject(REDIS) private readonly redis: Redis) {}

  onModuleDestroy() {
    this.redis.disconnect();
  }
}