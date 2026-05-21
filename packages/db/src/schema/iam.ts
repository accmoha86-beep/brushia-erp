// @ts-nocheck
/**
 * IAM Domain - Drizzle Schema
 * 
 * Tables: tenants, users, roles, permissions, sessions, api_keys
 * Schema: iam
 */
import {
  pgSchema,
  jsonb,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  inet,
  primaryKey,
  uniqueIndex,
  index,
  check,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

export const iamSchema = pgSchema('iam');

// =========================================================
// TENANTS
// =========================================================
export const tenants = iamSchema.table('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  plan: varchar('plan', { length: 50 }).notNull().default('trial'),
  
  legalName: varchar('legal_name', { length: 255 }),
  taxId: varchar('tax_id', { length: 50 }),
  commercialReg: varchar('commercial_reg', { length: 50 }),
  
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  
  addressLine1: varchar('address_line1', { length: 255 }),
  addressLine2: varchar('address_line2', { length: 255 }),
  city: varchar('city', { length: 100 }),
  governorate: varchar('governorate', { length: 100 }),
  postalCode: varchar('postal_code', { length: 10 }),
  country: varchar('country', { length: 2 }).notNull().default('EG'),
  
  currency: varchar('currency', { length: 3 }).notNull().default('EGP'),
  timezone: varchar('timezone', { length: 50 }).notNull().default('Africa/Cairo'),
  locale: varchar('locale', { length: 10 }).notNull().default('ar-EG'),
  vatRate: integer('vat_rate').notNull().default(1400),
  fiscalYearStart: integer('fiscal_year_start').notNull().default(1),
  
  maxUsers: integer('max_users').notNull().default(5),
  maxBranches: integer('max_branches').notNull().default(1),
  maxWarehouses: integer('max_warehouses').notNull().default(2),
  
  trialEndsAt: timestamp('trial_ends_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

// =========================================================
// USERS
// =========================================================
export const users = iamSchema.table('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  avatarUrl: varchar('avatar_url', { length: 500 }),
  
  status: varchar('status', { length: 20 }).notNull().default('active'),
  emailVerified: boolean('email_verified').notNull().default(false),
  phoneVerified: boolean('phone_verified').notNull().default(false),
  
  failedLoginAttempts: integer('failed_login_attempts').notNull().default(0),
  lockedUntil: timestamp('locked_until', { withTimezone: true }),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  passwordChangedAt: timestamp('password_changed_at', { withTimezone: true }).notNull().defaultNow(),
  mustChangePassword: boolean('must_change_password').notNull().default(false),
  
  language: varchar('language', { length: 5 }).notNull().default('ar'),
  theme: varchar('theme', { length: 10 }).notNull().default('system'),
  
  defaultBranchId: uuid('default_branch_id'),
  defaultWarehouseId: uuid('default_warehouse_id'),
  
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => [
  uniqueIndex('users_email_tenant_idx').on(table.tenantId, table.email),
  index('users_tenant_idx').on(table.tenantId),
]);

// =========================================================
// ROLES
// =========================================================
export const roles = iamSchema.table('roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull(),
  description: text('description'),
  
  isSystem: boolean('is_system').notNull().default(false),
  isDefault: boolean('is_default').notNull().default(false),
  permissions: jsonb('permissions').default([]),
  
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex('roles_slug_tenant_idx').on(table.tenantId, table.slug),
]);

// =========================================================
// PERMISSIONS
// =========================================================
export const permissions = iamSchema.table('permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  code: varchar('code', { length: 200 }).notNull().unique(),
  module: varchar('module', { length: 50 }).notNull(),
  resource: varchar('resource', { length: 50 }).notNull(),
  action: varchar('action', { length: 50 }).notNull(),
  
  description: text('description'),
  displayGroup: varchar('display_group', { length: 100 }),
  displayOrder: integer('display_order').notNull().default(0),
  
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// =========================================================
// ROLE PERMISSIONS
// =========================================================
export const rolePermissions = iamSchema.table('role_permissions', {
  roleId: uuid('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  permissionId: uuid('permission_id').notNull().references(() => permissions.id, { onDelete: 'cascade' }),
  grantedAt: timestamp('granted_at', { withTimezone: true }).notNull().defaultNow(),
  grantedBy: uuid('granted_by').references(() => users.id),
}, (table) => [
  primaryKey({ columns: [table.roleId, table.permissionId] }),
]);

// =========================================================
// USER ROLES
// =========================================================
export const userRoles = iamSchema.table('user_roles', {
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  roleId: uuid('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  branchId: uuid('branch_id'),
  assignedAt: timestamp('assigned_at', { withTimezone: true }).notNull().defaultNow(),
  assignedBy: uuid('assigned_by').references(() => users.id),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
}, (table) => [
  index('user_roles_user_idx').on(table.userId),
  index('user_roles_role_idx').on(table.roleId),
]);

// =========================================================
// SESSIONS
// =========================================================
export const sessions = iamSchema.table('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  
  refreshTokenHash: varchar('refresh_token_hash', { length: 128 }).notNull().unique(),
  
  ipAddress: inet('ip_address'),
  userAgent: text('user_agent'),
  deviceType: varchar('device_type', { length: 20 }),
  
  isActive: boolean('is_active').notNull().default(true),
  lastActivityAt: timestamp('last_activity_at', { withTimezone: true }).notNull().defaultNow(),
  
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
}, (table) => [
  index('sessions_user_idx').on(table.userId),
]);

// =========================================================
// API KEYS
// =========================================================
export const apiKeys = iamSchema.table('api_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  
  name: varchar('name', { length: 100 }).notNull(),
  keyHash: varchar('key_hash', { length: 128 }).notNull().unique(),
  keyPrefix: varchar('key_prefix', { length: 10 }).notNull(),
  
  permissions: text('permissions').array().notNull().default(sql`'{}'`),
  
  rateLimit: integer('rate_limit').notNull().default(1000),
  
  isActive: boolean('is_active').notNull().default(true),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  revokedBy: uuid('revoked_by').references(() => users.id),
}, (table) => [
  index('api_keys_tenant_idx').on(table.tenantId),
]);

// =========================================================
// RELATIONS
// =========================================================
export const tenantsRelations = relations(tenants, ({ many }) => ({
  users: many(users),
  roles: many(roles),
  sessions: many(sessions),
  apiKeys: many(apiKeys),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  tenant: one(tenants, { fields: [users.tenantId], references: [tenants.id] }),
  userRoles: many(userRoles),
  sessions: many(sessions),
}));

export const rolesRelations = relations(roles, ({ one, many }) => ({
  tenant: one(tenants, { fields: [roles.tenantId], references: [tenants.id] }),
  rolePermissions: many(rolePermissions),
  userRoles: many(userRoles),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
}));
