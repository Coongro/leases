/**
 * Resultado — composición y render (generado por el Builder de Vistas).
 *
 * ⚠️ ARCHIVO REGENERABLE: se reescribe al guardar el diseño en el Builder.
 * La lógica custom va en `handlers.ts` (nunca se pisa). Diseño: `spec.json`.
 */
import { getHostReact, getHostUI, useIsMobile } from '@coongro/plugin-sdk';

import { useResultadoView } from './use-resultado.js';

const React = getHostReact();
const h = React.createElement;
// Componentes del HOST: el diseño vive en core — una actualización de
// ui-components se refleja acá sin regenerar esta vista.
const UI = getHostUI() as any;

export function ResultadoView() {
  const isMobile = useIsMobile();
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
    page,
    setPage,
    pagedRows,
    HIDDEN_COLUMNS,
    metric,
  } = useResultadoView();

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
        columns: COLUMNS.map((c) => ({
          key: c.key,
          header: c.label,
          sortable: true,
          render: (row: any) => renderCell(row, c),
        })),
        searchPlaceholder: 'Buscar…',
        searchValue: search,
        onSearchChange: setSearch,
        sortKey: sort?.k ?? null,
        sortDirection: sort ? (sort.d > 0 ? 'asc' : 'desc') : null,
        onSortChange,
        pagination: { page, pageSize: 20, total: visibleRows.length },
        onPageChange: setPage,
        density: 'compact' as const,
        itemLabel: (row: any) => cellText(row, COLUMNS[0]),
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
              { style: { fontSize: '14px', fontWeight: 600, color: 'var(--cg-text)' } },
              renderCell(row, COLUMNS[0])
            ),
            ...COLUMNS.slice(1).map((c) =>
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
            )
          ),
        onClearFilters: () => {
          clearFilters();
        },
        emptyState: {
          title: 'Todavía no hay resultado que mostrar',
          description: 'Cuando cobres el primer alquiler vas a ver acá qué te deja cada propiedad.',
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
            title: 'Resultado',
            subtitle:
              'Qué te dejó cada propiedad este año. El gasto se compara con el 5% que Ganancias toma como presunto.',
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
                : 'minmax(0, 0.34fr) minmax(0, 0.33fr) minmax(0, 0.33fr)',
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
                        color: 'var(--cg-green)',
                        background: 'var(--cg-green-bg)',
                        flexShrink: 0,
                      },
                    },
                    h(UI.DynamicIcon, { icon: 'Scale', size: 17 })
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
                    'Neto del año'
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
                  metric('k1', 'value', '$426.612')
                ),
                h(
                  'div',
                  { style: { fontSize: '12px', color: 'var(--cg-text-muted)', marginTop: '2px' } },
                  metric('k1', 'sub', '1 propiedad · después de gastos y honorarios')
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
                    'Alquiler cobrado'
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
                  metric('k2', 'value', '$846.612')
                ),
                h(
                  'div',
                  { style: { fontSize: '12px', color: 'var(--cg-text-muted)', marginTop: '2px' } },
                  metric('k2', 'sub', 'sin expensas ni otros conceptos')
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
                    'Gastos a tu cargo'
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
                  metric('k3', 'value', '$420.000')
                ),
                h(
                  'div',
                  { style: { fontSize: '12px', color: 'var(--cg-text-muted)', marginTop: '2px' } },
                  metric('k3', 'sub', '49,6% de lo cobrado')
                )
              )
            )
          )
        )
      ),
      h('div', { 'data-cg-block-id': 'tbl', style: { display: 'contents' } }, renderTable())
    )
  );
}
