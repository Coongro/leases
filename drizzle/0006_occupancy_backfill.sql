-- Backfill de la ocupación como HECHO (COONG-300).
--
-- Hasta acá la unidad guardaba `status = 'ocupada'`, que se escribía al FIRMAR: un
-- contrato que empezaba el mes siguiente ocupaba la unidad desde el día de la firma, y
-- uno que terminaba no la liberaba nunca porque no había nada que lo hiciera. Ahora la
-- unidad guarda desde y hasta cuándo está comprometida, y el estado se deriva contra la
-- fecha de hoy.
--
-- Las dos tablas viven en el mismo schema del tenant, y `leases` depende de `properties`
-- —nunca al revés—, así que el backfill va acá: es este plugin el que sabe qué contrato
-- compromete cada unidad.
--
-- Se toma el contrato VIGENTE de cada unidad; si hubiera más de uno, el que se extiende
-- más lejos. Los rescindidos y los renovados quedan afuera: el primero ya liberó la
-- unidad y el segundo fue reemplazado por su renovación.
UPDATE "module_properties_units" u
SET "occupied_from" = v."start_date",
    "occupied_until" = v."end_date"
FROM (
  SELECT DISTINCT ON (l."unit_id")
         l."unit_id", l."start_date", l."end_date"
  FROM "module_leases_leases" l
  WHERE l."deleted_at" IS NULL
    AND l."status" = 'vigente'
    AND l."unit_id" IS NOT NULL
  ORDER BY l."unit_id", l."end_date" DESC NULLS FIRST
) v
WHERE u."id" = v."unit_id"
  AND u."deleted_at" IS NULL
  AND u."occupied_from" IS NULL;
