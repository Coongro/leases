/**
 * Concepto del contrato — composición y render (generado por el Builder de Vistas).
 *
 * ⚠️ ARCHIVO REGENERABLE: se reescribe al guardar el diseño en el Builder.
 * La lógica custom va en `handlers.ts` (nunca se pisa). Diseño: `spec.json`.
 */
import { getHostReact, getHostUI, usePlugin } from '@coongro/plugin-sdk';

import { useConceptoDelContratoView } from './use-concepto-del-contrato.js';

const React = getHostReact();
const h = React.createElement;
// Componentes del HOST: el diseño vive en core — una actualización de
// ui-components se refleja acá sin regenerar esta vista.
const UI = getHostUI() as any;

export function ConceptoDelContratoView() {
  const {
    views: { closeDialog },
  } = usePlugin();
  const { values, errors, setField, refOptions, refLabel, submit, editingId } =
    useConceptoDelContratoView();

  return h(
    'div',
    { style: { display: 'flex', flexDirection: 'column' as const } },
    h(
      'div',
      {
        style: { padding: '20px', display: 'flex', flexDirection: 'column' as const, gap: '16px' },
      },
      h(
        'div',
        { 'data-cg-block-id': 'sec_que', style: { display: 'contents' } },
        h(
          UI.FormSection,
          { icon: 'ReceiptText', title: 'Qué se factura' },
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
              { 'data-cg-block-id': 'f_lease', style: { display: 'contents' } },
              h(
                'div',
                { style: { flex: '1 1 100%', minWidth: 0 } },
                h(
                  UI.Label,
                  { htmlFor: 'lease_id', style: { display: 'block', marginBottom: '6px' } },
                  'Contrato',
                  h('span', { style: { color: 'var(--cg-danger)' } }, ' *')
                ),
                h(
                  UI.Select,
                  {
                    value: String(values['lease_id'] ?? ''),
                    onValueChange: (v: string) => setField('lease_id', v),
                    placeholder: 'Elegir…',
                    clearable: true,
                  },
                  ...(refOptions['lease_id'] ?? []).map((r: any) =>
                    h(UI.SelectItem, { key: String(r.id), value: String(r.id) }, refLabel(r))
                  )
                ),
                errors['lease_id']
                  ? h(
                      'div',
                      { style: { fontSize: '12px', color: 'var(--cg-danger)', marginTop: '4px' } },
                      errors['lease_id']
                    )
                  : null
              )
            ),
            h(
              'div',
              { style: { display: 'flex', gap: '14px', alignItems: 'flex-start' } },
              h(
                'div',
                { 'data-cg-block-id': 'f_type', style: { display: 'contents' } },
                h(
                  'div',
                  { style: { flex: '1 1 260px', minWidth: 0 } },
                  h(
                    UI.Label,
                    { htmlFor: 'type', style: { display: 'block', marginBottom: '6px' } },
                    'Tipo',
                    h('span', { style: { color: 'var(--cg-danger)' } }, ' *')
                  ),
                  h(
                    UI.Select,
                    {
                      value: String(values['type'] ?? ''),
                      onValueChange: (v: string) => setField('type', v),
                      placeholder: 'Elegir…',
                      clearable: true,
                    },
                    h(
                      UI.SelectItem,
                      {
                        key: 'abl',
                        value: 'abl',
                        icon: h(UI.DynamicIcon, { icon: 'Landmark', size: 16 }),
                      },
                      'ABL / inmobiliario'
                    ),
                    h(
                      UI.SelectItem,
                      {
                        key: 'servicio',
                        value: 'servicio',
                        icon: h(UI.DynamicIcon, { icon: 'Droplets', size: 16 }),
                      },
                      'Servicio'
                    ),
                    h(
                      UI.SelectItem,
                      {
                        key: 'expensas',
                        value: 'expensas',
                        icon: h(UI.DynamicIcon, { icon: 'Building2', size: 16 }),
                      },
                      'Expensas'
                    ),
                    h(
                      UI.SelectItem,
                      {
                        key: 'descuento',
                        value: 'descuento',
                        icon: h(UI.DynamicIcon, { icon: 'TicketPercent', size: 16 }),
                      },
                      'Descuento'
                    ),
                    h(
                      UI.SelectItem,
                      {
                        key: 'otro',
                        value: 'otro',
                        icon: h(UI.DynamicIcon, { icon: 'Receipt', size: 16 }),
                      },
                      'Otro'
                    )
                  ),
                  errors['type']
                    ? h(
                        'div',
                        {
                          style: { fontSize: '12px', color: 'var(--cg-danger)', marginTop: '4px' },
                        },
                        errors['type']
                      )
                    : null
                )
              ),
              h(
                'div',
                { 'data-cg-block-id': 'f_label', style: { display: 'contents' } },
                h(
                  'div',
                  { style: { flex: '1 1 260px', minWidth: 0 } },
                  h(
                    UI.Label,
                    { htmlFor: 'label', style: { display: 'block', marginBottom: '6px' } },
                    'Como aparece en la factura',
                    h('span', { style: { color: 'var(--cg-danger)' } }, ' *')
                  ),
                  h(UI.Input, {
                    id: 'label',
                    type: 'text',
                    value: String(values['label'] ?? ''),
                    placeholder: 'Ej: Aguas Santafesinas',
                    onChange: (e: any) => setField('label', e.target.value),
                  }),
                  errors['label']
                    ? h(
                        'div',
                        {
                          style: { fontSize: '12px', color: 'var(--cg-danger)', marginTop: '4px' },
                        },
                        errors['label']
                      )
                    : null
                )
              )
            ),
            h(
              'div',
              { 'data-cg-block-id': 'f_amount', style: { display: 'contents' } },
              h(
                'div',
                { style: { flex: '1 1 100%', minWidth: 0 } },
                h(
                  UI.Label,
                  { htmlFor: 'amount', style: { display: 'block', marginBottom: '6px' } },
                  'Importe por mes',
                  h('span', { style: { color: 'var(--cg-danger)' } }, ' *')
                ),
                h(
                  'div',
                  { style: { position: 'relative', display: 'flex', alignItems: 'center' } },
                  h(
                    'span',
                    {
                      style: {
                        position: 'absolute',
                        left: '11px',
                        color: 'var(--cg-text-muted)',
                        fontSize: '13px',
                        pointerEvents: 'none',
                      },
                    },
                    '$'
                  ),
                  h(UI.Input, {
                    id: 'amount',
                    type: 'number',
                    inputMode: 'decimal',
                    value: values['amount'] ?? '',
                    placeholder: 'Ej: 18000',
                    onChange: (e: any) =>
                      setField('amount', e.target.value === '' ? null : Number(e.target.value)),
                    style: { paddingLeft: '22px', textAlign: 'right' as const },
                  })
                ),
                errors['amount']
                  ? h(
                      'div',
                      { style: { fontSize: '12px', color: 'var(--cg-danger)', marginTop: '4px' } },
                      errors['amount']
                    )
                  : null
              )
            )
          )
        )
      ),
      h(
        'div',
        { 'data-cg-block-id': 'sec_vig', style: { display: 'contents' } },
        h(
          UI.FormSection,
          { icon: 'CalendarRange', title: 'Desde cuándo y hasta cuándo' },
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
              { style: { display: 'flex', gap: '14px', alignItems: 'flex-start' } },
              h(
                'div',
                { 'data-cg-block-id': 'f_from', style: { display: 'contents' } },
                h(
                  'div',
                  { style: { flex: '1 1 260px', minWidth: 0 } },
                  h(
                    UI.Label,
                    { htmlFor: 'valid_from', style: { display: 'block', marginBottom: '6px' } },
                    'Primer período'
                  ),
                  h(UI.Input, {
                    id: 'valid_from',
                    type: 'text',
                    value: String(values['valid_from'] ?? ''),
                    placeholder: 'Ej: 2026-09 (vacío = desde el inicio)',
                    onChange: (e: any) => setField('valid_from', e.target.value),
                  }),
                  errors['valid_from']
                    ? h(
                        'div',
                        {
                          style: { fontSize: '12px', color: 'var(--cg-danger)', marginTop: '4px' },
                        },
                        errors['valid_from']
                      )
                    : null
                )
              ),
              h(
                'div',
                { 'data-cg-block-id': 'f_to', style: { display: 'contents' } },
                h(
                  'div',
                  { style: { flex: '1 1 260px', minWidth: 0 } },
                  h(
                    UI.Label,
                    { htmlFor: 'valid_to', style: { display: 'block', marginBottom: '6px' } },
                    'Último período'
                  ),
                  h(UI.Input, {
                    id: 'valid_to',
                    type: 'text',
                    value: String(values['valid_to'] ?? ''),
                    placeholder: 'Ej: 2027-03 (vacío = mientras dure)',
                    onChange: (e: any) => setField('valid_to', e.target.value),
                  }),
                  errors['valid_to']
                    ? h(
                        'div',
                        {
                          style: { fontSize: '12px', color: 'var(--cg-danger)', marginTop: '4px' },
                        },
                        errors['valid_to']
                      )
                    : null
                )
              )
            ),
            h(
              'div',
              { 'data-cg-block-id': 'f_notes', style: { display: 'contents' } },
              h(
                'div',
                { style: { flex: '1 1 100%', minWidth: 0 } },
                h(
                  UI.Label,
                  { htmlFor: 'notes', style: { display: 'block', marginBottom: '6px' } },
                  'Observaciones'
                ),
                h(UI.Input, {
                  id: 'notes',
                  type: 'text',
                  value: String(values['notes'] ?? ''),
                  placeholder: 'Ej: lo paga el inquilino directo a la empresa',
                  onChange: (e: any) => setField('notes', e.target.value),
                }),
                errors['notes']
                  ? h(
                      'div',
                      { style: { fontSize: '12px', color: 'var(--cg-danger)', marginTop: '4px' } },
                      errors['notes']
                    )
                  : null
              )
            )
          )
        )
      )
    ),
    h(
      UI.DialogFooter,
      null,
      h(
        UI.Button,
        {
          variant: 'ghost',
          onClick: () => {
            closeDialog();
          },
        },
        'Cancelar'
      ),
      h(
        UI.Button,
        {
          onClick: () => {
            void submit();
          },
        },
        editingId ? 'Actualizar' : 'Guardar'
      )
    )
  );
}
