import { NestFactory } from '@nestjs/core';
import { raw, Request, Response, NextFunction } from 'express';
import { AppModule } from './app.module';

/**
 * External Integration service — NestJS, cổng 3003.
 *
 * Lưu ý quan trọng về webhook: chữ ký HMAC được tính trên ĐÚNG TỪNG BYTE
 * của body gốc mà GitHub/Jira gửi. Nếu body bị parse thành JSON rồi
 * stringify lại, chữ ký sẽ không khớp. Vì vậy 2 route webhook được gắn
 * `express.raw()` TRƯỚC khi Nest đăng ký parser JSON mặc định — body tới
 * controller vẫn là Buffer nguyên vẹn.
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const rawBody = raw({ type: 'application/json', limit: '1mb' });
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path === '/integrations/github/webhooks' || req.path === '/integrations/jira/webhooks') {
      return rawBody(req, res, next);
    }
    return next();
  });

  const port = Number(process.env.PORT ?? 3003);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`Nexus External Integration đang chạy ở http://localhost:${port}`);
}
void bootstrap();
