import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { GithubModule } from './github/github.module';
import { JiraModule } from './jira/jira.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { StatusModule } from './status/status.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    GithubModule,
    JiraModule,
    WebhooksModule,
    StatusModule,
  ],
})
export class AppModule {}
