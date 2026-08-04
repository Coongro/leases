import { contactTable } from '@coongro/contacts/server';
import type { ModuleDatabaseAPI } from '@coongro/plugin-sdk';
import { buildingTable, unitTable } from '@coongro/properties/server';
import { and, asc, desc, eq, getTableColumns, isNull, sql } from 'drizzle-orm';

import { guaranteeTable } from '../schema/guarantee.js';
import { indexAdjustmentTable } from '../schema/index-adjustment.js';
import { leaseTable } from '../schema/lease.js';
import type { LeaseRow, NewLeaseRow } from '../schema/lease.js';
import { describeRentChange } from '../services/rent-change.js';

/**
 * Días antes del vencimiento en que un contrato pasa a «por vencer». Dos meses es
 * el plazo con el que hay que empezar a hablar de renovación: por debajo, el
 * propietario se entera tarde para negociar o para buscar reemplazo.
 */
const DEFAULT_EXPIRY_WARNING_DAYS = 60;

/** Hoy como DateKey. */
const hoy = (): string => new Date().toISOString().slice(0, 10);

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

/**
 * Datos personales que pide un contrato de locación (nacionalidad, estado civil,
 * cónyuge, forma jurídica). Viajan en `contacts.metadata` porque son vocabulario de
 * alquileres y `contacts` es un plugin compartido.
 */
const TENANT_METADATA_KEYS = [
  'kind',
  'nationality',
  'marital_status',
  'spouse_name',
  'spouse_document',
  'occupation',
  'legal_representative',
  'legal_form',
  'phone_alt',
  'city',
  'zip_code',
  'province',
] as const;

/** Lo que manda el formulario de inquilino: columnas del contacto + sus datos personales. */
export interface TenantInput {
  name?: unknown;
  document_type?: unknown;
  document_number?: unknown;
  email?: unknown;
  phone?: unknown;
  address?: unknown;
  [clave: string]: unknown;
}

/** Lo que manda el formulario de contrato: el contrato y los campos de su garantía. */
export interface ContractInput {
  unit_id?: unknown;
  tenant_contact_id?: unknown;
  contract_type?: unknown;
  start_date?: unknown;
  end_date?: unknown;
  rent_amount?: unknown;
  expenses_amount?: unknown;
  currency?: unknown;
  due_day?: unknown;
  due_day_type?: unknown;
  adjustment_index?: unknown;
  adjustment_months?: unknown;
  late_fee_percent?: unknown;
  penalty_months?: unknown;
  deposit_amount?: unknown;
  deposit_status?: unknown;
  /** Campos de la garantía: viven en su propia tabla, no en el contrato. */
  guarantee_type?: unknown;
  guarantor_contact_id?: unknown;
  guarantee_notes?: unknown;
}

const texto = (v: unknown): string => String(v ?? '').trim();

