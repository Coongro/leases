/**
 * Qué le dejó cada propiedad en el año.
 *
 * Es la pregunta que ningún dato suelto del kit responde: la cobranza dice cuánto se
 * facturó, mantenimiento cuánto se gastó, y nadie los cruza. Un propietario con seis
 * departamentos no sabe cuál le rinde y cuál se le come la renta en arreglos.
 *
 * **Qué NO entra, y por qué importa.** Un resultado se arruina sumando plata que solo
 * está de paso:
 *
 * - **Las expensas** las cobra el propietario y se las gira al consorcio. Entran y salen:
 *   no son ingreso suyo. Contarlas infla la renta de una propiedad con expensas altas y
 *   la hace parecer mejor que su vecina.
 * - **Los arreglos que se le recuperan al inquilino** son lo mismo del otro lado: el
 *   propietario los adelanta y los cobra en el recibo. No son gasto suyo.
 * - **Los punitorios y otros conceptos** tampoco: son accesorios de la cobranza, no lo
 *   que la propiedad genera mes a mes. Mezclarlos haría que un inquilino moroso mejore
 *   el resultado de la propiedad, que es exactamente al revés de lo que pasa.
 *
 * Queda entonces una cuenta corta y verdadera: **alquiler cobrado − honorarios − gastos
 * propios**.
 *
 * **Cobrado y no facturado.** El resultado es plata que existe. Una propiedad que factura
 * mucho y cobra poco no está rindiendo, está acumulando deuda — y eso se ve aparte, en lo
 * impago, que también se devuelve.
 *
 * Sobre el porcentaje de gasto: se calcula contra el alquiler cobrado y sirve como
 * referencia para una decisión anual real (deducir gastos reales o el presunto). Es un
 * dato, no un consejo: qué hacer con él lo decide un contador.
 */

/** Lo cobrado de un cargo, ya separado por concepto. */
export interface ChargeForResult {
  /** El edificio al que pertenece, que es como se agrupa el resultado. */
  buildingId: string;
  /** Lo facturado de alquiler puro en ese cargo. */
  rent: number;
  /** El total del cargo, con todos sus conceptos. Es el denominador del prorrateo. */
  total: number;
  /** Lo efectivamente cobrado del cargo, sin distinguir a qué concepto se imputó. */
  paid: number;
  /** El honorario de administración pactado en el contrato, en porcentaje. */
  adminFeePercent: number;
}

/** Un gasto del propietario ya atribuido a una propiedad. */
export interface ExpenseForResult {
  buildingId: string;
  amount: number;
}

/** El resultado de una propiedad en el año. */
export interface PropertyResult {
  buildingId: string;
  /** Alquiler puro efectivamente cobrado. */
  rentCollected: number;
  /** Honorarios de administración sobre ese alquiler. */
  adminFee: number;
  /** Gastos a cargo del propietario. */
  expenses: number;
  /** rentCollected − adminFee − expenses. */
  net: number;
  /** Alquiler facturado que todavía no se cobró: no es resultado, pero explica su falta. */
  unpaidRent: number;
  /**
   * Qué proporción de la renta se fue en gastos, en puntos enteros.
   *
   * Sin decimales a propósito: entre 49% y 50% no hay ninguna decisión distinta, y el
   * decimal solo agrega una precisión que el dato no tiene —el gasto del año todavía no
   * terminó de ocurrir—. Además obliga a elegir separador, y un «49.6» en la tabla al
   * lado de un «49,6» en la cabecera se lee como dos números distintos.
   */
  expenseRatio: number;
}

/**
 * Cuánto del pago corresponde al alquiler.
 *
 * Un pago entra contra la cuenta, no contra una línea: si alguien paga la mitad de un
 * recibo que trae alquiler, expensas y un arreglo, nadie declaró qué mitad pagó. Se
 * imputa **en proporción a la composición del recibo**, que es lo que cancela cada
 * concepto por igual y no favorece a ninguno.
 *
 * El caso normal —el recibo pagado entero— da exactamente el alquiler, sin redondeos.
 */
function rentCollectedFrom(charge: ChargeForResult): number {
  if (charge.paid <= 0 || charge.total <= 0) return 0;
  if (charge.paid >= charge.total) return charge.rent;
  return (charge.rent * charge.paid) / charge.total;
}

/**
 * Arma el resultado de cada propiedad. Devuelve una entrada por propiedad presente en
 * los cargos O en los gastos: una propiedad vacía que solo generó gastos también tiene
 * resultado —negativo—, y esconderla sería esconder justamente la que duele.
 */
export function propertyResults(
  charges: ChargeForResult[],
  expenses: ExpenseForResult[]
): PropertyResult[] {
  const acc = new Map<string, PropertyResult>();

  const vacio = (buildingId: string): PropertyResult => ({
    buildingId,
    rentCollected: 0,
    adminFee: 0,
    expenses: 0,
    net: 0,
    unpaidRent: 0,
    expenseRatio: 0,
  });

  for (const c of charges) {
    if (!c.buildingId) continue;
    const r = acc.get(c.buildingId) ?? vacio(c.buildingId);
    const cobrado = rentCollectedFrom(c);

    r.rentCollected += cobrado;
    // El honorario se calcula sobre el alquiler PURO, que es la base con la que se pacta:
    // aplicarlo al total del recibo le cobraría comisión al administrador por las expensas
    // y los impuestos que solo pasan por sus manos.
    r.adminFee += (cobrado * c.adminFeePercent) / 100;
    r.unpaidRent += Math.max(0, c.rent - cobrado);
    acc.set(c.buildingId, r);
  }

  for (const e of expenses) {
    if (!e.buildingId) continue;
    const r = acc.get(e.buildingId) ?? vacio(e.buildingId);
    r.expenses += e.amount;
    acc.set(e.buildingId, r);
  }

  return (
    [...acc.values()]
      .map((r) => ({
        ...r,
        rentCollected: Math.round(r.rentCollected),
        adminFee: Math.round(r.adminFee),
        expenses: Math.round(r.expenses),
        unpaidRent: Math.round(r.unpaidRent),
        net: Math.round(r.rentCollected - r.adminFee - r.expenses),
        expenseRatio: r.rentCollected > 0 ? Math.round((r.expenses / r.rentCollected) * 100) : 0,
      }))
      // Lo que más deja, arriba: la lista se lee para comparar propiedades entre sí.
      .sort((a, b) => b.net - a.net)
  );
}
