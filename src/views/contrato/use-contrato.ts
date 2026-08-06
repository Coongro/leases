/**
 * Contrato — datos y estado (generado por el Builder de Vistas).
 *
 * ⚠️ ARCHIVO REGENERABLE: se reescribe al guardar el diseño en el Builder.
 * La lógica custom va en `handlers.ts` (nunca se pisa). Diseño: `spec.json`.
 */
import { actions, getHostReact, usePlugin, views } from '@coongro/plugin-sdk';

import { customHandlers } from './handlers.js';

const React = getHostReact();
const { useState, useEffect, useCallback, useRef } = React;

export function useContratoView() {
  const {
    toast,
    views: { closeDialog },
  } = usePlugin();
  const mounted = useRef(true);
  // reset en el mount (no solo cleanup): StrictMode desmonta y REMONTA
  // conservando refs — con cleanup solo, el remonte quedaría muerto
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const [values, setValues] = useState<Record<string, any>>({
    unit_id: null,
    tenant_contact_id: null,
    contract_type: null,
    start_date: null,
    end_date: null,
    due_day: null,
    due_day_type: null,
    currency: null,
    rent_amount: null,
    expenses_amount: null,
    admin_fee_percent: null,
    adjustment_index: null,
    adjustment_months: null,
    guarantee_type: null,
    guarantor_contact_id: null,
    guarantee_notes: null,
    deposit_amount: null,
    deposit_status: null,
    late_fee_percent: null,
    penalty_months: null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const setField = useCallback((k: string, v: any) => {
    setValues((prev: any) => ({ ...prev, [k]: v }));
    setErrors((e: any) => ({ ...e, [k]: undefined }));
  }, []);
  useEffect(() => {
    const init = customHandlers.onInit;
    if (!init) return;
    void init({
      execute: function exec<T = unknown>(id: string, args?: unknown): Promise<T> {
        return actions.execute<T>(id, args);
      },
      editingId,
      record: initialRecord,
      parentRecord,
    })
      .then((initial) => {
        if (!initial || !mounted.current) return;
        setValues((prev: any) => {
          const next = { ...prev };
          for (const [k, v] of Object.entries(initial)) {
            if (next[k] === undefined || next[k] === '' || next[k] === null) next[k] = v;
          }
          return next;
        });
      })
      .catch(() => {});
    // deps intencionalmente fijas: el efecto corre una sola vez
  }, []);

  // record con el que se abrió la vista (views.open(id, { record })), si hubo — lo
  // reciben los handlers en onSubmit (ej. una acción de fila que necesita el id).
  const initialRecord = ((views.params as any)?.record ?? null) as Record<string, any> | null;
  // Contexto padre (views.open(id, { parentRecord })): el registro DESDE el que
  // se abrió — «Nueva unidad» desde la ficha del edificio. A diferencia de
  // { record }, NUNCA activa el modo edición ni el prefill general de campos.
  const parentRecord = ((views.params as any)?.parentRecord ?? null) as Record<string, any> | null;
  // Abierta con { record } → modo edición: guardar actualiza, no crea
  const [editingId, setEditingId] = useState<string | null>(
    initialRecord?.id !== null && initialRecord?.id !== undefined ? String(initialRecord.id) : null
  );
  // …y los campos arrancan con lo que ya tenía el registro
  useEffect(() => {
    if (!initialRecord) return;
    const loose = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    setValues((prev: any) => {
      const next = { ...prev };
      const rks = Object.keys(initialRecord);
      for (const k of Object.keys(next)) {
        const rk = rks.find((x) => loose(x) === loose(k));
        if (rk) next[k] = initialRecord[rk];
      }
      return next;
    });
    // deps intencionalmente fijas: el efecto corre una sola vez
  }, []);
  // entidad del padre → campo ref que lo referencia (solo matches únicos)
  const PARENT_REF_FIELD: Record<string, string> = { 'properties.units': 'unit_id' };
  useEffect(() => {
    const parentEntity = ((views.params as any)?.parentEntity ?? null) as string | null;
    const linkField = parentEntity ? PARENT_REF_FIELD[parentEntity] : undefined;
    if (!linkField || !parentRecord || parentRecord.id === null || parentRecord.id === undefined)
      return;
    setValues((prev: any) =>
      prev[linkField] ? prev : { ...prev, [linkField]: String(parentRecord.id) }
    );
    // deps intencionalmente fijas: el efecto corre una sola vez
  }, []);
  const [refOptions, setRefOptions] = useState<Record<string, any[]>>({});
  const refLabel =
    customHandlers.refLabel ?? ((r: any) => String(r?.name ?? r?.title ?? r?.label ?? r?.id ?? ''));
  useEffect(() => {
    void Promise.all([
      actions
        .execute<any[]>('properties.units.list')
        .then((r) => {
          if (mounted.current)
            setRefOptions((o: any) => ({ ...o, unit_id: Array.isArray(r) ? r : [] }));
        })
        .catch(() => {}),
      actions
        .execute<any[]>('contacts.list')
        .then((r) => {
          if (mounted.current)
            setRefOptions((o: any) => ({ ...o, tenant_contact_id: Array.isArray(r) ? r : [] }));
        })
        .catch(() => {}),
      actions
        .execute<any[]>('contacts.list')
        .then((r) => {
          if (mounted.current)
            setRefOptions((o: any) => ({ ...o, guarantor_contact_id: Array.isArray(r) ? r : [] }));
        })
        .catch(() => {}),
    ]);
    // deps intencionalmente fijas: el efecto corre una sola vez
  }, []);

  const validate = useCallback((): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (
      values['unit_id'] === null ||
      values['unit_id'] === undefined ||
      values['unit_id'] === '' ||
      values['unit_id'] === false
    )
      errs['unit_id'] = '«Unidad» es requerido';
    if (
      values['tenant_contact_id'] === null ||
      values['tenant_contact_id'] === undefined ||
      values['tenant_contact_id'] === '' ||
      values['tenant_contact_id'] === false
    )
      errs['tenant_contact_id'] = '«Inquilino» es requerido';
    if (
      values['contract_type'] === null ||
      values['contract_type'] === undefined ||
      values['contract_type'] === '' ||
      values['contract_type'] === false
    )
      errs['contract_type'] = '«Tipo de contrato» es requerido';
    if (
      values['start_date'] === null ||
      values['start_date'] === undefined ||
      values['start_date'] === '' ||
      values['start_date'] === false
    )
      errs['start_date'] = '«Desde» es requerido';
    if (
      values['end_date'] === null ||
      values['end_date'] === undefined ||
      values['end_date'] === '' ||
      values['end_date'] === false
    )
      errs['end_date'] = '«Hasta» es requerido';
    if (
      values['due_day'] === null ||
      values['due_day'] === undefined ||
      values['due_day'] === '' ||
      values['due_day'] === false
    )
      errs['due_day'] = '«Día de vencimiento» es requerido';
    if (
      values['due_day_type'] === null ||
      values['due_day_type'] === undefined ||
      values['due_day_type'] === '' ||
      values['due_day_type'] === false
    )
      errs['due_day_type'] = '«Contar el día como» es requerido';
    if (
      values['currency'] === null ||
      values['currency'] === undefined ||
      values['currency'] === '' ||
      values['currency'] === false
    )
      errs['currency'] = '«Moneda» es requerido';
    if (
      values['rent_amount'] === null ||
      values['rent_amount'] === undefined ||
      values['rent_amount'] === '' ||
      values['rent_amount'] === false
    )
      errs['rent_amount'] = '«Alquiler inicial» es requerido';
    if (
      values['adjustment_index'] === null ||
      values['adjustment_index'] === undefined ||
      values['adjustment_index'] === '' ||
      values['adjustment_index'] === false
    )
      errs['adjustment_index'] = '«Índice de actualización» es requerido';
    if (
      values['adjustment_months'] === null ||
      values['adjustment_months'] === undefined ||
      values['adjustment_months'] === '' ||
      values['adjustment_months'] === false
    )
      errs['adjustment_months'] = '«Se actualiza cada» es requerido';
    if (
      values['guarantee_type'] === null ||
      values['guarantee_type'] === undefined ||
      values['guarantee_type'] === '' ||
      values['guarantee_type'] === false
    )
      errs['guarantee_type'] = '«Tipo de garantía» es requerido';
    return errs;
  }, [values]);

  const submit = useCallback(async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      toast.warning('Revisá el formulario', 'Hay campos con errores.');
      return;
    }
    try {
      if (customHandlers.onSubmit) {
        const ctx = {
          execute: function exec<T = unknown>(id: string, args?: unknown): Promise<T> {
            return actions.execute<T>(id, args);
          },
          toast,
          editingId,
          record: initialRecord,
          parentRecord,
        };
        await customHandlers.onSubmit(values, ctx);
      } else if (editingId) {
        await actions.execute('leases.contracts.update', { id: editingId, data: values });
      } else {
        await actions.execute('leases.contracts.create', { data: values });
      }
      toast.success(editingId ? 'Actualizado' : 'Guardado', 'El registro se guardó correctamente');
      setEditingId(null);
      setValues({
        unit_id: null,
        tenant_contact_id: null,
        contract_type: null,
        start_date: null,
        end_date: null,
        due_day: null,
        due_day_type: null,
        currency: null,
        rent_amount: null,
        expenses_amount: null,
        admin_fee_percent: null,
        adjustment_index: null,
        adjustment_months: null,
        guarantee_type: null,
        guarantor_contact_id: null,
        guarantee_notes: null,
        deposit_amount: null,
        deposit_status: null,
        late_fee_percent: null,
        penalty_months: null,
      });
      closeDialog();
    } catch (err) {
      toast.error('Error', err instanceof Error ? err.message : 'No se pudo guardar');
    }
    // deps intencionalmente fijas: el efecto corre una sola vez
  }, [values, validate, editingId]);

  return { values, errors, setField, editingId, refOptions, refLabel, submit };
}