/** Importe opcional: vacío es `null`, no cero — un cero dice algo distinto. */
const numero = (v: unknown): string | null => {
  const s = texto(v);
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? String(n) : null;
};

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
   * Firma o edita un contrato: el contrato, su garantía y la ocupación de la unidad.
   *
   * Es UN comando y no tres llamadas porque las tres cosas pasan en el mismo acto. Si
   * se publicaran por separado, quien las use —la web, el Copilot, un import— tendría
   * que acordarse de las tres y del orden; la primera vez que se olvide una, queda un
   * contrato sin respaldo cargado o una unidad que figura vacante con alguien viviendo
   * adentro.
   *
   * Todo va en una sola transacción: un contrato a medias es peor que ninguno.
   */
  async save({ id, data }: { id?: string | null; data: ContractInput }): Promise<{
    id: string;
    created: boolean;
  }> {
    const unitId = texto(data.unit_id);
    const tenantId = texto(data.tenant_contact_id);
    if (!unitId) throw new Error('El contrato necesita una unidad.');
    if (!tenantId) throw new Error('El contrato necesita un inquilino.');

    // Las tres columnas que la tabla exige y el formulario siempre manda. Sin
    // esto, faltar una terminaba en «invalid input syntax for type numeric: ""»
    // o en un `not-null constraint` de la base: un error que no dice qué falta
    // ni sobre qué contrato, justo en el acto que fija cuánto se cobra.
    const desde = texto(data.start_date);
    const hasta = texto(data.end_date);
    const alquiler = texto(data.rent_amount);
    if (!desde) throw new Error('El contrato necesita desde cuándo rige.');
    if (!hasta) throw new Error('El contrato necesita hasta cuándo rige.');
    if (!alquiler) throw new Error('El contrato necesita con qué alquiler arranca.');

    const contrato = {
      unit_id: unitId,
      tenant_contact_id: tenantId,
      // Nace vigente: el borrador es para lo que se guarda a medio cargar, y este
      // formulario exige lo necesario para que el contrato exista.
      status: 'vigente',
      contract_type: texto(data.contract_type) || 'determinado',
      start_date: desde,
      end_date: hasta,
      rent_amount: alquiler,
      expenses_amount: numero(data.expenses_amount),
      currency: texto(data.currency) || 'ARS',
      due_day: Number(data.due_day) || 1,
      due_day_type: texto(data.due_day_type) || 'fixed',
      adjustment_index: texto(data.adjustment_index) || null,
      adjustment_months: Number(data.adjustment_months) || null,
      late_fee_percent: numero(data.late_fee_percent),
      penalty_months: Number(data.penalty_months) || null,
      deposit_amount: numero(data.deposit_amount),
      deposit_status: texto(data.deposit_status) || null,
    };

    const tipoGarantia = texto(data.guarantee_type);

    return this.db.ormQuery(async (tx) => {
      let leaseId = texto(id);
      let created = false;

      if (leaseId) {
        // El precio de ANTES, leído dentro de la misma transacción que lo pisa: si se
        // leyera afuera, dos ediciones simultáneas anotarían las dos el mismo valor
        // previo y el historial mostraría un salto que nunca existió.
        const previas = await tx
          .select({ rent_amount: leaseTable.rent_amount })
          .from(leaseTable)
          .where(eq(leaseTable.id, leaseId))
          .limit(1);

        await tx
          .update(leaseTable)
          .set(contrato as never)
          .where(eq(leaseTable.id, leaseId));

        // Una suba pactada a mano se anota en el mismo historial que las del índice:
        // el contrato editado y nada más deja cargos viejos que no cuadran con su
        // precio actual, sin nada que explique la diferencia.
        const cambio = describeRentChange({
          previousRent: previas[0]?.rent_amount,
          newRent: contrato.rent_amount,
          effectiveDate: hoy(),
        });
        if (cambio) {
          await tx.insert(indexAdjustmentTable).values({
            lease_id: leaseId,
            index_code: 'manual',
            // Nace aplicada: el cambio ya está hecho sobre el contrato en esta misma
            // transacción. Dejarla `pending` mostraría en Actualizaciones una propuesta
            // para subir a un monto que el contrato ya tiene.
            status: 'applied',
            effective_date: cambio.effectiveDate,
            rate_percent: cambio.ratePercent,
            previous_rent: cambio.previousRent,
            new_rent: cambio.newRent,
            applied_at: new Date().toISOString(),
            notes: `Cambio pactado — ${cambio.detail}`,
          } as never);
        }
      } else {
        const filas = await tx
          .insert(leaseTable)
          .values(contrato as never)
          .returning({ id: leaseTable.id });
        leaseId = String(filas[0]?.id ?? '');
        if (!leaseId) throw new Error('No se pudo crear el contrato.');
        created = true;
      }

      // La unidad pasa a estar alquilada. Sin esto la ficha de la propiedad seguiría
      // mostrándola vacante con un contrato vigente encima.
      await tx
        .update(unitTable)
        .set({ status: 'ocupada' } as never)
        .where(eq(unitTable.id, unitId));

      // La garantía solo se crea al firmar: al editar un contrato ya firmado se toca
      // desde su propia ficha, porque sobrevive a la renovación.
      if (created && tipoGarantia) {
        await tx.insert(guaranteeTable).values({
          lease_id: leaseId,
          type: tipoGarantia,
          guarantor_contact_id: texto(data.guarantor_contact_id) || null,
          notes: texto(data.guarantee_notes) || null,
          // El depósito en garantía es la garantía misma: su monto se guarda también
          // acá para que la garantía se explique sola.
          amount: tipoGarantia === 'deposito' ? numero(data.deposit_amount) : null,
          archived: false,
        } as never);
      }

      return { id: leaseId, created };
    });
  }

  /**
   * Un inquilino con la forma que espera su formulario: las columnas del contacto y sus
   * datos personales sacados de `metadata`, todos al mismo nivel.
   *
   * El listado (`listTenants`) devuelve el documento ya concatenado para mostrar y no
   * trae domicilio ni `metadata`: prefillear con eso dejaría media ficha en blanco y
   * guardar borraría lo que no se volvió a cargar.
   */
  async getTenant({ id }: { id: string }): Promise<Record<string, unknown>> {
    const rows = await this.db.ormQuery((tx) =>
      tx
        .select({
          id: contactTable.id,
          name: contactTable.name,
          document_type: contactTable.document_type,
          document_number: contactTable.document_number,
          email: contactTable.email,
          phone: contactTable.phone,
          address: contactTable.address,
          metadata: contactTable.metadata,
        })
        .from(contactTable)
        .where(eq(contactTable.id, id))
        .limit(1)
    );
    const fila = rows[0] as
      | (Record<string, unknown> & { metadata?: Record<string, unknown> })
      | undefined;
    if (!fila) return {};

    const { metadata, ...columnas } = fila;
    const extras: Record<string, unknown> = {};
    for (const clave of TENANT_METADATA_KEYS) {
      const valor = (metadata ?? {})[clave];
      if (valor !== null && valor !== undefined) extras[clave] = valor;
    }
    return { ...columnas, ...extras };
  }

  /**
   * Alta y edición de un inquilino, en una sola operación.
   *
   * Es un comando y no un CRUD por las mismas tres reglas que el propietario: qué va en
   * columnas y qué en `metadata`, no pisar lo que otro rol le cargó al mismo contacto, y
   * fijar el tipo solo cuando nace. La misma persona puede ser inquilina de una unidad y
   * propietaria de otra.
   */
  async saveTenant({
    id,
    data,
  }: {
    id?: string | null;
    data: TenantInput;
  }): Promise<{ id: string; created: boolean }> {
    const nombre = texto(data.name);
    if (!nombre) throw new Error('El inquilino necesita un nombre.');

    // `metadata` es de todo el contacto: ahí conviven los datos de cobro que le cargó
    // «Propietario» y lo que guarde cualquier otro kit. Se parte de la CRUDA —no de la
    // aplanada que devuelve `getTenant`— y solo se tocan las claves propias.
    const metadata: Record<string, unknown> = { ...(await this.metadataDeContacto(id)) };
    for (const clave of TENANT_METADATA_KEYS) {
      const valor = texto(data[clave]);
      if (valor) metadata[clave] = valor;
      else delete metadata[clave];
    }

    const columnas = {
      name: nombre,
      document_type: texto(data.document_type) || null,
      document_number: texto(data.document_number) || null,
      email: texto(data.email) || null,
      phone: texto(data.phone) || null,
      address: texto(data.address) || null,
      metadata,
    };

    if (id) {
      await this.db.ormQuery((tx) =>
        tx
          .update(contactTable)
          .set(columnas as never)
          .where(eq(contactTable.id, id))
      );
      return { id, created: false };
    }

    const creados = await this.db.ormQuery((tx) =>
      tx
        .insert(contactTable)
        .values({ ...columnas, type: 'tenant', is_active: true } as never)
        .returning({ id: contactTable.id })
    );
    const nuevo = creados[0]?.id;
    if (!nuevo) throw new Error('No se pudo crear el inquilino.');
    return { id: String(nuevo), created: true };
  }

  /** La `metadata` cruda del contacto, para no pisar lo que le puso otro rol. */
  private async metadataDeContacto(id?: string | null): Promise<Record<string, unknown>> {
    if (!id) return {};
    const rows = await this.db.ormQuery((tx) =>
      tx
        .select({ metadata: contactTable.metadata })
        .from(contactTable)
        .where(eq(contactTable.id, id))
        .limit(1)
    );
    // `metadata` es jsonb sin tipar en el schema de contacts, así que llega como
    // `unknown`: hay que declarar su forma para poder mezclarla con las claves propias.
    return (rows[0]?.metadata ?? {}) as Record<string, unknown>;
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
    // Una renovación sin plazo o sin monto no es un contrato. Se comprueba acá
    // porque estos dos valores viajan derecho al insert: sin la guarda, faltar
    // uno terminaba en «UNDEFINED_VALUE: Undefined values are not allowed» de
    // la base, que no dice cuál falta ni sobre qué operación.
    if (!endDate) throw new Error('La renovación necesita hasta cuándo se extiende el contrato.');
    if (rentAmount === undefined || rentAmount === null || rentAmount === '') {
      throw new Error('La renovación necesita con qué alquiler arranca el período nuevo.');
    }

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

    await this.db.ormQuery(async (tx) => {
      await tx
        .update(leaseTable)
        .set({ status: 'renovado' } as unknown as Partial<NewLeaseRow>)
        .where(eq(leaseTable.id, id));

      // La unidad sigue alquilada: el contrato cambió, el inquilino no se fue.
      if (previo.unit_id) {
        await tx
          .update(unitTable)
          .set({ status: 'ocupada' } as never)
          .where(eq(unitTable.id, previo.unit_id));
      }
    });

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
    // Sin fecha, la rescisión no se puede asentar: es el dato que decide desde
    // cuándo la unidad queda libre y hasta cuándo se cobra. Sin esta guarda el
    // update mandaba undefined y la base cortaba con «UNDEFINED_VALUE».
    if (!terminationDate) throw new Error('La rescisión necesita la fecha en que termina.');

    const previo = await this.getById({ id });
    if (!previo) throw new Error('El contrato no existe.');
    if (previo.termination_date) throw new Error('Este contrato ya está rescindido.');
    if (terminationDate < previo.start_date) {
      throw new Error('La rescisión no puede ser anterior al inicio del contrato.');
    }

    return this.db.ormQuery(async (tx) => {
      const filas = await tx
        .update(leaseTable)
        .set({
          termination_date: terminationDate,
          status: 'rescindido',
          notes: notes ?? previo.notes,
        } as unknown as Partial<NewLeaseRow>)
        .where(eq(leaseTable.id, id))
        .returning();

      // La unidad vuelve a estar disponible. Va en el mismo acto que la rescisión: si
      // quedara para una segunda llamada, un corte en el medio dejaría la unidad
      // figurando ocupada sin nadie viviendo adentro.
      if (previo.unit_id) {
        await tx
          .update(unitTable)
          .set({ status: 'vacante' } as never)
          .where(eq(unitTable.id, previo.unit_id));
      }

      return filas;
    });
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
