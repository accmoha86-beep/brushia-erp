import { Controller, Get, Post, Put, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CatalogService } from './services/catalog.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  CreateCategoryDto, UpdateCategoryDto, CategoryQueryDto,
  CreateProductDto, UpdateProductDto, ProductQueryDto,
  CreateVariantDto, UpdateVariantDto, BarcodeLookupDto,
} from './dto/catalog.dto';

@ApiTags('Catalog')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  // ─── Categories ────────────────────────────────────────
  @Post('categories')
  @RequirePermissions('catalog:create')
  @ApiOperation({ summary: 'Create category' })
  async createCategory(
    @CurrentUser() user: any,
    @Body(new ZodValidationPipe(CreateCategoryDto)) dto: any,
  ) {
    return this.catalogService.createCategory(user.tenantId, user.id, dto);
  }

  @Get('categories')
  @RequirePermissions('catalog:read')
  @ApiOperation({ summary: 'List categories' })
  async listCategories(
    @CurrentUser() user: any,
    @Query(new ZodValidationPipe(CategoryQueryDto)) query: any,
  ) {
    return this.catalogService.listCategories(user.tenantId, query);
  }

  @Get('categories/tree')
  @RequirePermissions('catalog:read')
  @ApiOperation({ summary: 'Get category tree' })
  async getCategoryTree(@CurrentUser() user: any) {
    return this.catalogService.getCategoryTree(user.tenantId);
  }

  @Put('categories/:id')
  @RequirePermissions('catalog:update')
  @ApiOperation({ summary: 'Update category' })
  async updateCategory(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateCategoryDto)) dto: any,
  ) {
    return this.catalogService.updateCategory(user.tenantId, user.id, id, dto);
  }

  @Delete('categories/:id')
  @RequirePermissions('catalog:delete')
  @ApiOperation({ summary: 'Delete category' })
  async deleteCategory(@CurrentUser() user: any, @Param('id') id: string) {
    return this.catalogService.deleteCategory(user.tenantId, user.id, id);
  }

  // ─── Products ──────────────────────────────────────────
  @Post('products')
  @RequirePermissions('catalog:create')
  @ApiOperation({ summary: 'Create product' })
  async createProduct(
    @CurrentUser() user: any,
    @Body(new ZodValidationPipe(CreateProductDto)) dto: any,
  ) {
    return this.catalogService.createProduct(user.tenantId, user.id, dto);
  }

  @Get('products')
  @RequirePermissions('catalog:read')
  @ApiOperation({ summary: 'List products with pagination, filters, and search' })
  async listProducts(
    @CurrentUser() user: any,
    @Query(new ZodValidationPipe(ProductQueryDto)) query: any,
  ) {
    return this.catalogService.listProducts(user.tenantId, query);
  }

  @Get('products/search')
  @RequirePermissions('catalog:read')
  @ApiOperation({ summary: 'Quick search products (POS)' })
  async searchProducts(
    @CurrentUser() user: any,
    @Query('q') q: string,
    @Query('limit') limit?: string,
  ) {
    return this.catalogService.searchProducts(user.tenantId, q, limit ? parseInt(limit) : 20);
  }

  @Get('products/:id')
  @RequirePermissions('catalog:read')
  @ApiOperation({ summary: 'Get product details with variants' })
  async getProduct(@CurrentUser() user: any, @Param('id') id: string) {
    return this.catalogService.getProduct(user.tenantId, id);
  }

  @Put('products/:id')
  @RequirePermissions('catalog:update')
  @ApiOperation({ summary: 'Update product' })
  async updateProduct(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateProductDto)) dto: any,
  ) {
    return this.catalogService.updateProduct(user.tenantId, user.id, id, dto);
  }

  @Delete('products/:id')
  @RequirePermissions('catalog:delete')
  @ApiOperation({ summary: 'Soft-delete product (deactivate)' })
  async deleteProduct(@CurrentUser() user: any, @Param('id') id: string) {
    return this.catalogService.deleteProduct(user.tenantId, user.id, id);
  }

  // ─── Variants ──────────────────────────────────────────
  @Post('products/:productId/variants')
  @RequirePermissions('catalog:create')
  @ApiOperation({ summary: 'Create variant for a product' })
  async createVariant(
    @CurrentUser() user: any,
    @Param('productId') productId: string,
    @Body(new ZodValidationPipe(CreateVariantDto)) dto: any,
  ) {
    return this.catalogService.createVariant(user.tenantId, user.id, { ...dto, product_id: productId });
  }

  // ─── Barcode Lookup ────────────────────────────────────
  @Get('barcode/:barcode')
  @RequirePermissions('catalog:read')
  @ApiOperation({ summary: 'Resolve barcode to product/variant (POS scanner)' })
  async resolveBarcode(@CurrentUser() user: any, @Param('barcode') barcode: string) {
    return this.catalogService.resolveBarcode(user.tenantId, barcode);
  }
}