/**
 * AUTO-GENERADO por Coongro Builder — NO editar a mano.
 * Se regenera al guardar la página de settings desde /dev/builder.
 * La lógica de negocio va en un hook de dominio que consume esto.
 */
/* eslint-disable */

import { useSettings } from '@coongro/plugin-sdk';

function toEnum<T extends string>(v: unknown, options: readonly T[], fallback: T): T {
  return typeof v === 'string' && (options as readonly string[]).includes(v) ? (v as T) : fallback;
}

function toNum(v: unknown, fallback: number): number {
  if (typeof v === 'number' && !Number.isNaN(v)) return v;
  if (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v))) return Number(v);
  return fallback;
}

export const CHARGES_GENERATION = {
  manual: 'manual',
  ask: 'ask',
  auto: 'auto',
} as const;

export const LATE_FEE_APPLY = {
  propose: 'propose',
  off: 'off',
} as const;

export const CONTRACTS_DEFAULT_CURRENCY = {
  ARS: 'ARS',
  USD: 'USD',
} as const;

export const CONTRACTS_DEFAULT_DUE_DAY_TYPE = {
  fixed: 'fixed',
  business: 'business',
} as const;

export const CONTRACTS_DEFAULT_ADJUSTMENT_INDEX = {
  ICL: 'ICL',
  IPC: 'IPC',
  casa_propia: 'casa_propia',
  fijo: 'fijo',
} as const;

export const CONTRACTS_DEFAULT_ADJUSTMENT_MONTHS = {
  _3: '3',
  _4: '4',
  _6: '6',
  _12: '12',
} as const;

export const CONTRACTS_USD_HOUSE = {
  oficial: 'oficial',
  blue: 'blue',
  bolsa: 'bolsa',
  contadoconliqui: 'contadoconliqui',
  mayorista: 'mayorista',
} as const;

/** Tipo de cada setting por su key punteada (para getSetting). */
export interface LeasesSettingsByKey {
  'leases.charges.generation': 'manual' | 'ask' | 'auto';
  'leases.lateFee.graceDays': number;
  'leases.lateFee.apply': 'propose' | 'off';
  'leases.contracts.defaultCurrency': 'ARS' | 'USD';
  'leases.contracts.defaultDueDay': number;
  'leases.contracts.defaultDueDayType': 'fixed' | 'business';
  'leases.contracts.defaultAdjustmentIndex': 'ICL' | 'IPC' | 'casa_propia' | 'fijo';
  'leases.contracts.defaultAdjustmentMonths': '3' | '4' | '6' | '12';
  'leases.contracts.usdHouse': 'oficial' | 'blue' | 'bolsa' | 'contadoconliqui' | 'mayorista';
  'leases.contracts.expiryWarningDays': number;
}

