import type { ModuleDatabaseAPI } from '@coongro/plugin-sdk';
import {
  BuildingRepository,
  CertificateRepository,
  UnitRepository,
} from '@coongro/properties/server';
import { and, asc, eq, isNull, sql } from 'drizzle-orm';

import { expiryAlertTable } from '../schema/expiry-alert.js';
import type { ExpiryAlertRow, NewExpiryAlertRow } from '../schema/expiry-alert.js';
import { guaranteeTable } from '../schema/guarantee.js';
import { detectExpiries, type ExpiryAlert } from '../services/expiry-alerts.js';

import { LeaseRepository } from './lease.repository.js';

/**
 * Los vencimientos de la cartera: qué hay que renovar y desde cuándo se viene avisando.
 *
 * Cruza los tres lugares donde algo caduca —certificados en `properties`, contratos y
 * garantías acá— porque para quien administra es una sola tarea de la semana. Tres
 * pantallas separadas obligarían a acordarse de tres lugares, y de lo que uno se olvida
 * es justamente de lo que no mira seguido.
 *
 * La regla de qué cuenta como vencido o por vencer vive en `services/expiry-alerts.ts`,
 * sin base de datos: acá solo se traen los datos y se guarda el resultado.
 */

export interface ExpiryScanSummary {
  /** Cuántas cosas se miraron. */
  scanned: number;
  /** Cuántas están vencidas o por vencer hoy. */
  detected: number;
  /** Avisos nuevos, que nadie vio todavía. */
  created: number;
  /** Avisos que ya estaban y siguen abiertos. */
  updated: number;
  /** Avisos que se cerraron porque lo que vencía ya se renovó. */
  resolved: number;
}

export class ExpiryAlertRepository {
  constructor(private readonly db: ModuleDatabaseAPI) {}

  /**
   * Recalcula los vencimientos de toda la cartera.
   *
   * Lo corren dos: el barrido diario y el botón «Revisar vencimientos». Es la misma
   * función para los dos, así que no pueden dar resultados distintos.
   *
   * Cada aviso se identifica por `(kind, subject_id)`: volver a correrlo actualiza el
   * que existe en vez de crear otro, y `first_seen_at` queda intacto. Lo que ya no
   * vence se da de baja —el certificado se renovó, el contrato se rescindió— en vez de
   * borrarse, para que se pueda ver qué se atendió.
   */
  async scan({ today }: { today?: string } = {}): Promise<ExpiryScanSummary> {
    const fecha = today ?? new Date().toISOString().slice(0, 10);

    const [certificados, contratos, garantias, edificios, unidades] = await Promise.all([
      new CertificateRepository(this.db).list(),
      new LeaseRepository(this.db).list(),
      this.db.ormQuery((tx) =>
        tx.select().from(guaranteeTable).where(isNull(guaranteeTable.deleted_at))
      ),
      new BuildingRepository(this.db).list(),
      new UnitRepository(this.db).list(),
    ]);

    // Dónde está cada certificado, para nombrarlo: el aviso tiene que decir qué se
    // renueva y dónde, sin obligar a abrir la ficha para enterarse.
    const edificio = new Map(edificios.map((b) => [String(b.id), b.name]));
    const unidad = new Map(unidades.map((u) => [String(u.id), u]));
    const lugarDe = (buildingId?: string | null, unitId?: string | null): string => {
      if (unitId) {
        const u = unidad.get(String(unitId));
        return [edificio.get(String(u?.building_id ?? '')), u?.name].filter(Boolean).join(' · ');
      }
      return edificio.get(String(buildingId ?? '')) ?? '';
    };
    const contratoPorId = new Map(contratos.map((l) => [String(l.id), l]));

    const detectadas = detectExpiries({
      today: fecha,
      certificates: certificados.map((c) => ({
        id: String(c.id),
        type: String(c.type),
        expires_at: String(c.expires_at),
        alert_days: c.alert_days,
        building_id: c.building_id,
        unit_id: c.unit_id,
        place: lugarDe(c.building_id, c.unit_id),
      })),
      leases: contratos.map((l) => ({
        id: String(l.id),
        end_date: String(l.end_date),
        state: String(l.state),
        unit: l.unit,
        property: l.property,
        tenant: l.tenant,
        unit_id: l.unit_id,
        building_id: l.building_id,
      })),
      guarantees: garantias
        .filter((g) => !g.archived)
        .map((g) => {
          const l = contratoPorId.get(String(g.lease_id));
          return {
            id: String(g.id),
            lease_id: String(g.lease_id),
            type: String(g.type),
            insurance_expiry: g.insurance_expiry,
            place: [l?.property, l?.unit].filter(Boolean).join(' · '),
          };
        }),
    });

    const previas = await this.db.ormQuery((tx) => tx.select().from(expiryAlertTable));
    const previaDe = new Map(previas.map((a) => [`${a.kind}|${a.subject_id}`, a]));
    const vigentes = new Set(detectadas.map((a) => `${a.kind}|${a.subjectId}`));

    let created = 0;
    let updated = 0;
    for (const alerta of detectadas) {
      const previa = previaDe.get(`${alerta.kind}|${alerta.subjectId}`);
      if (previa) updated += 1;
      else created += 1;
      await this.guardar(alerta, previa);
    }

    // Lo que dejó de vencer ya no molesta, pero queda registrado: sirve para ver que
    // se atendió, y para no perder desde cuándo se venía avisando.
    let resolved = 0;
    for (const previa of previas) {
      if (!previa.is_active) continue;
      if (vigentes.has(`${previa.kind}|${previa.subject_id}`)) continue;
      await this.db.ormQuery((tx) =>
        tx
          .update(expiryAlertTable)
          .set({
            is_active: false,
            updated_at: sql`now()`,
          } as unknown as Partial<NewExpiryAlertRow>)
          .where(eq(expiryAlertTable.id, previa.id))
      );
      resolved += 1;
    }

    return {
      scanned: certificados.length + contratos.length + garantias.length,
      detected: detectadas.length,
      created,
      updated,
      resolved,
    };
  }

