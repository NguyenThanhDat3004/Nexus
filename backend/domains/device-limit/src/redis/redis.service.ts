import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const host = this.config.get<string>('redis.host', 'localhost');
    const port = this.config.get<number>('redis.port', 6379);
    const password = this.config.get<string>('redis.password');

    this.client = new Redis({
      host,
      port,
      password: password || undefined,
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      retryStrategy: (times) => {
        // KHÔNG bao giờ trả null: trước đây sau 3 lần thất bại ioredis dừng
        // reconnect vĩnh viễn, service chết âm thầm tới khi restart tay.
        // Giờ retry mãi với backoff, tối đa 5s/lần — Redis chỉ down tạm thời
        // thì service tự hồi phục.
        return Math.min(times * 200, 5000);
      },
    });

    this.client.on('error', (err) => {
      this.logger.error(`Redis connection error: ${err.message}`);
    });
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit().catch(() => {});
    }
  }

  getClient(): Redis {
    if (!this.client) {
      throw new Error('Redis client chưa được khởi tạo');
    }
    return this.client;
  }

  async ping(): Promise<string> {
    const client = this.getClient();
    if (client.status === 'wait') {
      await client.connect();
    }
    return client.ping();
  }

  async get(key: string): Promise<string | null> {
    const client = this.getClient();
    if (client.status === 'wait') {
      await client.connect();
    }
    return client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<'OK' | null> {
    const client = this.getClient();
    if (client.status === 'wait') {
      await client.connect();
    }
    if (ttlSeconds) {
      return client.set(key, value, 'EX', ttlSeconds);
    }
    return client.set(key, value);
  }

  async del(key: string): Promise<number> {
    const client = this.getClient();
    if (client.status === 'wait') {
      await client.connect();
    }
    return client.del(key);
  }
}
