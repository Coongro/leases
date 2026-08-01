/**
 * Contratos — datos y estado (generado por el Builder de Vistas).
 *
 * ⚠️ ARCHIVO REGENERABLE: se reescribe al guardar el diseño en el Builder.
 * La lógica custom va en `handlers.ts` (nunca se pisa). Diseño: `spec.json`.
 */
import { actions, events, getHostReact, usePlugin, views } from '@coongro/plugin-sdk';

import { customHandlers } from './handlers.js';

const React = getHostReact();
const { useState, useEffect, useCallback, useMemo, useRef } = React;

export function useContratosView() {
  const { toast } = usePlugin();
  const mounted = useRef(true);
  // reset en el mount (no solo cleanup): StrictMode desmonta y REMONTA
  // conservando refs — con cleanup solo, el remonte quedaría muerto
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  // Registro con el que se abrió la vista (views.open(id, { record })): en una
  // ficha es por lo que filtran sus tablas hijas. Null en una lista suelta.
  const viewRecord = ((views.params as any)?.record ?? null) as Record<string, any> | null;
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const ctx = {
        execute: function exec<T = unknown>(id: string, args?: unknown): Promise<T> {
          return actions.execute<T>(id, args);
        },
        record: viewRecord,
      };
      const byBlock = customHandlers.loadDataFor?.['tbl'];
      const data = byBlock
        ? await byBlock(ctx)
        : customHandlers.loadData
          ? await customHandlers.loadData(ctx)
          : await actions.execute<any[]>('leases.contracts.list');
      if (mounted.current) setRows(Array.isArray(data) ? data : []);
    } catch {
      if (mounted.current) {
        setRows([]);
        toast.error('Error', 'No se pudieron cargar los datos');
      }
    } finally {
      if (mounted.current) setLoading(false);
    }
    // deps intencionalmente fijas: el efecto corre una sola vez
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    const offs = [
      'leases.contracts.create',
      'leases.contracts.update',
      'leases.contracts.delete',
      'leases.contracts.restore',
    ].map((id) =>
      events.on(id, () => {
        void load();
      })
    );
    return () => {
      for (const off of offs) off();
    };
  }, [load]);

  const normKey = (s: string) =>
    s
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '');
  // columnas de la tabla: key + label (+ ref/refDisplay/refPath/ref2/display/values/prefix/suffix/format/iconFrom/empty*)
  const COLUMNS: {
    key: string;
    label: string;
    ref?: string;
    refDisplay?: string;
    refPath?: string;
    ref2?: string;
    display?: string;
    values?: { value: string; label?: string; icon?: string; tone?: string }[];
    tone?: string;
    prefix?: string;
    suffix?: string;
    format?: string;
    iconFrom?: string;
    emptyLabel?: string;
    emptyIcon?: string;
  }[] = [
    { key: 'unit', label: 'Unidad', emptyLabel: 'Sin unidad' },
    { key: 'property', label: 'Propiedad', emptyLabel: '—' },
    { key: 'tenant', label: 'Inquilino', emptyLabel: 'Sin inquilino' },
    { key: 'start_date', label: 'Desde', format: 'date' },
    { key: 'end_date', label: 'Hasta', format: 'date' },
    { key: 'rent_amount', label: 'Alquiler vigente', display: 'mono', format: 'money' },
    {
      key: 'adjustment_index',
      label: 'Ajuste',
      display: 'pill',
      values: [
        { value: 'ICL', label: 'ICL', icon: 'TrendingUp' },
        { value: 'IPC', label: 'IPC', icon: 'TrendingUp' },
        { value: 'casa_propia', label: 'Casa Propia', icon: 'TrendingUp' },
      ],
      tone: 'outline',
      emptyLabel: 'Fijo',
    },
    {
      key: 'state',
      label: 'Estado',
      display: 'pill',
      values: [
        { value: 'vigente', label: 'Vigente', tone: 'success', icon: 'CircleCheck' },
        { value: 'por_comenzar', label: 'Por comenzar', tone: 'neutral', icon: 'CalendarPlus' },
        { value: 'por_vencer', label: 'Por vencer', tone: 'warning', icon: 'CalendarClock' },
        { value: 'terminado', label: 'Terminado', tone: 'outline', icon: 'CircleSlash' },
        { value: 'renovado', label: 'Renovado', tone: 'outline', icon: 'RefreshCw' },
        { value: 'rescindido', label: 'Rescindido', tone: 'outline', icon: 'Ban' },
        { value: 'borrador', label: 'Borrador', tone: 'neutral', icon: 'FileEdit' },
      ],
    },
  ];
  // columnas OCULTAS: alimentan el detalle de la fila expandible
  const HIDDEN_COLUMNS: typeof COLUMNS = [
    { key: 'currency', label: 'Moneda' },
    { key: 'adjustment_months', label: 'Ajusta cada (meses)' },
    { key: 'deposit_amount', label: 'Depósito', display: 'mono', format: 'money' },
    { key: 'deposit_status', label: 'Estado del depósito' },
  ];
  // el subtítulo se muda bajo el título: fuera de las columnas propias
  const SUB_COL = COLUMNS.find((c) => c.key === 'property');
  const ITEM_COLS = COLUMNS.filter((c) => c.key !== 'property');
  const cellValue = (
    row: any,
    c: { key: string; ref?: string; refDisplay?: string; refPath?: string; ref2?: string }
  ) => {
    let v = row?.[c.key];
    if (v === undefined) {
      const k = Object.keys(row ?? {}).find((x) => normKey(x) === normKey(c.key));
      v = k ? row[k] : undefined;
    }
    return v;
  };
  const mapRow =
    customHandlers.mapRow ??
    ((row: any) =>
      COLUMNS.map((c) => {
        const v = cellValue(row, c);
        return v === null || v === undefined
          ? ''
          : typeof v === 'object'
            ? JSON.stringify(v)
            : String(v);
      }));

  // orden por columna (click en el encabezado) + filtros automáticos
  const [sort, setSort] = useState<{ k: string; d: 1 | -1 } | null>(null);
  // firma del UI.DataTable del host: (key, 'asc' | 'desc' | null)
  const onSortChange = useCallback((k: string, d: 'asc' | 'desc' | null) => {
    setSort(d ? { k, d: d === 'asc' ? 1 : -1 } : null);
  }, []);
  const [filters, setFilters] = useState<Record<string, string>>({});
  // filtrable = columna con pocos valores distintos (2..12) en los datos
  const filterOptions = useMemo(() => {
    const out: Record<string, string[]> = {};
    for (const c of COLUMNS) {
      const vals = [
        ...new Set(
          rows
            .map((r) => {
              const v = cellValue(r, c);
              return v === null || v === undefined ? '' : String(v);
            })
            .filter(Boolean)
        ),
      ];
      if (vals.length >= 2 && vals.length <= 12) out[c.key] = vals.sort();
    }
    return out;
    // deps intencionalmente fijas: el efecto corre una sola vez
  }, [rows]);
  const visibleRows = useMemo(() => {
    let out = rows;
    if (search)
      out = out.filter((r) => JSON.stringify(r).toLowerCase().includes(search.toLowerCase()));
    for (const [k, fv] of Object.entries(filters)) {
      if (!fv) continue;
      const c = COLUMNS.find((x) => x.key === k);
      if (c)
        out = out.filter((r) => {
          const v = cellValue(r, c);
          return String(v ?? '') === fv;
        });
    }
    if (sort) {
      const c = COLUMNS.find((x) => x.key === sort.k);
      if (c)
        out = [...out].sort((ra, rb) => {
          const va = cellValue(ra, c);
          const vb = cellValue(rb, c);
          const na = Number(va);
          const nb = Number(vb);
          const cmp =
            !Number.isNaN(na) && !Number.isNaN(nb) && va !== '' && vb !== ''
              ? na - nb
              : String(va ?? '').localeCompare(String(vb ?? ''));
          return sort.d * cmp;
        });
    }
    return out;
    // deps intencionalmente fijas: el efecto corre una sola vez
  }, [rows, search, filters, sort]);
  // limpiar todo: búsqueda + filtros + orden (botón "Limpiar filtros" del FilterBar)
  const clearFilters = useCallback(() => {
    setSearch('');
    setFilters({});
    setSort(null);
  }, []);
  // paginación (20 por página); vuelve a la página 1 al buscar/filtrar/ordenar
  const [page, setPage] = useState(1);
  useEffect(() => {
    setPage(1);
  }, [search, filters, sort]);
  const pagedRows = useMemo(
    () => visibleRows.slice((page - 1) * 20, page * 20),
    [visibleRows, page]
  );
  const [pendingDelete, setPendingDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const removeRow = useCallback((row: any) => {
    setPendingDelete(row ?? null);
  }, []);
  const cancelDelete = useCallback(() => {
    if (!deleting) setPendingDelete(null);
  }, [deleting]);
  const confirmDelete = useCallback(async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await actions.execute('leases.contracts.delete', { id: pendingDelete.id });
      toast.success('Eliminado', 'El registro se eliminó correctamente');
      setPendingDelete(null);
      void load();
    } catch {
      toast.error('Error', 'No se pudo eliminar');
    } finally {
      setDeleting(false);
    }
    // deps intencionalmente fijas: el efecto corre una sola vez
  }, [pendingDelete, load]);

  return {
    sort,
    onSortChange,
    filters,
    setFilters,
    filterOptions,
    cellValue,
    clearFilters,
    page,
    setPage,
    pagedRows,
    pendingDelete,
    deleting,
    confirmDelete,
    cancelDelete,
    loading,
    search,
    setSearch,
    load,
    COLUMNS,
    mapRow,
    visibleRows,
    removeRow,
    HIDDEN_COLUMNS,
    SUB_COL,
    ITEM_COLS,
  };
}
