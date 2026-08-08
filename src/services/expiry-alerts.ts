/**
 * Qué está por vencer en la cartera: certificados del inmueble, contratos que llegan
 * al final del plazo y garantías con póliza.
 *
 * Vive separado del repositorio y sin tocar la base porque es la regla que decide qué
 * se le muestra a una persona como urgente: tiene que poder probarse con fechas
 * inventadas, y tiene que dar lo mismo la corra el barrido diario o el botón.
 *
 * Dos niveles y no tres. `vencido` es un hecho —la fecha pasó— y `por_vencer` es una
 * ventana que depende de cuánto tarda conseguir el reemplazo: un matafuegos se recarga
 * en días, un ascensor necesita turno con la empresa, un contrato que no se renueva
 * deja la unidad vacía el mes siguiente. Por eso el umbral es POR TIPO y no uno solo
 * para todo: un único número deja avisos que llegan tarde para lo lento y molestan
 * durante meses para lo rápido.
 */

/** Qué clase de cosa vence. Decide de dónde salió el aviso y a dónde lleva el link. */
export type AlertKind = 'certificado' | 'contrato' | 'garantia';

export type AlertLevel = 'vencido' | 'por_vencer';

export interface ExpiryAlert {
  kind: AlertKind;
  /** El registro que vence: el certificado, el contrato o la garantía. */
  subjectId: string;
  /** Sub-clase dentro del tipo: «ascensor», «seguro_caucion», «plazo». */
  subtype: string;
  level: AlertLevel;
  /** DateKey `YYYY-MM-DD`. */
  expiresAt: string;
  /** «Ascensor · Belgrano 1240» — qué es, en una línea. */
  label: string;
  /** «Vence en 12 días» / «Vencido hace 3 días». */
  message: string;
  /** Para que la fila lleve a algún lado. Vacíos cuando no aplica. */
  buildingId?: string | null;
  unitId?: string | null;
  leaseId?: string | null;
}

/**
 * Días de anticipación de lo que vence en ESTE plugin.
 *
 * Los de certificados no están acá: son de `properties`, que es su dueño, y el
 * repositorio los suma antes de llamar a la detección. Tenerlos dos veces es lo que
 * hacía que la ficha de la propiedad dijera «Vigente» y esta lista «Por vencer» sobre
 * el mismo certificado.
 */
export const LEASE_HORIZONS: Record<string, number> = {
  /** Fin de plazo: un contrato hay que empezar a renegociarlo dos meses antes o el
   * inquilino ya se está mudando. */
  plazo: 60,
  /** Póliza de caución. */
  seguro_caucion: 45,
};

const HORIZONTE_POR_DEFECTO = 30;

/** El mapa completo de umbrales: los de este plugin más los que aporte quien llama. */
export type Horizons = Record<string, number>;

/** Cuántos días antes se empieza a avisar de algo de este tipo. */
export function horizonFor(subtype: string, horizons: Horizons, override?: number | null): number {
  const propio = Number(override);
  if (Number.isFinite(propio) && propio > 0) return propio;
  return horizons[subtype] ?? HORIZONTE_POR_DEFECTO;
}

