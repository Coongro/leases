import { actions } from '@coongro/plugin-sdk';

/**
 * Mantiene sincronizado el estado de ocupación de una unidad con sus contratos.
 *
 * La unidad vive en `properties` y no sabe nada de contratos; el contrato vive acá y
 * es el único que sabe si esa unidad está alquilada. Sin este puente, la ficha de la
 * propiedad mostraba «1°B · Vacante» mientras la lista de contratos mostraba esa
 * misma unidad alquilada y vigente — el mismo hecho contado de dos formas.
 *
 * Lo escribe el productor (leases) y no lo lee el consumidor (properties) porque la
 * dependencia va en ese sentido: `leases` depende de `properties`, nunca al revés.
 *
 * No es transaccional: si falla, el contrato ya se guardó y lo único que queda viejo
 * es una etiqueta. Por eso los errores no se propagan — perder el contrato por no
 * poder actualizar un estado sería mucho peor.
 */

export type UnitOccupancy = 'ocupada' | 'vacante';

export async function marcarUnidad(unitId: string, status: UnitOccupancy): Promise<void> {
  if (!unitId) return;
  try {
    await actions.execute('properties.units.update', { id: unitId, data: { status } });
  } catch {
    // Ver arriba: la ocupación es una etiqueta derivada, no el hecho.
  }
}

interface LeaseWithUnit {
  unit_id?: string | null;
}

/** Marca la unidad de un contrato, resolviéndola por el id del contrato. */
export async function marcarUnidadDeContrato(
  leaseId: string,
  status: UnitOccupancy
): Promise<void> {
  if (!leaseId) return;
  try {
    const lease = await actions.execute<LeaseWithUnit | undefined>('leases.contracts.getDetail', {
      id: leaseId,
    });
    await marcarUnidad(String(lease?.unit_id ?? ''), status);
  } catch {
    // idem
  }
}
