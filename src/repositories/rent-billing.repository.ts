import {
  accountLineTable,
  AccountLineRepository,
  AccountRepository,
  PaymentRepository,
} from '@coongro/billing/server';
import { convertToArs, describeRate } from '@coongro/indices';
import { FxRateRepository } from '@coongro/indices/server';
import {
  expenseForWorkOrder,
  workOrderRef,
  WorkOrderRepository,
} from '@coongro/maintenance/server';
import type { ModuleDatabaseAPI } from '@coongro/plugin-sdk';
import {
  BuildingExpenseRepository,
  BuildingRepository,
  UnitRepository,
} from '@coongro/properties/server';
import { eq } from 'drizzle-orm';

import type { GuaranteeRow } from '../schema/guarantee.js';
import {
  generateCharges,
  RENT_SOURCE,
  type GenerationResult,
  type MoneyConverter,
} from '../services/charge-generation.js';
import type { ExpenseSettlement } from '../services/expenses.js';
import { currentLateFeePolicy } from '../services/late-fee-policy.server.js';
import { proposeLateFee, type LateFeePolicy } from '../services/late-fee.js';
import type { LeaseCharge } from '../services/lease-charges.js';
import { periodTotals, type PeriodTotals } from '../services/period-totals.js';
import {
  propertyResults,
  type ChargeForResult,
  type ExpenseForResult,
  type PropertyResult,
} from '../services/property-result.js';
import { chargeForTenantExpense } from '../services/tenant-expense.js';

import { GuaranteeRepository } from './guarantee.repository.js';
import { IndexAdjustmentRepository } from './index-adjustment.repository.js';
import { LeaseChargeRepository } from './lease-charge.repository.js';
import { LeaseRepository, type LeaseListRow } from './lease.repository.js';

/**
 * Con qué origen entra en el recibo un arreglo que paga el inquilino.
 *
 * Es su propio `source_type` y no `mantenimiento` —el que usa el egreso al proveedor—
 * porque son las dos puntas del mismo gasto y conviven en la misma base: una sale de la
 * caja del propietario, la otra se la cobra al inquilino. Distinguirlas es lo que
 * permite preguntar «cuánto gasté» sin contar el recupero como si fuera otro gasto.
 */
const TENANT_EXPENSE_SOURCE = 'gasto_a_cargo';

/**
 * La cobranza de los alquileres: los cargos de un período con el contrato al que
 * pertenece cada uno.
 *
 * El cruce es entre dos plugins —las cuentas las lleva `billing`, que no sabe qué es un
 * contrato; el contrato lo tiene `leases`, que no lleva la plata— y el puente es
 * `source_ref = "<leaseId>:<período>"`, el mismo dato con el que la generación evita
 * duplicar.
 *
 * Antes esto vivía en el front (`src/data/`) porque un repositorio no podía hablar con
 * otro plugin. Ahora sí: se instancia el repositorio de `billing` con la MISMA base
 * tenant-scoped, así que la pantalla y el Copilot leen exactamente lo mismo en vez de
 * que cada uno arme el cruce por su cuenta.
 */

export interface RentChargeRow {
  id: string;
  lease_id: string;
  unit: string | null;
  property: string | null;
  tenant: string | null;
  due_date: string | null;
  total_due: string;
  paid: string;
  balance: string;
  status: string;
  /** Desglose de lo FACTURADO, para explicar el total sin abrir cada cuenta. */
  rent: string;
  expenses: string;
  /** Todo lo que no es alquiler, expensas ni punitorio: arreglos, impuestos, descuentos. */
  other: string;
  /** Porcentaje diario de punitorio pactado ('0' = no se pactó). */
  late_fee_percent: string;
  /** Punitorio propuesto para este cargo. Vacío = no corresponde. */
  late_fee: string;
  /** «12 días de atraso al 0,5% diario» — para el recibo y para explicar la propuesta. */
  late_fee_detail: string;
  /** `proponer` cuando hay algo para cobrar; vacío si no. Es lo que muestra la acción. */
  late_fee_state: string;
}

/** Un contrato que se acerca al final del plazo, como lo lista el panel. */
export interface ExpiringLease {
  id: string;
  unit: string | null;
  property: string | null;
  tenant: string | null;
  end_date: string;
}

/** El estado del negocio que resume el panel. */
export interface PanelData {
  propiedades: number;
  unidades: number;
  ocupadas: number;
  vacantes: number;
  ocupacionPct: number;
  contratosActivos: number;
  porVencer: ExpiringLease[];
  ajustesPendientes: Array<{ unit: string; index: string; new_rent: string }>;
  facturado: number;
  cobrado: number;
  porCobrar: number;
  vencido: number;
  cargosImpagos: number;
}

/** Un mes del gráfico anual: lo cobrado contra lo que quedó impago. */
export interface YearPoint {
  label: string;
  paid: number;
  unpaid: number;
}

/** Una línea de la cuenta corriente de un contrato. */
export interface LeaseChargeAccount {
  id: string;
  /** «2026-08» — el crudo, para ordenar. */
  period_key: string;
  /** «Agosto 2026» — el período como lo lee una persona. */
  period: string;
  due_date: string | null;
  total: string;
  paid: string;
  balance: string;
  status: string;
}

