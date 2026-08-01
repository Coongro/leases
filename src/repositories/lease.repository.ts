import { contactTable } from '@coongro/contacts/server';
import type { ModuleDatabaseAPI } from '@coongro/plugin-sdk';
import { buildingTable, unitTable } from '@coongro/properties/server';
import { and, asc, desc, eq, getTableColumns, isNull, sql } from 'drizzle-orm';

import { leaseTable } from '../schema/lease.js';
import type { LeaseRow, NewLeaseRow } from '../schema/lease.js';

/**
 * Días antes del vencimiento en que un contrato pasa a «por vencer». Dos meses es
 * el plazo con el que hay que empezar a hablar de renovación: por debajo, el
 * propietario se entera tarde para negociar o para buscar reemplazo.
 */
const DEFAULT_EXPIRY_WARNING_DAYS = 60;

/** Día siguiente a un DateKey. Una renovación arranca cuando termina el anterior. */
function siguienteDia(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d) + 86400000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

/** Un contrato con lo que su listado muestra y que no vive en su fila. */
export interface LeaseListRow extends LeaseRow {
  unit: string | null;
  property: string | null;
  tenant: string | null;
  /** Edificio de la unidad: por ahí se busca la liquidación de expensas del mes. */
  building_id: string | null;
  /**
   * Qué porcentaje del total de expensas del edificio le toca a esta unidad.
   * Null en una propiedad de una sola unidad, donde no hay nada que repartir.
   */
  share_pct: string | null;
  state:
    | 'borrador'
    | 'por_comenzar'
    | 'vigente'
    | 'por_vencer'
    | 'terminado'
    | 'rescindido'
    | 'renovado';
}

export class LeaseRepository {
  constructor(private readonly db: ModuleDatabaseAPI) {}

  /**
   * Listado de contratos con su unidad, propiedad e inquilino resueltos.
   *
   * El estado se calcula acá y no se lee de la columna: «vigente» o «por vencer»
   * dependen de la fecha de hoy, así que guardarlos obligaría a un proceso que
   * corriera todos los días para mantenerlos al día — y el día que no corriera,
   * la lista mentiría. Lo que sí manda es lo que decidió una persona: un contrato
   * rescindido o en borrador no cambia de estado por el paso del tiempo.
   */
  async list({ warningDays = DEFAULT_EXPIRY_WARNING_DAYS }: { warningDays?: number } = {}): Promise<
    LeaseListRow[]
  > {
    const today = sql`to_char(now(), 'YYYY-MM-DD')`;
    const horizon = sql`to_char(now() + make_interval(days => ${warningDays}), 'YYYY-MM-DD')`;

    return this.db.ormQuery((tx) =>
      tx
        .select({
          ...getTableColumns(leaseTable),
          unit: unitTable.name,
          property: buildingTable.name,
          tenant: contactTable.name,
          building_id: unitTable.building_id,
          share_pct: unitTable.share_pct,
          state: sql<LeaseListRow['state']>`case
            when ${leaseTable.status} = 'borrador' then 'borrador'
            -- Lo que decidió una persona manda sobre el calendario: un contrato
            -- renovado o rescindido no vuelve a «vigente» porque su fecha de fin
            -- todavía no llegó (la renovación deja el plazo original intacto).
            when ${leaseTable.status} = 'renovado' then 'renovado'
            when ${leaseTable.status} = 'rescindido' then 'rescindido'
            when ${leaseTable.termination_date} is not null then 'terminado'
            when ${leaseTable.start_date} > ${today} then 'por_comenzar'
            when ${leaseTable.end_date} < ${today} then 'terminado'
            when ${leaseTable.end_date} <= ${horizon} then 'por_vencer'
            else 'vigente'
          end`,
        })
        .from(leaseTable)
        .leftJoin(unitTable, eq(unitTable.id, leaseTable.unit_id))
        .leftJoin(buildingTable, eq(buildingTable.id, unitTable.building_id))
        .leftJoin(contactTable, eq(contactTable.id, leaseTable.tenant_contact_id))
        .where(isNull(leaseTable.deleted_at))
        // Lo que vence primero, arriba: es lo que hay que resolver.
        .orderBy(asc(leaseTable.end_date), desc(leaseTable.created_at))
    );
  }

