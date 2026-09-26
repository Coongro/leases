// Generado por el Coongro Builder desde contributes.permissions. No editar a mano.

export const LeasesPermissions = {
  /** Eliminar actualizaciones */
  adjustmentsDelete: 'leases.adjustments.delete',
  /** Gestionar actualizaciones */
  adjustmentsManage: 'leases.adjustments.manage',
  /** Ver actualizaciones */
  adjustmentsRead: 'leases.adjustments.read',
  /** Cobrar alquileres */
  billingManage: 'leases.billing.manage',
  /** Ver cobranzas */
  billingRead: 'leases.billing.read',
  /** Eliminar conceptos pactados */
  chargesDelete: 'leases.charges.delete',
  /** Gestionar conceptos pactados */
  chargesManage: 'leases.charges.manage',
  /** Ver conceptos pactados */
  chargesRead: 'leases.charges.read',
  /** Eliminar contratos */
  contractsDelete: 'leases.contracts.delete',
  /** Gestionar contratos */
  contractsManage: 'leases.contracts.manage',
  /** Ver contratos */
  contractsRead: 'leases.contracts.read',
  /** Eliminar co-inquilinos */
  coTenantsDelete: 'leases.coTenants.delete',
  /** Gestionar co-inquilinos */
  coTenantsManage: 'leases.coTenants.manage',
  /** Ver co-inquilinos */
  coTenantsRead: 'leases.coTenants.read',
  /** Gestionar vencimientos */
  expiriesManage: 'leases.expiries.manage',
  /** Ver vencimientos */
  expiriesRead: 'leases.expiries.read',
  /** Eliminar garantías */
  guaranteesDelete: 'leases.guarantees.delete',
  /** Gestionar garantías */
  guaranteesManage: 'leases.guarantees.manage',
  /** Ver garantías */
  guaranteesRead: 'leases.guarantees.read',
} as const;

export type LeasesPermission = (typeof LeasesPermissions)[keyof typeof LeasesPermissions];
