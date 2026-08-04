import { describe, expect, it, vi } from 'vitest';

import { appliesToPeriod, generateCharges } from './charge-generation.js';

const base = {
  id: 'l1',
  tenant_contact_id: 'c1',
  status: 'vigente',
  start_date: '2026-01-01',
  end_date: '2028-12-31',
  rent_amount: '520000',
  currency: 'ARS',
  due_day: 10,
  due_day_type: 'fixed',
  unit: '1°B',
  property: 'Belgrano 1240',
};

describe('qué contratos entran en el período', () => {
  it('entra el que está vigente todo el mes', () => {
    expect(appliesToPeriod(base, '2026-08')).toBe(true);
  });

  it('entra el que arranca a mitad de mes', () => {
    expect(appliesToPeriod({ ...base, start_date: '2026-08-20' }, '2026-08')).toBe(true);
  });

  it('NO entra el que arranca el mes siguiente', () => {
    expect(appliesToPeriod({ ...base, start_date: '2026-09-01' }, '2026-08')).toBe(false);
  });

  it('entra el que termina a mitad de mes', () => {
    expect(appliesToPeriod({ ...base, end_date: '2026-08-15' }, '2026-08')).toBe(true);
  });

  it('NO entra el que terminó antes', () => {
    expect(appliesToPeriod({ ...base, end_date: '2026-07-31' }, '2026-08')).toBe(false);
  });

  it('una rescisión anticipada corta el cobro', () => {
    const rescindido = { ...base, termination_date: '2026-07-20' };
    expect(appliesToPeriod(rescindido, '2026-07')).toBe(true);
    expect(appliesToPeriod(rescindido, '2026-08')).toBe(false);
  });

  it('un borrador no se cobra', () => {
    expect(appliesToPeriod({ ...base, status: 'borrador' }, '2026-08')).toBe(false);
  });
});

describe('generación', () => {
  it('abre una cuenta por contrato, con alquiler y expensas como líneas', async () => {
    const execute = vi.fn().mockResolvedValue({ created: true });
    const r = await generateCharges({
      period: '2026-08',
      leases: [{ ...base, expenses_amount: '72000' }],
      execute,
    });

    expect(r.created).toBe(1);
    expect(execute).toHaveBeenCalledTimes(1);
    const [action, args] = execute.mock.calls[0];
    expect(action).toBe('billing.accounts.openForSource');
    expect(args.sourceRef).toBe('l1:2026-08');
    expect(args.dueDate).toBe('2026-08-10');
    expect(args.contactId).toBe('c1');
    expect(args.lines).toHaveLength(2);
    expect(args.lines[0].subtotal).toBe('520000');
    // Sin liquidación del consorcio, la línea aclara que el importe es el pactado.
    expect(args.lines[1].description).toContain('Expensas 2026-08');
  });

  it('sin expensas, una sola línea', async () => {
    const execute = vi.fn().mockResolvedValue({ created: true });
    const r = await generateCharges({ period: '2026-08', leases: [base], execute });
    expect(r.created).toBe(1);
    expect(execute.mock.calls[0][1].lines).toHaveLength(1);
  });

  it('correrla dos veces NO duplica: la segunda cuenta ya existía', async () => {
    // billing devuelve created:false cuando ya hay una cuenta con ese source_ref.
    const execute = vi.fn().mockResolvedValue({ created: false });
    const r = await generateCharges({ period: '2026-08', leases: [base], execute });
    expect(r.created).toBe(0);
    expect(r.skipped).toBe(1);
    expect(r.details[0].status).toBe('ya_existía');
  });

  it('el vencimiento sigue lo pactado: 5º día hábil de agosto 2026 = viernes 7', async () => {
    const execute = vi.fn().mockResolvedValue({ created: true });
    await generateCharges({
      period: '2026-08',
      leases: [{ ...base, due_day: 5, due_day_type: 'business' }],
      execute,
    });
    expect(execute.mock.calls[0][1].dueDate).toBe('2026-08-07');
  });

  it('los que no corresponden al período no llegan a billing', async () => {
    const execute = vi.fn().mockResolvedValue({ created: true });
    const r = await generateCharges({
      period: '2026-08',
      leases: [base, { ...base, id: 'l2', status: 'borrador' }],
      execute,
    });
    expect(execute).toHaveBeenCalledTimes(1);
    expect(r.details.find((d) => d.leaseId === 'l2')?.status).toBe('fuera_de_período');
  });
});