/** Días entre dos DateKeys. Negativo = la primera ya pasó. */
export function daysBetween(from: string, to: string): number {
  const a = Date.parse(`${from}T00:00:00Z`);
  const b = Date.parse(`${to}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) return Number.NaN;
  return Math.round((b - a) / 86400000);
}

/**
 * El nivel de una fecha de vencimiento, o `null` si todavía falta demasiado para
 * molestar a nadie.
 */
export function evaluate(
  expiresAt: string | null | undefined,
  subtype: string,
  today: string,
  horizons: Horizons,
  override?: number | null
): AlertLevel | null {
  if (!expiresAt || !/^\d{4}-\d{2}-\d{2}$/.test(expiresAt)) return null;
  const dias = daysBetween(today, expiresAt);
  if (Number.isNaN(dias)) return null;
  if (dias < 0) return 'vencido';
  return dias <= horizonFor(subtype, horizons, override) ? 'por_vencer' : null;
}

/**
 * El texto del aviso. Se redacta acá y no en la pantalla para que el mismo aviso se
 * lea igual en la tabla, en la ficha y cuando lo responda el Copilot.
 */
export function describe(level: AlertLevel, expiresAt: string, today: string): string {
  const dias = daysBetween(today, expiresAt);
  if (level === 'vencido') {
    const atraso = Math.abs(dias);
    if (atraso === 0) return 'Vence hoy';
    return atraso === 1 ? 'Vencido ayer' : `Vencido hace ${atraso} días`;
  }
  if (dias === 0) return 'Vence hoy';
  return dias === 1 ? 'Vence mañana' : `Vence en ${dias} días`;
}

/** Un certificado, con lo mínimo para evaluarlo y para nombrarlo. */
export interface CertificateInput {
  id: string;
  type: string;
  expires_at: string;
  alert_days?: number | null;
  building_id?: string | null;
  unit_id?: string | null;
  /** Dónde está: «Belgrano 1240» o «Belgrano 1240 · 1°B». */
  place?: string | null;
}

/** Un contrato vigente, para avisar del fin de plazo. */
export interface LeaseInput {
  id: string;
  end_date: string;
  state: string;
  unit?: string | null;
  property?: string | null;
  tenant?: string | null;
  unit_id?: string | null;
  building_id?: string | null;
}

/** Una garantía con vencimiento propio: hoy solo la póliza de caución. */
export interface GuaranteeInput {
  id: string;
  lease_id: string;
  type: string;
  insurance_expiry?: string | null;
  /** Qué contrato respalda, para nombrarla. */
  place?: string | null;
}

const TIPO_CERTIFICADO: Record<string, string> = {
  matafuegos: 'Matafuegos',
  gas: 'Instalación de gas',
  ascensor: 'Ascensor',
  electricidad: 'Instalación eléctrica',
  seguro: 'Seguro del inmueble',
  otro: 'Certificado',
};

/** Un contrato terminado no vence: ya terminó. Solo se avisa de los que siguen vivos. */
const CONTRATOS_VIVOS = new Set(['vigente', 'por_vencer', 'por_comenzar']);

/**
 * Todo lo que vence, en una sola lista ordenada por urgencia.
 *
 * Van juntos los tres porque para quien administra son la misma tarea de la semana
 * —«qué tengo que renovar»— y separarlos en tres pantallas obliga a recordar tres
 * lugares. Lo vencido primero y, dentro de cada nivel, lo que vence antes.
 */
export function detectExpiries({
  certificates = [],
  leases = [],
  guarantees = [],
  today,
  horizons,
}: {
  certificates?: CertificateInput[];
  leases?: LeaseInput[];
  guarantees?: GuaranteeInput[];
  today: string;
  /**
   * Umbrales por tipo. Llega de afuera —y no se importa acá— porque los de
   * certificados son de `properties`: importarlos ataría esta regla, que tiene que
   * poder probarse sola, al plugin de al lado.
   */
  horizons: Horizons;
}): ExpiryAlert[] {
  const alertas: ExpiryAlert[] = [];

  for (const c of certificates) {
    const level = evaluate(c.expires_at, c.type, today, horizons, c.alert_days);
    if (!level) continue;
    alertas.push({
      kind: 'certificado',
      subjectId: c.id,
      subtype: c.type,
      level,
      expiresAt: c.expires_at,
      label: [TIPO_CERTIFICADO[c.type] ?? 'Certificado', c.place].filter(Boolean).join(' · '),
      message: describe(level, c.expires_at, today),
      buildingId: c.building_id ?? null,
      unitId: c.unit_id ?? null,
    });
  }

  for (const l of leases) {
    if (!CONTRATOS_VIVOS.has(String(l.state))) continue;
    const level = evaluate(l.end_date, 'plazo', today, horizons);
    if (!level) continue;
    alertas.push({
      kind: 'contrato',
      subjectId: l.id,
      subtype: 'plazo',
      level,
      expiresAt: l.end_date,
      label: ['Contrato', [l.property, l.unit].filter(Boolean).join(' · '), l.tenant]
        .filter(Boolean)
        .join(' · '),
      message: describe(level, l.end_date, today),
      buildingId: l.building_id ?? null,
      unitId: l.unit_id ?? null,
      leaseId: l.id,
    });
  }

  for (const g of guarantees) {
    // Solo la caución tiene fecha propia; un garante o un depósito no vencen.
    const level = evaluate(g.insurance_expiry, g.type, today, horizons);
    if (!level) continue;
    alertas.push({
      kind: 'garantia',
      subjectId: g.id,
      subtype: g.type,
      level,
      expiresAt: String(g.insurance_expiry),
      label: ['Seguro de caución', g.place].filter(Boolean).join(' · '),
      message: describe(level, String(g.insurance_expiry), today),
      leaseId: g.lease_id,
    });
  }

  return alertas.sort((a, b) => {
    if (a.level !== b.level) return a.level === 'vencido' ? -1 : 1;
    return a.expiresAt.localeCompare(b.expiresAt);
  });
}
