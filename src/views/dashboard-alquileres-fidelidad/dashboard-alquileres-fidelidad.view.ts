/**
 * Panel de alquileres — composición y render (generado por el Builder de Vistas).
 *
 * ⚠️ ARCHIVO REGENERABLE: se reescribe al guardar el diseño en el Builder.
 * La lógica custom va en `handlers.ts` (nunca se pisa). Diseño: `spec.json`.
 */
import { actions, getHostReact, getHostUI, useIsMobile, views } from '@coongro/plugin-sdk';

import { customHandlers } from './handlers.js';
import { useDashboardAlquileresFidelidadView } from './use-dashboard-alquileres-fidelidad.js';

const React = getHostReact();
const { useState } = React;
const h = React.createElement;
// Contexto de los cargadores de gráficos de handlers.ts. `record` es el
// registro con el que se abrió la vista: un gráfico dentro de una ficha
// tiene que poder pedir la serie de ESE contrato, no la de todos.
const chartCtx = () => ({
  execute: function exec<T = unknown>(id: string, args?: unknown): Promise<T> {
    return actions.execute<T>(id, args);
  },
  record: ((views.params as any)?.record ?? null) as Record<string, any> | null,
});
// Componentes del HOST: el diseño vive en core — una actualización de
// ui-components se refleja acá sin regenerar esta vista.
const UI = getHostUI() as any;