describe('contratos pactados en dólares', () => {
  const enDolares = { ...base, currency: 'USD', rent_amount: '1200', expenses_amount: '150' };

  /** Conversor de prueba: un dólar a $1.510, sin salir a la red. */
  const aPesos = vi.fn(async (amount: string, currency: string) => ({
    subtotal: String(Math.round(Number(amount) * 1510)),
    detail: `${currency} ${amount} × $1510 (oficial, 31/07/2026)`,
  }));

  it('el cargo llega a billing en pesos, no en dólares', async () => {
    const execute = vi.fn().mockResolvedValue({ created: true });
    await generateCharges({
      period: '2026-08',
      leases: [enDolares],
      execute,
      convertir: aPesos,
    });

    const lines = execute.mock.calls[0][1].lines;
    // USD 1.200 × 1.510 — sin esto billing sumaría 1.200 pesos.
    expect(lines[0].subtotal).toBe('1812000');
    expect(lines[1].subtotal).toBe('226500');
  });

  it('deja asentado con qué cotización se hizo la cuenta', async () => {
    const execute = vi.fn().mockResolvedValue({ created: true });
    await generateCharges({
      period: '2026-08',
      leases: [enDolares],
      execute,
      convertir: aPesos,
    });
    // El inquilino ve un monto en pesos que no está en su contrato: tiene que poder
    // saber de dónde salió sin preguntar.
    expect(execute.mock.calls[0][1].lines[0].description).toContain('USD 1200 × $1510');
  });

  it('un contrato en pesos no pasa por el conversor', async () => {
    const execute = vi.fn().mockResolvedValue({ created: true });
    const convertir = vi.fn();
    await generateCharges({ period: '2026-08', leases: [base], execute, convertir });
    expect(convertir).not.toHaveBeenCalled();
    expect(execute.mock.calls[0][1].lines[0].subtotal).toBe('520000');
  });

  it('sin moneda declarada se trata como pesos: los contratos viejos no la tienen', async () => {
    const execute = vi.fn().mockResolvedValue({ created: true });
    const convertir = vi.fn();
    const { currency: _omitida, ...sinMoneda } = base;
    await generateCharges({
      period: '2026-08',
      leases: [sinMoneda as typeof base],
      execute,
      convertir,
    });
    expect(convertir).not.toHaveBeenCalled();
  });

  it('sin cotización NO emite el cargo en vez de cobrar pesos por dólares', async () => {
    const execute = vi.fn().mockResolvedValue({ created: true });
    await expect(
      generateCharges({ period: '2026-08', leases: [enDolares], execute })
    ).rejects.toThrow(/USD/);
    expect(execute).not.toHaveBeenCalled();
  });
});

describe('expensas en el cargo del mes', () => {
  const enEdificio = {
    ...base,
    building_id: 'b1',
    share_pct: '35',
    expenses_amount: '72000',
  };

  it('usa la liquidación del consorcio repartida por alícuota', async () => {
    const execute = vi.fn().mockResolvedValue({ created: true });
    await generateCharges({
      period: '2026-09',
      leases: [enEdificio],
      execute,
      settlements: new Map([['b1', { building_id: 'b1', period: '2026-09', amount: '900000' }]]),
    });

    const expensas = execute.mock.calls[0][1].lines[1];
    // 35% de 900.000 — no los 72.000 escritos en el contrato hace un año.
    expect(expensas.subtotal).toBe('315000');
    expect(expensas.description).toContain('35% de $900000');
  });

  it('sin liquidación cobra lo pactado y avisa que es una estimación', async () => {
    const execute = vi.fn().mockResolvedValue({ created: true });
    await generateCharges({ period: '2026-09', leases: [enEdificio], execute });

    const expensas = execute.mock.calls[0][1].lines[1];
    expect(expensas.subtotal).toBe('72000');
    expect(expensas.description).toContain('todavía no liquidó');
  });

  it('la liquidación de OTRO edificio no se le cobra a este contrato', async () => {
    const execute = vi.fn().mockResolvedValue({ created: true });
    await generateCharges({
      period: '2026-09',
      leases: [enEdificio],
      execute,
      settlements: new Map([
        ['otro', { building_id: 'otro', period: '2026-09', amount: '5000000' }],
      ]),
    });
    expect(execute.mock.calls[0][1].lines[1].subtotal).toBe('72000');
  });
});

describe('el período es obligatorio y tiene forma', () => {
  // Sin esta comprobación, generar el mes sin período moría con «Cannot read
  // properties of undefined (reading 'slice')»: un stack que no dice qué falta,
  // sobre la operación que emite los recibos de todos los inquilinos.
  const execute = vi.fn();

  it('sin período, lo dice en vez de romperse por dentro', async () => {
    await expect(
      generateCharges({ period: undefined as unknown as string, leases: [], execute })
    ).rejects.toThrow(/no es un período válido/);
    expect(execute).not.toHaveBeenCalled();
  });

  it('con un mes escrito de cualquier otra forma, también', async () => {
    await expect(generateCharges({ period: 'agosto 2026', leases: [], execute })).rejects.toThrow(
      /«agosto 2026».*2026-08/s
    );
  });
});
