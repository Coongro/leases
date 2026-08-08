# @coongro/leases

## 0.3.0

### Minor Changes

- dbe939f: feat: los contratos en dólares se facturan en pesos, con la cotización asentada (COONG-275)

  Un contrato podía pactarse en dólares desde el principio, pero el importe viajaba tal cual a la
  cuenta por cobrar: un alquiler de USD 1.200 se cobraba como 1.200 pesos y el panel lo sumaba así.

  - Al emitir los cargos, un contrato en moneda extranjera se convierte a pesos con la cotización del
    día, y la línea deja escrito cómo se hizo la cuenta: `Alquiler 2026-08 · USD 1200 × $1510
(oficial, 31/07/2026)`. El inquilino ve un monto que no figura en su contrato y tiene que poder
    saber de dónde salió.
  - Setting nueva **«Con qué dólar se convierte»** (oficial, blue, MEP, contado con liqui, mayorista):
    se elige la que dice el contrato.
  - La cotización se pide una sola vez por corrida, así todos los cargos de la tanda salen con el
    mismo valor del día.
  - Si no hay cotización disponible, el cargo **no se emite**: es preferible que falte y se vea, a que
    salga cobrando pesos donde el contrato dice dólares.

- dbe939f: feat: renovación, rescisión, punitorios y fichas con datos reales (COONG-275)

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

- dbe939f: feat: facturar ABL, servicios y descuentos además del alquiler (COONG-275)

  El plan definía siete tipos de línea (`rent | expensas | abl | servicio | punitorio | descuento | otro`)
  pero solo se podían emitir tres. Un propietario que le cobra el ABL o el agua al inquilino los
  cobraba por fuera del sistema, y la cuenta corriente mentía.

  Ahora un contrato tiene sus **conceptos recurrentes** (`leases.charges`), que se suman como líneas
  propias al generar el mes:

  ```
  Alquiler 2026-09                            586.612   rent
  Expensas 2026-09 · estimadas según contrato  72.000   expenses
  ABL 2026-09                                  18.000   abl
  Aguas Santafesinas 2026-09                    9.500   servicio
  Bonificación por pago adelantado 2026-09    -15.000   descuento
  ```

  Tres cosas se resolvieron distinto de la fuente (LocaCentral `monthlybillingmanager.js`), porque su
  enfoque falla en silencio:

  - **El tipo se elige, no se adivina.** Allá lo deducen del título con `includes()`, así que
    «Impuesto municipal» cae en «otro» y «Luz de emergencia del palier» se clasifica como servicio de
    luz. Acá el tipo es del concepto.
  - **Un descuento es un concepto con signo negativo**, en la misma lista y con la misma vigencia que
    el resto — no un campo aparte del contrato como su `promo`/`notepromo`.
  - **Los conceptos se dan de baja con `valid_to`, no se borran.** Una cochera que se cobró seis meses
    deja de facturarse conservando el registro de por qué se cobró.

  Un importe en cero no genera línea, y los montos se redondean a peso entero como el resto del kit.

- dbe939f: feat: las actualizaciones por índice se detectan solas todas las mañanas (COONG-275)

  Hasta ahora la detección existía pero había que ir a Actualizaciones y apretar un botón. Un contrato
  que cumplía su aniversario en agosto y que nadie miraba hasta octubre se seguía facturando al valor
  viejo, y esa plata no se recupera.

  - Tarea programada diaria (7 AM) con `scope: "tenant"`: la plataforma la corre una vez por cada
    tenant que tenga el plugin, con la base ya apuntada a ese cliente.
  - Reusa `IndexValueRepository.quote()` de `@coongro/indices`, que baja la serie del BCRA si falta —
    no hay una segunda copia de esa integración acá.
  - **No cambia ningún alquiler**: la propuesta nace `pending` con los dos valores del índice
    guardados, y una persona la confirma. Lo que toca plata se propone, no se aplica solo.
  - Idempotente: las fechas ya propuestas o aplicadas no se vuelven a proponer, así que correrla de
    nuevo no duplica nada.
  - Un contrato cuyo índice todavía no se publicó se anota y se reintenta al día siguiente, sin frenar
    a los demás.
  - El plugin pasa a `runtime: "eager"`, que es lo que exige un cron para no apagarse cuando el plugin
    sale del cache.

- dbe939f: feat: las expensas se facturan por la liquidación del mes, no por el monto del contrato (COONG-275)

  Las expensas de un edificio no son un número fijo: el consorcio liquida un total cada mes y cada
  unidad paga su alícuota. Hasta ahora el cargo se emitía con el `expenses_amount` escrito el día que
  se firmó el contrato, así que con inflación se cobraba mal todos los meses — y siempre de menos.

  - Al generar los cargos se busca la liquidación del período y se reparte por la alícuota de la
    unidad: `Expensas 2026-09 · 35% de $900000 liquidados en septiembre`.
  - Si el consorcio todavía no liquidó, se cobra lo pactado en el contrato y **la línea lo aclara**
    («estimadas según contrato»). El propietario tiene que poder distinguir un importe real de una
    estimación arrastrada, sobre todo cuando se la reclama a alguien.
  - Si hay liquidación pero falta la alícuota de la unidad, tampoco se inventa el reparto: cae a lo
    pactado y lo dice.
  - El importe se redondea a peso entero, igual que el alquiler ajustado por índice.
  - `leases.contracts.list` expone `building_id` y `share_pct` de la unidad, que es por donde se cruza
    con la liquidación.

