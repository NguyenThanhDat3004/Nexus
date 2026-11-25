import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = Number(process.env.PORT ?? 3004);
  await app.listen(port);
  console.log(`Nexus Device Limit Service đang chạy ở http://localhost:${port}`);
}
void bootstrap();
