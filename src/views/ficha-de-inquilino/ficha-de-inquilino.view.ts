/**
 * Ficha de inquilino — composición y render (generado por el Builder de Vistas).
 *
 * ⚠️ ARCHIVO REGENERABLE: se reescribe al guardar el diseño en el Builder.
 * La lógica custom va en `handlers.ts` (nunca se pisa). Diseño: `spec.json`.
 */
import { getHostReact, getHostUI, useIsMobile, views } from '@coongro/plugin-sdk';

import { useFichaDeInquilinoView } from './use-ficha-de-inquilino.js';

const React = getHostReact();
const h = React.createElement;
// Componentes del HOST: el diseño vive en core — una actualización de
// ui-components se refleja acá sin regenerar esta vista.
const UI = getHostUI() as any;

export function FichaDeInquilinoView() {
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
  const { t1, t2, metric } = useFichaDeInquilinoView();

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
            views.open('leases.ficha-de-contrato.open', { record: row });
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
            title: 'Todavía no firmó ningún contrato',
            description: 'Cuando alquile una unidad, el contrato aparece acá.',
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
          pagination: { page, pageSize: 20, total: visibleRows.length },
          onPageChange: setPage,
          onRowClick: (row: any) => {
            views.open('leases.inquilino.open', { record: row }, { mode: 'dialog' });
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
            title: 'Sin cargos todavía',
            description: 'Los cargos aparecen a medida que se generan los meses.',
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
            h(UI.Avatar, { name: metric('hdr', 'avatar', 'Ana María Ruiz'), size: 'lg' }),
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
                  metric('hdr', 'name', 'Ana María Ruiz')
                ),
                h(
                  UI.Badge,
                  { variant: badgeVariant(metric('hdr', 'badgeTone', ''), 'success-soft') },
                  metric('hdr', 'badge', 'Con contrato vigente')
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
                metric('hdr', 'sub', 'DNI 28.345.129 · Belgrano 1240 · 1°B')
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
                    'leases.inquilino.open',
                    { record: (views.params as any)?.record ?? null },
                    { mode: 'dialog' }
                  );
                },
              },
              'Editar datos'
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
                  metric('k1', 'value', '$586.612')
                ),
                h(
                  'div',
                  { style: { fontSize: '12px', color: 'var(--cg-text-muted)', marginTop: '2px' } },
                  metric('k1', 'sub', 'Belgrano 1240 · 1°B')
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
                    'Saldo'
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
                  metric('k2', 'value', '$658.612')
                ),
                h(
                  'div',
                  { style: { fontSize: '12px', color: 'var(--cg-text-muted)', marginTop: '2px' } },
                  metric('k2', 'sub', '1 cargo sin saldar')
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
                    'Antigüedad'
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
                  metric('k3', 'value', '11 meses')
                ),
                h(
                  'div',
                  { style: { fontSize: '12px', color: 'var(--cg-text-muted)', marginTop: '2px' } },
                  metric('k3', 'sub', 'desde el 01/08/2025')
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
              { 'data-cg-block-id': 'sec_contratos', style: { display: 'contents' } },
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
                    icon: 'ScrollText',
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
                    'Contratos'
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
                    { 'data-cg-block-id': 'tbl_contratos', style: { display: 'contents' } },
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
                    'Cuenta corriente'
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
              { 'data-cg-block-id': 'c_datos', style: { display: 'contents' } },
              h(
                UI.FormSection,
                { icon: 'IdCard', title: 'Datos de contacto' },
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
                    { 'data-cg-block-id': 'kv_datos', style: { display: 'contents' } },
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
                        { key: 'Documento' },
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
                          h(UI.DynamicIcon, { icon: 'IdCard', size: 14 }),
                          h('span', null, 'Documento')
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
                          metric('kv_datos.Documento', 'value', 'DNI 28.345.129')
                        )
                      ),
                      h(
                        React.Fragment,
                        { key: 'Teléfono' },
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
                          h(UI.DynamicIcon, { icon: 'Phone', size: 14 }),
                          h('span', null, 'Teléfono')
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
                          metric('kv_datos.Teléfono', 'value', '11 5555-1234')
                        )
                      ),
                      h(
                        React.Fragment,
                        { key: 'Email' },
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
                          h(UI.DynamicIcon, { icon: 'Mail', size: 14 }),
                          h('span', null, 'Email')
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
                          metric('kv_datos.Email', 'value', 'ana.ruiz@mail.com')
                        )
                      ),
                      h(
                        React.Fragment,
                        { key: 'Domicilio' },
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
                          h(UI.DynamicIcon, { icon: 'MapPin', size: 14 }),
                          h('span', null, 'Domicilio')
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
                          metric('kv_datos.Domicilio', 'value', 'Belgrano 1240, 1°B')
                        )
                      )
                    )
                  )
                )
              )
            ),
            h(
              'div',
              { 'data-cg-block-id': 'c_hist', style: { display: 'contents' } },
              h(
                UI.FormSection,
                { icon: 'History', title: 'Historial' },
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
                    { 'data-cg-block-id': 'kv_hist', style: { display: 'contents' } },
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
                        { key: 'Contratos firmados' },
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
                          h(UI.DynamicIcon, { icon: 'ScrollText', size: 14 }),
                          h('span', null, 'Contratos firmados')
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
                          metric('kv_hist.Contratos firmados', 'value', '1')
                        )
                      ),
                      h(
                        React.Fragment,
                        { key: 'Primer contrato' },
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
                          h(UI.DynamicIcon, { icon: 'CalendarPlus', size: 14 }),
                          h('span', null, 'Primer contrato')
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
                          metric('kv_hist.Primer contrato', 'value', '01/08/2025')
                        )
                      ),
                      h(
                        React.Fragment,
                        { key: 'Cargos emitidos' },
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
                          h('span', null, 'Cargos emitidos')
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
                          metric('kv_hist.Cargos emitidos', 'value', '2')
                        )
                      ),
                      h(
                        React.Fragment,
                        { key: 'Total cobrado' },
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
                          h(UI.DynamicIcon, { icon: 'CircleCheck', size: 14 }),
                          h('span', null, 'Total cobrado')
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
                          metric('kv_hist.Total cobrado', 'value', '$0')
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
