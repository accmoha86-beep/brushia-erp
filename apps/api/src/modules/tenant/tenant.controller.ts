import { Controller, Get, Post, Patch, Delete, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TenantService } from './tenant.service';
import { CreateTenantDto, UpdateTenantDto } from './tenant.dto';

@ApiTags('Tenants')
@Controller('tenants')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new tenant' })
  @ApiResponse({ status: 201, description: 'Tenant created' })
  async create(@Body() dto: CreateTenantDto) {
    return this.tenantService.createTenant(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tenant by ID' })
  async findOne(@Param('id') id: string) {
    return this.tenantService.getTenant(id);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get tenant by slug' })
  async findBySlug(@Param('slug') slug: string) {
    return this.tenantService.getTenantBySlug(slug);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update tenant' })
  async update(@Param('id') id: string, @Body() dto: UpdateTenantDto) {
    return this.tenantService.updateTenant(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete tenant' })
  async remove(@Param('id') id: string) {
    await this.tenantService.deleteTenant(id);
  }
}