/** Un cargo en la cuenta corriente de un inquilino: la unidad importa porque puede
 * alquilar más de una. */
export interface TenantCharge {
  id: string;
  period_key: string;
  period: string;
  unit: string | null;
  due_date: string | null;
  total_due: string;
  paid: string;
  balance: string;
  status: string;
}

/** La ficha completa de un contrato, tal como la muestra su pantalla. */
export interface ContractFile {
  contrato: LeaseListRow;
  /** La garantía vigente de ESTE contrato, si tiene una cargada. */
  garantia?: GuaranteeRow;
  cargos: LeaseChargeAccount[];
  /** Lo que este contrato debe hoy, sumando sus cargos. */
  saldo: number;
  impagos: number;
}

export interface TenantContract {
  id: string;
  unit: string | null;
  property: string | null;
  start_date: string;
  end_date: string;
  rent_amount: string;
  state: string;
}

/** Todo lo que muestra la ficha de un inquilino. */
export interface TenantFile {
  contratos: TenantContract[];
  cargos: TenantCharge[];
  /** El contrato que hoy está vigente, si tiene uno: dónde vive y cuánto paga. */
  vigente?: TenantContract;
  /** Fecha del primer contrato: desde cuándo es inquilino. */
  desde?: string;
  facturado: number;
  cobrado: number;
  saldo: number;
  impagos: number;
}

/** Un contrato cuenta como vigente para la ficha si está corriendo o por vencer. */
const VIGENTES = new Set(['vigente', 'por_vencer']);

const MESES_LARGOS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

/** «2026-08» → «Agosto 2026». */
function periodoLegible(period: string): string {
  const m = /^(\d{4})-(\d{2})$/.exec(period);
  if (!m) return period;
  return `${MESES_LARGOS[Number(m[2]) - 1] ?? m[2]} ${m[1]}`;
}

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

/** «ICL · +12,81%» — el índice con su variación, si ya está calculada. */
function etiquetaIndice(code?: string | null, rate?: string | null): string {
  const base = code ?? '';
  if (rate === null || rate === undefined || rate === '') return base;
  return `${base} · +${String(rate).replace('.', ',')}%`;
}

/** `<leaseId>:<período>` — el id es todo lo anterior a los dos puntos finales. */
function leaseIdDe(sourceRef: string): string {
  const corte = sourceRef.lastIndexOf(':');
  return corte < 0 ? sourceRef : sourceRef.slice(0, corte);
}

/** `<leaseId>:<período>` — el período es lo que sigue a los dos puntos finales. */
function periodoDe(sourceRef: string): string {
  const corte = sourceRef.lastIndexOf(':');
  return corte < 0 ? '' : sourceRef.slice(corte + 1);
}

/** El resultado de una propiedad con su nombre resuelto, como lo muestra la pantalla. */
export interface PropertyResultRow extends PropertyResult {
  property: string;
}

export class RentBillingRepository {
  constructor(private readonly db: ModuleDatabaseAPI) {}

  /**
   * Los cargos de alquiler de un mes, listos para mostrar o para responder.
   *
   * La política de punitorios llega por parámetro porque es una setting del negocio y
   * quien la lee es el cliente. Sin ella no se propone nada: es el mismo criterio que
   * en la pantalla — el punitorio se propone, no se cobra solo.
   *
   * `generateIfMissing` emite el mes cuando todavía no tiene ningún cargo. Va acá y no
   * en dos llamadas seguidas porque «traeme el mes, y si falta emitilo» es UNA decisión:
   * separarlas deja una ventana en la que dos pantallas abiertas a la vez emiten dos
   * veces (no duplica —el `source_ref` es único— pero sí genera trabajo y confusión).
   */
  async chargesForPeriod({
    period,
    graceDays,
    applyLateFee,
    generateIfMissing,
    usdHouse,
  }: {
    period: string;
    graceDays?: number;
    applyLateFee?: 'propose' | 'off';
    generateIfMissing?: boolean;
    usdHouse?: string;
  }): Promise<RentChargeRow[]> {
    const cuentas = new AccountRepository(this.db);
    const contratos = new LeaseRepository(this.db);

    if (generateIfMissing) {
      const yaHay = await cuentas.listWithTotals({
        source: RENT_SOURCE,
        refSuffix: `:${period}`,
      });
      if (yaHay.length === 0) await this.generateForPeriod({ period, usdHouse });
    }

    const [filas, leases, desgloses] = await Promise.all([
      cuentas.listWithTotals({ source: RENT_SOURCE, refSuffix: `:${period}` }),
      contratos.list(),
      this.desglosePorCuenta(),
    ]);

    const porContrato = new Map(leases.map((l) => [l.id, l]));
    const policy: LateFeePolicy = {
      graceDays: Number(graceDays) || 0,
      apply: applyLateFee === 'propose' ? 'propose' : 'off',
    };

    return (filas ?? []).map((cuenta) => {
      const leaseId = leaseIdDe(String(cuenta.source_ref ?? ''));
      const l = porContrato.get(leaseId);
      const desglose = desgloses.get(String(cuenta.id)) ?? { rent: 0, expenses: 0, otros: 0 };

      const fila = {
        id: String(cuenta.id),
        lease_id: leaseId,
        unit: l?.unit ?? null,
        property: l?.property ?? null,
        tenant: l?.tenant ?? null,
        due_date: cuenta.due_date ?? null,
        total_due: String(cuenta.total ?? '0'),
        paid: String(cuenta.paid ?? '0'),
        balance: String(cuenta.balance ?? '0'),
        status: String(cuenta.status ?? 'open'),
        // Lo FACTURADO, no lo pactado. Salía del contrato, y eso hacía que el desglose
        // no cerrara con el total en cuanto los dos dejaban de coincidir: después de una
        // actualización mostraba el alquiler nuevo sobre un cargo viejo, las expensas
        // liquidadas por el consorcio figuraban en cero porque el contrato no las tiene,
        // y cualquier otro concepto —un arreglo a cargo del inquilino, un descuento— no
        // aparecía en ninguna parte. El inquilino leía un total que el detalle no explicaba.
        rent: String(desglose.rent),
        expenses: String(desglose.expenses),
        other: String(desglose.otros),
        late_fee_percent: l?.late_fee_percent ?? '0',
      };

      const punitorio = proposeLateFee(fila, policy);
      return {
        ...fila,
        late_fee: punitorio.amount === '0' ? '' : punitorio.amount,
        late_fee_detail: punitorio.detail,
        late_fee_state: punitorio.amount === '0' ? '' : 'proponer',
      };
    });
  }

