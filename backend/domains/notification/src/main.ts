import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import type { AppConfig } from './config/configuration';
import { ConfiguredIoAdapter } from './infrastructure/realtime/configured-io.adapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get<ConfigService<AppConfig, true>>(ConfigService);
  const origins = config.get('webOrigin', { infer: true });
  app.enableCors({ origin: origins, credentials: true });
  app.useWebSocketAdapter(new ConfiguredIoAdapter(app, origins));
  app.enableShutdownHooks();
  const port = config.get('port', { infer: true });
  await app.listen(port);
  new Logger('Bootstrap').log(`Nexus Notification đang chạy ở http://localhost:${port}`);
}
void bootstrap();