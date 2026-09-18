---
'@coongro/leases': minor
---

Un contrato firmado se puede editar, con su garantía

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