  /**
   * Lo que se facturó en cada cargo, abierto en alquiler, expensas y todo lo demás.
   *
   * Se arma de las líneas —que son lo que la persona va a pagar— y no de las condiciones
   * del contrato.
   *
   * «Otros» incluye el punitorio YA FACTURADO, aunque la pantalla tenga su propia columna
   * de punitorio: esa columna muestra lo que se PROPONE cobrar hoy, que no está en la
   * cuenta y no suma al total. Son dos cosas distintas con el mismo nombre, y dejar
   * afuera el punitorio cobrado hacía que el desglose de un cargo atrasado no llegara
   * al total.
   */
  private async desglosePorCuenta(): Promise<
    Map<string, { rent: number; expenses: number; otros: number }>
  > {
    const lineas = await new AccountLineRepository(this.db).list();
    const porCuenta = new Map<string, { rent: number; expenses: number; otros: number }>();

    for (const linea of lineas ?? []) {
      const cuenta = String(linea.account_id ?? '');
      if (!cuenta) continue;
      const acc = porCuenta.get(cuenta) ?? { rent: 0, expenses: 0, otros: 0 };
      const monto = Number(linea.subtotal ?? 0);
      const tipo = String(linea.source_type ?? '');

      if (tipo === RENT_SOURCE) acc.rent += monto;
      else if (tipo === 'expenses') acc.expenses += monto;
      else acc.otros += monto;

      porCuenta.set(cuenta, acc);
    }
    return porCuenta;
  }

  /** Los totales de arriba de Cobranzas: facturado, cobrado, por cobrar y vencido. */
  async periodSummary({ period }: { period: string }): Promise<PeriodTotals> {
    return periodTotals(await this.chargesForPeriod({ period }));
  }

  /**
   * Qué le dejó cada propiedad en el año: alquiler cobrado menos honorarios y gastos.
   *
   * Cruza los tres plugins que tienen las puntas —los contratos y su cobranza en
   * `leases`, la propiedad en `properties`, los arreglos en `maintenance`— porque
   * ninguno solo puede responderlo. Es el único lugar del kit donde se ve si una
   * propiedad rinde o se come la renta en mantenimiento.
   *
   * El criterio de qué entra y qué no vive en el servicio puro, con sus tests.
   */
  async propertyResults({ year }: { year?: number } = {}): Promise<PropertyResultRow[]> {
    const anio = year ?? new Date().getFullYear();
    const [cuentas, contratos, desgloses, edificios, ordenes] = await Promise.all([
      new AccountRepository(this.db).listWithTotals({ source: RENT_SOURCE }),
      new LeaseRepository(this.db).list(),
      this.desglosePorCuenta(),
      new BuildingRepository(this.db).list(),
      new WorkOrderRepository(this.db).list(),
    ]);

    const porContrato = new Map(contratos.map((l) => [l.id, l]));
    const nombre = new Map(
      (edificios ?? []).map((b) => [String((b as { id: string }).id), String(b.name ?? '')])
    );

    const cargos: ChargeForResult[] = (cuentas ?? [])
      .filter((c) => periodoDe(String(c.source_ref ?? '')).startsWith(String(anio)))
      .map((c) => {
        const lease = porContrato.get(leaseIdDe(String(c.source_ref ?? '')));
        const desglose = desgloses.get(String(c.id));
        return {
          buildingId: String(lease?.building_id ?? ''),
          rent: desglose?.rent ?? 0,
          total: Number(c.total ?? 0),
          paid: Number(c.paid ?? 0),
          adminFeePercent: Number(lease?.admin_fee_percent ?? 0) || 0,
        };
      });

    // Solo los arreglos que salen del bolsillo del propietario: los que se le recuperan
    // al inquilino entran y salen, y contarlos como gasto haría rendir menos a una
    // propiedad justamente por algo que no le costó nada.
    const gastos: ExpenseForResult[] = (ordenes ?? [])
      .filter(
        (o) =>
          String(o.completed_at ?? '').startsWith(String(anio)) &&
          o.expense_state !== '' &&
          String(o.paid_by ?? '') !== 'inquilino'
      )
      .map((o) => ({
        buildingId: String(o.building_id ?? ''),
        amount: Number(o.cost ?? 0) || 0,
      }));

    return propertyResults(cargos, gastos).map((r) => ({
      ...r,
      property: nombre.get(r.buildingId) ?? '—',
    }));
  }

