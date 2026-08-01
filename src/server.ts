/**
 * @coongro/leases — Exportaciones server-only
 *
 * Schema tables y repositories (dependen de drizzle-orm).
 * NO importar desde el browser — usar '@coongro/leases' para hooks/componentes.
 */
export * from './schema/lease.js';
export { LeaseRepository } from './repositories/lease.repository.js';
export * from './schema/lease-tenant.js';
export { LeaseTenantRepository } from './repositories/lease-tenant.repository.js';
export * from './schema/guarantee.js';
export { GuaranteeRepository } from './repositories/guarantee.repository.js';
export * from './schema/index-adjustment.js';
export { IndexAdjustmentRepository } from './repositories/index-adjustment.repository.js';
export * from './schema/notice-log.js';
export { NoticeLogRepository } from './repositories/notice-log.repository.js';
