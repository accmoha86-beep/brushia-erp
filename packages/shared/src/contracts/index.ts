/**
 * Module Contracts Index
 * All cross-module communication goes through these contracts.
 * Rule: No module may directly query another module's database tables.
 */

export * from './catalog.contract';
export * from './inventory.contract';
export * from './accounting.contract';
export * from './sales.contract';