- c95151b: El catálogo de capacidades del plugin, declarado en código y certificado

  Las 44 capacidades de contratos, cobranza, actualizaciones y vencimientos se declaran con Action Contracts junto a su handler —el mismo objeto que valida en runtime— y se publican certificadas contra un tenant real: cada escritura se ejecutó y se releyó para comprobar qué dejó.

- 0ab33c0: feat: se quita la bitácora de avisos hasta que exista un canal de envío (COONG-275)

  `module_leases_notice_logs` existía desde el diseño original del kit: la bitácora inmutable de qué
  se le comunicó al inquilino y cuándo, para poder sostener una intimación. Llegó a v1 con **cero
  filas, ningún escritor y ninguna vista** — solo dos capabilities publicadas (`leases.notices.list`
  y `getById`) que leían una tabla que nadie llenaba.

  El motivo por el que quedó vacía no era falta de pantalla: el core **no tiene canal de envío**. El
  motor de notificaciones materializa todo in-app, en la campana; el campo `channels` se persiste
  pero el dispatcher nunca lo lee. No hay email, SMS ni WhatsApp en ninguna parte. Registrar "se le
  avisó" sin haber podido avisar es un respaldo que no respalda nada — y peor, uno que en un reclamo
  se presenta como si lo fuera.

  Se quita la tabla en vez de dejarla esperando. Una tabla vacía con capabilities publicadas le
  ofrece a un agente leer y escribir avisos que nunca salieron; el costo de traerla de vuelta cuando
  el canal exista es una migración, y para entonces su forma va a depender de cómo se envíe.

  `module_leases_expiry_alerts` no se toca y no la reemplaza: es estado recalculable —qué hay que
  renovar— y se puede marcar como visto. Justo lo contrario de una bitácora.

- 2fb8914: Se puede borrar lo que se cargó por error, y aplicar una actualización vuelve a pedir confirmación.

  **Borrado.** Contratos, conceptos, actualizaciones e inquilinos ganan su acción de eliminar. Y con la distinción que faltaba: **borrar no es rescindir**. Rescindir conserva la historia de un contrato que existió y se terminó antes; borrar es admitir que nunca debió existir. Por eso un contrato con períodos liquidados o actualizaciones aplicadas se niega y ofrece rescindir en su lugar. Una actualización ya aplicada tampoco se borra —es borrado físico y haría desaparecer un aumento sin dejar rastro—: para eso está «Cancelar», y el botón ni siquiera aparece ahí.

  **«Aplicar» no pedía confirmación.** Su `confirm` y su `successToast` estaban anidados dentro de `action`, donde el codegen no los lee, así que cambiaba el alquiler de un contrato con un solo click.

  **Un inquilino cargado por error era invisible.** El listado exigía que tuviera contrato, así que quien se cargaba con «Nuevo inquilino» y todavía no firmaba nada no aparecía en ninguna pantalla — ni para corregirlo ni para darlo de baja.

- bd0d0d3: feat: Resultado — qué te dejó cada propiedad este año (COONG-275)

  El kit sabía cuánto se facturó y cuánto se gastó, pero nadie los cruzaba. Un propietario con seis
  departamentos no tenía forma de saber cuál le rinde y cuál se le come la renta en arreglos.

  La vista nueva responde eso por propiedad: **alquiler cobrado − honorarios de administración −
  gastos a tu cargo = neto**. Y muestra aparte lo que se facturó y no se cobró, porque una propiedad
  que factura mucho y cobra poco no está rindiendo, está acumulando deuda.

  Lo importante es **qué queda afuera**, que es donde un resultado se arruina:

  - **Las expensas** no son ingreso: el propietario las cobra y se las gira al consorcio. Contarlas
    haría parecer mejor a la propiedad con expensas más altas.
  - **Los arreglos que se le recuperan al inquilino** no son gasto: los adelanta y los cobra en el
    recibo.
  - **Los punitorios y demás conceptos** tampoco: si entraran, un inquilino moroso _mejoraría_ el
    resultado de la propiedad, que es al revés de lo que pasa.
  - El **honorario** se calcula sobre el alquiler puro, que es la base con la que se pacta en el
    mercado — sobre el total del recibo le cobraría comisión al administrador por plata que solo pasa
    por sus manos.

  Se trabaja sobre lo **cobrado**, no lo facturado: el resultado es plata que existe. Un pago parcial
  se imputa en proporción a la composición del recibo, que cancela cada concepto por igual — nadie
  declara qué parte de un pago a medias corresponde al alquiler.

  La proporción de gasto sobre la renta se muestra en puntos enteros y sirve de referencia contra el
  5% que Ganancias toma como presunto: es el número que a fin de año dice si conviene deducir gastos
  reales, una opción que ata por cinco años. Es un dato, no un consejo.