  /**
   * Un contrato con todo lo que su ficha muestra en la cabecera y en las tarjetas de
   * condiciones. Reusa el mismo listado (con su estado calculado) para que la ficha
   * y la lista no puedan decir cosas distintas del mismo contrato.
   */
  async getDetail({ id }: { id: string }): Promise<LeaseListRow | undefined> {
    const rows = await this.list();
    return rows.find((r) => r.id === id);
  }

  /**
   * Inquilinos: los contactos que figuran como parte en algún contrato.
   *
   * No hay entidad «inquilino» —igual que con los propietarios, es un contacto— así
   * que la lista sale del cruce con los contratos. Trae el estado del vínculo, que es
   * lo que se mira: si hoy alquila algo o si es alguien que alquiló antes.
   */
  async listTenants(): Promise<
    Array<{
      id: string;
      name: string;
      document: string | null;
      phone: string | null;
      email: string | null;
      photo_url: string | null;
      current_unit: string | null;
      current_property: string | null;
      leases_count: number;
      is_current: boolean;
    }>
  > {
    const today = sql`to_char(now(), 'YYYY-MM-DD')`;
    const c = sql`${contactTable}."id"`;

    // Contrato vigente hoy de este contacto (si tiene alguno).
    const vigente = sql`(
      select l2.id from ${leaseTable} l2
      where l2.tenant_contact_id = ${c}
        and l2.deleted_at is null
        and l2.status <> 'borrador'
        and l2.start_date <= ${today}
        and coalesce(l2.termination_date, l2.end_date) >= ${today}
      order by l2.start_date desc
      limit 1
    )`;

    return this.db.ormQuery((tx) =>
      tx
        .select({
          id: contactTable.id,
          name: contactTable.name,
          document: sql<string | null>`nullif(trim(concat_ws(' ',
            upper(${contactTable}."document_type"), ${contactTable}."document_number")), '')`,
          phone: contactTable.phone,
          email: contactTable.email,
          photo_url: contactTable.avatar_url,
          current_unit: sql<string | null>`(select u.name from ${unitTable} u
            where u.id = (select l3.unit_id from ${leaseTable} l3 where l3.id = ${vigente}))`,
          current_property: sql<string | null>`(select b.name from ${buildingTable} b
            where b.id = (select u.building_id from ${unitTable} u
              where u.id = (select l3.unit_id from ${leaseTable} l3 where l3.id = ${vigente})))`,
          leases_count: sql<number>`(select count(*)::int from ${leaseTable} l4
            where l4.tenant_contact_id = ${c} and l4.deleted_at is null)`,
          is_current: sql<boolean>`${vigente} is not null`,
        })
        .from(contactTable)
        .where(
          and(
            isNull(contactTable.deleted_at),
            sql`exists (select 1 from ${leaseTable} l5
              where l5.tenant_contact_id = ${c} and l5.deleted_at is null)`
          )
        )
        .orderBy(asc(contactTable.name))
    );
  }

