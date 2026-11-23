import { Module } from '@nestjs/common';
import { GithubModule } from '../github/github.module';
import { JiraModule } from '../jira/jira.module';
import { StatusController } from './status.controller';
import { StatusService } from './status.service';

@Module({
  imports: [GithubModule, JiraModule],
  controllers: [StatusController],
  providers: [StatusService],
})
export class StatusModule {}