  /**
   * Le suma al recibo del inquilino los arreglos que quedaron a cargo suyo.
   *
   * Cierra el circuito que dejaba abierto el cierre de una orden: el propietario le paga
   * al plomero (eso lo registra `maintenance` como egreso) y acá recupera esa plata
   * poniéndola en el recibo de quien la tiene que pagar. Sin este paso el campo «Lo paga:
   * el inquilino» no era más que una anotación — el gasto lo terminaba absorbiendo el
   * propietario.
   *
   * Es un barrido y no una consecuencia inmediata del cierre a propósito: cuando la orden
   * se cierra puede no haber ningún recibo al que sumarle el gasto (el del mes ya se
   * cobró, el siguiente no se emitió). Volviendo a preguntar cada vez que se genera un
   * mes, el gasto entra solo en cuanto aparece dónde ponerlo, sin que nadie se acuerde.
   *
   * Repetirlo no cobra dos veces: cada línea lleva `workorder:<id>` y se saltea toda
   * orden que ya figure en algún recibo.
   *
   * También RETIRA lo que dejó de corresponder. Marcar «lo paga el inquilino» por error
   * y corregirlo tiene que poder deshacerse: sin esto el gasto quedaba en su recibo para
   * siempre, y la única forma de sacarlo era borrar la línea a mano desde la cuenta.
   */
  async chargeTenantWorkOrders({ today }: { today?: string } = {}): Promise<{
    charged: Array<{ order: string; amount: string }>;
    /** Lo que se retiró de un recibo porque la orden dejó de estar a cargo del inquilino. */
    removed: string[];
  }> {
    const hoy = today ?? new Date().toISOString().slice(0, 10);
    const ordenes = await new WorkOrderRepository(this.db).list();

    const aCargoDelInquilino = ordenes.filter(
      (o) => String(o.paid_by ?? '') === 'inquilino' && expenseForWorkOrder(o, hoy) !== null
    );
    const removed = await this.retirarGastosQueYaNoCorresponden(
      new Set(aCargoDelInquilino.map((o) => workOrderRef(o.id)))
    );
    if (aCargoDelInquilino.length === 0) return { charged: [], removed };

    // Lo ya cargado se pregunta UNA vez para todas las órdenes: preguntarlo por orden
    // haría una consulta por cada arreglo del historial cada vez que se genera un mes.
    const yaCargadas = await this.refsYaCobradas();
    const contratos = await new LeaseRepository(this.db).list();
    const lineas = new AccountLineRepository(this.db);
    const charged: Array<{ order: string; amount: string }> = [];

    for (const orden of aCargoDelInquilino) {
      const ref = workOrderRef(orden.id);
      if (yaCargadas.has(ref)) continue;

      const gasto = expenseForWorkOrder(orden, hoy);
      if (!gasto) continue;

      // El gasto va al contrato que ocupa la unidad hoy, no al inquilino que la ocupaba
      // cuando se reportó: si se fue, la deuda se le reclama por otro camino y no
      // apareciéndole en el recibo a quien entró después.
      const contrato = contratos.find(
        (l) => l.unit_id === orden.unit_id && (l.state === 'vigente' || l.state === 'por_vencer')
      );
      if (!contrato) continue;

      const destino = chargeForTenantExpense(
        await this.chargesForLease({ leaseId: contrato.id }),
        hoy
      );
      // Sin recibo cobrable el gasto espera: lo levanta la próxima generación de mes.
      if (!destino) continue;

      await lineas.add({
        accountId: destino.id,
        description: gasto.description,
        unitPrice: gasto.amount,
        sourceType: TENANT_EXPENSE_SOURCE,
        sourceRef: ref,
      });
      charged.push({ order: orden.title, amount: gasto.amount });
    }

    return { charged, removed };
  }

  /** Las órdenes que ya figuran en algún recibo, para no cobrarlas de nuevo. */
  private async refsYaCobradas(): Promise<Set<string>> {
    const filas = await this.db.ormQuery((tx) =>
      tx
        .select({ source_ref: accountLineTable.source_ref })
        .from(accountLineTable)
        .where(eq(accountLineTable.source_type, TENANT_EXPENSE_SOURCE))
    );
    return new Set((filas ?? []).map((f) => String(f.source_ref ?? '')).filter(Boolean));
  }

