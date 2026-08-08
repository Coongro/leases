import { describe, expect, it } from 'vitest';

import { appliesInPeriod, chargeLinesForPeriod } from './lease-charges.js';

const abl = { type: 'abl', label: 'ABL', amount: '18000' };

describe('vigencia de un concepto', () => {
  it('sin fechas se factura siempre', () => {
    expect(appliesInPeriod(abl, '2026-09')).toBe(true);
  });

  it('no se factura antes de su período inicial', () => {
    const c = { ...abl, valid_from: '2026-10' };
    expect(appliesInPeriod(c, '2026-09')).toBe(false);
    expect(appliesInPeriod(c, '2026-10')).toBe(true);
  });

  it('deja de facturarse después del último período, sin borrarse', () => {
    // Se da de baja poniendo `valid_to`: el registro queda para explicar los meses
    // en que sí se cobró.
    const c = { ...abl, valid_to: '2026-08' };
    expect(appliesInPeriod(c, '2026-08')).toBe(true);
    expect(appliesInPeriod(c, '2026-09')).toBe(false);
  });
});

describe('líneas del cargo', () => {
  it('cada concepto vigente es una línea con su tipo declarado', () => {
    const lines = chargeLinesForPeriod({
      charges: [abl, { type: 'servicio', label: 'Aguas Santafesinas', amount: '9500' }],
      period: '2026-09',
    });
    expect(lines).toHaveLength(2);
    expect(lines[0]).toEqual({ description: 'ABL 2026-09', subtotal: '18000', sourceType: 'abl' });
    // El tipo sale de lo que se eligió, NO de adivinarlo del título como hace la fuente
    // (ahí «Aguas Santafesinas» no matchearía «agua» y caería en «otro»).
    expect(lines[1].sourceType).toBe('servicio');
  });

  it('un descuento resta: es un concepto con signo, no un mecanismo aparte', () => {
    const lines = chargeLinesForPeriod({
      charges: [
        {
          type: 'descuento',
          label: 'Bonificación por pago adelantado',
          amount: '15000',
          sign: '-1',
        },
      ],
      period: '2026-09',
    });
    expect(lines[0].subtotal).toBe('-15000');
    expect(lines[0].sourceType).toBe('descuento');
  });

  it('un importe negativo cargado con signo positivo igual suma', () => {
    // El signo manda sobre cómo se tipeó el monto: si no, un descuento cargado en
    // negativo y con sign -1 terminaría sumando.
    const lines = chargeLinesForPeriod({
      charges: [{ ...abl, amount: '-18000' }],
      period: '2026-09',
    });
    expect(lines[0].subtotal).toBe('18000');
  });

  it('los conceptos fuera de vigencia no llegan a la factura', () => {
    const lines = chargeLinesForPeriod({
      charges: [{ ...abl, valid_to: '2026-06' }],
      period: '2026-09',
    });
    expect(lines).toHaveLength(0);
  });

  it('un importe en cero no genera línea', () => {
    const lines = chargeLinesForPeriod({ charges: [{ ...abl, amount: '0' }], period: '2026-09' });
    expect(lines).toHaveLength(0);
  });
});

describe('el tipo manda sobre el signo', () => {
  it('un descuento resta aunque nadie haya cargado el signo', () => {
    // Quien da de alta una bonificación no tiene por qué pensar en números negativos.
    // Si dependiera del signo, el día que se olvide se le COBRARÍA al inquilino.
    const lines = chargeLinesForPeriod({
      charges: [{ type: 'descuento', label: 'Bonificación', amount: '15000' }],
      period: '2026-09',
    });
    expect(lines[0].subtotal).toBe('-15000');
  });

  it('un concepto normal suma aunque venga con signo raro', () => {
    const lines = chargeLinesForPeriod({
      charges: [{ type: 'abl', label: 'ABL', amount: '18000', sign: '1' }],
      period: '2026-09',
    });
    expect(lines[0].subtotal).toBe('18000');
  });
});
