import type { ModuleDatabaseAPI } from '@coongro/plugin-sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Dos invariantes de la emisión del mes, los dos ganados a golpes.
 *
 * 1. LEER NO EMITE. `chargesForPeriod` tuvo un `generateIfMissing` que llamaba a la
 *    generación: una escritura publicada bajo un contrato que declaraba lectura, visible
 *    para el perfil `readonly` como si solo consultara.
 * 2. SE EMITE CONTRATO POR CONTRATO. Antes se miraba si el período tenía algún cargo y,
 *    si lo tenía, no se generaba nada más: un contrato firmado después de emitir el mes
 *    quedaba sin facturar para siempre y sin ningún aviso.
 */
const listWithTotals = vi.fn(async () => [] as Array<Record<string, unknown>>);

vi.mock('@coongro/billing/server', () => ({
  accountLineTable: {},
  AccountRepository: class {
    listWithTotals = listWithTotals;
  },
  AccountLineRepository: class {
    add = vi.fn();
    list = vi.fn(async () => []);
  },
  PaymentRepository: class {},
}));

// Los vecinos del árbol solo se stubean para que el módulo cargue: acá no se
// ejercita nada de ellos.
vi.mock('@coongro/indices', () => ({ convertToArs: vi.fn(), describeRate: vi.fn() }));
vi.mock('@coongro/indices/server', () => ({ FxRateRepository: class {} }));
const ordenes = vi.fn(async () => [] as Array<Record<string, unknown>>);
const gastoDe = vi.fn(
  (_o: unknown, _hoy: string) => null as null | { description: string; amount: string }
);
vi.mock('@coongro/maintenance/server', () => ({
  expenseForWorkOrder: (o: unknown, hoy: string) => gastoDe(o, hoy),
  workOrderRef: (id: string) => `workorder:${id}`,
  WorkOrderRepository: class {
    list = ordenes;
  },
}));
vi.mock('@coongro/properties/server', () => ({
  BuildingExpenseRepository: class {
    forPeriod = vi.fn(async () => []);
  },
  BuildingRepository: class {
    list = vi.fn(async () => []);
  },
  UnitRepository: class {
    list = vi.fn(async () => []);
  },
}));

const { RentBillingRepository } = await import('./rent-billing.repository.js');

/** Una base que no devuelve nada: acá lo que se mide es a quién se llama, no qué trae. */
function baseVacia() {
  return { ormQuery: vi.fn(async () => []) } as unknown as ModuleDatabaseAPI;
}

describe('emitir los cargos del mes', () => {
  beforeEach(() => {
    listWithTotals.mockClear();
    listWithTotals.mockResolvedValue([]);
  });

  it('consultar la cobranza no emite nada, ni con el mes vacío', async () => {
    // El mes sin un solo cargo es justo el caso en el que el atajo viejo emitía.
    const repo = new RentBillingRepository(baseVacia());
    const generate = vi.spyOn(repo, 'generateForPeriod');

    await repo.chargesForPeriod({ period: '2026-08' });

    expect(generate).not.toHaveBeenCalled();
  });

  it('la emisión no pregunta si el mes ya tiene cargos: decide por contrato', async () => {
    // El corte que dejaba contratos sin facturar era mirar el estado del período
    // completo. Que no se consulten las cuentas del mes es esa ausencia, verificada.
    listWithTotals.mockResolvedValue([
      { id: 'cuenta-1', source_ref: 'contrato-viejo:2026-08', status: 'open', total: '300000' },
    ]);

    const resultado = await new RentBillingRepository(baseVacia()).generateForPeriod({
      period: '2026-08',
    });

    expect(listWithTotals).not.toHaveBeenCalled();
    expect(resultado.period).toBe('2026-08');
  });
});

/**
 * Un barrido que no hizo nada y no dice por qué es indistinguible de uno roto. Pasó de
 * verdad: se pidió pasar el arreglo del termotanque al recibo del inquilino, devolvió
 * listas vacías, y no había forma de saber si no había trabajo o si faltaba emitir el mes.
 */
describe('pasar los arreglos del inquilino a su recibo', () => {
  beforeEach(() => {
    ordenes.mockResolvedValue([]);
    gastoDe.mockReturnValue(null);
  });

  it('sin órdenes esperando, lo dice en vez de devolver vacío y callarse', async () => {
    const sweep = await new RentBillingRepository(baseVacia()).chargeTenantWorkOrders({
      today: '2026-08-11',
    });

    expect(sweep.charged).toEqual([]);
    expect(sweep.detail).toMatch(/no había nada que pasar/i);
  });

  it('cuando saltea, nombra el arreglo y el motivo', async () => {
    ordenes.mockResolvedValue([
      {
        id: 'o1',
        title: 'Reposición termotanque',
        paid_by: 'inquilino',
        unit_id: 'u-sin-contrato',
      },
    ]);
    gastoDe.mockReturnValue({ description: 'Reposición termotanque', amount: '85000' });

    const sweep = await new RentBillingRepository(baseVacia()).chargeTenantWorkOrders({
      today: '2026-08-11',
    });

    expect(sweep.charged).toEqual([]);
    expect(sweep.skipped).toEqual([
      { order: 'Reposición termotanque', reason: 'la unidad no tiene contrato vigente' },
    ]);
    // El resumen tiene que alcanzar solo: es lo único que ve quien pidió el barrido.
    expect(sweep.detail).toContain('1 sin pasar: la unidad no tiene contrato vigente');
  });
});