  /**
   * Saca del recibo los gastos cuyas órdenes ya no están a cargo del inquilino.
   *
   * Un recibo que YA recibió un pago no se toca: la otra persona pagó contra un total,
   * y bajárselo después le dejaría un saldo a favor que nadie decidió. Ese caso se
   * resuelve a mano —con una nota de crédito o devolviéndolo—, que es lo que
   * corresponde cuando la plata ya se movió.
   */
  private async retirarGastosQueYaNoCorresponden(vigentes: Set<string>): Promise<string[]> {
    const filas = await this.db.ormQuery((tx) =>
      tx
        .select({
          id: accountLineTable.id,
          source_ref: accountLineTable.source_ref,
          description: accountLineTable.description,
          account_id: accountLineTable.account_id,
        })
        .from(accountLineTable)
        .where(eq(accountLineTable.source_type, TENANT_EXPENSE_SOURCE))
    );

    const sobrantes = (filas ?? []).filter((f) => !vigentes.has(String(f.source_ref ?? '')));
    if (sobrantes.length === 0) return [];

    const pagos = new PaymentRepository(this.db);
    const retiradas: string[] = [];
    for (const linea of sobrantes) {
      const cobrado = await pagos.listByAccount({ accountId: String(linea.account_id) });
      if (cobrado.length > 0) continue;

      await this.db.ormQuery((tx) =>
        tx.delete(accountLineTable).where(eq(accountLineTable.id, linea.id))
      );
      retiradas.push(String(linea.description ?? ''));
    }
    return retiradas;
  }

  /**
   * Emite los cargos de alquiler de un mes: uno por contrato vigente, con el alquiler,
   * las expensas del período y los conceptos pactados de cada uno.
   *
   * Es la operación más compuesta del kit —cruza contratos, liquidaciones de expensas,
   * conceptos, la cotización del dólar y las cuentas de `billing`— y por eso vive
   * entera acá: corriendo en el navegador, cerrar la pestaña a mitad de la tanda dejaba
   * medio mes facturado y medio no, y el Copilot no podía emitir el mes.
   *
   * Es idempotente: `source_ref = "<leaseId>:<período>"` con índice único, así que
   * volver a correrla no duplica. Por eso el resultado distingue creados de existentes:
   * que el botón «no haga nada» es una respuesta válida y hay que poder decirla.
   */
  async generateForPeriod({
    period,
    usdHouse,
  }: {
    period: string;
    /** Qué dólar usar para los contratos en USD. Es una setting del negocio. */
    usdHouse?: string;
  }): Promise<GenerationResult> {
    const cuentas = new AccountRepository(this.db);

    const [leases, settlements, extras] = await Promise.all([
      new LeaseRepository(this.db).list(),
      this.liquidacionesDelPeriodo(period),
      this.conceptosPorContrato(),
    ]);

    const resultado = await generateCharges({
      period,
      leases: leases as unknown as Parameters<typeof generateCharges>[0]['leases'],
      // El servicio puro escribe a través de este puente. Contra el repositorio de
      // `billing` es una llamada directa: sin red de por medio y en la misma
      // transacción tenant-scoped.
      execute: (id, args) => {
        if (id !== 'billing.accounts.openForSource') {
          throw new Error(`La generación de cargos no puede ejecutar «${id}».`);
        }
        return cuentas.openForSource(
          args as Parameters<AccountRepository['openForSource']>[0]
        ) as never;
      },
      convertir: this.conversorDeMoneda(usdHouse),
      settlements,
      extras,
    });

    // Recién emitidos los recibos del mes, los arreglos que estaban esperando dónde
    // caer ya tienen destino. Va después y no dentro de la generación porque un fallo
    // acá no puede dejar el mes sin facturar: el gasto vuelve a intentarse el mes que
    // viene, pero el alquiler se cobra una sola vez.
    try {
      await this.chargeTenantWorkOrders();
    } catch {
      // Silencioso a propósito: el resultado que se muestra es el de la facturación
      // del mes, y un arreglo que no entró se recupera solo en la próxima corrida.
    }

    return resultado;
  }

  /**
   * Liquidaciones de expensas del mes, por edificio.
   *
   * Si la consulta falla se sigue sin ellas: cada contrato cae a lo pactado y la línea
   * lo aclara. Frenar la facturación del mes entero porque el consorcio no cargó su
   * liquidación sería peor que facturar el estimado.
   */
  private async liquidacionesDelPeriodo(period: string): Promise<Map<string, ExpenseSettlement>> {
    try {
      const filas = await new BuildingExpenseRepository(this.db).forPeriod({ period });
      return new Map((filas ?? []).map((f) => [String(f.building_id), f as ExpenseSettlement]));
    } catch {
      return new Map();
    }
  }

  /** Conceptos recurrentes de cada contrato (ABL, agua, bonificaciones), por contrato. */
  private async conceptosPorContrato(): Promise<Map<string, LeaseCharge[]>> {
    const filas = await new LeaseChargeRepository(this.db).list();
    const porContrato = new Map<string, LeaseCharge[]>();
    for (const f of filas as unknown as LeaseCharge[]) {
      const id = String(f.lease_id ?? '');
      if (!id) continue;
      porContrato.set(id, [...(porContrato.get(id) ?? []), f]);
    }
    return porContrato;
  }

