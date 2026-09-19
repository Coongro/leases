/**
 * Rescindir contrato — composición y render (generado por el Builder de Vistas).
 *
 * ⚠️ ARCHIVO REGENERABLE: se reescribe al guardar el diseño en el Builder.
 * La lógica custom va en `handlers.ts` (nunca se pisa). Diseño: `spec.json`.
 */
import { getHostReact, getHostUI, usePlugin } from '@coongro/plugin-sdk';

import { useRescindirContratoView } from './use-rescindir-contrato.js';

const React = getHostReact();
const h = React.createElement;
// Componentes del HOST: el diseño vive en core — una actualización de
// ui-components se refleja acá sin regenerar esta vista.
const UI = getHostUI() as any;

export function RescindirContratoView() {
  const {
    views: { closeDialog },
  } = usePlugin();
  const { values, errors, setField, submit } = useRescindirContratoView();

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
              background: 'var(--cg-gold-soft)',
              border: '1px solid var(--cg-gold-lt)',
              color: 'var(--cg-gold-deep)',
            },
          },
          null,
          h(
            'div',
            { style: { minWidth: 0 } },
            h(
              'div',
              { style: { fontWeight: 600, fontSize: '13.5px', marginBottom: '2px' } },
              'El contrato deja de generar cargos'
            ),
            h(
              'div',
              { style: { fontSize: '13px', lineHeight: 1.5 } },
              'Se guarda la fecha real de fin. El plazo pactado no se modifica: la diferencia entre ambos es lo que fundamenta la multa por rescisión anticipada, si el contrato la prevé. La unidad vuelve a figurar vacante.'
            )
          )
        )
      ),
      h(
        'div',
        { 'data-cg-block-id': 's1', style: { display: 'contents' } },
        h(
          UI.FormSection,
          { icon: 'Ban', title: 'La rescisión' },
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
              { 'data-cg-block-id': 'f_date', style: { display: 'contents' } },
              h(
                'div',
                { style: { flex: '1 1 100%', minWidth: 0 } },
                h(
                  UI.Label,
                  { htmlFor: 'terminationDate', style: { display: 'block', marginBottom: '6px' } },
                  'Último día del contrato',
                  h('span', { style: { color: 'var(--cg-danger)' } }, ' *')
                ),
                h(UI.Input, {
                  id: 'terminationDate',
                  type: 'date',
                  value: String(values['terminationDate'] ?? ''),
                  onChange: (e: any) => setField('terminationDate', e.target.value),
                }),
                errors['terminationDate']
                  ? h(
                      'div',
                      { style: { fontSize: '12px', color: 'var(--cg-danger)', marginTop: '4px' } },
                      errors['terminationDate']
                    )
                  : null
              )
            ),
            h(
              'div',
              { 'data-cg-block-id': 'f_reason', style: { display: 'contents' } },
              h(
                'div',
                { style: { flex: '1 1 100%', minWidth: 0 } },
                h(
                  UI.Label,
                  { htmlFor: 'reason', style: { display: 'block', marginBottom: '6px' } },
                  'Motivo',
                  h('span', { style: { color: 'var(--cg-danger)' } }, ' *')
                ),
                h(
                  UI.Select,
                  {
                    value: String(values['reason'] ?? ''),
                    onValueChange: (v: string) => setField('reason', v),
                    placeholder: 'Elegir…',
                    clearable: true,
                  },
                  h(
                    UI.SelectItem,
                    { key: 'inquilino', value: 'inquilino' },
                    'El inquilino se va antes'
                  ),
                  h(
                    UI.SelectItem,
                    { key: 'propietario', value: 'propietario' },
                    'Decisión del propietario'
                  ),
                  h(
                    UI.SelectItem,
                    { key: 'mutuo_acuerdo', value: 'mutuo_acuerdo' },
                    'De común acuerdo'
                  ),
                  h(
                    UI.SelectItem,
                    { key: 'incumplimiento', value: 'incumplimiento' },
                    'Por incumplimiento'
                  )
                ),
                errors['reason']
                  ? h(
                      'div',
                      { style: { fontSize: '12px', color: 'var(--cg-danger)', marginTop: '4px' } },
                      errors['reason']
                    )
                  : null
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
                  {
                    htmlFor: 'termination_detail',
                    style: { display: 'block', marginBottom: '6px' },
                  },
                  'Detalle'
                ),
                h(UI.Input, {
                  id: 'termination_detail',
                  type: 'text',
                  value: String(values['termination_detail'] ?? ''),
                  placeholder: 'Ej: entregó las llaves el 20/07, quedó a deber el mes de julio',
                  onChange: (e: any) => setField('termination_detail', e.target.value),
                }),
                errors['termination_detail']
                  ? h(
                      'div',
                      { style: { fontSize: '12px', color: 'var(--cg-danger)', marginTop: '4px' } },
                      errors['termination_detail']
                    )
                  : null
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
          { icon: 'Gavel', title: 'Multa por rescisión anticipada' },
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
              { 'data-cg-block-id': 'f_penalty', style: { display: 'contents' } },
              h(
                'div',
                { style: { flex: '1 1 100%', minWidth: 0 } },
                h(
                  UI.Label,
                  { htmlFor: 'penalty', style: { display: 'block', marginBottom: '6px' } },
                  'Qué se hace con la multa'
                ),
                h(
                  UI.Select,
                  {
                    value: String(values['penalty'] ?? ''),
                    onValueChange: (v: string) => setField('penalty', v),
                    placeholder: 'Elegir…',
                    clearable: true,
                  },
                  h(
                    UI.SelectItem,
                    {
                      key: 'cobrar',
                      value: 'cobrar',
                      icon: h(UI.DynamicIcon, { icon: 'ReceiptText', size: 16 }),
                    },
                    'Cobrarla'
                  ),
                  h(
                    UI.SelectItem,
                    {
                      key: 'eximir',
                      value: 'eximir',
                      icon: h(UI.DynamicIcon, { icon: 'HandHeart', size: 16 }),
                    },
                    'No cobrarla'
                  )
                ),
                errors['penalty']
                  ? h(
                      'div',
                      { style: { fontSize: '12px', color: 'var(--cg-danger)', marginTop: '4px' } },
                      errors['penalty']
                    )
                  : null
              )
            ),
            h(
              'div',
              { 'data-cg-block-id': 'f_penalty_amount', style: { display: 'contents' } },
              h(
                'div',
                { style: { flex: '1 1 100%', minWidth: 0 } },
                h(
                  UI.Label,
                  { htmlFor: 'penaltyAmount', style: { display: 'block', marginBottom: '6px' } },
                  'Importe'
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
                    id: 'penaltyAmount',
                    type: 'number',
                    inputMode: 'decimal',
                    value: values['penaltyAmount'] ?? '',
                    placeholder: 'Ej: 1560000',
                    onChange: (e: any) =>
                      setField(
                        'penaltyAmount',
                        e.target.value === '' ? null : Number(e.target.value)
                      ),
                    style: { paddingLeft: '22px', textAlign: 'right' as const },
                  })
                ),
                errors['penaltyAmount']
                  ? h(
                      'div',
                      { style: { fontSize: '12px', color: 'var(--cg-danger)', marginTop: '4px' } },
                      errors['penaltyAmount']
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
        'Rescindir contrato'
      )
    )
  );
}
