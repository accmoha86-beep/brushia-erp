import { Controller, Get, Put, Delete, Body, Param, Req, Post, UseGuards } from '@nestjs/common';
import { SettingsService } from './services/settings.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  // === Company Info ===
  @Get('company')
  getCompanyInfo(@Req() req: any) {
    return this.settingsService.getCompanyInfo(req.user.tenantId);
  }

  @Put('company')
  updateCompanyInfo(@Req() req: any, @Body() dto: any) {
    return this.settingsService.updateCompanyInfo(req.user.tenantId, dto);
  }

  // === Tax Settings ===
  @Get('tax')
  getTaxSettings(@Req() req: any) {
    return this.settingsService.getTaxSettings(req.user.tenantId);
  }

  @Put('tax')
  updateTaxSettings(@Req() req: any, @Body() dto: any) {
    return this.settingsService.updateTaxSettings(req.user.tenantId, dto);
  }

  // === Integration Settings ===
  @Get('integrations')
  listIntegrations(@Req() req: any) {
    return this.settingsService.listIntegrations(req.user.tenantId);
  }

  @Get('integrations/:key')
  getIntegration(@Req() req: any, @Param('key') key: string) {
    return this.settingsService.getIntegration(req.user.tenantId, key);
  }

  @Put('integrations/:key')
  configureIntegration(@Req() req: any, @Param('key') key: string, @Body() dto: any) {
    return this.settingsService.configureIntegration(req.user.tenantId, req.user.sub, key, dto);
  }

  @Post('integrations/:key/test')
  testIntegration(@Req() req: any, @Param('key') key: string) {
    return this.settingsService.testIntegration(req.user.tenantId, key);
  }

  @Delete('integrations/:key')
  disconnectIntegration(@Req() req: any, @Param('key') key: string) {
    return this.settingsService.disconnectIntegration(req.user.tenantId, key);
  }
}
