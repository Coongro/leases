/**
 * Co-firmante del contrato — datos y estado (generado por el Builder de Vistas).
 *
 * ⚠️ ARCHIVO REGENERABLE: se reescribe al guardar el diseño en el Builder.
 * La lógica custom va en `handlers.ts` (nunca se pisa). Diseño: `spec.json`.
 */
import { actions, getHostReact, usePlugin, views } from '@coongro/plugin-sdk';

import { customHandlers } from './handlers.js';

const React = getHostReact();
const { useState, useEffect, useCallback, useRef } = React;

export function useCoFirmanteDelContratoView() {
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
    leaseId: null,
    contactId: null,
    role: null,
    notes: null,
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
  // entidad del padre → campo ref que lo referencia (solo matches únicos)
  const PARENT_REF_FIELD: Record<string, string> = {
    'leases.contracts': 'leaseId',
    contacts: 'contactId',
  };
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
        .execute<any[]>('leases.contracts.list')
        .then((r) => {
          if (mounted.current)
            setRefOptions((o: any) => ({ ...o, leaseId: Array.isArray(r) ? r : [] }));
        })
        .catch(() => {}),
      actions
        .execute<any[]>('contacts.list')
        .then((r) => {
          if (mounted.current)
            setRefOptions((o: any) => ({ ...o, contactId: Array.isArray(r) ? r : [] }));
        })
        .catch(() => {}),
    ]);
    // deps intencionalmente fijas: el efecto corre una sola vez
  }, []);

  const validate = useCallback((): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (
      values['leaseId'] === null ||
      values['leaseId'] === undefined ||
      values['leaseId'] === '' ||
      values['leaseId'] === false
    )
      errs['leaseId'] = '«Contrato» es requerido';
    if (
      values['contactId'] === null ||
      values['contactId'] === undefined ||
      values['contactId'] === '' ||
      values['contactId'] === false
    )
      errs['contactId'] = '«Persona» es requerido';
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
      } else {
        toast.warning(
          'Sin destino',
          'Conectá un repositorio (binding de datos) en el Builder o implementá onSubmit en handlers.ts'
        );
        return;
      }
      toast.success(
        'Co-firmante registrado',
        'La persona queda como firmante del contrato junto al inquilino principal.'
      );
      setEditingId(null);
      setValues({ leaseId: null, contactId: null, role: null, notes: null });
      closeDialog();
    } catch (err) {
      toast.error('Error', err instanceof Error ? err.message : 'No se pudo guardar');
    }
    // deps intencionalmente fijas: el efecto corre una sola vez
  }, [values, validate, editingId]);

  return { values, errors, setField, editingId, refOptions, refLabel, submit };
}
