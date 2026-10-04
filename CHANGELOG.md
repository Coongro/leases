# @coongro/leases

## 0.4.0

### Minor Changes

- Un contrato se puede guardar como borrador

  El estado `borrador` existía en todas partes menos donde se necesitaba. La lógica ya sabía
  tratarlo: un borrador no se factura, no genera actualizaciones y no le bloquea la unidad a
  otro contrato. Los filtros de Contratos y de la ficha del inquilino lo ofrecían. Pero el
  único camino que escribe un contrato fijaba «vigente» a mano, así que ese filtro siempre
  daba vacío y la opción no existía.

  Ahora el formulario tiene **Estado del contrato**: «Firmado · empieza a facturar» (el
  default, el caso de todos los días) o «Borrador · todavía no se firma». Sirve para lo que
  pasa siempre: el contrato se carga antes de estar firmado —falta que el garante traiga los
  papeles— y hasta entonces no puede facturar ni tomar la unidad.

  Y el mismo campo lo activa: al editarlo y pasarlo a firmado, empieza a facturar y la
  unidad queda comprometida. Un borrador no le escribe las fechas a la unidad, justamente
  para no mostrarla alquilada por algo que quizá no se firme.

  Los otros estados —rescindido, renovado— siguen sin entrar por acá: tienen su propia
  acción, porque significan cosas que pasaron, no que se eligen.

- Se pueden registrar co-firmantes, consultar la cobranza ya no emite, y los contratos publicados dejan de prometer lo que no hacen

  **Co-firmantes.** El kit no tenía forma de registrar a quien firma junto al inquilino
  principal — ni por pantalla ni por API. La tabla existía y solo se la tocaba para dar de
  baja en la cascada de rescisión. Ahora la ficha del contrato tiene «Quiénes firman», con
  su alta y su baja, y la operación se niega a sumar un firmante a un contrato cerrado, a
  anotar al inquilino principal como si fuera otra persona, y a repetir a alguien que ya
  firma. El nombre se trae de `contacts` por join: duplicarlo lo dejaría viejo en cuanto
  alguien corrija la persona.

  **Consultar la cobranza del mes ya no emite.** `chargesForPeriod` tenía un
  `generateIfMissing` que llamaba a la generación, y esa comodidad convertía una lectura en
  una escritura encubierta: se publica declarada de lectura, así que la ve el perfil de
  conexión de solo lectura como una consulta inofensiva y —por ser lectura— nunca tuvo que
  correr de verdad para publicarse. Una rama que emite plata detrás de un contrato que
  decía consultar. Emitir es `generateForPeriod`, que declara lo que hace. El acople existía
  para cerrar la ventana de dos pantallas emitiendo el mismo mes, y esa ventana se cerró
  sola cuando la generación pasó a ser incremental e idempotente por contrato.

  **Contratos que prometían de más.** Las seis listas del plugin publicaban `limit` y
  `offset` y ningún handler los implementaba: un agente pedía diez resultados y recibía
  todos. Se sacaron. La de vencimientos además ocultaba los filtros que sí existen
  (urgencia, tipo, incluir los ya vistos), que es justo lo que hace falta para preguntar qué
  vence esta semana. Y los títulos y descripciones que había dejado el generador
  —«Obtiene Contrato disponibles para el cliente actual»— se reescribieron para que digan
  qué devuelve cada una.

- Cobrar la mora vuelve a ser posible desde el canal agentic: se pide por contrato, cobra todos los cargos vencidos y siempre dice qué hizo.

  La capability publicaba `id` y el handler leía `accountId`, así que por MCP el argumento nunca llegaba y la operación devolvía «no cobré» con el motivo vacío — nunca pudo cobrar, y la certificación la daba por buena porque el resultado era coherente con lo que la propia operación reportaba.

  Ahora el input es `leaseId` (el contrato, que es lo que existe para quien administra; el id de una cuenta interna no se puede pedir sin haber mirado la pantalla) con `period` opcional para acotar a un mes. Con varios meses vencidos cobra sobre todos los cargos con saldo.

  La política de gracia se lee de las settings del tenant **en el servidor**: antes solo existía del lado del navegador y viajaba como parámetros del RPC, así que un agente cobraba con cero días de gracia sobre plata de una persona.

  Y `detail` ya no vuelve vacío nunca: distingue «al día», «dentro de los N días de gracia», «sin punitorio pactado», «sin saldo pendiente» y «ya cobrado hoy». Ese último caso además dejó de reportarse como cobro: la línea no se duplicaba, pero la respuesta decía haber cobrado un monto que nunca se agregó.

