---
'@coongro/leases': minor
---

feat: los contratos en dólares se facturan en pesos, con la cotización asentada (COONG-275)

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
