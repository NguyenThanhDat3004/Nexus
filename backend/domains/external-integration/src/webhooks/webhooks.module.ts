import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { DeliveryDedup } from './delivery-dedup';
import { WebhookQueue } from './webhook-queue';

@Module({
  controllers: [WebhooksController],
  providers: [WebhooksService, DeliveryDedup, WebhookQueue],
  exports: [WebhooksService, DeliveryDedup, WebhookQueue],
})
export class WebhooksModule {}
