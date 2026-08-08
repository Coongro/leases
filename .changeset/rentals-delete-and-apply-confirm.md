---
'@coongro/leases': minor
---

Se puede borrar lo que se cargó por error, y aplicar una actualización vuelve a pedir confirmación.

**Borrado.** Contratos, conceptos, actualizaciones e inquilinos ganan su acción de eliminar. Y con la distinción que faltaba: **borrar no es rescindir**. Rescindir conserva la historia de un contrato que existió y se terminó antes; borrar es admitir que nunca debió existir. Por eso un contrato con períodos liquidados o actualizaciones aplicadas se niega y ofrece rescindir en su lugar. Una actualización ya aplicada tampoco se borra —es borrado físico y haría desaparecer un aumento sin dejar rastro—: para eso está «Cancelar», y el botón ni siquiera aparece ahí.

**«Aplicar» no pedía confirmación.** Su `confirm` y su `successToast` estaban anidados dentro de `action`, donde el codegen no los lee, así que cambiaba el alquiler de un contrato con un solo click.

**Un inquilino cargado por error era invisible.** El listado exigía que tuviera contrato, así que quien se cargaba con «Nuevo inquilino» y todavía no firmaba nada no aparecía en ninguna pantalla — ni para corregirlo ni para darlo de baja.
