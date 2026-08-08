/**
 * Cuándo un contrato se puede borrar, y por qué eso NO es rescindirlo.
 *
 * Son dos operaciones distintas y la pantalla las tenía confundidas en una: el listado ofrecía
 * «Rescindir» —en rojo, con cara de destructiva— y no ofrecía ninguna forma de borrar. Quien
 * había cargado un contrato equivocado tenía dos salidas malas: rescindirlo, que lo deja en la
 * cartera con una historia que nunca existió, o dejarlo ahí para siempre.
 *
 *   **Rescindir** es un hecho del negocio: el contrato existió, se terminó antes de tiempo, y esa
 *   historia se conserva porque explica por qué la unidad quedó libre en junio.
 *
 *   **Borrar** es admitir que ese contrato nunca debió existir: un error de carga, un duplicado,
 *   una prueba. No hay nada que conservar.
 *
 * La diferencia se puede decidir sola mirando si el contrato **movió plata o cambió el alquiler**:
 *
 *  - **Períodos liquidados.** Si ya se le facturó al inquilino, lo que hay es una cuenta corriente
 *    con lo cobrado y lo adeudado. Borrar el contrato la deja huérfana y la liquidación del mes
 *    empieza a contar mal.
 *  - **Actualizaciones aplicadas.** Cada una dejó registrado que el alquiler pasó de un monto a
 *    otro en una fecha. Ese es el rastro que se mira cuando el inquilino pregunta por qué le
 *    aumentó, y no debería poder desaparecer.
 *
 * Con cualquiera de las dos, el contrato ya vivió: se rescinde, no se borra.
 */

/** Lo que hace falta saber del contrato para decidir. */
export interface LeaseMovements {
  /** Cuántos períodos se le liquidaron (cuentas de alquiler a su nombre). */
  billedPeriods: number;
  /** Cuántas actualizaciones se le aplicaron de verdad (no las pendientes ni las canceladas). */
  appliedAdjustments: number;
}

/** «3 períodos liquidados y 1 actualización aplicada» — en singular o plural, según el número. */
function describe({ billedPeriods, appliedAdjustments }: LeaseMovements): string {
  const partes: string[] = [];
  if (billedPeriods > 0) {
    partes.push(
      billedPeriods === 1 ? '1 período liquidado' : `${billedPeriods} períodos liquidados`
    );
  }
  if (appliedAdjustments > 0) {
    partes.push(
      appliedAdjustments === 1
        ? '1 actualización aplicada'
        : `${appliedAdjustments} actualizaciones aplicadas`
    );
  }
  return partes.join(' y ');
}

/**
 * Por qué este contrato no se puede borrar, o `null` si se puede.
 *
 * El mensaje nombra lo que lo frena y ofrece la salida correcta, porque el error de fondo no es
 * que la persona quiera borrar: es que hasta ahora tenía una sola puerta para dos cosas.
 */
export function leaseDeletionBlockedMessage(
  lease: { label?: string | null },
  movements: LeaseMovements
): string | null {
  const detalle = describe(movements);
  if (!detalle) return null;

  const cual = String(lease.label ?? '').trim();
  const sujeto = cual ? `El contrato de ${cual}` : 'Este contrato';
  return `${sujeto} ya tiene ${detalle}: eliminarlo borraría movimientos que el inquilino ya vio. Si el contrato terminó antes de tiempo, lo que corresponde es rescindirlo — así queda la historia de por qué la unidad se liberó.`;
}
