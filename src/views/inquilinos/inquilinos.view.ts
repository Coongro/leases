/**
 * Inquilinos — composición y render (generado por el Builder de Vistas).
 *
 * ⚠️ ARCHIVO REGENERABLE: se reescribe al guardar el diseño en el Builder.
 * La lógica custom va en `handlers.ts` (nunca se pisa). Diseño: `spec.json`.
 */
import { getHostReact, getHostUI, useIsMobile, views } from '@coongro/plugin-sdk';

import { useInquilinosView } from './use-inquilinos.js';

const React = getHostReact();
const h = React.createElement;
// Componentes del HOST: el diseño vive en core — una actualización de
// ui-components se refleja acá sin regenerar esta vista.
const UI = getHostUI() as any;

export function InquilinosView() {
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
    filters,
    setFilters,
    filterOptions,
    page,
    setPage,
    pagedRows,
    IMAGE_COL,
    SUB_COL,
    ITEM_COLS,
  } = useInquilinosView();

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
    const label = ev?.label ?? raw;
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
      label: 'Editar',
      icon: 'Pencil',
      onClick: (row: any) => {
        views.open('leases.inquilino.open', { record: row }, { mode: 'dialog' });
      },
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
              ...(filterOptions['is_current'] ?? []).map((o) => ({
                value: o,
                label: valueLabel('is_current', o),
              })),
            ],
            value: filters['is_current'] ?? '',
            onChange: (v: string) => setFilters((ff: any) => ({ ...ff, ['is_current']: v })),
          },
        ].filter((s) => s.options.length > 1),
        sortKey: sort?.k ?? null,
        sortDirection: sort ? (sort.d > 0 ? 'asc' : 'desc') : null,
        onSortChange,
        pagination: { page, pageSize: 20, total: visibleRows.length },
        onPageChange: setPage,
        onRowClick: (row: any) => {
          views.open('leases.ficha-de-inquilino.open', { record: row });
        },
        actions: ROW_ACTIONS,
        view: 'list' as const,
        itemImage: (row: any) => cellText(row, IMAGE_COL),
        imageLayout: 'avatar' as const,
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
              : null,
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
          title: 'Todavía no hay inquilinos',
          description: 'Aparecen acá cuando firmás el primer contrato.',
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
            title: 'Inquilinos',
            subtitle: 'Quiénes alquilan hoy y quiénes alquilaron antes.',
            action: h(
              UI.Button,
              {
                variant: 'default',
                onClick: () => {
                  views.open('leases.inquilino.open', undefined, { mode: 'dialog' });
                },
              },
              'Nuevo inquilino'
            ),
          })
        )
      ),
      h('div', { 'data-cg-block-id': 'tbl', style: { display: 'contents' } }, renderTable())
    )
  );
}