/** Settings del plugin con defaults aplicados y coerción por tipo. */
export interface LeasesSettings {
  /** Cómo se generan — «A mano»: vos apretás el botón en Cobranzas cuando querés. «Avisarme»: el sistema te recuerda al inicio del mes y generás vos. «Sola»: se generan al empezar el mes sin preguntar. Generándolos dos veces nunca se duplican, así que la diferencia real es cuánta iniciativa querés que tome el sistema. · `leases.charges.generation` · default: `"manual"` */
  readonly chargesGeneration: 'manual' | 'ask' | 'auto';
  /** Días de gracia — Cuántos días después del vencimiento se puede pagar sin punitorio. Un pago que entra el lunes por un vencimiento del sábado no siempre es una mora: con 0 el interés corre desde el día siguiente. · `leases.lateFee.graceDays` · default: `0` */
  readonly lateFeeGraceDays: number;
  /** Cómo se cobra el punitorio — El punitorio nunca se agrega en silencio. «Proponer» lo calcula y espera tu confirmación antes de sumarlo a la cuenta; «no calcular» lo deja fuera del sistema, para quien lo arregla hablando. · `leases.lateFee.apply` · default: `"propose"` */
  readonly lateFeeApply: 'propose' | 'off';
  /** Moneda — En qué moneda se pactan tus alquileres habitualmente. Es solo el valor con el que arranca el formulario: cada contrato puede firmarse en la otra. · `leases.contracts.defaultCurrency` · default: `"ARS"` */
  readonly contractsDefaultCurrency: 'ARS' | 'USD';
  /** Día de vencimiento — Qué día del mes vencen tus alquileres. Cada propietario tiene su costumbre — el 1, el 5, el 10 — y repetirla en cada contrato es tiempo perdido. · `leases.contracts.defaultDueDay` · default: `10` */
  readonly contractsDefaultDueDay: number;
  /** Cómo se cuenta ese día — «Día fijo» vence siempre la misma fecha, caiga como caiga. «Día hábil» corre el vencimiento cuando cae fin de semana o feriado — se usa cuando el pago entra por transferencia y el banco tiene que estar abierto. · `leases.contracts.defaultDueDayType` · default: `"fixed"` */
  readonly contractsDefaultDueDayType: 'fixed' | 'business';
  /** Índice de actualización — Con qué índice actualizás los alquileres. Desde la Ley 27.551 el ICL del BCRA es el más usado, pero se pacta libremente. · `leases.contracts.defaultAdjustmentIndex` · default: `"ICL"` */
  readonly contractsDefaultAdjustmentIndex: 'ICL' | 'IPC' | 'casa_propia' | 'fijo';
  /** Cada cuánto se actualiza — Cada cuántos meses se recalcula el alquiler. Ya no lo fija la ley: se pacta en el contrato. · `leases.contracts.defaultAdjustmentMonths` · default: `"6"` */
  readonly contractsDefaultAdjustmentMonths: '3' | '4' | '6' | '12';
  /** Con qué dólar se convierte — Un contrato pactado en dólares se cobra en pesos: el cargo se convierte con esta cotización el día que se emite, y queda asentado con qué valor y de qué fecha se hizo la cuenta. Elegí la que dice el contrato — si dice «dólar oficial», poné oficial. · `leases.contracts.usdHouse` · default: `"oficial"` */
  readonly contractsUsdHouse: 'oficial' | 'blue' | 'bolsa' | 'contadoconliqui' | 'mayorista';
  /** Marcar «por vencer» con esta anticipación — Cuántos días antes del final un contrato aparece como próximo a vencer. Es el tiempo que te dejás para negociar la renovación o buscar un inquilino nuevo: por debajo de 60 días se llega justo. · `leases.contracts.expiryWarningDays` · default: `60` */
  readonly contractsExpiryWarningDays: number;
}

/** Nombre de prop → key punteada del manifest. */
export const SETTING_KEYS = {
  chargesGeneration: 'leases.charges.generation',
  lateFeeGraceDays: 'leases.lateFee.graceDays',
  lateFeeApply: 'leases.lateFee.apply',
  contractsDefaultCurrency: 'leases.contracts.defaultCurrency',
  contractsDefaultDueDay: 'leases.contracts.defaultDueDay',
  contractsDefaultDueDayType: 'leases.contracts.defaultDueDayType',
  contractsDefaultAdjustmentIndex: 'leases.contracts.defaultAdjustmentIndex',
  contractsDefaultAdjustmentMonths: 'leases.contracts.defaultAdjustmentMonths',
  contractsUsdHouse: 'leases.contracts.usdHouse',
  contractsExpiryWarningDays: 'leases.contracts.expiryWarningDays',
} as const;

/** Valores por defecto (los mismos del manifest). */
export const SETTING_DEFAULTS = {
  'leases.charges.generation': 'manual',
  'leases.lateFee.graceDays': 0,
  'leases.lateFee.apply': 'propose',
  'leases.contracts.defaultCurrency': 'ARS',
  'leases.contracts.defaultDueDay': 10,
  'leases.contracts.defaultDueDayType': 'fixed',
  'leases.contracts.defaultAdjustmentIndex': 'ICL',
  'leases.contracts.defaultAdjustmentMonths': '6',
  'leases.contracts.usdHouse': 'oficial',
  'leases.contracts.expiryWarningDays': 60,
} as const;