  /**
   * Escribe un aviso sin perder su historia.
   *
   * El acuse se respeta mientras siga siendo el MISMO vencimiento: si la fecha cambió
   * —se renovó el certificado y volvió a vencer— el aviso se reabre, porque es un
   * hecho nuevo aunque sea del mismo ascensor.
   */
  private async guardar(alerta: ExpiryAlert, previa?: ExpiryAlertRow): Promise<void> {
    const comun = {
      subtype: alerta.subtype,
      level: alerta.level,
      expires_at: alerta.expiresAt,
      label: alerta.label,
      message: alerta.message,
      building_id: alerta.buildingId ?? null,
      unit_id: alerta.unitId ?? null,
      lease_id: alerta.leaseId ?? null,
      last_seen_at: sql`now()`,
      updated_at: sql`now()`,
      is_active: true,
    };

    if (!previa) {
      await this.db.ormQuery((tx) =>
        tx.insert(expiryAlertTable).values({
          kind: alerta.kind,
          subject_id: alerta.subjectId,
          ...comun,
        } as unknown as NewExpiryAlertRow)
      );
      return;
    }

    const mismoVencimiento = previa.expires_at === alerta.expiresAt;
    await this.db.ormQuery((tx) =>
      tx
        .update(expiryAlertTable)
        .set({
          ...comun,
          acknowledged_at: mismoVencimiento ? previa.acknowledged_at : null,
        } as unknown as Partial<NewExpiryAlertRow>)
        .where(eq(expiryAlertTable.id, previa.id))
    );
  }

  /**
   * Los vencimientos abiertos, de lo más urgente a lo que falta más.
   *
   * Lo que alguien ya marcó como visto no aparece salvo que se pida expresamente: la
   * lista tiene que ser lo que queda por hacer, no todo lo que alguna vez venció.
   */
  async list({
    level,
    kind,
    includeAcknowledged,
  }: {
    level?: string;
    kind?: string;
    includeAcknowledged?: boolean;
  } = {}): Promise<ExpiryAlertRow[]> {
    const filtros = [eq(expiryAlertTable.is_active, true)];
    if (level) filtros.push(eq(expiryAlertTable.level, level));
    if (kind) filtros.push(eq(expiryAlertTable.kind, kind));
    if (!includeAcknowledged) filtros.push(isNull(expiryAlertTable.acknowledged_at));

    return this.db.ormQuery((tx) =>
      tx
        .select()
        .from(expiryAlertTable)
        .where(and(...filtros))
        // Lo vencido antes que lo que está por vencer, y dentro de cada grupo lo que
        // caduca primero: es el orden en que hay que atenderlo.
        .orderBy(
          sql`case when ${expiryAlertTable.level} = 'vencido' then 0 else 1 end`,
          asc(expiryAlertTable.expires_at)
        )
    );
  }

  /**
   * El resumen de arriba de la pantalla: cuántos esperan atención y cuándo se miró por
   * última vez.
   *
   * La fecha del último barrido va junto con la cuenta y no en otra consulta porque es
   * parte de la misma respuesta: un «0 vencidos» significa una cosa si se revisó hoy y
   * otra muy distinta si el barrido no corre desde hace una semana.
   */
  async pendingCount(): Promise<{ vencidos: number; porVencer: number; lastScan?: string }> {
    const filas = await this.list();
    const ultima = filas
      .map((a) => String(a.last_seen_at ?? ''))
      .filter(Boolean)
      .sort()
      .at(-1);
    return {
      vencidos: filas.filter((a) => a.level === 'vencido').length,
      porVencer: filas.filter((a) => a.level === 'por_vencer').length,
      lastScan: ultima,
    };
  }

  /**
   * «Ya lo sé»: el aviso deja de figurar en la lista.
   *
   * No se borra ni se da de baja: sigue vivo para que el barrido lo siga mirando. Si el
   * vencimiento cambia, vuelve a aparecer solo.
   */
  async acknowledge({ id }: { id: string }): Promise<ExpiryAlertRow | undefined> {
    const filas = await this.db.ormQuery((tx) =>
      tx
        .update(expiryAlertTable)
        .set({
          acknowledged_at: sql`now()`,
          updated_at: sql`now()`,
        } as unknown as Partial<NewExpiryAlertRow>)
        .where(eq(expiryAlertTable.id, id))
        .returning()
    );
    return filas[0];
  }

  /** Deshace el acuse: vuelve a la lista de pendientes. */
  async unacknowledge({ id }: { id: string }): Promise<ExpiryAlertRow | undefined> {
    const filas = await this.db.ormQuery((tx) =>
      tx
        .update(expiryAlertTable)
        .set({
          acknowledged_at: null,
          updated_at: sql`now()`,
        } as unknown as Partial<NewExpiryAlertRow>)
        .where(eq(expiryAlertTable.id, id))
        .returning()
    );
    return filas[0];
  }
}