  /**
   * Conversor para los contratos pactados en moneda extranjera.
   *
   * Pide la cotización UNA vez por corrida y solo si algún contrato la necesita: todos
   * los cargos que se emiten juntos quedan al mismo valor del día, que además es lo que
   * hace explicable la tanda («los de agosto salieron al dólar del 1°»).
   */
  private conversorDeMoneda(house?: string): MoneyConverter {
    const fx = new FxRateRepository(this.db);
    let cotizacion: { rate: string; rateDate: string; house: string } | null = null;

    return async (amount, currency) => {
      cotizacion ??= await fx.rate({ currency: 'USD', house: house || undefined });
      return {
        subtotal: convertToArs(amount, cotizacion.rate),
        detail: describeRate({
          amount,
          currency,
          rate: cotizacion.rate,
          rateDate: cotizacion.rateDate,
          house: cotizacion.house,
        }),
      };
    };
  }

  /**
   * Cobra el punitorio que corresponde hoy por los cargos atrasados de un contrato.
   *
   * El monto lo calcula el servidor con el saldo y el porcentaje pactado —no llega
   * desde la pantalla— porque es plata que se le cobra a una persona: quien pide la
   * acción elige a quién cobrarle, no cuánto.
   *
   * Se pide por CONTRATO y no por cargo (COONG-301). El contrato es lo que existe
   * para quien administra —«cobrale la mora a Marta»—, mientras que el id de una
   * cuenta interna no es algo que se pueda pedir sin haber mirado la pantalla
   * primero. `accountId` sigue aceptándose porque la tabla de cobranzas ya tiene la
   * fila a mano y no necesita el rodeo; `period` acota a un mes cuando hace falta.
   *
   * Cobrarlo dos veces el mismo día no suma dos veces (`sourceRef` lleva la fecha);
   * mañana, con un día más de mora, sí corresponde volver a cobrarlo.
   *
   * `detail` NUNCA vuelve vacío: no cobrar es un resultado legítimo —el contrato
   * está al día, la gracia todavía corre, el contrato no pactó punitorio— y quien
   * pidió la acción tiene que poder distinguir cuál de esos fue. Un «no cobré» sin
   * motivo se lee como una falla y manda a buscar el problema donde no está.
   */
  async chargeLateFee({
    leaseId,
    accountId,
    period,
    graceDays,
    applyLateFee,
  }: {
    leaseId?: string;
    accountId?: string;
    period?: string;
    graceDays?: number;
    applyLateFee?: 'propose' | 'off';
  }): Promise<{ charged: boolean; amount: string; detail: string }> {
    if (!leaseId && !accountId) {
      throw new Error('Falta el contrato: indicá «leaseId» para saber a quién cobrarle la mora.');
    }

    const cuentas = await new AccountRepository(this.db).listWithTotals({ source: RENT_SOURCE });
    // Un cargo puntual (la pantalla) o todos los del contrato (el agente). En el
    // segundo caso el orden es cronológico: el desglose se lee como un extracto.
    const alcance = accountId
      ? cuentas.filter((c) => String(c.id) === accountId)
      : cuentas
          .filter((c) => leaseIdDe(String(c.source_ref ?? '')) === leaseId)
          .filter((c) => !period || String(c.source_ref ?? '').endsWith(`:${period}`))
          .sort((a, b) => String(a.due_date ?? '').localeCompare(String(b.due_date ?? '')));

    if (!alcance.length) {
      if (accountId) throw new Error('El cargo no existe o no es de alquiler.');
      return {
        charged: false,
        amount: '0',
        detail: period
          ? `El contrato no tiene cargos emitidos en ${period}.`
          : 'El contrato todavía no tiene cargos emitidos.',
      };
    }

    const contrato = await new LeaseRepository(this.db).getDetail({
      id: leaseId ?? leaseIdDe(String(alcance[0]?.source_ref ?? '')),
    });
    const politica = await currentLateFeePolicy(this.db, { graceDays, applyLateFee });

    if (politica.apply === 'off') {
      return {
        charged: false,
        amount: '0',
        detail: 'El punitorio está desactivado en la configuración del sistema.',
      };
    }
    if (Number(contrato?.late_fee_percent ?? '0') === 0) {
      return { charged: false, amount: '0', detail: 'El contrato no pactó punitorio por mora.' };
    }

    const lineas = new AccountLineRepository(this.db);
    const hoy = new Date().toISOString().slice(0, 10);
    const sourceRef = `late_fee:${hoy}`;
    const cobrados: string[] = [];
    const yaCobrados: string[] = [];
    let total = 0;
    let conSaldo = 0;

    for (const cuenta of alcance) {
      if (Number(cuenta.balance ?? '0') <= 0) continue;
      conSaldo += 1;
      const periodo = periodoDe(String(cuenta.source_ref ?? ''));

      // El punitorio del día ya está en la cuenta. `add` no lo duplicaría —
      // deduplica por `sourceRef`—, pero seguir de largo haría que la respuesta
      // informe un cobro que no ocurrió, sobre un saldo que YA incluye el
      // punitorio anterior. Un barrido tiene que decir qué hizo y qué no.
      const existentes = await lineas.listByAccount({ accountId: String(cuenta.id) });
      if (existentes.some((linea) => String(linea.source_ref ?? '') === sourceRef)) {
        yaCobrados.push(periodo);
        continue;
      }

      const punitorio = proposeLateFee(
        {
          due_date: cuenta.due_date ?? null,
          balance: String(cuenta.balance ?? '0'),
          status: String(cuenta.status ?? 'open'),
          late_fee_percent: contrato?.late_fee_percent ?? '0',
        },
        politica
      );
      if (punitorio.amount === '0') continue;

      await lineas.add({
        accountId: String(cuenta.id),
        description: `Punitorio — ${punitorio.detail}`,
        quantity: '1',
        unitPrice: punitorio.amount,
        sourceType: 'late_fee',
        sourceRef,
      });
      total += Number(punitorio.amount);
      cobrados.push(`${periodo}: ${punitorio.detail}`);
    }

    const salteados = yaCobrados.length
      ? ` Ya estaba cobrado el punitorio de hoy en ${yaCobrados.join(', ')}.`
      : '';

    if (!cobrados.length) {
      return {
        charged: false,
        amount: '0',
        detail: yaCobrados.length
          ? `El punitorio de hoy ya estaba cobrado en ${yaCobrados.join(', ')}. Mañana, con un día más de mora, vuelve a corresponder.`
          : !conSaldo
            ? 'No hay saldo pendiente: los cargos están cobrados.'
            : politica.graceDays > 0
              ? `Los cargos impagos están al día o todavía dentro de los ${politica.graceDays} días de gracia.`
              : 'Los cargos impagos todavía no están vencidos.',
      };
    }

    return { charged: true, amount: String(total), detail: `${cobrados.join(' · ')}${salteados}` };
  }

