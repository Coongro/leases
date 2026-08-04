import { describe, expect, it } from 'vitest';

import { propertyResults, type ChargeForResult } from './property-result.js';

const cargo = (over: Partial<ChargeForResult> = {}): ChargeForResult => ({
  buildingId: 'belgrano',
  rent: 500000,
  total: 500000,
  paid: 500000,
  adminFeePercent: 0,
  ...over,
});

describe('propertyResults', () => {
  it('el resultado de un mes cobrado entero es el alquiler', () => {
    const [r] = propertyResults([cargo()], []);
    expect(r.rentCollected).toBe(500000);
    expect(r.net).toBe(500000);
    expect(r.unpaidRent).toBe(0);
  });

  it('descuenta los gastos del propietario', () => {
    const [r] = propertyResults([cargo()], [{ buildingId: 'belgrano', amount: 95000 }]);
    expect(r.expenses).toBe(95000);
    expect(r.net).toBe(405000);
    expect(r.expenseRatio).toBe(19);
  });

  it('descuenta el honorario sobre el alquiler puro, no sobre el total del recibo', () => {
    // El recibo trae 500.000 de alquiler + 100.000 de expensas. El 10% se cobra sobre el
    // alquiler: 50.000. Sobre el total serían 60.000 — comisión por plata que solo pasa.
    const [r] = propertyResults([cargo({ total: 600000, paid: 600000, adminFeePercent: 10 })], []);
    expect(r.rentCollected).toBe(500000);
    expect(r.adminFee).toBe(50000);
    expect(r.net).toBe(450000);
  });

  it('la proporción de gasto va en puntos enteros', () => {
    // 420.000 sobre 846.612 es 49,61%. Se redondea a 50: el decimal no cambia ninguna
    // decisión y obligaría a elegir separador, que es como la tabla y la cabecera
    // terminaron mostrando «49.61%» y «49,6%» para el mismo número.
    const [r] = propertyResults(
      [cargo({ rent: 846612, total: 846612, paid: 846612 })],
      [{ buildingId: 'belgrano', amount: 420000 }]
    );
    expect(r.expenseRatio).toBe(50);
    expect(Number.isInteger(r.expenseRatio)).toBe(true);
  });

  it('un recibo impago no suma resultado, pero se ve como alquiler sin cobrar', () => {
    const [r] = propertyResults([cargo({ paid: 0 })], []);
    expect(r.rentCollected).toBe(0);
    expect(r.net).toBe(0);
    expect(r.unpaidRent).toBe(500000);
  });

  it('un pago parcial se imputa en proporción a la composición del recibo', () => {
    // 500.000 de alquiler + 100.000 de expensas = 600.000. Pagó 300.000 (la mitad):
    // se cancela la mitad de cada concepto, así que el alquiler cobrado es 250.000.
    const [r] = propertyResults([cargo({ total: 600000, paid: 300000 })], []);
    expect(r.rentCollected).toBe(250000);
    expect(r.unpaidRent).toBe(250000);
  });

  it('las expensas del recibo nunca entran como ingreso', () => {
    // Todo el recibo cobrado, pero solo el alquiler es del propietario.
    const [r] = propertyResults([cargo({ total: 600000, paid: 600000 })], []);
    expect(r.rentCollected).toBe(500000);
    expect(r.net).toBe(500000);
  });

  it('una propiedad que solo generó gastos aparece con resultado negativo', () => {
    // Una unidad vacante que hubo que arreglar: es la que más importa ver.
    const rs = propertyResults([], [{ buildingId: 'salta', amount: 240000 }]);
    expect(rs).toHaveLength(1);
    expect(rs[0].net).toBe(-240000);
    // Sin renta no hay proporción que calcular: 0 es más honesto que dividir por cero.
    expect(rs[0].expenseRatio).toBe(0);
  });

  it('agrupa por propiedad y ordena por lo que deja', () => {
    const rs = propertyResults(
      [
        cargo({ buildingId: 'chica', rent: 200000, total: 200000, paid: 200000 }),
        cargo({ buildingId: 'grande', rent: 800000, total: 800000, paid: 800000 }),
      ],
      [{ buildingId: 'grande', amount: 100000 }]
    );
    expect(rs.map((r) => r.buildingId)).toEqual(['grande', 'chica']);
    expect(rs[0].net).toBe(700000);
    expect(rs[1].net).toBe(200000);
  });

  it('suma los meses de una misma propiedad', () => {
    const rs = propertyResults([cargo(), cargo(), cargo()], []);
    expect(rs).toHaveLength(1);
    expect(rs[0].rentCollected).toBe(1500000);
  });
});
