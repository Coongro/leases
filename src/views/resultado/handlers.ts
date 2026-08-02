/**
 * Lógica custom de «Resultado» (ResultadoView).
 *
 * Este archivo es TUYO: el Builder lo crea una sola vez y NUNCA lo pisa al
 * regenerar. Los archivos regenerables (`resultado.view.ts`,
 * `use-resultado.ts`, `index.ts`) invocan estos puntos de extensión si
 * existen — acá va lo que el diseño no puede expresar.
 *
 * Los dos puntos leen la MISMA acción de servidor
 * (`leases.billing.propertyResults`): la tabla muestra sus filas y la cabecera las
 * suma. La cuenta —qué entra como ingreso, qué como gasto, cómo se imputa un pago
 * parcial— vive en el servidor, así que si alguien le pregunta al Copilot cuánto le
 * dejaron sus propiedades, contesta exactamente el número que está viendo en pantalla.
 */
import { formatMoney, plural, type CustomHandlers } from '@coongro/plugin-sdk';

/** El resultado de una propiedad, como lo devuelve el servidor. */
interface PropertyResultRow {
  property: string;
  rentCollected: number;
  adminFee: number;
  expenses: number;
  net: number;
  unpaidRent: number;
  expenseRatio: number;
}

export const customHandlers: CustomHandlers = {
  loadData: ({ execute }) => execute<PropertyResultRow[]>('leases.billing.propertyResults'),

  loadLiveValues: async ({ execute }) => {
    const filas = await execute<PropertyResultRow[]>('leases.billing.propertyResults');
    const suma = (campo: keyof PropertyResultRow): number =>
      (filas ?? []).reduce((acc, f) => acc + Number(f[campo] ?? 0), 0);

    const cobrado = suma('rentCollected');
    const gastos = suma('expenses');
    const propiedades = (filas ?? []).length;
    // El porcentaje del conjunto NO es el promedio de los porcentajes: una propiedad
    // chica con un arreglo caro lo inflaría. Se recalcula sobre los totales.
    const proporcion = cobrado > 0 ? (gastos / cobrado) * 100 : 0;

    return {
      k1: {
        value: formatMoney(suma('net')),
        sub: propiedades
          ? `${plural(propiedades, 'propiedad', 'propiedades')} · después de gastos y honorarios`
          : 'todavía sin datos del año',
      },
      k2: {
        value: formatMoney(cobrado),
        sub: 'sin expensas ni otros conceptos',
      },
      k3: {
        value: formatMoney(gastos),
        // El porcentaje es el dato que decide, no el monto: contra el 5% presunto de
        // Ganancias es lo que dice si conviene deducir gastos reales. Redondeado igual
        // que en la tabla, para que los dos números se lean como el mismo.
        sub:
          cobrado > 0
            ? `${Math.round(proporcion)}% de lo cobrado`
            : 'sin renta con la que compararlo',
      },
    };
  },
};
