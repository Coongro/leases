import { describe, expect, it } from 'vitest';

import { periodTotals } from './period-totals.js';

/**
 * Lo saldado y lo impago salen del SALDO, no del `status` de la cuenta.
 *
 * `billing` escribe `open`, `closed` y `overdue`; «paid» no existe en ninguna de sus
 * escrituras —lo cobrado vive aparte, en el estado de pago que deriva del balance—. Se
 * comparaba contra ese valor inexistente, así que un mes íntegramente cobrado informaba
 * cero saldados y, del otro lado de la resta, todos los cargos impagos.
 */
const cargo = (over: Partial<Parameters<typeof periodTotals>[0][number]> = {}) => ({
  total_due: '765000',
  paid: '765000',
  balance: '0',
  status: 'open',
  ...over,
});

describe('totales de un período', () => {
  it('un mes íntegramente cobrado no tiene cargos impagos', () => {
    const t = periodTotals([cargo(), cargo(), cargo()]);

    expect(t.cargos).toBe(3);
    expect(t.saldados).toBe(3);
    expect(t.facturado).toBe(2295000);
    expect(t.cobrado).toBe(2295000);
    expect(t.porCobrar).toBe(0);
  });

  it('cuenta como impago solo lo que tiene saldo', () => {
    const t = periodTotals([
      cargo(),
      cargo({ paid: '0', balance: '765000', status: 'overdue' }),
      cargo({ paid: '400000', balance: '365000' }),
    ]);

    expect(t.saldados).toBe(1);
    expect(t.cargos - t.saldados).toBe(2);
    expect(t.vencido).toBe(765000);
    expect(t.vencidos).toBe(1);
  });

  it('un resto de centavos no deja un cargo cobrado figurando como impago', () => {
    const t = periodTotals([cargo({ balance: '0.001' })]);
    expect(t.saldados).toBe(1);
  });
});
