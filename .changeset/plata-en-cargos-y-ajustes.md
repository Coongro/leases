---
'@coongro/leases': patch
---

Cinco errores de plata en la facturación y en las actualizaciones

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
