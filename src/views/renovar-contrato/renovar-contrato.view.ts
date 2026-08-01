/**
 * Renovar contrato — composición y render (generado por el Builder de Vistas).
 *
 * ⚠️ ARCHIVO REGENERABLE: se reescribe al guardar el diseño en el Builder.
 * La lógica custom va en `handlers.ts` (nunca se pisa). Diseño: `spec.json`.
 */
import { getHostReact, getHostUI, usePlugin } from '@coongro/plugin-sdk';

import { useRenovarContratoView } from './use-renovar-contrato.js';

const React = getHostReact();
const h = React.createElement;
// Componentes del HOST: el diseño vive en core — una actualización de
// ui-components se refleja acá sin regenerar esta vista.
const UI = getHostUI() as any;

export function RenovarContratoView() {
  const {
    views: { closeDialog },
  } = usePlugin();
  const { values, errors, setField, submit } = useRenovarContratoView();

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
        { 'data-cg-block-id': 'aviso', style: { display: 'contents' } },
        h(
          'div',
          {
            style: {
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '12px 14px',
              borderRadius: '10px',
              background: 'var(--cg-bg-main)',
              border: '1px solid var(--cg-border)',
              color: 'var(--cg-text-secondary)',
            },
          },
          null,
          h(
            'div',
            { style: { minWidth: 0 } },
            h(
              'div',
              { style: { fontWeight: 600, fontSize: '13.5px', marginBottom: '2px' } },
              'Se crea un contrato nuevo'
            ),
            h(
              'div',
              { style: { fontSize: '13px', lineHeight: 1.5 } },
              'El actual queda cerrado como renovado y se encadena con el nuevo, así la historia de la unidad queda completa. Las condiciones se heredan salvo las que cambies acá.'
            )
          )
        )
      ),
      h(
        'div',
        { 'data-cg-block-id': 's1', style: { display: 'contents' } },
        h(
          UI.FormSection,
          { icon: 'CalendarRange', title: 'Nuevo plazo' },
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
                { 'data-cg-block-id': 'f_start', style: { display: 'contents' } },
                h(
                  'div',
                  { style: { flex: '1 1 260px', minWidth: 0 } },
                  h(
                    UI.Label,
                    { htmlFor: 'startDate', style: { display: 'block', marginBottom: '6px' } },
                    'Desde'
                  ),
                  h(UI.Input, {
                    id: 'startDate',
                    type: 'date',
                    value: String(values['startDate'] ?? ''),
                    onChange: (e: any) => setField('startDate', e.target.value),
                  }),
                  errors['startDate']
                    ? h(
                        'div',
                        {
                          style: { fontSize: '12px', color: 'var(--cg-danger)', marginTop: '4px' },
                        },
                        errors['startDate']
                      )
                    : null
                )
              ),
              h(
                'div',
                { 'data-cg-block-id': 'f_end', style: { display: 'contents' } },
                h(
                  'div',
                  { style: { flex: '1 1 260px', minWidth: 0 } },
                  h(
                    UI.Label,
                    { htmlFor: 'endDate', style: { display: 'block', marginBottom: '6px' } },
                    'Hasta',
                    h('span', { style: { color: 'var(--cg-danger)' } }, ' *')
                  ),
                  h(UI.Input, {
                    id: 'endDate',
                    type: 'date',
                    value: String(values['endDate'] ?? ''),
                    onChange: (e: any) => setField('endDate', e.target.value),
                  }),
                  errors['endDate']
                    ? h(
                        'div',
                        {
                          style: { fontSize: '12px', color: 'var(--cg-danger)', marginTop: '4px' },
                        },
                        errors['endDate']
                      )
                    : null
                )
              )
            )
          )
        )
      ),
      h(
        'div',
        { 'data-cg-block-id': 's2', style: { display: 'contents' } },
        h(
          UI.FormSection,
          { icon: 'Wallet', title: 'Nuevo valor' },
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
              { 'data-cg-block-id': 'f_rent', style: { display: 'contents' } },
              h(
                'div',
                { style: { flex: '1 1 100%', minWidth: 0 } },
                h(
                  UI.Label,
                  { htmlFor: 'rentAmount', style: { display: 'block', marginBottom: '6px' } },
                  'Alquiler de la renovación',
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
                    id: 'rentAmount',
                    type: 'number',
                    inputMode: 'decimal',
                    value: values['rentAmount'] ?? '',
                    placeholder: 'Ej: 640000',
                    onChange: (e: any) =>
                      setField('rentAmount', e.target.value === '' ? null : Number(e.target.value)),
                    style: { paddingLeft: '22px', textAlign: 'right' as const },
                  })
                ),
                errors['rentAmount']
                  ? h(
                      'div',
                      { style: { fontSize: '12px', color: 'var(--cg-danger)', marginTop: '4px' } },
                      errors['rentAmount']
                    )
                  : null
              )
            ),
            h(
              'div',
              { style: { display: 'flex', gap: '14px', alignItems: 'flex-start' } },
              h(
                'div',
                { 'data-cg-block-id': 'f_index', style: { display: 'contents' } },
                h(
                  'div',
                  { style: { flex: '1 1 260px', minWidth: 0 } },
                  h(
                    UI.Label,
                    {
                      htmlFor: 'adjustmentIndex',
                      style: { display: 'block', marginBottom: '6px' },
                    },
                    'Índice de actualización'
                  ),
                  h(
                    UI.Select,
                    {
                      value: String(values['adjustmentIndex'] ?? ''),
                      onValueChange: (v: string) => setField('adjustmentIndex', v),
                      placeholder: 'Elegir…',
                      clearable: true,
                    },
                    h(UI.SelectItem, { key: 'ICL', value: 'ICL' }, 'ICL (BCRA)'),
                    h(UI.SelectItem, { key: 'IPC', value: 'IPC' }, 'IPC (INDEC)'),
                    h(UI.SelectItem, { key: 'casa_propia', value: 'casa_propia' }, 'Casa Propia'),
                    h(UI.SelectItem, { key: 'fijo', value: 'fijo' }, 'Escalonado fijo')
                  ),
                  errors['adjustmentIndex']
                    ? h(
                        'div',
                        {
                          style: { fontSize: '12px', color: 'var(--cg-danger)', marginTop: '4px' },
                        },
                        errors['adjustmentIndex']
                      )
                    : null
                )
              ),
              h(
                'div',
                { 'data-cg-block-id': 'f_months', style: { display: 'contents' } },
                h(
                  'div',
                  { style: { flex: '1 1 260px', minWidth: 0 } },
                  h(
                    UI.Label,
                    {
                      htmlFor: 'adjustmentMonths',
                      style: { display: 'block', marginBottom: '6px' },
                    },
                    'Se actualiza cada'
                  ),
                  h(
                    UI.Select,
                    {
                      value: String(values['adjustmentMonths'] ?? ''),
                      onValueChange: (v: string) => setField('adjustmentMonths', v),
                      placeholder: 'Elegir…',
                      clearable: true,
                    },
                    h(UI.SelectItem, { key: '3', value: '3' }, '3 meses'),
                    h(UI.SelectItem, { key: '4', value: '4' }, '4 meses'),
                    h(UI.SelectItem, { key: '6', value: '6' }, '6 meses'),
                    h(UI.SelectItem, { key: '12', value: '12' }, '12 meses')
                  ),
                  errors['adjustmentMonths']
                    ? h(
                        'div',
                        {
                          style: { fontSize: '12px', color: 'var(--cg-danger)', marginTop: '4px' },
                        },
                        errors['adjustmentMonths']
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
                  'Notas de la renovación'
                ),
                h(UI.Input, {
                  id: 'notes',
                  type: 'text',
                  value: String(values['notes'] ?? ''),
                  placeholder: 'Ej: se acordó por teléfono el 12/07',
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
        'Renovar contrato'
      )
    )
  );
}
