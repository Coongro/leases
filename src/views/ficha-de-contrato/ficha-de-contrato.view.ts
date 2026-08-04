/**
 * Ficha de contrato — composición y render (generado por el Builder de Vistas).
 *
 * ⚠️ ARCHIVO REGENERABLE: se reescribe al guardar el diseño en el Builder.
 * La lógica custom va en `handlers.ts` (nunca se pisa). Diseño: `spec.json`.
 */
import { getHostReact, getHostUI, useIsMobile, views } from '@coongro/plugin-sdk';

import { useFichaDeContratoView } from './use-ficha-de-contrato.js';

const React = getHostReact();
const h = React.createElement;
// Componentes del HOST: el diseño vive en core — una actualización de
// ui-components se refleja acá sin regenerar esta vista.
const UI = getHostUI() as any;

export function FichaDeContratoView() {
  const isMobile = useIsMobile();
  // Tono del badge: el que devuelven los datos, y si no el del diseño.
  // ⚠️ MISMO mapa que el TONE_VARIANT de las tablas: el mismo estado tiene
  // que pintarse igual en la lista y en la ficha (neutral era 'secondary'
  // acá y 'neutral-soft' en la tabla — el mismo contrato, dos grises).
  const badgeVariant = (tone: string, fallback: string): string =>
    ({
      neutral: 'neutral-soft',
      success: 'success-soft',
      warning: 'warning-soft',
      danger: 'danger-soft',
      outline: 'outline',
    })[tone] ?? fallback;
  const { t1, t2, t3, metric } = useFichaDeContratoView();

  // ── tabla 1: render propio sobre su estado t1 ──
  const renderTable1 = (() => {
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
    const formatMoney = (raw: string) => {
      const n = Number(raw);
      return isNaN(n) ? raw : '$' + n.toLocaleString('es-AR');
    };
    const renderCell = (row: any, c: any) => {
      const raw = cellText(row, c);
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
          pagination: { page, pageSize: 10, total: visibleRows.length },
          onPageChange: setPage,
          onRowClick: (row: any) => {
            views.open('leases.renovar-contrato.open', { record: row }, { mode: 'sheet' });
          },
          density: 'compact' as const,
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
            title: 'Sin actualizaciones todavía',
            description: 'La primera aparece cuando el contrato cumpla su período.',
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
          pagination: { page, pageSize: 10, total: visibleRows.length },
          onPageChange: setPage,
          onRowClick: (row: any) => {
            views.open('leases.renovar-contrato.open', { record: row }, { mode: 'sheet' });
          },
          density: 'compact' as const,
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
            title: 'Sin cargos generados',
            description: 'Generá el mes desde Cobranzas.',
            filteredTitle: 'Sin resultados',
            filteredDescription: 'Probá con otros términos o ajustá los filtros.',
          },
        })
      );
    return renderTable;
  })();
  // ── tabla 3: render propio sobre su estado t3 ──
  const renderTable3 = (() => {
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
    } = t3;
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
          onRowClick: (row: any) => {
            views.open('leases.concepto-del-contrato.open', { record: row }, { mode: 'dialog' });
          },
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
            title: 'Solo se factura el alquiler',
            description: 'Agregá ABL, agua o una bonificación para que salgan en el cargo del mes.',
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
        { 'data-cg-block-id': 'hdr', style: { display: 'contents' } },
        h(
          'header',
          {
            style: {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              marginBottom: '8px',
              flexWrap: 'wrap' as const,
            },
          },
          h(
            'div',
            { style: { display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 } },
            h(
              'button',
              {
                type: 'button',
                onClick: () => {
                  views.back();
                },
                title: 'Volver',
                style: {
                  width: '34px',
                  height: '34px',
                  borderRadius: '9px',
                  border: '1px solid var(--cg-border)',
                  background: 'var(--cg-surface)',
                  cursor: 'pointer',
                  color: 'var(--cg-text-secondary)',
                },
              },
              '←'
            ),
            h(UI.Avatar, { name: metric('hdr', 'avatar', 'Contrato'), size: 'lg' }),
            h(
              'div',
              { style: { minWidth: 0 } },
              h(
                'div',
                {
                  style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: '9px',
                    flexWrap: 'wrap' as const,
                  },
                },
                h(
                  'h1',
                  {
                    style: {
                      fontSize: '24px',
                      fontWeight: 700,
                      color: 'var(--cg-text)',
                      margin: 0,
                    },
                  },
                  metric('hdr', 'name', 'Belgrano 1240 · 3°B')
                ),
                h(
                  UI.Badge,
                  { variant: badgeVariant(metric('hdr', 'badgeTone', ''), 'success-soft') },
                  metric('hdr', 'badge', 'Vigente')
                )
              ),
              h(
                'p',
                {
                  style: {
                    fontSize: '13.5px',
                    color: 'var(--cg-text-secondary)',
                    margin: '2px 0 0',
                  },
                },
                metric('hdr', 'sub', 'Martina Ruiz · del 01/09/2025 al 31/08/2028')
              )
            )
          ),
          h(
            'div',
            { style: { display: 'flex', gap: '9px', flexShrink: 0 } },
            h(
              UI.Button,
              {
                variant: 'secondary',
                onClick: () => {
                  views.open(
                    'leases.renovar-contrato.open',
                    { record: (views.params as any)?.record ?? null },
                    { mode: 'sheet' }
                  );
                },
              },
              'Renovar'
            ),
            h(
              UI.Button,
              {
                variant: 'secondary',
                onClick: () => {
                  views.open(
                    'leases.rescindir-contrato.open',
                    { record: (views.params as any)?.record ?? null },
                    { mode: 'sheet' }
                  );
                },
              },
              'Rescindir'
            )
          )
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
                    'Alquiler vigente'
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
                  metric('k1', 'value', '$485.000')
                ),
                h(
                  'div',
                  { style: { fontSize: '12px', color: 'var(--cg-text-muted)', marginTop: '2px' } },
                  metric('k1', 'sub', 'Desde la última actualización')
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
                        color: 'var(--cg-gold-deep)',
                        background: 'var(--cg-gold-soft)',
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
                    'Próxima actualización'
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
                  metric('k2', 'value', '01/09/2026')
                ),
                h(
                  'div',
                  { style: { fontSize: '12px', color: 'var(--cg-text-muted)', marginTop: '2px' } },
                  metric('k2', 'sub', 'ICL, cada 6 meses')
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
                        color: 'var(--cg-green)',
                        background: 'var(--cg-green-bg)',
                        flexShrink: 0,
                      },
                    },
                    h(UI.DynamicIcon, { icon: 'CircleCheck', size: 17 })
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
                    'Saldo del inquilino'
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
                  metric('k3', 'sub', 'Al día')
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
                        color: 'var(--cg-text-muted)',
                        background: 'var(--cg-bg-secondary)',
                        flexShrink: 0,
                      },
                    },
                    h(UI.DynamicIcon, { icon: 'CalendarClock', size: 17 })
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
                    'Termina en'
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
                  metric('k4', 'value', '2 años')
                ),
                h(
                  'div',
                  { style: { fontSize: '12px', color: 'var(--cg-text-muted)', marginTop: '2px' } },
                  metric('k4', 'sub', '31/08/2028')
                )
              )
            )
          )
        )
      ),
      h(
        'div',
        { 'data-cg-block-id': 'row_main', style: { display: 'contents' } },
        h(
          'div',
          {
            style: {
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 0.62fr) minmax(0, 0.38fr)',
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
              { 'data-cg-block-id': 'sec_ajustes', style: { display: 'contents' } },
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
                    'Historial de actualizaciones'
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
                    { 'data-cg-block-id': 'tbl_ajustes', style: { display: 'contents' } },
                    renderTable1()
                  )
                )
              )
            ),
            h(
              'div',
              { 'data-cg-block-id': 'sec_cargos', style: { display: 'contents' } },
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
                    icon: 'ReceiptText',
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
                    'Cargos del contrato'
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
                    { 'data-cg-block-id': 'tbl_cargos', style: { display: 'contents' } },
                    renderTable2()
                  )
                )
              )
            ),
            h(
              'div',
              { 'data-cg-block-id': 'sec_conceptos', style: { display: 'contents' } },
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
                    icon: 'ReceiptText',
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
                    'Conceptos que se facturan'
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
                    { 'data-cg-block-id': 'btn_concepto', style: { display: 'contents' } },
                    h(
                      'div',
                      { style: { display: 'flex', justifyContent: 'flex-end' } },
                      h(
                        UI.Button,
                        {
                          variant: 'secondary',
                          onClick: () => {
                            views.open('leases.concepto-del-contrato.open', undefined, {
                              mode: 'dialog',
                            });
                          },
                        },
                        'Agregar concepto'
                      )
                    )
                  ),
                  h(
                    'div',
                    { 'data-cg-block-id': 'tbl_conceptos', style: { display: 'contents' } },
                    renderTable3()
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
              { 'data-cg-block-id': 'c_cond', style: { display: 'contents' } },
              h(
                UI.FormSection,
                { icon: 'ScrollText', title: 'Condiciones' },
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
                    { 'data-cg-block-id': 'kv_cond', style: { display: 'contents' } },
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
                        { key: 'Moneda' },
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
                          h('span', null, 'Moneda')
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
                          metric('kv_cond.Moneda', 'value', 'Pesos (ARS)')
                        )
                      ),
                      h(
                        React.Fragment,
                        { key: 'Alquiler inicial' },
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
                          h('span', null, 'Alquiler inicial')
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
                          metric('kv_cond.Alquiler inicial', 'value', '$333.000')
                        )
                      ),
                      h(
                        React.Fragment,
                        { key: 'Expensas' },
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
                          h('span', null, 'Expensas')
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
                          metric('kv_cond.Expensas', 'value', '$65.000')
                        )
                      ),
                      h(
                        React.Fragment,
                        { key: 'Vence el' },
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
                          h('span', null, 'Vence el')
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
                          metric('kv_cond.Vence el', 'value', '5 de cada mes')
                        )
                      ),
                      h(
                        React.Fragment,
                        { key: 'Punitorio' },
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
                          h('span', null, 'Punitorio')
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
                          metric('kv_cond.Punitorio', 'value', '0,5% diario')
                        )
                      ),
                      h(
                        React.Fragment,
                        { key: 'Multa rescisión' },
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
                          h('span', null, 'Multa rescisión')
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
                          metric('kv_cond.Multa rescisión', 'value', '1,5 meses')
                        )
                      )
                    )
                  )
                )
              )
            ),
            h(
              'div',
              { 'data-cg-block-id': 'c_gar', style: { display: 'contents' } },
              h(
                UI.FormSection,
                { icon: 'ShieldCheck', title: 'Garantía y depósito' },
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
                    { 'data-cg-block-id': 'kv_gar', style: { display: 'contents' } },
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
                        { key: 'Tipo' },
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
                          h('span', null, 'Tipo')
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
                          metric('kv_gar.Tipo', 'value', 'Garante propietario')
                        )
                      ),
                      h(
                        React.Fragment,
                        { key: 'Garante' },
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
                          h('span', null, 'Garante')
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
                          metric('kv_gar.Garante', 'value', 'Ana María Ruiz')
                        )
                      ),
                      h(
                        React.Fragment,
                        { key: 'Depósito' },
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
                          h('span', null, 'Depósito')
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
                          metric('kv_gar.Depósito', 'value', '$420.000')
                        )
                      ),
                      h(
                        React.Fragment,
                        { key: 'Estado' },
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
                          h('span', null, 'Estado')
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
                          metric('kv_gar.Estado', 'value', 'Recibido')
                        )
                      )
                    )
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
