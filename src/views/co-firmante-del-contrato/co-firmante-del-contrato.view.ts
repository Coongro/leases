/**
 * Co-firmante del contrato — composición y render (generado por el Builder de Vistas).
 *
 * ⚠️ ARCHIVO REGENERABLE: se reescribe al guardar el diseño en el Builder.
 * La lógica custom va en `handlers.ts` (nunca se pisa). Diseño: `spec.json`.
 */
import { getHostReact, getHostUI, usePlugin } from '@coongro/plugin-sdk';

import { useCoFirmanteDelContratoView } from './use-co-firmante-del-contrato.js';

const React = getHostReact();
const h = React.createElement;
// Componentes del HOST: el diseño vive en core — una actualización de
// ui-components se refleja acá sin regenerar esta vista.
const UI = getHostUI() as any;

export function CoFirmanteDelContratoView() {
  const {
    views: { closeDialog },
  } = usePlugin();
  const { values, errors, setField, refOptions, refLabel, submit } = useCoFirmanteDelContratoView();

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
              'Quién más responde por el contrato'
            ),
            h(
              'div',
              { style: { fontSize: '13px', lineHeight: 1.5 } },
              'El inquilino principal ya está en el contrato: acá van los demás firmantes, que responden solidariamente. La garantía se registra aparte.'
            )
          )
        )
      ),
      h(
        'div',
        { 'data-cg-block-id': 's1', style: { display: 'contents' } },
        h(
          UI.FormSection,
          { icon: 'Users', title: 'Quién firma' },
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
                  { htmlFor: 'leaseId', style: { display: 'block', marginBottom: '6px' } },
                  'Contrato',
                  h('span', { style: { color: 'var(--cg-danger)' } }, ' *')
                ),
                h(
                  UI.Select,
                  {
                    value: String(values['leaseId'] ?? ''),
                    onValueChange: (v: string) => setField('leaseId', v),
                    placeholder: 'Elegir…',
                    clearable: true,
                  },
                  ...(refOptions['leaseId'] ?? []).map((r: any) =>
                    h(UI.SelectItem, { key: String(r.id), value: String(r.id) }, refLabel(r))
                  )
                ),
                errors['leaseId']
                  ? h(
                      'div',
                      { style: { fontSize: '12px', color: 'var(--cg-danger)', marginTop: '4px' } },
                      errors['leaseId']
                    )
                  : null
              )
            ),
            h(
              'div',
              { 'data-cg-block-id': 'f_contact', style: { display: 'contents' } },
              h(
                'div',
                { style: { flex: '1 1 100%', minWidth: 0 } },
                h(
                  UI.Label,
                  { htmlFor: 'contactId', style: { display: 'block', marginBottom: '6px' } },
                  'Persona',
                  h('span', { style: { color: 'var(--cg-danger)' } }, ' *')
                ),
                h(
                  UI.Select,
                  {
                    value: String(values['contactId'] ?? ''),
                    onValueChange: (v: string) => setField('contactId', v),
                    placeholder: 'Elegir…',
                    clearable: true,
                  },
                  ...(refOptions['contactId'] ?? []).map((r: any) =>
                    h(UI.SelectItem, { key: String(r.id), value: String(r.id) }, refLabel(r))
                  )
                ),
                errors['contactId']
                  ? h(
                      'div',
                      { style: { fontSize: '12px', color: 'var(--cg-danger)', marginTop: '4px' } },
                      errors['contactId']
                    )
                  : null
              )
            ),
            h(
              'div',
              { style: { display: 'flex', gap: '14px', alignItems: 'flex-start' } },
              h(
                'div',
                { 'data-cg-block-id': 'f_role', style: { display: 'contents' } },
                h(
                  'div',
                  { style: { flex: '1 1 260px', minWidth: 0 } },
                  h(
                    UI.Label,
                    { htmlFor: 'role', style: { display: 'block', marginBottom: '6px' } },
                    'Con qué carácter firma'
                  ),
                  h(
                    UI.Select,
                    {
                      value: String(values['role'] ?? ''),
                      onValueChange: (v: string) => setField('role', v),
                      placeholder: 'Elegir…',
                      clearable: true,
                    },
                    h(UI.SelectItem, { key: 'cotitular', value: 'cotitular' }, 'Cotitular'),
                    h(UI.SelectItem, { key: 'conyuge', value: 'conyuge' }, 'Cónyuge'),
                    h(UI.SelectItem, { key: 'conviviente', value: 'conviviente' }, 'Conviviente'),
                    h(
                      UI.SelectItem,
                      { key: 'fiador_solidario', value: 'fiador_solidario' },
                      'Fiador solidario'
                    )
                  ),
                  errors['role']
                    ? h(
                        'div',
                        {
                          style: { fontSize: '12px', color: 'var(--cg-danger)', marginTop: '4px' },
                        },
                        errors['role']
                      )
                    : null
                )
              ),
              h(
                'div',
                { 'data-cg-block-id': 'f_notes', style: { display: 'contents' } },
                h(
                  'div',
                  { style: { flex: '1 1 260px', minWidth: 0 } },
                  h(
                    UI.Label,
                    { htmlFor: 'notes', style: { display: 'block', marginBottom: '6px' } },
                    'Aclaración'
                  ),
                  h(UI.Input, {
                    id: 'notes',
                    type: 'text',
                    value: String(values['notes'] ?? ''),
                    placeholder: 'Ej: firma solo por la unidad, no por la cochera',
                    onChange: (e: any) => setField('notes', e.target.value),
                  }),
                  errors['notes']
                    ? h(
                        'div',
                        {
                          style: { fontSize: '12px', color: 'var(--cg-danger)', marginTop: '4px' },
                        },
                        errors['notes']
                      )
                    : null
                )
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
        'Sumar al contrato'
      )
    )
  );
}
