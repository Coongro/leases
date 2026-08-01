import { describe, expect, it } from 'vitest';

import { detectExpiries, evaluate, describe as texto, horizonFor } from './expiry-alerts.js';

const HOY = '2026-08-01';

describe('horizonte por tipo', () => {
  it('cada tipo tiene el suyo', () => {
    expect(horizonFor('ascensor')).toBe(60);
    expect(horizonFor('matafuegos')).toBe(30);
  });

  it('un tipo desconocido cae al default', () => {
    expect(horizonFor('lo_que_sea')).toBe(30);
  });

  it('el certificado puede pedir el suyo', () => {
    expect(horizonFor('matafuegos', 90)).toBe(90);
  });

  it('un override inválido no rompe: se ignora', () => {
    expect(horizonFor('gas', 0)).toBe(45);
    expect(horizonFor('gas', -10)).toBe(45);
    expect(horizonFor('gas', null)).toBe(45);
  });
});

describe('nivel de una fecha', () => {
  it('la fecha pasada está vencida', () => {
    expect(evaluate('2026-07-31', 'matafuegos', HOY)).toBe('vencido');
  });

  it('el día del vencimiento todavía no está vencido', () => {
    expect(evaluate(HOY, 'matafuegos', HOY)).toBe('por_vencer');
  });

  it('dentro del horizonte avisa', () => {
    expect(evaluate('2026-08-20', 'matafuegos', HOY)).toBe('por_vencer');
  });

  it('fuera del horizonte no molesta', () => {
    expect(evaluate('2026-10-15', 'matafuegos', HOY)).toBe(null);
  });

  it('el ascensor avisa antes que el matafuegos, con la misma fecha', () => {
    const dentroDe50Dias = '2026-09-20';
    expect(evaluate(dentroDe50Dias, 'ascensor', HOY)).toBe('por_vencer');
    expect(evaluate(dentroDe50Dias, 'matafuegos', HOY)).toBe(null);
  });

  it('sin fecha no hay aviso', () => {
    expect(evaluate(null, 'gas', HOY)).toBe(null);
    expect(evaluate('', 'gas', HOY)).toBe(null);
    expect(evaluate('mañana', 'gas', HOY)).toBe(null);
  });
});

describe('el texto del aviso', () => {
  it('cuenta los días que faltan', () => {
    expect(texto('por_vencer', '2026-08-13', HOY)).toBe('Vence en 12 días');
    expect(texto('por_vencer', '2026-08-02', HOY)).toBe('Vence mañana');
    expect(texto('por_vencer', HOY, HOY)).toBe('Vence hoy');
  });

  it('cuenta el atraso', () => {
    expect(texto('vencido', '2026-07-29', HOY)).toBe('Vencido hace 3 días');
    expect(texto('vencido', '2026-07-31', HOY)).toBe('Vencido ayer');
  });
});

describe('barrido de la cartera', () => {
  it('junta las tres fuentes y ordena por urgencia', () => {
    const r = detectExpiries({
      today: HOY,
      certificates: [
        {
          id: 'c1',
          type: 'ascensor',
          expires_at: '2026-09-15',
          building_id: 'b1',
          place: 'Belgrano 1240',
        },
        { id: 'c2', type: 'gas', expires_at: '2026-06-01', building_id: 'b1' },
      ],
      leases: [
        {
          id: 'l1',
          end_date: '2026-08-20',
          state: 'vigente',
          unit: '1°B',
          property: 'Belgrano 1240',
          tenant: 'Ana Ruiz',
        },
      ],
      guarantees: [
        { id: 'g1', lease_id: 'l1', type: 'seguro_caucion', insurance_expiry: '2026-08-10' },
      ],
    });

    expect(r.map((a) => a.subjectId)).toEqual(['c2', 'g1', 'l1', 'c1']);
    expect(r[0]).toMatchObject({ level: 'vencido', kind: 'certificado' });
    expect(r[3].label).toBe('Ascensor · Belgrano 1240');
  });

  it('un contrato terminado no vence: ya terminó', () => {
    const r = detectExpiries({
      today: HOY,
      leases: [{ id: 'l1', end_date: '2026-08-10', state: 'terminado' }],
    });
    expect(r).toEqual([]);
  });

  it('una garantía sin póliza no genera aviso', () => {
    const r = detectExpiries({
      today: HOY,
      guarantees: [
        { id: 'g1', lease_id: 'l1', type: 'deposito', insurance_expiry: null },
        { id: 'g2', lease_id: 'l2', type: 'garante_propietario' },
      ],
    });
    expect(r).toEqual([]);
  });

  it('el contrato lleva su lease_id para que la fila abra la ficha', () => {
    const [a] = detectExpiries({
      today: HOY,
      leases: [{ id: 'l1', end_date: '2026-08-20', state: 'vigente', unit_id: 'u1' }],
    });
    expect(a).toMatchObject({ leaseId: 'l1', unitId: 'u1' });
  });

  it('sin nada que vencer, la lista está vacía (no es un error)', () => {
    expect(detectExpiries({ today: HOY })).toEqual([]);
  });
});