export function DashboardAlquileresFidelidadView() {
  const isMobile = useIsMobile();
  // Mes elegido en el selector. Vive acá y no dentro del componente porque
  // recargar los datos re-renderiza la vista: con el estado adentro, el
  // selector volvía al mes actual mientras la tabla mostraba otro.
  const [periodValue, setPeriodValue] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const { t1, t2, metric, reloadMetrics } = useDashboardAlquileresFidelidadView();

  // ── tabla 1: render propio sobre su estado t1 ──
  const renderTable1 = (() => {
    const {
      loading,
      visibleRows,
      sort,
      onSortChange,
      cellValue,
      search,
      setSearch,
      clearFilters,
      page,
      setPage,
      pagedRows,
      SUB_COL,
      ITEM_COLS,
    } = t1;
    const cellText = (row: any, c: any) => {
      const v = cellValue(row, c);
      return v === null || v === undefined
        ? ''
        : typeof v === 'object'
          ? JSON.stringify(v)
          : String(v);
    };
    const TONE_VARIANT: Record<string, string> = {
      neutral: 'neutral-soft',
      success: 'success-soft',
      warning: 'warning-soft',
      danger: 'danger-soft',
      outline: 'outline',
    };
    const enumVal = (c: any, raw: string) => (c.values ?? []).find((e: any) => e.value === raw);
    const formatDate = (fmt: string, raw: string) => {
      const s = String(raw ?? '');
      const only = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
      if (only) return only[3] + '/' + only[2] + '/' + only[1];
      const d = new Date(s);
      if (isNaN(d.getTime())) return s;
      const p = (n: number) => String(n).padStart(2, '0');
      const dmy = p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear();
      const hm = p(d.getHours()) + ':' + p(d.getMinutes());
      return fmt === 'datetime' ? dmy + ' ' + hm : fmt === 'time' ? hm : dmy;
    };
    const renderCell = (row: any, c: any) => {
      const raw = cellText(row, c);
      const ev = enumVal(c, raw);
      const label = c.format ? formatDate(c.format, raw) : (ev?.label ?? raw);
      const shown = raw !== '' ? (c.prefix ?? '') + label + (c.suffix ?? '') : label;
      if (c.display === 'avatar') {
        const initial = (String(raw).trim().charAt(0) || '?').toUpperCase();
        return h(
          'span',
          { style: { display: 'inline-flex', alignItems: 'center', gap: '8px', minWidth: 0 } },
          h(
            'span',
            {
              style: {
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                flexShrink: 0,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--cg-gold-soft)',
                border: '1px solid var(--cg-gold-lt)',
                color: 'var(--cg-gold-deep)',
                fontWeight: 700,
                fontSize: '11px',
              },
            },
            initial
          ),
          h('span', null, shown)
        );
      }
      const iconName = ev?.icon;
      const icon = iconName ? h(UI.DynamicIcon, { icon: iconName, size: 16 }) : null;
      if (c.display === 'pill') {
        return label
          ? h(
              UI.Badge,
              {
                variant: TONE_VARIANT[ev?.tone ?? c.tone ?? 'neutral'] ?? 'neutral-soft',
                size: 'compact',
                icon,
              },
              label
            )
          : '';
      }
      if (c.display === 'progress') {
        const n = Math.max(0, Math.min(100, Number(cellValue(row, c)) || 0));
        return h(
          'div',
          { style: { display: 'flex', alignItems: 'center', gap: '8px', minWidth: '90px' } },
          h(
            'div',
            {
              style: {
                flex: '1 1 0',
                height: '6px',
                borderRadius: '999px',
                background: 'var(--cg-bg-secondary)',
                overflow: 'hidden',
              },
            },
            h('div', {
              style: {
                width: n + '%',
                height: '100%',
                borderRadius: '999px',
                background: 'var(--cg-gold)',
              },
            })
          ),
          h(
            'span',
            { style: { fontSize: '12px', color: 'var(--cg-text-muted)' } },
            Math.round(n) + '%'
          )
        );
      }
      if (c.display === 'mono')
        return h(
          'span',
          { style: { fontFamily: 'ui-monospace, monospace', fontSize: '12px' } },
          shown
        );
      return icon
        ? h(
            'span',
            { style: { display: 'inline-flex', alignItems: 'center', gap: '6px' } },
            icon,
            shown
          )
        : shown;
    };
    // eslint-disable-next-line sonarjs/prefer-immediate-return
    const renderTable = () =>
      h(
        'div',
        {
          style: {
            background: 'var(--cg-bg)',
            border: '1px solid var(--cg-border)',
            borderRadius: '14px',
            padding: '20px',
          },
        },
        h(UI.DataTable, {
          data: pagedRows,
          rowKey: (row: any) => String(row.id ?? JSON.stringify(row)),
          loading,
          columns: ITEM_COLS.map((c, ci) => ({
            key: c.key,
            header: c.label,
            sortable: true,
            render: (row: any) =>
              ci === 0 && SUB_COL
                ? h(
                    'div',
                    { style: { display: 'flex', flexDirection: 'column' as const, gap: '2px' } },
                    h('div', null, renderCell(row, c)),
                    h(
                      'div',
                      { style: { fontSize: '12px', color: 'var(--cg-text-muted)' } },
                      renderCell(row, SUB_COL)
                    )
                  )
                : renderCell(row, c),
          })),
          searchPlaceholder: 'Buscar…',
          searchValue: search,
          onSearchChange: setSearch,
          sortKey: sort?.k ?? null,
          sortDirection: sort ? (sort.d > 0 ? 'asc' : 'desc') : null,
          onSortChange,
          pagination: { page, pageSize: 10, total: visibleRows.length },
          onPageChange: setPage,
          view: 'list' as const,
          renderItem: (row: any) =>
            h(
              'div',
              { style: { display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 } },
              h(
                'div',
                {
                  style: {
                    minWidth: 0,
                    flex: '1 1 auto',
                    display: 'flex',
                    flexDirection: 'column' as const,
                    gap: '2px',
                  },
                },
                h(
                  'div',
                  null,
                  h(
                    'div',
                    { style: { fontSize: '14px', fontWeight: 600, color: 'var(--cg-text)' } },
                    renderCell(row, ITEM_COLS[0])
                  ),
                  SUB_COL
                    ? h(
                        'div',
                        {
                          style: {
                            fontSize: '12px',
                            color: 'var(--cg-text-muted)',
                            marginTop: '1px',
                          },
                        },
                        renderCell(row, SUB_COL)
                      )
                    : null
                ),
                ITEM_COLS.length > 2
                  ? h(
                      'div',
                      {
                        style: {
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          flexWrap: 'wrap' as const,
                          fontSize: '12.5px',
                          color: 'var(--cg-text-muted)',
                        },
                      },
                      ...ITEM_COLS.slice(1, ITEM_COLS.length - 1).map((c) =>
                        h(
                          'span',
                          { key: c.key, style: { display: 'inline-flex', minWidth: 0 } },
                          renderCell(row, c)
                        )
                      )
                    )
                  : null
              ),
              ITEM_COLS.length > 1
                ? h(
                    'div',
                    { style: { flexShrink: 0, display: 'flex', alignItems: 'center' } },
                    renderCell(row, ITEM_COLS[ITEM_COLS.length - 1])
                  )
                : null
            ),
          onClearFilters: () => {
            clearFilters();
          },
          emptyState: {
            title: 'Ningún contrato vence en los próximos 60 días',
            description: 'Acá vas a ver los que se acerquen al final del plazo.',
            filteredTitle: 'Sin resultados',
            filteredDescription: 'Probá con otros términos o ajustá los filtros.',
          },
        })
      );
    return renderTable;
  })();
  // ── tabla 2: render propio sobre su estado t2 ──
  const renderTable2 = (() => {
    const {
      loading,
      visibleRows,
      sort,
      onSortChange,
      cellValue,
      search,
      setSearch,
      clearFilters,
      page,
      setPage,
      pagedRows,
      SUB_COL,
      ITEM_COLS,
    } = t2;
    const cellText = (row: any, c: any) => {
      const v = cellValue(row, c);
      return v === null || v === undefined
        ? ''
        : typeof v === 'object'
          ? JSON.stringify(v)
          : String(v);
    };
    const TONE_VARIANT: Record<string, string> = {
      neutral: 'neutral-soft',
      success: 'success-soft',
      warning: 'warning-soft',
      danger: 'danger-soft',
      outline: 'outline',
    };
    const enumVal = (c: any, raw: string) => (c.values ?? []).find((e: any) => e.value === raw);
    const formatMoney = (raw: string) => {
      const n = Number(raw);
      return isNaN(n) ? raw : '$' + n.toLocaleString('es-AR');
    };
    const renderCell = (row: any, c: any) => {
      const raw = cellText(row, c);
      const ev = enumVal(c, raw);
      const label = c.format === 'money' ? formatMoney(raw) : (ev?.label ?? raw);
      const shown = raw !== '' ? (c.prefix ?? '') + label + (c.suffix ?? '') : label;
      if (c.display === 'avatar') {
        const initial = (String(raw).trim().charAt(0) || '?').toUpperCase();
        return h(
          'span',
          { style: { display: 'inline-flex', alignItems: 'center', gap: '8px', minWidth: 0 } },
          h(
            'span',
            {
              style: {
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                flexShrink: 0,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--cg-gold-soft)',
                border: '1px solid var(--cg-gold-lt)',
                color: 'var(--cg-gold-deep)',
                fontWeight: 700,
                fontSize: '11px',
              },
            },
            initial
          ),
          h('span', null, shown)
        );
      }
      const iconName = ev?.icon;
      const icon = iconName ? h(UI.DynamicIcon, { icon: iconName, size: 16 }) : null;
      if (c.display === 'pill') {
        return label
          ? h(
              UI.Badge,
              {
                variant: TONE_VARIANT[ev?.tone ?? c.tone ?? 'neutral'] ?? 'neutral-soft',
                size: 'compact',
                icon,
              },
              label
            )
          : '';
      }
      if (c.display === 'progress') {
        const n = Math.max(0, Math.min(100, Number(cellValue(row, c)) || 0));
        return h(
          'div',
          { style: { display: 'flex', alignItems: 'center', gap: '8px', minWidth: '90px' } },
          h(
            'div',
            {
              style: {
                flex: '1 1 0',
                height: '6px',
                borderRadius: '999px',
                background: 'var(--cg-bg-secondary)',
                overflow: 'hidden',
              },
            },
            h('div', {
              style: {
                width: n + '%',
                height: '100%',
                borderRadius: '999px',
                background: 'var(--cg-gold)',
              },
            })
          ),
          h(
            'span',
            { style: { fontSize: '12px', color: 'var(--cg-text-muted)' } },
            Math.round(n) + '%'
          )
        );
      }
      if (c.display === 'mono')
        return h(
          'span',
          { style: { fontFamily: 'ui-monospace, monospace', fontSize: '12px' } },
          shown
        );
      return icon
        ? h(
            'span',
            { style: { display: 'inline-flex', alignItems: 'center', gap: '6px' } },
            icon,
            shown
          )
        : shown;
    };
    // eslint-disable-next-line sonarjs/prefer-immediate-return
    const renderTable = () =>
      h(
        'div',
        {
          style: {
            background: 'var(--cg-bg)',
            border: '1px solid var(--cg-border)',
            borderRadius: '14px',
            padding: '20px',
          },
        },
        h(UI.DataTable, {
          data: pagedRows,
          rowKey: (row: any) => String(row.id ?? JSON.stringify(row)),
          loading,
          columns: ITEM_COLS.map((c, ci) => ({
            key: c.key,
            header: c.label,
            sortable: true,
            render: (row: any) =>
              ci === 0 && SUB_COL
                ? h(
                    'div',
                    { style: { display: 'flex', flexDirection: 'column' as const, gap: '2px' } },
                    h('div', null, renderCell(row, c)),
                    h(
                      'div',
                      { style: { fontSize: '12px', color: 'var(--cg-text-muted)' } },
                      renderCell(row, SUB_COL)
                    )
                  )
                : renderCell(row, c),
          })),
          searchPlaceholder: 'Buscar…',
          searchValue: search,
          onSearchChange: setSearch,
          sortKey: sort?.k ?? null,
          sortDirection: sort ? (sort.d > 0 ? 'asc' : 'desc') : null,
          onSortChange,
          pagination: { page, pageSize: 10, total: visibleRows.length },
          onPageChange: setPage,
          view: 'list' as const,
          renderItem: (row: any) =>
            h(
              'div',
              { style: { display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 } },
              h(
                'div',
                {
                  style: {
                    minWidth: 0,
                    flex: '1 1 auto',
                    display: 'flex',
                    flexDirection: 'column' as const,
                    gap: '2px',
                  },
                },
                h(
                  'div',
                  null,
                  h(
                    'div',
                    { style: { fontSize: '14px', fontWeight: 600, color: 'var(--cg-text)' } },
                    renderCell(row, ITEM_COLS[0])
                  ),
                  SUB_COL
                    ? h(
                        'div',
                        {
                          style: {
                            fontSize: '12px',
                            color: 'var(--cg-text-muted)',
                            marginTop: '1px',
                          },
                        },
                        renderCell(row, SUB_COL)
                      )
                    : null
                ),
                ITEM_COLS.length > 2
                  ? h(
                      'div',
                      {
                        style: {
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          flexWrap: 'wrap' as const,
                          fontSize: '12.5px',
                          color: 'var(--cg-text-muted)',
                        },
                      },
                      ...ITEM_COLS.slice(1, ITEM_COLS.length - 1).map((c) =>
                        h(
                          'span',
                          { key: c.key, style: { display: 'inline-flex', minWidth: 0 } },
                          renderCell(row, c)
                        )
                      )
                    )
                  : null
              ),
              ITEM_COLS.length > 1
                ? h(
                    'div',
                    { style: { flexShrink: 0, display: 'flex', alignItems: 'center' } },
                    renderCell(row, ITEM_COLS[ITEM_COLS.length - 1])
                  )
                : null
            ),
          onClearFilters: () => {
            clearFilters();
          },
          emptyState: {
            title: 'No hay actualizaciones esperando',
            description:
              'Cuando un contrato cumpla su período, la actualización aparece acá para que la confirmes.',
            filteredTitle: 'Sin resultados',
            filteredDescription: 'Probá con otros términos o ajustá los filtros.',
          },
        })
      );
    return renderTable;
  })();

  return h(
    'div',
    {
      style: {
        minHeight: '100%',
        backgroundColor: 'var(--cg-bg-secondary)',
        padding: isMobile ? '16px' : '24px',
      },
    },
    h(
      'div',
      { style: { width: '100%', display: 'flex', flexDirection: 'column' as const, gap: '18px' } },
      h(
        'div',
        { 'data-cg-block-id': 'ph', style: { display: 'contents' } },
        h(
          'div',
          null,
          h(
            'div',
            {
              style: {
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase' as const,
                color: 'var(--cg-gold-deep)',
                marginBottom: '5px',
              },
            },
            'ALQUILERES'
          ),
          h(UI.PageHeader, { title: 'Panel', subtitle: 'Cómo viene el mes.' })
        )
      ),
      h(
        'div',
        { 'data-cg-block-id': 'row_kpi', style: { display: 'contents' } },
        h(
          'div',
          {
            style: {
              display: 'grid',
              gridTemplateColumns: isMobile
                ? '1fr'
                : 'minmax(0, 0.25fr) minmax(0, 0.25fr) minmax(0, 0.25fr) minmax(0, 0.25fr)',
              gap: '2%',
              alignItems: 'stretch',
            },
          },
          h(
            'div',
            {
              style: {
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column' as const,
                justifyContent: 'flex-start',
                gap: '16px',
              },
            },
            h(
              'div',
              { 'data-cg-block-id': 'k1', style: { display: 'contents' } },
              h(
                'div',
                {
                  style: {
                    display: 'flex',
                    flexDirection: 'column',
                    boxSizing: 'border-box',
                    width: '100%',
                    padding: '16px',
                    borderRadius: '12px',
                    background: 'var(--cg-bg)',
                    border: '1px solid var(--cg-border)',
                    boxShadow: 'var(--cg-shadow-card, 0 1px 2px rgba(0,0,0,.05))',
                  },
                },
                h(
                  'div',
                  { style: { display: 'flex', alignItems: 'center', gap: '10px' } },
                  h(
                    'span',
                    {
                      style: {
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '34px',
                        height: '34px',
                        borderRadius: '8px',
                        color: 'var(--cg-text-muted)',
                        background: 'var(--cg-bg-secondary)',
                        flexShrink: 0,
                      },
                    },
                    h(UI.DynamicIcon, { icon: 'House', size: 17 })
                  ),
                  h(
                    'span',
                    {
                      style: {
                        fontSize: '11px',
                        fontWeight: 600,
                        letterSpacing: '.02em',
                        textTransform: 'uppercase',
                        color: 'var(--cg-text-muted)',
                      },
                    },
                    'Ocupación'
                  )
                ),
                h(
                  'div',
                  {
                    style: {
                      fontSize: '24px',
                      fontWeight: 700,
                      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                      color: 'var(--cg-text)',
                      marginTop: '8px',
                    },
                  },
                  metric('k1', 'value', '80%')
                ),
                h(
                  'div',
                  { style: { fontSize: '12px', color: 'var(--cg-text-muted)', marginTop: '2px' } },
                  metric('k1', 'sub', '8 de 10 unidades ocupadas')
                )
              )
            )
          ),
          h(
            'div',
            {
              style: {
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column' as const,
                justifyContent: 'flex-start',
                gap: '16px',
              },
            },
            h(
              'div',
              { 'data-cg-block-id': 'k2', style: { display: 'contents' } },
              h(
                'div',
                {
                  style: {
                    display: 'flex',
                    flexDirection: 'column',
                    boxSizing: 'border-box',
                    width: '100%',
                    padding: '16px',
                    borderRadius: '12px',
                    background: 'var(--cg-bg)',
                    border: '1px solid var(--cg-border)',
                    boxShadow: 'var(--cg-shadow-card, 0 1px 2px rgba(0,0,0,.05))',
                  },
                },
                h(
                  'div',
                  { style: { display: 'flex', alignItems: 'center', gap: '10px' } },
                  h(
                    'span',
                    {
                      style: {
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '34px',
                        height: '34px',
                        borderRadius: '8px',
                        color: 'var(--cg-text-muted)',
                        background: 'var(--cg-bg-secondary)',
                        flexShrink: 0,
                      },
                    },
                    h(UI.DynamicIcon, { icon: 'ScrollText', size: 17 })
                  ),
                  h(
                    'span',
                    {
                      style: {
                        fontSize: '11px',
                        fontWeight: 600,
                        letterSpacing: '.02em',
                        textTransform: 'uppercase',
                        color: 'var(--cg-text-muted)',
                      },
                    },
                    'Contratos activos'
                  )
                ),
                h(
                  'div',
                  {
                    style: {
                      fontSize: '24px',
                      fontWeight: 700,
                      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                      color: 'var(--cg-text)',
                      marginTop: '8px',
                    },
                  },
                  metric('k2', 'value', '8')
                ),
                h(
                  'div',
                  { style: { fontSize: '12px', color: 'var(--cg-text-muted)', marginTop: '2px' } },
                  metric('k2', 'sub', '1 vence en 47 días')
                )
              )
            )
          ),
          h(
            'div',
            {
              style: {
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column' as const,
                justifyContent: 'flex-start',
                gap: '16px',
              },
            },
            h(
              'div',
              { 'data-cg-block-id': 'k3', style: { display: 'contents' } },
              h(
                'div',
                {
                  style: {
                    display: 'flex',
                    flexDirection: 'column',
                    boxSizing: 'border-box',
                    width: '100%',
                    padding: '16px',
                    borderRadius: '12px',
                    background: 'var(--cg-bg)',
                    border: '1px solid var(--cg-border)',
                    boxShadow: 'var(--cg-shadow-card, 0 1px 2px rgba(0,0,0,.05))',
                  },
                },
                h(
                  'div',
                  { style: { display: 'flex', alignItems: 'center', gap: '10px' } },
                  h(
                    'span',
                    {
                      style: {
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '34px',
                        height: '34px',
                        borderRadius: '8px',
                        color: 'var(--cg-gold-deep)',
                        background: 'var(--cg-gold-soft)',
                        flexShrink: 0,
                      },
                    },
                    h(UI.DynamicIcon, { icon: 'Wallet', size: 17 })
                  ),
                  h(
                    'span',
                    {
                      style: {
                        fontSize: '11px',
                        fontWeight: 600,
                        letterSpacing: '.02em',
                        textTransform: 'uppercase',
                        color: 'var(--cg-text-muted)',
                      },
                    },
                    'Deuda pendiente'
                  )
                ),
                h(
                  'div',
                  {
                    style: {
                      fontSize: '24px',
                      fontWeight: 700,
                      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                      color: 'var(--cg-text)',
                      marginTop: '8px',
                    },
                  },
                  metric('k3', 'value', '$1.285.000')
                ),
                h(
                  'div',
                  { style: { fontSize: '12px', color: 'var(--cg-text-muted)', marginTop: '2px' } },
                  metric('k3', 'sub', '3 cargos sin saldar')
                )
              )
            )
          ),
          h(
            'div',
            {
              style: {
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column' as const,
                justifyContent: 'flex-start',
                gap: '16px',
              },
            },
            h(
              'div',
              { 'data-cg-block-id': 'k4', style: { display: 'contents' } },
              h(
                'div',
                {
                  style: {
                    display: 'flex',
                    flexDirection: 'column',
                    boxSizing: 'border-box',
                    width: '100%',
                    padding: '16px',
                    borderRadius: '12px',
                    background: 'var(--cg-bg)',
                    border: '1px solid var(--cg-border)',
                    boxShadow: 'var(--cg-shadow-card, 0 1px 2px rgba(0,0,0,.05))',
                  },
                },
                h(
                  'div',
                  { style: { display: 'flex', alignItems: 'center', gap: '10px' } },
                  h(
                    'span',
                    {
                      style: {
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '34px',
                        height: '34px',
                        borderRadius: '8px',
                        color: 'var(--cg-danger)',
                        background: 'var(--cg-danger-bg)',
                        flexShrink: 0,
                      },
                    },
                    h(UI.DynamicIcon, { icon: 'TriangleAlert', size: 17 })
                  ),
                  h(
                    'span',
                    {
                      style: {
                        fontSize: '11px',
                        fontWeight: 600,
                        letterSpacing: '.02em',
                        textTransform: 'uppercase',
                        color: 'var(--cg-text-muted)',
                      },
                    },
                    'Vencido'
                  )
                ),
                h(
                  'div',
                  {
                    style: {
                      fontSize: '24px',
                      fontWeight: 700,
                      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                      color: 'var(--cg-text)',
                      marginTop: '8px',
                    },
                  },
                  metric('k4', 'value', '$505.000')
                ),
                h(
                  'div',
                  { style: { fontSize: '12px', color: 'var(--cg-text-muted)', marginTop: '2px' } },
                  metric('k4', 'sub', 'Salta 870 · 1°C, 24 días')
                )
              )
            )
          )
        )
      ),
      h(
        'div',
        { 'data-cg-block-id': 'periodo', style: { display: 'contents' } },
        h(
          'div',
          { style: { display: 'flex', justifyContent: 'flex-start' } },
          h(UI.PeriodPicker, {
            value: periodValue,
            onChange: (period: string) => {
              setPeriodValue(period);
              customHandlers.onPeriodChange?.({
                period,
                reload: () => {
                  void t1.load();
                  void t2.load();
                  reloadMetrics();
                },
              });
            },
          })
        )
      ),
      h(
        'div',
        { 'data-cg-block-id': 'row_charts', style: { display: 'contents' } },
        h(
          'div',
          {
            style: {
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 0.58fr) minmax(0, 0.42fr)',
              gap: '2%',
              alignItems: 'stretch',
            },
          },
          h(
            'div',
            {
              style: {
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column' as const,
                justifyContent: 'flex-start',
                gap: '16px',
              },
            },
            h(
              'div',
              { 'data-cg-block-id': 'sec_anio', style: { display: 'contents' } },
              h(
                'section',
                null,
                h(
                  'div',
                  {
                    style: {
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '12px',
                    },
                  },
                  h('span', {
                    style: {
                      width: '16px',
                      height: '2px',
                      background: 'var(--cg-accent)',
                      borderRadius: '2px',
                    },
                  }),
                  h(UI.DynamicIcon, {
                    icon: 'ChartColumn',
                    size: 15,
                    style: { color: 'var(--cg-text-muted)' },
                  }),
                  h(
                    'span',
                    {
                      style: {
                        fontSize: '11px',
                        fontWeight: 500,
                        letterSpacing: '.08em',
                        textTransform: 'uppercase' as const,
                        color: 'var(--cg-text-muted)',
                      },
                    },
                    'El año: cobrado contra impago'
                  )
                ),
                h(
                  'div',
                  {
                    style: {
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px',
                      alignItems: 'stretch',
                    },
                  },
                  h(
                    'div',
                    { 'data-cg-block-id': 'chart_anio', style: { display: 'contents' } },
                    h(UI.BarChart, {
                      data: [
                        {
                          label: 'Ene',
                          value: 0,
                          parts: [
                            { key: 'paid', value: 1050000, label: 'Cobrado' },
                            { key: 'unpaid', value: 210000, label: 'Impago' },
                          ],
                        },
                        {
                          label: 'Feb',
                          value: 0,
                          parts: [
                            { key: 'paid', value: 1180000, label: 'Cobrado' },
                            { key: 'unpaid', value: 160000, label: 'Impago' },
                          ],
                        },
                        {
                          label: 'Mar',
                          value: 0,
                          parts: [
                            { key: 'paid', value: 1210000, label: 'Cobrado' },
                            { key: 'unpaid', value: 90000, label: 'Impago' },
                          ],
                        },
                        {
                          label: 'Abr',
                          value: 0,
                          parts: [
                            { key: 'paid', value: 1305000, label: 'Cobrado' },
                            { key: 'unpaid', value: 140000, label: 'Impago' },
                          ],
                        },
                        {
                          label: 'May',
                          value: 0,
                          parts: [
                            { key: 'paid', value: 1340000, label: 'Cobrado' },
                            { key: 'unpaid', value: 95000, label: 'Impago' },
                          ],
                        },
                        {
                          label: 'Jun',
                          value: 0,
                          parts: [
                            { key: 'paid', value: 1420000, label: 'Cobrado' },
                            { key: 'unpaid', value: 60000, label: 'Impago' },
                          ],
                        },
                        {
                          label: 'Jul',
                          value: 0,
                          parts: [
                            { key: 'paid', value: 1465000, label: 'Cobrado' },
                            { key: 'unpaid', value: 505000, label: 'Impago' },
                          ],
                        },
                      ],
                      palette: 'teal',
                      orientation: 'horizontal',
                      prefix: '$',
                      stackMode: 'diverge',
                      load: customHandlers.loadChartFor?.['chart_anio']
                        ? () => customHandlers.loadChartFor['chart_anio'](chartCtx())
                        : undefined,
                      reloadKey: periodValue,
                    })
                  )
                )
              )
            )
          ),
          h(
            'div',
            {
              style: {
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column' as const,
                justifyContent: 'flex-start',
                gap: '16px',
              },
            },
            h(
              'div',
              { 'data-cg-block-id': 'sec_mes', style: { display: 'contents' } },
              h(
                'section',
                null,
                h(
                  'div',
                  {
                    style: {
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '12px',
                    },
                  },
                  h('span', {
                    style: {
                      width: '16px',
                      height: '2px',
                      background: 'var(--cg-accent)',
                      borderRadius: '2px',
                    },
                  }),
                  h(UI.DynamicIcon, {
                    icon: 'ChartPie',
                    size: 15,
                    style: { color: 'var(--cg-text-muted)' },
                  }),
                  h(
                    'span',
                    {
                      style: {
                        fontSize: '11px',
                        fontWeight: 500,
                        letterSpacing: '.08em',
                        textTransform: 'uppercase' as const,
                        color: 'var(--cg-text-muted)',
                      },
                    },
                    'Cobranza del mes'
                  )
                ),
                h(
                  'div',
                  {
                    style: {
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px',
                      alignItems: 'stretch',
                    },
                  },
                  h(
                    'div',
                    { 'data-cg-block-id': 'chart_mes', style: { display: 'contents' } },
                    h(UI.DonutChart, {
                      data: [
                        { label: 'Cobrado', value: 1465000, color: 'var(--cg-teal)' },
                        { label: 'Por cobrar', value: 780000, color: 'var(--cg-gold)' },
                        { label: 'Vencido', value: 505000, color: 'var(--cg-danger)' },
                      ],
                      palette: 'mixed',
                      size: 140,
                      centerLabel: 'facturado',
                      load: customHandlers.loadChartFor?.['chart_mes']
                        ? () => customHandlers.loadChartFor['chart_mes'](chartCtx())
                        : undefined,
                      reloadKey: periodValue,
                    })
                  )
                )
              )
            )
          )
        )
      ),
      h(
        'div',
        { 'data-cg-block-id': 'row_cards', style: { display: 'contents' } },
        h(
          'div',
          {
            style: {
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 0.55fr) minmax(0, 0.45fr)',
              gap: '2%',
              alignItems: 'stretch',
            },
          },
          h(
            'div',
            {
              style: {
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column' as const,
                justifyContent: 'flex-start',
                gap: '16px',
              },
            },
            h(
              'div',
              { 'data-cg-block-id': 'c_mes', style: { display: 'contents' } },
              h(
                UI.FormSection,
                { icon: 'CalendarRange', title: 'El mes en curso' },
                h(
                  'div',
                  {
                    style: {
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px',
                      alignItems: 'stretch',
                    },
                  },
                  h(
                    'div',
                    { 'data-cg-block-id': 'kv_mes', style: { display: 'contents' } },
                    h(
                      'div',
                      {
                        style: {
                          display: 'grid',
                          gridTemplateColumns: 'auto 1fr',
                          columnGap: '18px',
                        },
                      },
                      h(
                        React.Fragment,
                        { key: 'Facturado' },
                        h(
                          'div',
                          {
                            style: {
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              fontSize: '12.5px',
                              fontWeight: 400,
                              color: 'var(--cg-text-muted)',
                              padding: '8px 0',
                              borderBottom: '1px solid var(--cg-border-light)',
                            },
                          },
                          h(UI.DynamicIcon, { icon: 'ReceiptText', size: 14 }),
                          h('span', null, 'Facturado')
                        ),
                        h(
                          'div',
                          {
                            style: {
                              fontSize: '13.5px',
                              fontWeight: 500,
                              color: 'var(--cg-text)',
                              padding: '8px 0',
                              textAlign: 'right' as const,
                              borderBottom: '1px solid var(--cg-border-light)',
                            },
                          },
                          metric('kv_mes.Facturado', 'value', '$2.750.000')
                        )
                      ),
                      h(
                        React.Fragment,
                        { key: 'Cobrado' },
                        h(
                          'div',
                          {
                            style: {
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              fontSize: '12.5px',
                              fontWeight: 400,
                              color: 'var(--cg-text-muted)',
                              padding: '8px 0',
                              borderBottom: '1px solid var(--cg-border-light)',
                            },
                          },
                          h(UI.DynamicIcon, { icon: 'CircleCheck', size: 14 }),
                          h('span', null, 'Cobrado')
                        ),
                        h(
                          'div',
                          {
                            style: {
                              fontSize: '13.5px',
                              fontWeight: 500,
                              color: 'var(--cg-success)',
                              padding: '8px 0',
                              textAlign: 'right' as const,
                              borderBottom: '1px solid var(--cg-border-light)',
                            },
                          },
                          metric('kv_mes.Cobrado', 'value', '$1.465.000')
                        )
                      ),
                      h(
                        React.Fragment,
                        { key: 'Por cobrar' },
                        h(
                          'div',
                          {
                            style: {
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              fontSize: '12.5px',
                              fontWeight: 400,
                              color: 'var(--cg-text-muted)',
                              padding: '8px 0',
                              borderBottom: '1px solid var(--cg-border-light)',
                            },
                          },
                          h(UI.DynamicIcon, { icon: 'Clock', size: 14 }),
                          h('span', null, 'Por cobrar')
                        ),
                        h(
                          'div',
                          {
                            style: {
                              fontSize: '13.5px',
                              fontWeight: 500,
                              color: 'var(--cg-text)',
                              padding: '8px 0',
                              textAlign: 'right' as const,
                              borderBottom: '1px solid var(--cg-border-light)',
                            },
                          },
                          metric('kv_mes.Por cobrar', 'value', '$780.000')
                        )
                      ),
                      h(
                        React.Fragment,
                        { key: 'Saldo del mes' },
                        h(
                          'div',
                          {
                            style: {
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              fontSize: '13.5px',
                              fontWeight: 600,
                              color: 'var(--cg-text)',
                              padding: '8px 0',
                              borderTop: '1px solid var(--cg-border)',
                              borderBottom: '1px solid var(--cg-border-light)',
                            },
                          },
                          h(UI.DynamicIcon, { icon: 'Wallet', size: 14 }),
                          h('span', null, 'Saldo del mes')
                        ),
                        h(
                          'div',
                          {
                            style: {
                              fontSize: '18px',
                              fontWeight: 800,
                              color: 'var(--cg-text)',
                              fontFamily: 'var(--cg-font-serif)',
                              padding: '8px 0',
                              textAlign: 'right' as const,
                              borderTop: '1px solid var(--cg-border)',
                              borderBottom: '1px solid var(--cg-border-light)',
                            },
                          },
                          metric('kv_mes.Saldo del mes', 'value', '$1.285.000')
                        )
                      )
                    )
                  )
                )
              )
            )
          ),
          h(
            'div',
            {
              style: {
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column' as const,
                justifyContent: 'flex-start',
                gap: '16px',
              },
            },
            h(
              'div',
              { 'data-cg-block-id': 'c_cartera', style: { display: 'contents' } },
              h(
                UI.FormSection,
                { icon: 'Building2', title: 'Cartera' },
                h(
                  'div',
                  {
                    style: {
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px',
                      alignItems: 'stretch',
                    },
                  },
                  h(
                    'div',
                    { 'data-cg-block-id': 'kv_cartera', style: { display: 'contents' } },
                    h(
                      'div',
                      {
                        style: {
                          display: 'grid',
                          gridTemplateColumns: 'auto 1fr',
                          columnGap: '18px',
                        },
                      },
                      h(
                        React.Fragment,
                        { key: 'Propiedades' },
                        h(
                          'div',
                          {
                            style: {
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              fontSize: '12.5px',
                              fontWeight: 400,
                              color: 'var(--cg-text-muted)',
                              padding: '8px 0',
                              borderBottom: '1px solid var(--cg-border-light)',
                            },
                          },
                          h(UI.DynamicIcon, { icon: 'Building2', size: 14 }),
                          h('span', null, 'Propiedades')
                        ),
                        h(
                          'div',
                          {
                            style: {
                              fontSize: '13.5px',
                              fontWeight: 500,
                              color: 'var(--cg-text)',
                              padding: '8px 0',
                              textAlign: 'right' as const,
                              borderBottom: '1px solid var(--cg-border-light)',
                            },
                          },
                          metric('kv_cartera.Propiedades', 'value', '4')
                        )
                      ),
                      h(
                        React.Fragment,
                        { key: 'Unidades' },
                        h(
                          'div',
                          {
                            style: {
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              fontSize: '12.5px',
                              fontWeight: 400,
                              color: 'var(--cg-text-muted)',
                              padding: '8px 0',
                              borderBottom: '1px solid var(--cg-border-light)',
                            },
                          },
                          h(UI.DynamicIcon, { icon: 'Grid3x3', size: 14 }),
                          h('span', null, 'Unidades')
                        ),
                        h(
                          'div',
                          {
                            style: {
                              fontSize: '13.5px',
                              fontWeight: 500,
                              color: 'var(--cg-text)',
                              padding: '8px 0',
                              textAlign: 'right' as const,
                              borderBottom: '1px solid var(--cg-border-light)',
                            },
                          },
                          metric('kv_cartera.Unidades', 'value', '10')
                        )
                      ),
                      h(
                        React.Fragment,
                        { key: 'Ocupadas' },
                        h(
                          'div',
                          {
                            style: {
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              fontSize: '12.5px',
                              fontWeight: 400,
                              color: 'var(--cg-text-muted)',
                              padding: '8px 0',
                              borderBottom: '1px solid var(--cg-border-light)',
                            },
                          },
                          h(UI.DynamicIcon, { icon: 'UserCheck', size: 14 }),
                          h('span', null, 'Ocupadas')
                        ),
                        h(
                          'div',
                          {
                            style: {
                              fontSize: '13.5px',
                              fontWeight: 500,
                              color: 'var(--cg-success)',
                              padding: '8px 0',
                              textAlign: 'right' as const,
                              borderBottom: '1px solid var(--cg-border-light)',
                            },
                          },
                          metric('kv_cartera.Ocupadas', 'value', '8')
                        )
                      ),
                      h(
                        React.Fragment,
                        { key: 'Vacantes' },
                        h(
                          'div',
                          {
                            style: {
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              fontSize: '12.5px',
                              fontWeight: 400,
                              color: 'var(--cg-text-muted)',
                              padding: '8px 0',
                              borderBottom: '1px solid var(--cg-border-light)',
                            },
                          },
                          h(UI.DynamicIcon, { icon: 'DoorOpen', size: 14 }),
                          h('span', null, 'Vacantes')
                        ),
                        h(
                          'div',
                          {
                            style: {
                              fontSize: '13.5px',
                              fontWeight: 500,
                              color: 'var(--cg-text)',
                              padding: '8px 0',
                              textAlign: 'right' as const,
                              borderBottom: '1px solid var(--cg-border-light)',
                            },
                          },
                          metric('kv_cartera.Vacantes', 'value', '2')
                        )
                      )
                    )
                  )
                )
              )
            )
          )
        )
      ),
      h(
        'div',
        { 'data-cg-block-id': 'row_listas', style: { display: 'contents' } },
        h(
          'div',
          {
            style: {
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 0.5fr) minmax(0, 0.5fr)',
              gap: '2%',
              alignItems: 'stretch',
            },
          },
          h(
            'div',
            {
              style: {
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column' as const,
                justifyContent: 'flex-start',
                gap: '16px',
              },
            },
            h(
              'div',
              { 'data-cg-block-id': 'sec_venc', style: { display: 'contents' } },
              h(
                'section',
                null,
                h(
                  'div',
                  {
                    style: {
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '12px',
                    },
                  },
                  h('span', {
                    style: {
                      width: '16px',
                      height: '2px',
                      background: 'var(--cg-accent)',
                      borderRadius: '2px',
                    },
                  }),
                  h(UI.DynamicIcon, {
                    icon: 'CalendarClock',
                    size: 15,
                    style: { color: 'var(--cg-text-muted)' },
                  }),
                  h(
                    'span',
                    {
                      style: {
                        fontSize: '11px',
                        fontWeight: 500,
                        letterSpacing: '.08em',
                        textTransform: 'uppercase' as const,
                        color: 'var(--cg-text-muted)',
                      },
                    },
                    'Contratos por vencer'
                  )
                ),
                h(
                  'div',
                  {
                    style: {
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px',
                      alignItems: 'stretch',
                    },
                  },
                  h(
                    'div',
                    { 'data-cg-block-id': 'tbl_venc', style: { display: 'contents' } },
                    renderTable1()
                  )
                )
              )
            )
          ),
          h(
            'div',
            {
              style: {
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column' as const,
                justifyContent: 'flex-start',
                gap: '16px',
              },
            },
            h(
              'div',
              { 'data-cg-block-id': 'sec_aj', style: { display: 'contents' } },
              h(
                'section',
                null,
                h(
                  'div',
                  {
                    style: {
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '12px',
                    },
                  },
                  h('span', {
                    style: {
                      width: '16px',
                      height: '2px',
                      background: 'var(--cg-accent)',
                      borderRadius: '2px',
                    },
                  }),
                  h(UI.DynamicIcon, {
                    icon: 'TrendingUp',
                    size: 15,
                    style: { color: 'var(--cg-text-muted)' },
                  }),
                  h(
                    'span',
                    {
                      style: {
                        fontSize: '11px',
                        fontWeight: 500,
                        letterSpacing: '.08em',
                        textTransform: 'uppercase' as const,
                        color: 'var(--cg-text-muted)',
                      },
                    },
                    'Actualizaciones pendientes'
                  )
                ),
                h(
                  'div',
                  {
                    style: {
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px',
                      alignItems: 'stretch',
                    },
                  },
                  h(
                    'div',
                    { 'data-cg-block-id': 'tbl_aj', style: { display: 'contents' } },
                    renderTable2()
                  )
                )
              )
            )
          )
        )
      )
    )
  );
}