  /**
   * El estado del negocio en una pantalla: ocupación, contratos, cobranza del mes y lo
   * que espera confirmación.
   *
   * Cruza los cuatro plugins del kit. Sale de las mismas fuentes que cada vista de
   * detalle, así que el panel no puede decir algo distinto de lo que se ve al entrar.
   */
  async dashboard({
    period,
    graceDays,
    applyLateFee,
  }: {
    period: string;
    graceDays?: number;
    applyLateFee?: 'propose' | 'off';
  }): Promise<PanelData> {
    const [buildings, units, leases, adjustments, cargos] = await Promise.all([
      new BuildingRepository(this.db).list(),
      new UnitRepository(this.db).list(),
      new LeaseRepository(this.db).list(),
      new IndexAdjustmentRepository(this.db).list(),
      this.chargesForPeriod({ period, graceDays, applyLateFee }),
    ]);

    const unidades = units.length;
    const ocupadas = units.filter((u) => u.status === 'ocupada').length;
    const activos = leases.filter((l) => l.state === 'vigente' || l.state === 'por_vencer');
    const t = periodTotals(cargos);
    const porContrato = new Map(leases.map((l) => [l.id, l]));

    return {
      propiedades: buildings.length,
      unidades,
      ocupadas,
      vacantes: unidades - ocupadas,
      // Sin unidades cargadas la ocupación no es 0%: es que no hay nada que medir.
      ocupacionPct: unidades > 0 ? Math.round((ocupadas / unidades) * 100) : 0,
      contratosActivos: activos.length,
      porVencer: leases
        .filter((l) => l.state === 'por_vencer')
        .sort((a, b) => String(a.end_date).localeCompare(String(b.end_date)))
        .map((l) => ({
          id: l.id,
          unit: l.unit,
          property: l.property,
          tenant: l.tenant,
          end_date: l.end_date,
        })),
      ajustesPendientes: adjustments
        .filter((a) => a.status === 'pending')
        .map((a) => {
          const l = porContrato.get(String(a.lease_id));
          return {
            unit: [l?.property, l?.unit].filter(Boolean).join(' · ') || '—',
            index: etiquetaIndice(a.index_code, a.rate_percent),
            new_rent: String(a.new_rent ?? '0'),
          };
        }),
      facturado: t.facturado,
      cobrado: t.cobrado,
      porCobrar: t.porCobrar,
      vencido: t.vencido,
      cargosImpagos: t.cargos - t.saldados,
    };
  }

  /**
   * Serie del año para el gráfico: cobrado contra impago, mes a mes.
   *
   * Se trae la cobranza del año ENTERA en una consulta y se agrupa acá. Antes eran doce
   * consultas —una por mes— disparadas desde el navegador: con un puñado de contratos
   * no se notaba, con cincuenta convertía el panel en una espera.
   */
  async yearSeries({ year }: { year: number }): Promise<YearPoint[]> {
    const cuentas = await new AccountRepository(this.db).listWithTotals({ source: RENT_SOURCE });

    const porMes = new Map<number, { paid: number; billed: number }>();
    for (const c of cuentas ?? []) {
      const ref = String(c.source_ref ?? '');
      const periodo = ref.slice(ref.lastIndexOf(':') + 1);
      const m = /^(\d{4})-(\d{2})$/.exec(periodo);
      if (!m || Number(m[1]) !== year) continue;

      const mes = Number(m[2]);
      const acc = porMes.get(mes) ?? { paid: 0, billed: 0 };
      acc.paid += Number(c.paid ?? 0) || 0;
      acc.billed += Number(c.total ?? 0) || 0;
      porMes.set(mes, acc);
    }

    // El año en curso se corta en el mes actual: los meses que no llegaron no son
    // ceros, son futuro, y dibujarlos deja el gráfico cayendo a cero sin motivo.
    const hasta = new Date().getFullYear() === year ? new Date().getMonth() + 1 : 12;
    return Array.from({ length: hasta }, (_, i) => {
      const acc = porMes.get(i + 1) ?? { paid: 0, billed: 0 };
      return { label: MESES[i], paid: acc.paid, unpaid: acc.billed - acc.paid };
    });
  }

