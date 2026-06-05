import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';

@Injectable()
export class SettingsService {
  constructor(private readonly db: DatabaseService) {}

  // === Company Info (stored in iam.tenants) ===
  async getCompanyInfo(tenantId: string) {
    const tenant = await this.db.queryOne(
      'SELECT * FROM iam.tenants WHERE id = $1', [tenantId]
    );
    if (!tenant) throw new NotFoundException('Tenant not found');
    return {
      name: tenant.name,
      slug: tenant.slug,
      legal_name: tenant.legal_name || '',
      email: tenant.email || '',
      phone: tenant.phone || '',
      tax_id: tenant.tax_id || '',
      commercial_reg: tenant.commercial_reg || '',
      city: tenant.city || '',
      governorate: tenant.governorate || '',
      currency: tenant.currency || 'EGP',
      country: tenant.country || 'EG',
      logo_url: tenant.logo_url || '',
      tagline: tenant.tagline || '',
      website: tenant.website || '',
      social_instagram: tenant.social_instagram || '',
      social_facebook: tenant.social_facebook || '',
      social_tiktok: tenant.social_tiktok || '',
    };
  }

  async updateCompanyInfo(tenantId: string, dto: any) {
    const result = await this.db.queryOne(
      `UPDATE iam.tenants SET 
        name = COALESCE($2, name),
        legal_name = COALESCE($3, legal_name),
        email = COALESCE($4, email),
        phone = COALESCE($5, phone),
        tax_id = COALESCE($6, tax_id),
        commercial_reg = COALESCE($7, commercial_reg),
        city = COALESCE($8, city),
        governorate = COALESCE($9, governorate),
        currency = COALESCE($10, currency),
        updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [tenantId, dto.name, dto.legal_name, dto.email, dto.phone,
       dto.tax_id, dto.commercial_reg, dto.city, dto.governorate, dto.currency]
    );
    return result;
  }

  // === Tax Settings ===
  async getTaxSettings(tenantId: string) {
    const tenant = await this.db.queryOne(
      'SELECT vat_rate, fiscal_year_start FROM iam.tenants WHERE id = $1', [tenantId]
    );
    return {
      vat_rate: tenant ? (Number(tenant.vat_rate) / 100) : 14,
      vat_rate_raw: tenant?.vat_rate ?? 1400,
      tax_inclusive: true,
      fiscal_year_start: tenant?.fiscal_year_start ?? 1,
    };
  }

  async updateTaxSettings(tenantId: string, dto: any) {
    const vatRate = dto.vat_rate != null ? Math.round(Number(dto.vat_rate) * 100) : undefined;
    const fiscalYear = dto.fiscal_year_start != null ? Number(dto.fiscal_year_start) : undefined;

    await this.db.query(
      `UPDATE iam.tenants SET 
        vat_rate = COALESCE($2, vat_rate),
        fiscal_year_start = COALESCE($3, fiscal_year_start),
        updated_at = NOW()
       WHERE id = $1`,
      [tenantId, vatRate, fiscalYear]
    );
    return this.getTaxSettings(tenantId);
  }

  // === Integration Settings ===
  async listIntegrations(tenantId: string) {
    const result = await this.db.query(
      `SELECT id, integration_key, display_name, description, status, is_active,
              last_tested_at, test_result, configured_at,
              CASE WHEN config != '{}' THEN true ELSE false END as has_config
       FROM iam.integration_settings WHERE tenant_id = $1 ORDER BY display_name`,
      [tenantId]
    );
    return { data: result.rows };
  }

  async getIntegration(tenantId: string, key: string) {
    const integration = await this.db.queryOne(
      `SELECT * FROM iam.integration_settings WHERE tenant_id = $1 AND integration_key = $2`,
      [tenantId, key]
    );
    if (!integration) throw new NotFoundException(`Integration '${key}' not found`);

    // Mask sensitive values in config
    const maskedConfig: any = {};
    if (integration.config) {
      for (const [k, v] of Object.entries(integration.config as Record<string, any>)) {
        if (typeof v === 'string' && v.length > 6 && (k.toLowerCase().includes('key') || k.toLowerCase().includes('token') || k.toLowerCase().includes('secret') || k.toLowerCase().includes('pin'))) {
          maskedConfig[k] = v.substring(0, 4) + '••••' + v.substring(v.length - 4);
        } else {
          maskedConfig[k] = v;
        }
      }
    }

    return { ...integration, config: maskedConfig };
  }

  async configureIntegration(tenantId: string, userId: string, key: string, dto: any) {
    const requiredFields = this.getRequiredFields(key);
    for (const field of requiredFields) {
      if (!dto.config?.[field.key]) {
        throw new BadRequestException(`${field.label} is required`);
      }
    }

    const result = await this.db.queryOne(
      `UPDATE iam.integration_settings
       SET config = $3, status = 'configured', is_active = true,
           configured_at = NOW(), configured_by = $4, updated_at = NOW()
       WHERE tenant_id = $1 AND integration_key = $2
       RETURNING id, integration_key, display_name, status, is_active, configured_at`,
      [tenantId, key, JSON.stringify(dto.config), userId]
    );
    if (!result) throw new NotFoundException(`Integration '${key}' not found`);
    return result;
  }

  async testIntegration(tenantId: string, key: string) {
    const integration = await this.db.queryOne(
      'SELECT config FROM iam.integration_settings WHERE tenant_id = $1 AND integration_key = $2',
      [tenantId, key]
    );
    if (!integration) throw new NotFoundException(`Integration '${key}' not found`);

    let testResult = 'success';
    let testMessage = 'Connection successful';

    try {
      switch (key) {
        case 'bosta_shipping': {
          const apiKey = (integration.config as any)?.api_key;
          if (!apiKey) throw new Error('API key not configured');
          const resp = await fetch('https://app.bosta.co/api/v2/cities', {
            headers: { 'Authorization': apiKey, 'Content-Type': 'application/json' }
          });
          if (!resp.ok) throw new Error(`Bosta API returned ${resp.status}`);
          testMessage = 'Connected to Bosta API successfully';
          break;
        }
        case 'whatsapp_business': {
          const config = integration.config as any;
          if (!config?.api_token) throw new Error('API token not configured');
          testMessage = 'WhatsApp Business API credentials saved. Send a test message to verify.';
          break;
        }
        default:
          testMessage = 'Configuration saved successfully';
      }
    } catch (err: any) {
      testResult = 'failed';
      testMessage = err.message || 'Connection test failed';
    }

    await this.db.query(
      `UPDATE iam.integration_settings SET last_tested_at = NOW(), test_result = $3, updated_at = NOW()
       WHERE tenant_id = $1 AND integration_key = $2`,
      [tenantId, key, `${testResult}: ${testMessage}`]
    );

    return { result: testResult, message: testMessage };
  }

  async disconnectIntegration(tenantId: string, key: string) {
    const result = await this.db.queryOne(
      `UPDATE iam.integration_settings
       SET config = '{}', status = 'pending', is_active = false, 
           configured_at = NULL, configured_by = NULL, updated_at = NOW()
       WHERE tenant_id = $1 AND integration_key = $2
       RETURNING id, integration_key, status`,
      [tenantId, key]
    );
    if (!result) throw new NotFoundException(`Integration '${key}' not found`);
    return result;
  }

  private getRequiredFields(key: string): { key: string; label: string }[] {
    switch (key) {
      case 'bosta_shipping':
        return [{ key: 'api_key', label: 'API Key' }];
      case 'whatsapp_business':
        return [
          { key: 'phone_number_id', label: 'Phone Number ID' },
          { key: 'business_account_id', label: 'Business Account ID' },
          { key: 'api_token', label: 'API Token' },
        ];
      case 'vodafone_cash':
        return [{ key: 'merchant_code', label: 'Merchant Code' }];
      case 'instapay':
        return [{ key: 'ipa_address', label: 'IPA Address' }];
      case 'meta_pixel':
        return [{ key: 'pixel_id', label: 'Pixel ID' }];
      case 'google_analytics':
        return [{ key: 'measurement_id', label: 'Measurement ID' }];
      default:
        return [];
    }
  }
}
