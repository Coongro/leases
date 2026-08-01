import { describe, expect, it } from 'vitest';

import { expensesForPeriod } from './expenses.js';

const unidad = {
  building_id: 'b1',
  share_pct: '12.5',
  expenses_amount: '72000',
};

const liquidacion = { building_id: 'b1', period: '2026-08', amount: '800000' };

describe('expensas del período', () => {
  it('reparte la liquidación del consorcio según la alícuota', () => {
    // 12,5% de $800.000 liquidados = $100.000 — y NO los $72.000 del contrato.
    const r = expensesForPeriod({ lease: unidad, period: '2026-08', settlement: liquidacion });
    expect(r.amount).toBe('100000');
    expect(r.source).toBe('liquidacion');
    expect(r.detail).toContain('12.5%');
    expect(r.detail).toContain('agosto');
  });

  it('redondea a peso entero, como el resto de los importes', () => {
    const r = expensesForPeriod({
      lease: { ...unidad, share_pct: '13.33' },
      period: '2026-08',
      settlement: liquidacion,
    });
    // 13,33% de 800.000 = 106.640
    expect(r.amount).toBe('106640');
  });

  it('sin liquidación del mes cae a lo pactado y lo aclara', () => {
    // El consorcio todavía no liquidó: se cobra la estimación del contrato, pero el
    // cargo tiene que decir que es una estimación.
    const r = expensesForPeriod({ lease: unidad, period: '2026-08', settlement: null });
    expect(r.amount).toBe('72000');
    expect(r.source).toBe('contrato');
    expect(r.detail).toContain('todavía no liquidó');
  });

  it('con liquidación pero sin alícuota cargada, no inventa el reparto', () => {
    // Repartir sin saber qué porcentaje le toca sería adivinar cuánto cobrarle.
    const r = expensesForPeriod({
      lease: { ...unidad, share_pct: null },
      period: '2026-08',
      settlement: liquidacion,
    });
    expect(r.amount).toBe('72000');
    expect(r.source).toBe('contrato');
    expect(r.detail).toContain('alícuota');
  });

  it('un contrato sin expensas no genera la línea', () => {
    const r = expensesForPeriod({
      lease: { ...unidad, expenses_amount: null, share_pct: null },
      period: '2026-08',
      settlement: null,
    });
    expect(r.amount).toBeNull();
  });

  it('una liquidación en cero no borra lo pactado', () => {
    // Un total en cero es un dato incompleto, no una expensa de cero pesos.
    const r = expensesForPeriod({
      lease: unidad,
      period: '2026-08',
      settlement: { ...liquidacion, amount: '0' },
    });
    expect(r.amount).toBe('72000');
    expect(r.source).toBe('contrato');
  });
});