const COERCE: {
  [K in keyof LeasesSettingsByKey]: (values: Record<string, unknown>) => LeasesSettingsByKey[K];
} = {
  'leases.charges.generation': (values) =>
    toEnum(values['leases.charges.generation'], ['manual', 'ask', 'auto'], 'manual'),
  'leases.lateFee.graceDays': (values) => toNum(values['leases.lateFee.graceDays'], 0),
  'leases.lateFee.apply': (values) =>
    toEnum(values['leases.lateFee.apply'], ['propose', 'off'], 'propose'),
  'leases.contracts.defaultCurrency': (values) =>
    toEnum(values['leases.contracts.defaultCurrency'], ['ARS', 'USD'], 'ARS'),
  'leases.contracts.defaultDueDay': (values) => toNum(values['leases.contracts.defaultDueDay'], 10),
  'leases.contracts.defaultDueDayType': (values) =>
    toEnum(values['leases.contracts.defaultDueDayType'], ['fixed', 'business'], 'fixed'),
  'leases.contracts.defaultAdjustmentIndex': (values) =>
    toEnum(
      values['leases.contracts.defaultAdjustmentIndex'],
      ['ICL', 'IPC', 'casa_propia', 'fijo'],
      'ICL'
    ),
  'leases.contracts.defaultAdjustmentMonths': (values) =>
    toEnum(values['leases.contracts.defaultAdjustmentMonths'], ['3', '4', '6', '12'], '6'),
  'leases.contracts.usdHouse': (values) =>
    toEnum(
      values['leases.contracts.usdHouse'],
      ['oficial', 'blue', 'bolsa', 'contadoconliqui', 'mayorista'],
      'oficial'
    ),
  'leases.contracts.expiryWarningDays': (values) =>
    toNum(values['leases.contracts.expiryWarningDays'], 60),
};

/** Lee UNA setting tipada desde los valores crudos del tenant (para handlers). */
export function getSetting<K extends keyof LeasesSettingsByKey>(
  values: Record<string, unknown>,
  key: K
): LeasesSettingsByKey[K] {
  return COERCE[key](values);
}

/** Construye el objeto tipado desde los valores crudos (sin hook: handlers/tests). */
export function readLeasesSettings(values: Record<string, unknown>): LeasesSettings {
  return {
    chargesGeneration: COERCE['leases.charges.generation'](values),
    lateFeeGraceDays: COERCE['leases.lateFee.graceDays'](values),
    lateFeeApply: COERCE['leases.lateFee.apply'](values),
    contractsDefaultCurrency: COERCE['leases.contracts.defaultCurrency'](values),
    contractsDefaultDueDay: COERCE['leases.contracts.defaultDueDay'](values),
    contractsDefaultDueDayType: COERCE['leases.contracts.defaultDueDayType'](values),
    contractsDefaultAdjustmentIndex: COERCE['leases.contracts.defaultAdjustmentIndex'](values),
    contractsDefaultAdjustmentMonths: COERCE['leases.contracts.defaultAdjustmentMonths'](values),
    contractsUsdHouse: COERCE['leases.contracts.usdHouse'](values),
    contractsExpiryWarningDays: COERCE['leases.contracts.expiryWarningDays'](values),
  };
}

/**
 * Hook reactivo: settings tipadas del plugin con defaults aplicados.
 * Envolvé esto en un hook de dominio si necesitás lógica de negocio.
 */
export function useLeasesSettings(): { settings: LeasesSettings; loading: boolean } {
  const { values, loading } = useSettings('leases.');
  return { settings: readLeasesSettings(values), loading };
}
