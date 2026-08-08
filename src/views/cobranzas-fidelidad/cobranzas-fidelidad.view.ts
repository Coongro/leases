/**
 * Cobranzas — composición y render (generado por el Builder de Vistas).
 *
 * ⚠️ ARCHIVO REGENERABLE: se reescribe al guardar el diseño en el Builder.
 * La lógica custom va en `handlers.ts` (nunca se pisa). Diseño: `spec.json`.
 */
import { getHostReact, getHostUI, useIsMobile } from '@coongro/plugin-sdk';

import { customHandlers } from './handlers.js';
import { useCobranzasFidelidadView } from './use-cobranzas-fidelidad.js';

const React = getHostReact();
const { useState } = React;
const h = React.createElement;
// Componentes del HOST: el diseño vive en core — una actualización de
// ui-components se refleja acá sin regenerar esta vista.
const UI = getHostUI() as any;

export function CobranzasFidelidadView() {
  const isMobile = useIsMobile();
  // Mes elegido en el selector. Vive acá y no dentro del componente porque
  // recargar los datos re-renderiza la vista: con el estado adentro, el
  // selector volvía al mes actual mientras la tabla mostraba otro.
  const [periodValue, setPeriodValue] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const {
    loading,
    visibleRows,
    COLUMNS,
    sort,
    onSortChange,
    cellValue,
    search,
    setSearch,
    clearFilters,
    filters,
    setFilters,
    filterOptions,
    page,
    setPage,
    pagedRows,
    HIDDEN_COLUMNS,
    SUB_COL,
    ITEM_COLS,
    runServerAction,
    metric,
    reloadMetrics,
    load,
  } = useCobranzasFidelidadView();

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
  const formatMoney = (raw: string) => {
    const n = Number(raw);
    return isNaN(n) ? raw : '$' + n.toLocaleString('es-AR');
  };
  const renderCell = (row: any, c: any) => {
    const raw = cellText(row, c);
    if (raw === '' && c.emptyLabel) {
      return h(
        'span',
        {
          style: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--cg-text-muted)',
          },
        },
        c.emptyIcon ? h(UI.DynamicIcon, { icon: c.emptyIcon, size: 15 }) : null,
        c.emptyLabel
      );
    }
    const ev = enumVal(c, raw);
    const label =
      c.format === 'money'
        ? formatMoney(raw)
        : c.format
          ? formatDate(c.format, raw)
          : (ev?.label ?? raw);
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
  const valueLabel = (key: string, raw: string) =>
    (COLUMNS.find((c) => c.key === key)?.values ?? []).find((v: any) => v.value === raw)?.label ??
    raw;
  const ROW_ACTIONS = [
    {
      label: 'Cobrar punitorio',
      icon: 'AlarmClock',
      onClick: (row: any) => {
        void runServerAction('leases.billing.chargeLateFee', { id: row.id }, row);
      },
      hidden: (row: any) => !['proponer'].includes(String(row?.['late_fee_state'] ?? '')),
    },
  ];
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
        filterSections: [
          {
            label: 'Estado',
            options: [
              { value: '', label: 'Todos' },
              ...(filterOptions['status'] ?? []).map((o) => ({
                value: o,
                label: valueLabel('status', o),
              })),
            ],
            value: filters['status'] ?? '',
            onChange: (v: string) => setFilters((ff: any) => ({ ...ff, ['status']: v })),
          },
        ].filter((s) => s.options.length > 1),
        sortKey: sort?.k ?? null,
        sortDirection: sort ? (sort.d > 0 ? 'asc' : 'desc') : null,
        onSortChange,
        pagination: { page, pageSize: 20, total: visibleRows.length },
        onPageChange: setPage,
        actions: ROW_ACTIONS,
        density: 'compact' as const,
        itemLabel: (row: any) => cellText(row, ITEM_COLS[0]),
        renderExpanded: (row: any) =>
          h(
            'div',
            {
              style: {
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '14px',
              },
            },
            ...HIDDEN_COLUMNS.map((c) =>
              h(
                'div',
                { key: c.key, style: { minWidth: 0 } },
                h(
                  'div',
                  {
                    style: {
                      fontSize: '10.5px',
                      fontWeight: 700,
                      letterSpacing: '.06em',
                      textTransform: 'uppercase' as const,
                      color: 'var(--cg-text-muted)',
                    },
                  },
                  c.label
                ),
                h('div', { style: { fontSize: '13.5px', marginTop: '2px' } }, renderCell(row, c))
              )
            )
          ),
        mobileRender: (row: any) =>
          h(
            'div',
            { style: { display: 'flex', flexDirection: 'column' as const, gap: '6px' } },
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
                      style: { fontSize: '12px', color: 'var(--cg-text-muted)', marginTop: '1px' },
                    },
                    renderCell(row, SUB_COL)
                  )
                : null
            ),
            ...ITEM_COLS.slice(1).map((c) =>
              h(
                'div',
                {
                  key: c.key,
                  style: {
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '13px',
                  },
                },
                h('span', { style: { color: 'var(--cg-text-muted)', flexShrink: 0 } }, c.label),
                h(
                  'span',
                  {
                    style: {
                      textAlign: 'right' as const,
                      minWidth: 0,
                      flex: '1 1 auto',
                      display: 'flex',
                      justifyContent: 'flex-end',
                    },
                  },
                  renderCell(row, c)
                )
              )
            ),
            h(
              'div',
              {
                style: {
                  display: 'flex',
                  gap: '4px',
                  justifyContent: 'flex-end',
                  borderTop: '1px solid var(--cg-border-light)',
                  paddingTop: '8px',
                  marginTop: '2px',
                },
              },
              ...ROW_ACTIONS.filter((a2: any) => !a2.hidden?.(row)).map((a2: any) =>
                h(
                  UI.Button,
                  {
                    key: a2.label,
                    size: 'sm' as const,
                    variant:
                      a2.variant === 'destructive' ? ('destructive' as const) : ('ghost' as const),
                    onClick: (e: any) => {
                      e.stopPropagation();
                      a2.onClick(row);
                    },
                  },
                  a2.label
                )
              )
            )
          ),
        onClearFilters: () => {
          clearFilters();
        },
        emptyState: {
          title: 'Todavía no hay cargos de este mes',
          description: 'Generá los cargos del mes desde el botón de arriba.',
          filteredTitle: 'Sin resultados',
          filteredDescription: 'Probá con otros términos o ajustá los filtros.',
        },
      })
    );

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
          h(UI.PageHeader, {
            title: 'Cobranzas',
            subtitle: 'Los cargos del período y cómo viene la cobranza.',
            action: h(
              UI.Button,
              {
                variant: 'default',
                onClick: () => {
                  if (
                    !window.confirm(
                      'Se generan los cargos de todos los contratos vigentes del período. Si ya estaban generados, no se duplican.'
                    )
                  )
                    return;
                  (() => {
                    void runServerAction('leases.billing.generateForPeriod');
                  })();
                },
              },
              'Generar cargos del mes'
            ),
          })
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
                    h(UI.DynamicIcon, { icon: 'ReceiptText', size: 17 })
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
                    'Facturado'
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
                  metric('k1', 'value', '$0')
                ),
                h(
                  'div',
                  { style: { fontSize: '12px', color: 'var(--cg-text-muted)', marginTop: '2px' } },
                  metric('k1', 'sub', 'sin cargos')
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
                        color: 'var(--cg-green)',
                        background: 'var(--cg-green-bg)',
                        flexShrink: 0,
                      },
                    },
                    h(UI.DynamicIcon, { icon: 'TrendingUp', size: 17 })
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
                    'Cobrado'
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
                  metric('k2', 'value', '$0')
                ),
                h(
                  'div',
                  { style: { fontSize: '12px', color: 'var(--cg-text-muted)', marginTop: '2px' } },
                  metric('k2', 'sub', 'sin cobros')
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
                    h(UI.DynamicIcon, { icon: 'TrendingDown', size: 17 })
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
                    'Por cobrar'
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
                  metric('k3', 'value', '$0')
                ),
                h(
                  'div',
                  { style: { fontSize: '12px', color: 'var(--cg-text-muted)', marginTop: '2px' } },
                  metric('k3', 'sub', 'aún no vencido')
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
                  metric('k4', 'value', '$0')
                ),
                h(
                  'div',
                  { style: { fontSize: '12px', color: 'var(--cg-text-muted)', marginTop: '2px' } },
                  metric('k4', 'sub', 'sin atrasos')
                )
              )
            )
          )
        )
      ),
      h(
        'div',
        { 'data-cg-block-id': 'periodo', style: { display: 'contents' } },
        h(UI.PeriodPicker, {
          value: periodValue,
          onChange: (period: string) => {
            setPeriodValue(period);
            customHandlers.onPeriodChange?.({
              period,
              reload: () => {
                void load();
                reloadMetrics();
              },
            });
          },
        })
      ),
      h('div', { 'data-cg-block-id': 'tbl', style: { display: 'contents' } }, renderTable())
    )
  );
}