- Un contrato en dólares puede fijar su cotización, y el recibo dice cuál usó

  Hasta ahora todo contrato en dólares se convertía con la cotización del día de emisión.
  En la práctica argentina, desde que la ley de alquileres quedó derogada las partes pactan
  libremente y es habitual dejar por escrito a qué valor se paga: uno fijo por todo el
  contrato. Ese contrato se facturaba con el dólar de hoy — más caro o más barato que lo
  firmado, y sin que nadie lo notara.

  El contrato ahora tiene **«Cotización pactada»** (visible sólo si la moneda es USD, vacío
  = la del mercado). Cuando está, gana sobre cualquier fuente: el cargo se emite igual
  aunque la cotización del día no esté disponible, porque no depende de ella. La línea del
  recibo lo deja asentado — `USD 1200 × $1450 (pactada en el contrato)` — así que el
  inquilino puede reconstruir la cuenta sin preguntar.

  La ficha del contrato ya no dice sólo «Dólares (USD)»: aclara si es a valor pactado o a
  la cotización del día. Esa mitad de la condición faltaba.

- Cobranzas muestra hace cuánto que un cargo está impago

  «Venció ayer» y «venció hace cuarenta días» eran la misma píldora roja, y no son la
  misma llamada. La tabla tiene ahora una columna **Atraso** con los días, ordenable: se
  ordena por ella y arriba queda a quién hay que llamar primero.

  El atraso **no descuenta los días de gracia**, a propósito. Son dos preguntas distintas
  y cada una ya tenía su respuesta en su lugar: «¿está vencido?» es un hecho del
  calendario —la fecha pasó y la plata no entró—, y «¿corresponde punitorio?» es una
  decisión comercial, que sí respeta la gracia. Si la pantalla esperara la tolerancia
  escondería una deuda real justo los días en que hay que reclamarla: la gracia es una
  promesa de no cobrar interés, no de no mirar.

  Un cargo saldado no muestra atraso aunque se haya pagado tarde, y uno sin fecha de
  vencimiento tampoco: en los dos casos la columna dice «—» en vez de un cero que se
  leería como «venció hoy».

- Una actualización confirmada tarde ya no regala los meses que quedaron atrás

  Si una actualización empieza a regir en un mes que ya se facturó al alquiler anterior,
  esa diferencia no se cobraba ni aparecía en ninguna parte. El sesgo tenía dueño: la
  plata que no se reclama sale siempre del bolsillo del propietario.

  Aplicar una actualización ahora **informa la diferencia** con su importe y los meses
  afectados, y deja el botón **«Cobrar diferencia»** en la misma fila. No la cobra sola:
  el kit calcula el ajuste con el último índice publicado —la cláusula de rezago que usan
  los contratos reales, porque el IPC de cada mes sale a mitad del siguiente—, así que una
  actualización siempre se puede confirmar a tiempo. Si igual quedaron meses atrás es que
  se pasó por alto, y eso conviene mirarlo antes de cobrarlo. Quien prefiera lo contrario
  tiene la setting **«Si la actualización se confirma tarde»**: informar (default), cobrar
  sin preguntar, o no cobrar diferencias.

  **Ningún recibo emitido se toca.** La diferencia entra en el primer recibo posterior que
  siga impago, o como concepto del mes siguiente si todavía no hay ninguno: un recibo
  entregado es un documento y la rendición que el propietario ya firmó no se reescribe.
  La línea se puede reconstruir sin preguntar — `Diferencia por actualización IPC ·
agosto de 2026, septiembre de 2026 · $540000 → $618729`.

  Una actualización a la baja no genera cargo: devolver plata es una decisión que no se
  toma sola ni se esconde en un recibo.

