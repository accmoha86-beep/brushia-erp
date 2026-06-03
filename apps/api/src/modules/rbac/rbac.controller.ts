import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RbacService } from './rbac.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth';

@ApiTags('Roles & Permissions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('rbac')
export class RbacController {
  constructor(private readonly rbacService: RbacService) {}

  @Get('roles')
  @RequirePermissions('admin.roles.manage')
  @ApiOperation({ summary: 'List all roles for current tenant' })
  async listRoles(@CurrentUser('tid') tenantId: string) {
    return this.rbacService.getRolesForTenant(tenantId);
  }

  @Get('permissions')
  @RequirePermissions('admin.roles.manage')
  @ApiOperation({ summary: 'List all available permissions' })
  async listPermissions() {
    return this.rbacService.getAllPermissions();
  }

  @Get('roles/:roleId/permissions')
  @RequirePermissions('admin.roles.manage')
  @ApiOperation({ summary: 'Get permissions assigned to a role' })
  async getRolePermissions(@Param('roleId') roleId: string) {
    return this.rbacService.getRolePermissions(roleId);
  }

  @Put('roles/:roleId/permissions')
  @RequirePermissions('admin.roles.manage')
  @ApiOperation({ summary: 'Set permissions for a role' })
  async setRolePermissions(
    @Param('roleId') roleId: string,
    @Body() body: { permissionIds: string[] },
    @CurrentUser('sub') userId: string,
  ) {
    await this.rbacService.setRolePermissions(roleId, body.permissionIds, userId);
    return { success: true };
  }

  @Get('users')
  @RequirePermissions('admin.users.manage')
  @ApiOperation({ summary: 'List all users for current tenant' })
  async listUsers(@CurrentUser('tid') tenantId: string) {
    return this.rbacService.getUsersForTenant(tenantId);
  }

  @Get('users/:userId/roles')
  @RequirePermissions('admin.users.manage')
  @ApiOperation({ summary: 'Get roles for a user' })
  async getUserRoles(@Param('userId') userId: string) {
    return this.rbacService.getUserRoles(userId);
  }

  @Post('users/:userId/roles')
  @RequirePermissions('admin.users.manage')
  @ApiOperation({ summary: 'Assign a role to a user' })
  async assignRole(
    @Param('userId') userId: string,
    @Body() body: { roleId: string; branchId?: string },
    @CurrentUser('sub') assignedBy: string,
  ) {
    return this.rbacService.assignRole({
      userId,
      roleId: body.roleId,
      branchId: body.branchId,
      assignedBy,
    });
  }

  @Delete('users/:userId/roles/:roleId')
  @RequirePermissions('admin.users.manage')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a role from a user' })
  async removeRole(
    @Param('userId') userId: string,
    @Param('roleId') roleId: string,
  ) {
    await this.rbacService.removeRole(userId, roleId);
  }
}
