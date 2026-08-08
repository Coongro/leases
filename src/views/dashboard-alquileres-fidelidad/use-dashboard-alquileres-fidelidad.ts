/**
 * Panel de alquileres — datos y estado (generado por el Builder de Vistas).
 *
 * ⚠️ ARCHIVO REGENERABLE: se reescribe al guardar el diseño en el Builder.
 * La lógica custom va en `handlers.ts` (nunca se pisa). Diseño: `spec.json`.
 */
import { actions, getHostReact, usePlugin, views, type LiveValues } from '@coongro/plugin-sdk';

import { customHandlers } from './handlers.js';

const React = getHostReact();
const { useState, useEffect, useCallback, useMemo, useRef } = React;

export function useDashboardAlquileresFidelidadView() {
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
  // Valores en vivo de los indicadores. Mientras cargan NO se muestra el número
  // del diseño: sería una cifra inventada leída como real (por el usuario y por
  // el Copilot). Sin loadLiveValues la vista es de maqueta y el texto escrito manda.
  const [metrics, setMetrics] = useState<Record<string, LiveValues> | null>(null);
  const reloadMetrics = useCallback(() => {
    const load = customHandlers.loadLiveValues;
    if (!load) return;
    setMetrics(null);
    void load({
      execute: function exec<T = unknown>(id: string, args?: unknown): Promise<T> {
        return actions.execute<T>(id, args);
      },
      record: viewRecord,
    })
      .then((m) => {
        if (mounted.current) setMetrics(m ?? {});
      })
      .catch(() => {
        if (mounted.current) setMetrics({});
      });
    // deps intencionalmente fijas: la función es estable
  }, []);
  useEffect(() => {
    reloadMetrics();
  }, [reloadMetrics]);
  const metric = useCallback(
    (id: string, key: keyof LiveValues, design: string) => {
      if (!customHandlers.loadLiveValues) return design;
      if (!metrics) return '…';
      return metrics[id]?.[key] ?? design;
    },
    [metrics]
  );

  const normKey = (s: string) =>
    s
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '');

  // ── tabla 1: estado propio en su scope (mismos nombres, sin colisión) ──
  const useTable1 = () => {
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
        const byBlock = customHandlers.loadDataFor?.['tbl_venc'];
        const data = byBlock
          ? await byBlock(ctx)
          : customHandlers.loadData
            ? await customHandlers.loadData(ctx)
            : [];
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
      { key: 'tenant', label: 'Inquilino' },
      { key: 'unit', label: 'Unidad' },
      { key: 'end_date', label: 'Termina', format: 'date' },
    ];
    // el subtítulo se muda bajo el título: fuera de las columnas propias
    const SUB_COL = COLUMNS.find((c) => c.key === 'unit');
    const ITEM_COLS = COLUMNS.filter((c) => c.key !== 'unit');
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
    // paginación (10 por página); vuelve a la página 1 al buscar/filtrar/ordenar
    const [page, setPage] = useState(1);
    useEffect(() => {
      setPage(1);
    }, [search, filters, sort]);
    const pagedRows = useMemo(
      () => visibleRows.slice((page - 1) * 10, page * 10),
      [visibleRows, page]
    );
    const removeRow = useCallback((_row: any) => {
      toast.warning(
        'Sin entidad',
        'Conectá un repositorio (binding de datos) en el Builder o implementá onAction en handlers.ts'
      );
    }, []);
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
      loading,
      search,
      setSearch,
      load,
      COLUMNS,
      mapRow,
      visibleRows,
      removeRow,
      SUB_COL,
      ITEM_COLS,
    };
  };
  const t1 = useTable1();

  // ── tabla 2: estado propio en su scope (mismos nombres, sin colisión) ──
  const useTable2 = () => {
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
        const byBlock = customHandlers.loadDataFor?.['tbl_aj'];
        const data = byBlock ? await byBlock(ctx) : [];
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
      { key: 'unit', label: 'Unidad' },
      { key: 'index', label: 'Índice' },
      { key: 'new_rent', label: 'Nuevo alquiler', display: 'mono', format: 'money' },
    ];
    // el subtítulo se muda bajo el título: fuera de las columnas propias
    const SUB_COL = COLUMNS.find((c) => c.key === 'index');
    const ITEM_COLS = COLUMNS.filter((c) => c.key !== 'index');
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
    const mapRow = (row: any) =>
      COLUMNS.map((c) => {
        const v = cellValue(row, c);
        return v === null || v === undefined
          ? ''
          : typeof v === 'object'
            ? JSON.stringify(v)
            : String(v);
      });

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
    // paginación (10 por página); vuelve a la página 1 al buscar/filtrar/ordenar
    const [page, setPage] = useState(1);
    useEffect(() => {
      setPage(1);
    }, [search, filters, sort]);
    const pagedRows = useMemo(
      () => visibleRows.slice((page - 1) * 10, page * 10),
      [visibleRows, page]
    );
    const removeRow = useCallback((_row: any) => {
      toast.warning(
        'Sin entidad',
        'Conectá un repositorio (binding de datos) en el Builder o implementá onAction en handlers.ts'
      );
    }, []);
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
      loading,
      search,
      setSearch,
      load,
      COLUMNS,
      mapRow,
      visibleRows,
      removeRow,
      SUB_COL,
      ITEM_COLS,
    };
  };
  const t2 = useTable2();

  const reloadTables = useCallback(() => {
    void t1.load();
    void t2.load();
  }, [t1, t2]);

  return { metric, reloadMetrics, t1, t2, reloadTables };
}