- Un contrato firmado se puede editar, con su garantía

  La única acción que abría el formulario de contrato era «Nuevo contrato». Una vez firmado,
  un alquiler mal tipeado, un día de vencimiento equivocado o un índice mal elegido no
  tenían arreglo desde la app — aunque el repositorio soporta la edición desde siempre.

  La ficha del contrato ahora tiene **«Editar contrato»** en su encabezado.

  Habilitarlo destapó dos cosas que hacían falta para que funcionara:
  - **La garantía se carga en el formulario.** Su tipo es obligatorio, pero la garantía vive
    en su propia tabla y no viaja con el registro del contrato: editar moría en «Tipo de
    garantía es requerido», pidiendo volver a elegir algo que ya estaba cargado y que la
    pantalla no mostraba. Para eso se agregó `leases.guarantees.forLease`, la lectura que
    faltaba — el repositorio tenía «todas» y «una por id», pero no «las de este contrato».
  - **La garantía también se corrige al editar.** El formulario mostraba sus campos en la
    edición y lo que se escribiera ahí no iba a ningún lado. Se actualiza la vigente, no se
    crea otra: la garantía sobrevive a la renovación y el historial importa.

- Los contratos declaran quién puede verlos, gestionarlos y cobrar alquileres

  El plugin declara sus permisos (`contributes.permissions`, generados con el Coongro Builder) y trae `src/permissions/permissions.gen.ts` con las constantes para chequearlos en código. En Coongro Standalone, cada usuario ve y hace solo lo que le permiten sus roles; el dueño, todo. Rescindir un contrato queda dentro de «Gestionar contratos».

  Las vistas del Builder se regeneraron: los botones que abren una pantalla o ejecutan una acción que el rol no permite ya no se muestran. Necesita un Core con `useAccess` en el plugin-sdk (Coongro/coongro-core#687).

- Rescindir un contrato ahora resuelve la multa, en vez de dejarla «para hablarlo»

  La rescisión guardaba la fecha de fin, liberaba la unidad y terminaba ahí. La multa por
  rescisión anticipada —que el contrato tiene pactada en meses de alquiler— no aparecía en
  ninguna parte: se cobraba por fuera del sistema, o no se cobraba. El dato estaba cargado
  y no servía para nada.

  Ahora el panel de rescisión **propone** el importe (meses pactados × alquiler vigente,
  no el inicial: si el contrato se actualizó por índice, tres meses son tres meses de lo
  que se paga hoy) y ofrece dos caminos: **cobrarla** o **no cobrarla**. El importe es
  editable, porque en la práctica se negocia. Si el contrato no pactó multa, la opción
  arranca en no cobrar: ofrecer cobrar una multa que nadie firmó sería inventar una deuda.

  Cuando se cobra, la multa va donde se pueda cobrar: **al recibo del mes de la rescisión
  si ya está emitido, o como concepto de ese mismo mes si todavía no**. Son dos caminos
  porque la rescisión puede pasar antes o después de facturar el mes, y ninguno sirve para
  el otro caso: agregar una línea a un recibo que no existe no cobra nada, y crear el
  recibo con sólo la multa haría que la generación del mes lo encuentre hecho y no emita
  el alquiler. Eligiendo uno solo, la multa se cobra exactamente una vez.

  En un contrato en dólares la multa se convierte con el mismo criterio que el alquiler:
  la cotización pactada gana sobre la del mercado.

  Rescindir y resolver la multa son **una sola acción** (`leases.billing.terminateLease`):
  separarlas deja el estado de la mitad —contrato rescindido, multa en el aire— que es
  justamente el que se quiere evitar.

### Patch Changes

- Los botones «Aplicar» y «Cancelar» de una actualización no hacían nada

  En la pantalla de Actualizaciones, confirmar una actualización mostraba «Actualización
  aplicada» y **no aplicaba nada**: el alquiler del contrato seguía igual. Lo mismo con
  «Cancelar».

  La causa: el motor de la vista, cuando el archivo de lógica define `onAction`, delega
  en él TODA acción y no ejecuta ninguna por su cuenta. Y ese `onAction` ignoraba cuál se
  había apretado — corría siempre la detección de actualizaciones, que es lo que hace el
  botón de la cabecera. La lógica correcta existía en un `onRowAction` exportado que no
  llamaba nadie.

  Ahora cada botón hace lo suyo, y el aviso dice lo que realmente pasó.

- Un contrato de precio fijo se puede guardar, y el saldo deja de decir «US$»

  **«Índice de actualización» y «Se actualiza cada» eran obligatorios.** Un contrato cuyo
  precio no se actualiza solo —frecuente en locales comerciales pactados en dólares— no
  podía editarse nunca: cualquier cambio moría en «Revisá el formulario». Y al darlo de
  alta obligaba a inventarle un índice, que después disparaba actualizaciones que nadie
  pactó. Ahora el índice es opcional (su placeholder dice qué significa dejarlo vacío) y
  el período sólo aparece cuando hay un índice elegido, que es cuando la pregunta tiene
  sentido.

  En la ficha, el **saldo del inquilino** se rotulaba con la moneda del contrato: mostraba
  `US$ 1.887.000` sobre un saldo que estaba en pesos: los cargos se emiten convertidos.
  Leído así, la deuda parecía mil veces más grande. Las **expensas** tenían el mismo
  problema y la misma causa: las liquida el consorcio en pesos, no el contrato.

- El mes se emite contrato por contrato, los barridos dicen qué hicieron, y una actualización vieja ya no pisa el alquiler

  **Contratos que quedaban sin facturar.** Emitir el mes miraba si el período tenía algún
  cargo y, si lo tenía, no generaba ninguno más. Un contrato firmado después de emitir
  quedaba sin factura para siempre y sin ningún aviso: la unidad se veía alquilada y al
  inquilino no le llegaba nada que pagar. Ahora se emite contrato por contrato — la
  generación ya era idempotente (cada cuenta lleva su `contrato:período` único), así que
  correrla de más no cuesta nada y correrla de menos dejaba plata sin cobrar.

  **Barridos que no decían nada.** Pasar los arreglos a cargo del inquilino a su recibo
  devolvía listas vacías sin explicar por qué: no se distinguía «no había trabajo» de
  «falta emitir el mes» ni de «algo falló». Ahora devuelve el motivo de cada arreglo que no
  entró y un resumen en una línea, que es lo único que ve quien pidió el barrido. El motivo
  ya se calculaba en cada salteo; lo que faltaba era no tirarlo.

  **Actualizaciones obsoletas.** Confirmar una propuesta por índice escribía su monto sobre
  el contrato sin mirar si el alquiler había cambiado desde que se propuso. Con una
  propuesta vieja y un aumento acordado a mano después, confirmarla devolvía el alquiler a
  la cuenta anterior. Ahora se compara contra el alquiler que la propuesta asumió y, si no
  coincide, se explica con los dos montos y se pide volver a detectarla.

- Firmar un contrato ya no ocupa la unidad antes de tiempo, y rescindir la libera el día que corresponde

  Al firmar se marcaba la unidad como ocupada en el acto, sin mirar cuándo empezaba el
  contrato: uno que arrancaba el mes siguiente la dejaba alquilada desde ese mismo día, así
  que quedaba fuera de oferta estando libre. Y no había nada que la liberara al vencer.

  Ahora se escriben las FECHAS que el contrato compromete —`occupied_from` y
  `occupied_until` en la unidad— y `properties` deriva el estado contra el día de hoy. La
  renovación corre el hasta; la rescisión lo fija en su fecha, no en el momento de
  rescindir. Una migración completa las fechas de los contratos vigentes que ya existían.

- Confirmar «Generar cargos del mes» y «Revisar vencimientos» ya no abre el cuadro del navegador

  Los dos botones preguntaban con `window.confirm`: el cuadro propio del navegador, que
  ignora los tokens y el modo oscuro, muestra el dominio arriba y se despacha sin leerlo.
  Ahora preguntan con el mismo diálogo de Coongro que ya usaba el borrado de una fila, con
  la etiqueta del botón como título y como verbo de confirmación.

  Son vistas generadas: el arreglo es del codegen del Builder (COONG-306) y acá solo se
  regeneran. Cancelar no ejecuta nada; confirmar ejecuta la acción una sola vez.

- El selector de período se apoya a la izquierda en Panel y en Cobranzas

  Quedaba centrado en la fila, lejos de la tabla y de las métricas que filtra. Ahora arranca
  donde arranca el resto del contenido, así se lee como lo que es: el control del período de
  lo que está abajo.

  Cambio de diseño hecho en el Builder; las vistas solo se regeneran.

- La píldora de estado de un recibo decía «closed»

  Las tres tablas que muestran los cargos —Cobranzas, la ficha del contrato y la del
  inquilino— traducían `open` y `overdue`, y dejaban pasar `closed` en crudo, que es el
  estado más frecuente: 28 de los 39 recibos del entorno de prueba. Encima traducían
  `paid` y `partial`, que **billing nunca escribe**: los únicos estados que una cuenta
  llega a tener son `open`, `closed` y `overdue`.

  Ahora las tres dicen lo mismo y sólo lo que existe: **Emitido**, **Vencido**,
  **Cerrado**. Si el recibo se cobró entero o quedó algo se lee en la columna «Cobrado»,
  que está al lado — la píldora dice en qué etapa está el recibo, no cuánta plata entró.

- El panel cuenta las unidades ocupadas por sus fechas, no por la columna

  La ocupación del panel salía de contar las unidades con `status = 'ocupada'`. Esa columna
  guarda la marca que pone quien administra («no disponible», «en recambio»), no si la unidad
  está alquilada: eso se deriva de las fechas del contrato. Con la cartera llena, el panel
  podía decir 0 % de ocupación.

  Ahora cuenta `occupancy`, que es el campo donde `properties` publica la ocupación ya
  resuelta contra la fecha de hoy.

- Cinco errores de plata en la facturación y en las actualizaciones

  **El ABL y los servicios se multiplicaban por la cotización del dólar.** En un contrato
  pactado en USD, todo lo que entraba al recibo pasaba por la conversión, no solo el
  alquiler: un ABL de $45.000 salía $67.950.000 a $1.510 el dólar. La moneda extranjera se
  pacta sobre el canon locativo; las expensas las liquida el consorcio en pesos —sueldo del
  encargado, luz, proveedores— y el ABL o el agua se cargan en pesos porque así se facturan.
  Ahora se convierte únicamente el alquiler.

  **Un contrato sin cotización dejaba sin facturar a todos los que venían después.** La
  excepción cortaba la corrida entera, así que un inquilino en pesos podía quedarse sin
  recibo del mes porque otro contrato, en dólares y sin cotización, estaba más arriba en la
  lista. Ahora cada contrato que falla se anota con su motivo y la corrida sigue.

  **Las actualizaciones acumuladas de un contrato se calculaban mal, de dos formas a la
  vez.** La fecha base se buscaba por posición sobre el arreglo sin filtrar, así que con una
  actualización ya registrada la siguiente comparaba el índice contra el doble de meses y
  proponía cobrar de nuevo la inflación que la anterior ya había cobrado. Y todas las
  propuestas partían del alquiler vigente en vez de encadenar con el resultado de la
  anterior: en un contrato con tres semestres atrasados, la segunda y la tercera quedaban
  hasta un 24 % por debajo de lo que el índice justifica. Los dos números viajaban a la
  pantalla de actualizaciones y a su impacto mensual proyectado.

  **La comisión de administración no se guardaba.** El formulario la pedía, el campo existía
  en la base y `propertyResults` la usa para calcular el honorario — pero no estaba en la
  lista de campos que se persisten, así que se guardaba vacía sin ningún error y el rinde de
  cada propiedad daba siempre cero de comisión.

  **El punitorio se recalculaba sobre un saldo que ya incluía los punitorios anteriores.**
  El cálculo devuelve el interés acumulado desde el vencimiento, y se cobraba entero contra
  el saldo de la cuenta: al día 5 se cobraban $13.000 sobre una deuda de $520.000, y al día
  10 otros $26.650 sobre $533.000, cuando los diez días son $26.000. Un 52 % de más, que se
  aceleraba con cada barrido. Ahora la base es la deuda sin punitorios y se cobra solo la
  diferencia contra lo ya cobrado.

  **Los contadores de cargos saldados e impagos estaban siempre al revés.** Se comparaban
  contra `status === 'paid'`, un valor que `billing` no escribe nunca —sus cuentas son
  `open`, `closed` u `overdue`—, así que un mes íntegramente cobrado informaba cero
  saldados y todos los cargos impagos, al lado de un saldo de $0 que decía lo contrario.
  Ahora se miran los saldos, que son los que ya estaban bien.

- El arreglo que paga el inquilino se pone al día cuando cambia su costo

  El egreso al proveedor ya se resincronizaba si el costo de la orden cambiaba; el recupero
  al inquilino no. Una orden presupuestada en $50.000 que termina costando $65.000 se le
  pagaba entera al plomero y se le recuperaban $50.000 al inquilino: los $15.000 los
  absorbía el propietario, que es exactamente lo contrario de lo que significa «a cargo del
  inquilino».

  Ahora el barrido pone al día lo que ya está en un recibo, y lo dice en su resumen. Un
  recibo que YA recibió un pago no se toca — el mismo criterio que usa el retiro, y por la
  misma razón: la otra persona pagó contra un total, y cambiárselo después le deja un saldo
  que nadie decidió.

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
