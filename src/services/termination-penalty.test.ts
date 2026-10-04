import { describe, expect, it } from 'vitest';

import {
  penaltyDestination,
  penaltyLabel,
  periodOf,
  proposedPenalty,
} from './termination-penalty.js';

describe('proposedPenalty', () => {
  it('son los meses pactados por el alquiler vigente', () => {
    expect(proposedPenalty({ rent_amount: '520000', penalty_months: 3 })).toBe('1560000');
  });

  it('sin cláusula de multa no propone nada, que no es proponer cero', () => {
    // Un contrato sin multa y uno con multa de $0 son cosas distintas: en el primero
    // no hay nada que ofrecer cobrar.
    expect(proposedPenalty({ rent_amount: '520000', penalty_months: null })).toBeNull();
    expect(proposedPenalty({ rent_amount: '520000' })).toBeNull();
  });

  it('un contrato en dólares propone la multa en dólares', () => {
    // El importe sale del alquiler tal como está pactado; la conversión es del cobro.
    expect(proposedPenalty({ rent_amount: '1200', penalty_months: 2, currency: 'USD' })).toBe(
      '2400'
    );
  });

  it('acepta media multa: el mes y medio del Código Civil es lo más común', () => {
    expect(proposedPenalty({ rent_amount: '400000', penalty_months: 1.5 })).toBe('600000');
  });
});

describe('penaltyLabel', () => {
  it('deja el fundamento a la vista en el recibo', () => {
    expect(penaltyLabel({ rent_amount: '1', penalty_months: 3 })).toBe(
      'Multa por rescisión anticipada (3 meses de alquiler)'
    );
    expect(penaltyLabel({ rent_amount: '1', penalty_months: 1 })).toBe(
      'Multa por rescisión anticipada (1 mes de alquiler)'
    );
  });

  it('sin meses pactados no inventa un fundamento', () => {
    expect(penaltyLabel({ rent_amount: '1' })).toBe('Multa por rescisión anticipada');
  });
});

describe('penaltyDestination', () => {
  it('si el mes ya se facturó, la multa entra en ese recibo', () => {
    expect(penaltyDestination({ period: '2026-11', issuedPeriods: ['2026-10', '2026-11'] })).toBe(
      'recibo'
    );
  });

  it('si el mes todavía no se facturó, queda como concepto y entra al emitirlo', () => {
    // Crear el recibo acá con sólo la multa haría que la generación del mes lo
    // encuentre hecho y no emita el alquiler.
    expect(penaltyDestination({ period: '2026-11', issuedPeriods: ['2026-10'] })).toBe('concepto');
  });
});

describe('periodOf', () => {
  it('el período de la rescisión es el mes de su fecha', () => {
    expect(periodOf('2026-11-20')).toBe('2026-11');
  });
});
