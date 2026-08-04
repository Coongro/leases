import { describe, expect, it } from 'vitest';

import { describeRentChange } from './rent-change.js';

describe('describeRentChange', () => {
  it('describe una suba con su porcentaje', () => {
    const cambio = describeRentChange({
      previousRent: '400000',
      newRent: '467295',
      effectiveDate: '2026-08-02',
    });

    expect(cambio).not.toBeNull();
    expect(cambio?.previousRent).toBe('400000');
    expect(cambio?.newRent).toBe('467295');
    expect(cambio?.ratePercent).toBe('16.82');
    expect(cambio?.effectiveDate).toBe('2026-08-02');
  });

  it('también anota una baja: el historial no es solo de subas', () => {
    const cambio = describeRentChange({
      previousRent: '500000',
      newRent: '450000',
      effectiveDate: '2026-08-02',
    });

    expect(cambio?.ratePercent).toBe('-10.00');
    expect(cambio?.detail).toContain('-10,00%');
  });

  it('no anota nada si el monto no cambió', () => {
    expect(
      describeRentChange({ previousRent: '400000', newRent: '400000', effectiveDate: '2026-08-02' })
    ).toBeNull();
  });

  it('no confunde el formato de PostgreSQL con un cambio de precio', () => {
    // Guardar el formulario sin tocar el monto trae '520000.00' de la base contra el
    // '520000' del input. Si se compararan como texto, cada guardado anotaría una
    // actualización del 0%.
    expect(
      describeRentChange({
        previousRent: '520000.00',
        newRent: '520000',
        effectiveDate: '2026-08-02',
      })
    ).toBeNull();
  });

  it('no anota nada al crear un contrato: no hay precio anterior', () => {
    expect(
      describeRentChange({
        previousRent: undefined,
        newRent: '400000',
        effectiveDate: '2026-08-02',
      })
    ).toBeNull();
    expect(
      describeRentChange({ previousRent: '0', newRent: '400000', effectiveDate: '2026-08-02' })
    ).toBeNull();
  });

  it('no anota nada si alguno de los valores no es un alquiler', () => {
    // `Number('')` es 0: sin la guarda esto se anotaría como una baja del 100%.
    expect(
      describeRentChange({ previousRent: '400000', newRent: '', effectiveDate: '2026-08-02' })
    ).toBeNull();
    expect(
      describeRentChange({ previousRent: '400000', newRent: '0', effectiveDate: '2026-08-02' })
    ).toBeNull();
    expect(
      describeRentChange({
        previousRent: 'ochocientos',
        newRent: '400000',
        effectiveDate: '2026-08-02',
      })
    ).toBeNull();
  });

  it('arma el detalle con los dos montos formateados', () => {
    const cambio = describeRentChange({
      previousRent: '400000',
      newRent: '467295',
      effectiveDate: '2026-08-02',
    });

    expect(cambio?.detail).toBe('$400.000 → $467.295 (+16,82%)');
  });
});
