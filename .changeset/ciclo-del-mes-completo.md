---
'@coongro/leases': minor
---

feat: renovación, rescisión, punitorios y fichas con datos reales (COONG-275)

Cierra el ciclo del mes del kit de alquileres: un contrato se firma, genera sus cargos, se actualiza
por índice, cobra su mora y termina —renovado o rescindido— sin salir del sistema.

- **Renovar** crea el contrato nuevo encadenado al anterior (que queda `renovado`, no alargado: el
  plazo original se conserva y con él la historia de precios de la unidad). El formulario llega
  precargado con lo que se sabe —empieza al día siguiente del vencimiento, hereda monto, índice y
  período—, así que renovar es revisar y confirmar.
- **Rescindir** guarda la fecha real de fin y el motivo. La fecha arranca en hoy, salvo que el
  contrato todavía no haya empezado (ahí ofrece su primer día, la única fecha válida más temprana).
- **El estado del contrato ya no miente.** `renovado` y `rescindido` se muestran como tales en vez de
  seguir apareciendo «vigente» porque su fecha de fin no llegó, y las acciones que ya no
  corresponden dejan de ofrecerse — antes «Renovar» aparecía en un contrato renovado y fallaba al
  clickearlo.
- **Punitorio por mora**: la cobranza propone el interés de cada cargo vencido según el porcentaje
  pactado y los días de gracia configurados, y lo suma a la cuenta solo cuando alguien lo confirma.
- **Generación de cargos según la política del negocio** (`leases.charges.generation`): a mano,
  avisando o sola al abrir el mes. La generación es idempotente, así que ninguna de las tres puede
  duplicar un cargo.
- **Ficha de inquilino**: sus contratos, su cuenta corriente y su saldo, desde la lista de
  inquilinos (que hasta ahora no llevaba a ningún lado y ni siquiera cargaba sus datos).
- **La ficha de contrato dejó de mostrar secciones vacías**: sus actualizaciones y sus cargos son los
  reales, y el saldo del inquilino sale de los mismos cargos que muestra Cobranzas.
- **La ocupación de la unidad se mantiene sola**: firmar o renovar la marca ocupada, rescindir la
  libera. La ficha de la propiedad mostraba «Vacante» en una unidad con contrato vigente.
