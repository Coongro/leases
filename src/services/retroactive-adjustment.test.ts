import { describe, expect, it } from 'vitest';

import {
  adjustmentMark,
  alreadyCharged,
  describePeriods,
  retroactiveDifference,
  retroactiveLabel,
  retroactivePeriods,
} from './retroactive-adjustment.js';

describe('retroactivePeriods', () => {
  it('son los períodos ya emitidos desde la vigencia, inclusive', () => {
    expect(
      retroactivePeriods({
        effectiveDate: '2026-09-01',
        issuedPeriods: ['2026-07', '2026-08', '2026-09', '2026-10'],
      })
    ).toEqual(['2026-09', '2026-10']);
  });

  it('confirmada a tiempo no deja nada atrás', () => {
    // El caso sano: el ajuste rige en noviembre y sólo se facturó hasta octubre.
    expect(
      retroactivePeriods({ effectiveDate: '2026-11-01', issuedPeriods: ['2026-09', '2026-10'] })
    ).toEqual([]);
  });

  it('los períodos anteriores a la vigencia no se tocan', () => {
    // Lo facturado antes de que el ajuste rigiera está bien facturado.
    expect(
      retroactivePeriods({ effectiveDate: '2026-10-01', issuedPeriods: ['2026-08', '2026-09'] })
    ).toEqual([]);
  });
});

describe('retroactiveDifference', () => {
  it('es la diferencia mensual por la cantidad de meses', () => {
    expect(
      retroactiveDifference({
        periods: ['2026-09', '2026-10'],
        previousRent: '520000',
        newRent: '585000',
      })
    ).toBe('130000');
  });

  it('sin períodos no hay nada que cobrar', () => {
    expect(retroactiveDifference({ periods: [], previousRent: '520000', newRent: '585000' })).toBe(
      '0'
    );
  });

  it('una actualización a la baja no genera un cargo', () => {
    // Con índices negativos el nuevo alquiler puede ser menor; ahí lo que
    // correspondería es devolver, y devolver no se hace sin que alguien lo decida.
    expect(
      retroactiveDifference({ periods: ['2026-09'], previousRent: '585000', newRent: '520000' })
    ).toBe('0');
  });
});

describe('cómo se lee', () => {
  it('los meses se nombran en castellano', () => {
    expect(describePeriods(['2026-09'])).toBe('septiembre de 2026');
    expect(describePeriods(['2026-09', '2026-10'])).toBe('septiembre de 2026 y octubre de 2026');
  });

  it('la línea del recibo se puede reconstruir sin preguntar', () => {
    expect(
      retroactiveLabel({
        indexCode: 'ICL',
        periods: ['2026-09'],
        previousRent: '520000',
        newRent: '585000',
      })
    ).toBe('Diferencia por actualización ICL · septiembre de 2026 · $520000 → $585000');
  });
});

describe('alreadyCharged', () => {
  it('reconoce el concepto que dejó esta misma actualización', () => {
    const conceptos = [{ notes: 'ABL de la unidad' }, { notes: adjustmentMark('adj-1') }];
    expect(alreadyCharged(conceptos, 'adj-1')).toBe(true);
  });

  it('no confunde la diferencia de otra actualización', () => {
    expect(alreadyCharged([{ notes: adjustmentMark('adj-2') }], 'adj-1')).toBe(false);
  });

  it('un concepto sin notas no es una diferencia cobrada', () => {
    // Apretar «Cobrar diferencia» dos veces dejaba al inquilino debiendo el doble:
    // esta es la pregunta que lo evita, y por eso su caso vacío importa.
    expect(alreadyCharged([{ notes: null }, {}], 'adj-1')).toBe(false);
  });
});