  /**
   * Renueva un contrato: crea uno nuevo que continúa al anterior.
   *
   * NO se edita el contrato viejo alargándole la fecha. Son dos contratos distintos
   * —con su precio, su plazo y su firma— y la historia de la unidad tiene que poder
   * leerse completa: cuánto se pagaba antes y cuánto después. `renewed_from_lease_id`
   * los encadena.
   *
   * El anterior queda `renovado` y el nuevo arranca al día siguiente de su fin, salvo
   * que se indique otra fecha.
   */
  async renew({
    id,
    startDate,
    endDate,
    rentAmount,
    adjustmentIndex,
    adjustmentMonths,
    notes,
  }: {
    id: string;
    startDate?: string;
    endDate: string;
    rentAmount: string;
    adjustmentIndex?: string | null;
    adjustmentMonths?: number | null;
    notes?: string | null;
  }): Promise<LeaseRow[]> {
    const previo = await this.getById({ id });
    if (!previo) throw new Error('El contrato no existe.');
    if (previo.status === 'renovado') throw new Error('Este contrato ya fue renovado.');

    const desde = startDate ?? siguienteDia(previo.end_date);
    if (endDate <= desde) {
      throw new Error('La fecha de fin de la renovación tiene que ser posterior a su inicio.');
    }

    const nuevo = await this.db.ormQuery((tx) =>
      tx
        .insert(leaseTable)
        .values({
          unit_id: previo.unit_id,
          tenant_contact_id: previo.tenant_contact_id,
          status: 'vigente',
          contract_type: previo.contract_type,
          start_date: desde,
          end_date: endDate,
          rent_amount: rentAmount,
          expenses_amount: previo.expenses_amount,
          currency: previo.currency,
          due_day: previo.due_day,
          due_day_type: previo.due_day_type,
          // Las condiciones se heredan salvo que la renovación las cambie: es lo que
          // pasa en la práctica, se renegocia el precio y el resto sigue igual.
          adjustment_index: adjustmentIndex ?? previo.adjustment_index,
          adjustment_months: adjustmentMonths ?? previo.adjustment_months,
          penalty_months: previo.penalty_months,
          admin_fee_percent: previo.admin_fee_percent,
          late_fee_percent: previo.late_fee_percent,
          deposit_amount: previo.deposit_amount,
          deposit_status: previo.deposit_status,
          renewed_from_lease_id: previo.id,
          notes: notes ?? null,
        } as unknown as NewLeaseRow)
        .returning()
    );

    await this.db.ormQuery((tx) =>
      tx
        .update(leaseTable)
        .set({ status: 'renovado' } as unknown as Partial<NewLeaseRow>)
        .where(eq(leaseTable.id, id))
    );

    return nuevo;
  }

  /**
   * Rescinde un contrato antes de tiempo.
   *
   * Guarda la fecha real de fin en `termination_date` y NO toca `end_date`: el plazo
   * pactado sigue siendo un dato del contrato, y la diferencia entre los dos es
   * justamente lo que fundamenta la multa por rescisión anticipada.
   *
   * A partir de esa fecha el contrato deja de generar cargos.
   */
  async terminate({
    id,
    terminationDate,
    notes,
  }: {
    id: string;
    terminationDate: string;
    notes?: string | null;
  }): Promise<LeaseRow[]> {
    const previo = await this.getById({ id });
    if (!previo) throw new Error('El contrato no existe.');
    if (previo.termination_date) throw new Error('Este contrato ya está rescindido.');
    if (terminationDate < previo.start_date) {
      throw new Error('La rescisión no puede ser anterior al inicio del contrato.');
    }

    return this.db.ormQuery((tx) =>
      tx
        .update(leaseTable)
        .set({
          termination_date: terminationDate,
          status: 'rescindido',
          notes: notes ?? previo.notes,
        } as unknown as Partial<NewLeaseRow>)
        .where(eq(leaseTable.id, id))
        .returning()
    );
  }

  async getById({ id }: { id: string }): Promise<LeaseRow | undefined> {
    const rows = await this.db.ormQuery((tx) =>
      tx.select().from(leaseTable).where(eq(leaseTable.id, id)).limit(1)
    );
    return rows[0];
  }

  async create({ data }: { data: NewLeaseRow }): Promise<LeaseRow[]> {
    return this.db.ormQuery((tx) => tx.insert(leaseTable).values(data).returning());
  }

  async update({ id, data }: { id: string; data: Partial<NewLeaseRow> }): Promise<LeaseRow[]> {
    return this.db.ormQuery((tx) =>
      tx.update(leaseTable).set(data).where(eq(leaseTable.id, id)).returning()
    );
  }

  // Los dos .set() van casteados: drizzle 0.38.x deja fuera de `$inferInsert` las columnas
  // nullable, así que el tipo del update no reconoce `deleted_at` y el typecheck falla.
  async delete({ id }: { id: string }): Promise<LeaseRow[]> {
    return this.db.ormQuery((tx) =>
      tx
        .update(leaseTable)
        .set({
          deleted_at: new Date().toISOString(),
          is_active: false,
        } as unknown as Partial<NewLeaseRow>)
        .where(eq(leaseTable.id, id))
        .returning()
    );
  }

  async restore({ id }: { id: string }): Promise<LeaseRow[]> {
    return this.db.ormQuery((tx) =>
      tx
        .update(leaseTable)
        .set({ deleted_at: null, is_active: true } as unknown as Partial<NewLeaseRow>)
        .where(eq(leaseTable.id, id))
        .returning()
    );
  }
}
