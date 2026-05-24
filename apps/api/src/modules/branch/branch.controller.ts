import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { BranchService } from './services/branch.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Branches')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('branches')
export class BranchController {
  constructor(private readonly branchService: BranchService) {}

  @Get()
  listBranches(@Req() req: any, @Query() query: any) {
    return this.branchService.listBranches(req.user.tenantId, query);
  }

  @Get(':id')
  getBranch(@Req() req: any, @Param('id') id: string) {
    return this.branchService.getBranch(req.user.tenantId, id);
  }

  @Post()
  createBranch(@Req() req: any, @Body() dto: any) {
    return this.branchService.createBranch(req.user.tenantId, req.user.sub, dto);
  }

  @Put(':id')
  updateBranch(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    return this.branchService.updateBranch(req.user.tenantId, id, dto);
  }

  @Delete(':id')
  deleteBranch(@Req() req: any, @Param('id') id: string) {
    return this.branchService.deleteBranch(req.user.tenantId, id);
  }
}
