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
      settings: tenant.settings || {},
    };
  }

  async updateCompanyInfo(tenantId: string, dto: any) {
    const settings = JSON.stringify({
      legal_name: dto.legal_name || '',
      email: dto.email || '',
      phone: dto.phone || '',
      tax_id: dto.tax_id || '',
      commercial_reg: dto.commercial_reg || '',
      city: dto.city || '',
      governorate: dto.governorate || '',
      currency: dto.currency || 'EGP',
      vat_rate: dto.vat_rate ?? 14,
      ...(dto.settings || {}),
    });

    const result = await this.db.queryOne(
      `UPDATE iam.tenants SET name = COALESCE($2, name), settings = $3, updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [tenantId, dto.name || null, settings]
    );
    return result;
  }

  // === Tax Settings ===
  async getTaxSettings(tenantId: string) {
    const tenant = await this.db.queryOne(
      'SELECT settings FROM iam.tenants WHERE id = $1', [tenantId]
    );
    const s = tenant?.settings || {};
    return {
      vat_rate: s.vat_rate ?? 14,
      tax_inclusive: s.tax_inclusive ?? true,
      fiscal_year_start: s.fiscal_year_start || 'January',
    };
  }

  async updateTaxSettings(tenantId: string, dto: any) {
    const tenant = await this.db.queryOne(
      'SELECT settings FROM iam.tenants WHERE id = $1', [tenantId]
    );
    const settings = { ...(tenant?.settings || {}), ...dto };
    await this.db.query(
      'UPDATE iam.tenants SET settings = $2, updated_at = NOW() WHERE id = $1',
      [tenantId, JSON.stringify(settings)]
    );
    return settings;
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
    // Validate required fields per integration type
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
          // Test by fetching cities from Bosta
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
