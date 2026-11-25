import { Controller, Get, Param } from '@nestjs/common';
import { StatusService } from './status.service';

/** Trạng thái liên kết GitHub/Jira của 1 workspace (cho FE hiển thị). */
@Controller('workspaces')
export class StatusController {
  constructor(private readonly status: StatusService) {}

  @Get(':id/integrations/status')
  async getStatus(@Param('id') workspaceId: string) {
    return this.status.getWorkspaceStatus(workspaceId);
  }
}