  /**
   * Los cargos de UN contrato, del más reciente al más viejo: su cuenta corriente.
   *
   * Se filtra por el prefijo de `source_ref` en vez de traer todas las cuentas de
   * alquiler y descartar en el cliente, que es lo que hacía la versión anterior.
   */
  async chargesForLease({ leaseId }: { leaseId: string }): Promise<LeaseChargeAccount[]> {
    if (!leaseId) return [];
    const cuentas = await new AccountRepository(this.db).listWithTotals({ source: RENT_SOURCE });

    return (
      (cuentas ?? [])
        .filter((c) => leaseIdDe(String(c.source_ref ?? '')) === leaseId)
        .map((c) => {
          const period = String(c.source_ref ?? '').slice(
            String(c.source_ref ?? '').lastIndexOf(':') + 1
          );
          return {
            id: String(c.id),
            period_key: period,
            period: periodoLegible(period),
            due_date: c.due_date ?? null,
            total: String(c.total ?? '0'),
            paid: String(c.paid ?? '0'),
            balance: String(c.balance ?? '0'),
            status: String(c.status ?? 'open'),
          };
        })
        // Lo más reciente arriba: la cuenta se lee de ahora hacia atrás.
        .sort((a, b) => b.period_key.localeCompare(a.period_key))
    );
  }

  /**
   * La ficha de un contrato: sus condiciones, su garantía y su cuenta corriente.
   *
   * Va junto y no en tres llamadas porque la pantalla no puede mostrar la mitad: el
   * saldo se cuenta sobre los cargos de ESTE contrato y la garantía es la de ESTE
   * contrato — antes se pedía la lista entera de garantías y se tomaba la primera, que
   * en cuanto hay dos contratos muestra el respaldo de otro.
   */
  async contractFile({ leaseId }: { leaseId: string }): Promise<ContractFile | undefined> {
    if (!leaseId) return undefined;

    const contrato = await new LeaseRepository(this.db).getDetail({ id: leaseId });
    if (!contrato) return undefined;

    const [garantias, cargos] = await Promise.all([
      new GuaranteeRepository(this.db).list(),
      this.chargesForLease({ leaseId }),
    ]);

    let saldo = 0;
    let impagos = 0;
    for (const c of cargos) {
      saldo += Number(c.balance) || 0;
      if (c.status !== 'paid') impagos += 1;
    }

    return {
      contrato,
      garantia: (garantias ?? []).find((g) => g.lease_id === leaseId && !g.archived),
      cargos,
      saldo,
      impagos,
    };
  }

  /**
   * La ficha de un inquilino: sus contratos, su cuenta corriente y el saldo.
   *
   * Es una sola consulta desde afuera aunque adentro cruce dos plugins — la pantalla y
   * el Copilot piden lo mismo y reciben lo mismo.
   */
  async tenantFile({ tenantId }: { tenantId: string }): Promise<TenantFile> {
    const vacia: TenantFile = {
      contratos: [],
      cargos: [],
      facturado: 0,
      cobrado: 0,
      saldo: 0,
      impagos: 0,
    };
    if (!tenantId) return vacia;

    const [leases, cuentas] = await Promise.all([
      new LeaseRepository(this.db).list(),
      new AccountRepository(this.db).listWithTotals({ source: RENT_SOURCE }),
    ]);

    const contratos = leases.filter((l) => l.tenant_contact_id === tenantId);
    if (contratos.length === 0) return vacia;
    const porId = new Map(contratos.map((l) => [l.id, l]));

    const cargos = (cuentas ?? [])
      .filter((c) => porId.has(leaseIdDe(String(c.source_ref ?? ''))))
      .map((c) => {
        const ref = String(c.source_ref ?? '');
        const period = ref.slice(ref.lastIndexOf(':') + 1);
        return {
          id: String(c.id),
          period_key: period,
          period: periodoLegible(period),
          unit: porId.get(leaseIdDe(ref))?.unit ?? null,
          due_date: c.due_date ?? null,
          total_due: String(c.total ?? '0'),
          paid: String(c.paid ?? '0'),
          balance: String(c.balance ?? '0'),
          status: String(c.status ?? 'open'),
        };
      })
      .sort((a, b) => b.period_key.localeCompare(a.period_key));

    let facturado = 0;
    let cobrado = 0;
    let impagos = 0;
    for (const c of cargos) {
      facturado += Number(c.total_due) || 0;
      cobrado += Number(c.paid) || 0;
      if (c.status !== 'paid') impagos += 1;
    }

    const inicios = contratos
      .map((l) => String(l.start_date ?? ''))
      .filter(Boolean)
      .sort();

    const fichas: TenantContract[] = contratos.map((l) => ({
      id: l.id,
      unit: l.unit,
      property: l.property,
      start_date: l.start_date,
      end_date: l.end_date,
      rent_amount: l.rent_amount,
      state: l.state,
    }));

    return {
      contratos: fichas,
      cargos,
      vigente: fichas.find((l) => VIGENTES.has(l.state)),
      desde: inicios[0],
      facturado,
      cobrado,
      saldo: facturado - cobrado,
      impagos,
    };
  }
}