- 5a166f5: feat: la suba pactada queda en el historial y los arreglos del inquilino entran en su recibo (COONG-275)

  Dos agujeros por los que se perdía plata o rastro de plata.

  **Una suba acordada a mano no dejaba huella.** El alquiler se podía cambiar editando el contrato,
  pero eso solo pisaba el número: los cargos ya emitidos quedaban sin explicación y la ficha no
  mostraba nada. Ahora una edición que cambia el monto se anota en el mismo historial que las
  actualizaciones por índice, con el valor anterior, el nuevo, la variación y desde cuándo rige —
  identificada como **«Pactada»** para distinguirla de las que calcula el ICL. Nace aplicada, porque
  el cambio ya lo decidió quien escribió el monto. Volver a guardar el formulario sin tocar el precio
  no anota nada.

  **Un arreglo a cargo del inquilino lo terminaba pagando el propietario.** El campo «Lo paga: el
  inquilino» de una orden de trabajo no era más que una anotación. Ahora ese gasto entra en su recibo,
  con la regla con la que liquida una administración: **el primer recibo que todavía no se cobró**.

  - Si el cargo del mes sigue impago, la línea va ahí.
  - Si ya se cobró —entero o en parte—, no se toca: el gasto espera al mes siguiente. Sumarle plata a
    un recibo que la otra persona dio por cerrado es la forma de romper la confianza en el número.
  - Si el único cargo impago está vencido, tampoco: el gasto quedaría devengando el punitorio del
    contrato desde antes de que el arreglo existiera.

  Cargarlo dos veces no duplica, y corregir la orden retira la línea del recibo mientras nadie haya
  pagado contra él. Corre al generar los cargos del mes y en un barrido diario a las 8, así un arreglo
  cerrado no espera a que alguien se acuerde de facturar.

  **El desglose del cargo en Cobranzas no cerraba con el total.** Salía de las condiciones del
  contrato en vez de las líneas facturadas, así que después de una actualización mostraba el alquiler
  nuevo sobre un cargo viejo, las expensas liquidadas por el consorcio figuraban en cero porque el
  contrato no las tiene, y ningún otro concepto aparecía. El inquilino leía un total que el detalle no
  explicaba. Ahora se arma de lo efectivamente facturado y suma «Otros conceptos» —arreglos, impuestos,
  descuentos, punitorios ya cobrados—, de modo que las partes siempre dan el total. La columna de
  punitorio pasa a llamarse «Punitorio a proponer», que es lo que muestra: lo que se podría cobrar hoy,
  no lo que ya está en la cuenta.

  De paso, el menú «Vencimientos» no tenía icono y quedaba desalineado del resto.

### Patch Changes

- 4c79f4e: Cada acción de una vista se declara y se verifica por separado

  En «Vencimientos» y «Cobranzas», el `onAction` resolvía dos operaciones distintas
  —barrer la cartera y acusar un aviso; emitir el mes y cobrar un punitorio— pero solo
  una quedaba declarada en el contrato headless. La otra existía únicamente como texto
  en una precondición, así que ningún agente podía usarla y el Builder reportaba el
  hook como orquestación.

  Ahora cada operación vive en su propia rama `actionId === '...'` y tiene su entrada
  `headless.handlers` con su `key`. Son operaciones distintas, no variantes de una:
  acusar UN aviso y revisar la cartera entera no comparten ni el sujeto.

  `chargeLateFee` pasa a devolver un tipo nombrado en vez de un genérico inline, que
  el inventario del Builder no podía leer y marcaba como no verificable.

- 9a98b83: Las operaciones que mueven la plata dicen qué les falta antes de tocar la base

  Firmar un contrato sin plazo o sin alquiler, renovarlo sin decir hasta cuándo, rescindirlo sin fecha
  o generar un mes sin período morían con errores de la base —«invalid input syntax for type numeric»,
  «Cannot read properties of undefined»— que no dicen qué falta ni sobre qué contrato. Ahora lo dicen,
  y cortan antes de escribir.

  Además, un concepto dado de baja deja de leerse por su id: antes desaparecía de la lista pero quien
  lo pidiera directo lo recibía igual y podía seguir operando sobre algo que ya no existe.

- 8149716: Al firmar un contrato se ve de qué propiedad es la unidad

  El selector de unidad mostraba solo el nombre. En el tenant de prueba había dos «1°A» —uno
  en Belgrano 1240 y otro en Salta 870— escritos idénticos: elegir era tirar una moneda, y
  equivocarse no daba ningún error. El contrato quedaba firmado contra el inmueble de otro
  dueño, y eso recién se nota cuando hay que liquidarle a alguien.

  Ahora la unidad se lee «Belgrano 1240 · 1°A», con sus ambientes y superficie debajo. El
  nombre calificado lo arma `properties`, que es el plugin dueño de las unidades: si cada
  formulario lo compusiera a su manera, la misma unidad se leería distinta en cada pantalla.
