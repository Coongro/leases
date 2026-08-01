---
'@coongro/leases': minor
---

feat: las expensas se facturan por la liquidación del mes, no por el monto del contrato (COONG-275)

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
