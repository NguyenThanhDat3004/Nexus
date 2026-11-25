import { Controller, Get } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

@Controller('health')
export class HealthController {
  constructor(private readonly redisService: RedisService) {}

  @Get()
  async check() {
    try {
      const pong = await this.redisService.ping();
      if (pong === 'PONG') {
        return { status: 'ok', redis: 'ok' };
      }
      return { status: 'ok', redis: 'fail', error: `Phản hồi lạ: ${pong}` };
    } catch (err: any) {
      return {
        status: 'ok',
        redis: 'fail',
        error: err?.message ?? 'Không kết nối được tới Redis',
      };
    }
  }
}
