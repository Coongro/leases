/**
 * Contrato — composición y render (generado por el Builder de Vistas).
 *
 * ⚠️ ARCHIVO REGENERABLE: se reescribe al guardar el diseño en el Builder.
 * La lógica custom va en `handlers.ts` (nunca se pisa). Diseño: `spec.json`.
 */
import { getHostReact, getHostUI, usePlugin } from '@coongro/plugin-sdk';

import { useContratoView } from './use-contrato.js';

const React = getHostReact();
const h = React.createElement;
// Componentes del HOST: el diseño vive en core — una actualización de
// ui-components se refleja acá sin regenerar esta vista.
const UI = getHostUI() as any;

export function ContratoView() {
  const {
    views: { closeDialog },
  } = usePlugin();
  const { values, errors, setField, refOptions, refLabel, submit, editingId } = useContratoView();

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
        { 'data-cg-block-id': 's1', style: { display: 'contents' } },
        h(
          UI.FormSection,
          { icon: 'Users', title: 'Las partes' },
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
              { 'data-cg-block-id': 'f_unit', style: { display: 'contents' } },
              h(
                'div',
                { style: { flex: '1 1 100%', minWidth: 0 } },
                h(
                  UI.Label,
                  { htmlFor: 'unit_id', style: { display: 'block', marginBottom: '6px' } },
                  'Unidad',
                  h('span', { style: { color: 'var(--cg-danger)' } }, ' *')
                ),
                h(
                  UI.Select,
                  {
                    value: String(values['unit_id'] ?? ''),
                    onValueChange: (v: string) => setField('unit_id', v),
                    placeholder: 'Elegir…',
                    clearable: true,
                  },
                  ...(refOptions['unit_id'] ?? []).map((r: any) =>
                    h(
                      UI.SelectItem,
                      {
                        key: String(r.id),
                        value: String(r.id),
                        subtitle: String(r['detail'] ?? ''),
                      },
                      String(r['label'] ?? refLabel(r))
                    )
                  )
                ),
                errors['unit_id']
                  ? h(
                      'div',
                      { style: { fontSize: '12px', color: 'var(--cg-danger)', marginTop: '4px' } },
                      errors['unit_id']
                    )
                  : null
              )
            ),
            h(
              'div',
              { 'data-cg-block-id': 'f_tenant', style: { display: 'contents' } },
              h(
                'div',
                { style: { flex: '1 1 100%', minWidth: 0 } },
                h(
                  UI.Label,
                  {
                    htmlFor: 'tenant_contact_id',
                    style: { display: 'block', marginBottom: '6px' },
                  },
                  'Inquilino',
                  h('span', { style: { color: 'var(--cg-danger)' } }, ' *')
                ),
                h(
                  UI.Select,
                  {
                    value: String(values['tenant_contact_id'] ?? ''),
                    onValueChange: (v: string) => setField('tenant_contact_id', v),
                    placeholder: 'Elegir…',
                    clearable: true,
                  },
                  ...(refOptions['tenant_contact_id'] ?? []).map((r: any) =>
                    h(UI.SelectItem, { key: String(r.id), value: String(r.id) }, refLabel(r))
                  )
                ),
                errors['tenant_contact_id']
                  ? h(
                      'div',
                      { style: { fontSize: '12px', color: 'var(--cg-danger)', marginTop: '4px' } },
                      errors['tenant_contact_id']
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
          { icon: 'CalendarRange', title: 'Plazo' },
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
                { 'data-cg-block-id': 'f_kind', style: { display: 'contents' } },
                h(
                  'div',
                  { style: { flex: '1 1 260px', minWidth: 0 } },
                  h(
                    UI.Label,
                    { htmlFor: 'contract_type', style: { display: 'block', marginBottom: '6px' } },
                    'Tipo de contrato',
                    h('span', { style: { color: 'var(--cg-danger)' } }, ' *')
                  ),
                  h(
                    UI.Select,
                    {
                      value: String(values['contract_type'] ?? ''),
                      onValueChange: (v: string) => setField('contract_type', v),
                      placeholder: 'Elegir…',
                      clearable: true,
                    },
                    h(
                      UI.SelectItem,
                      { key: 'determinado', value: 'determinado' },
                      'Plazo determinado'
                    ),
                    h(
                      UI.SelectItem,
                      { key: 'indeterminado', value: 'indeterminado' },
                      'Plazo indeterminado'
                    )
                  ),
                  errors['contract_type']
                    ? h(
                        'div',
                        {
                          style: { fontSize: '12px', color: 'var(--cg-danger)', marginTop: '4px' },
                        },
                        errors['contract_type']
                      )
                    : null
                )
              ),
              h(
                'div',
                { 'data-cg-block-id': 'f_from', style: { display: 'contents' } },
                h(
                  'div',
                  { style: { flex: '1 1 260px', minWidth: 0 } },
                  h(
                    UI.Label,
                    { htmlFor: 'start_date', style: { display: 'block', marginBottom: '6px' } },
                    'Desde',
                    h('span', { style: { color: 'var(--cg-danger)' } }, ' *')
                  ),
                  h(UI.Input, {
                    id: 'start_date',
                    type: 'date',
                    value: String(values['start_date'] ?? ''),
                    onChange: (e: any) => setField('start_date', e.target.value),
                  }),
                  errors['start_date']
                    ? h(
                        'div',
                        {
                          style: { fontSize: '12px', color: 'var(--cg-danger)', marginTop: '4px' },
                        },
                        errors['start_date']
                      )
                    : null
                )
              )
            ),
            h(
              'div',
              { style: { display: 'flex', gap: '14px', alignItems: 'flex-start' } },
              h(
                'div',
                { 'data-cg-block-id': 'f_to', style: { display: 'contents' } },
                h(
                  'div',
                  { style: { flex: '1 1 260px', minWidth: 0 } },
                  h(
                    UI.Label,
                    { htmlFor: 'end_date', style: { display: 'block', marginBottom: '6px' } },
                    'Hasta',
                    h('span', { style: { color: 'var(--cg-danger)' } }, ' *')
                  ),
                  h(UI.Input, {
                    id: 'end_date',
                    type: 'date',
                    value: String(values['end_date'] ?? ''),
                    onChange: (e: any) => setField('end_date', e.target.value),
                  }),
                  errors['end_date']
                    ? h(
                        'div',
                        {
                          style: { fontSize: '12px', color: 'var(--cg-danger)', marginTop: '4px' },
                        },
                        errors['end_date']
                      )
                    : null
                )
              ),
              h(
                'div',
                { 'data-cg-block-id': 'f_due_day', style: { display: 'contents' } },
                h(
                  'div',
                  { style: { flex: '1 1 260px', minWidth: 0 } },
                  h(
                    UI.Label,
                    { htmlFor: 'due_day', style: { display: 'block', marginBottom: '6px' } },
                    'Día de vencimiento',
                    h('span', { style: { color: 'var(--cg-danger)' } }, ' *')
                  ),
                  h(UI.Input, {
                    id: 'due_day',
                    type: 'number',
                    value: values['due_day'] ?? '',
                    placeholder: 'Ej: 10',
                    onChange: (e: any) =>
                      setField('due_day', e.target.value === '' ? null : Number(e.target.value)),
                  }),
                  errors['due_day']
                    ? h(
                        'div',
                        {
                          style: { fontSize: '12px', color: 'var(--cg-danger)', marginTop: '4px' },
                        },
                        errors['due_day']
                      )
                    : null
                )
              )
            ),
            h(
              'div',
              { 'data-cg-block-id': 'f_due_type', style: { display: 'contents' } },
              h(
                'div',
                { style: { flex: '1 1 100%', minWidth: 0 } },
                h(
                  UI.Label,
                  { htmlFor: 'due_day_type', style: { display: 'block', marginBottom: '6px' } },
                  'Contar el día como',
                  h('span', { style: { color: 'var(--cg-danger)' } }, ' *')
                ),
                h(
                  UI.Select,
                  {
                    value: String(values['due_day_type'] ?? ''),
                    onValueChange: (v: string) => setField('due_day_type', v),
                    placeholder: 'Elegir…',
                    clearable: true,
                  },
                  h(UI.SelectItem, { key: 'fixed', value: 'fixed' }, 'Día fijo del mes'),
                  h(UI.SelectItem, { key: 'business', value: 'business' }, 'Día hábil')
                ),
                errors['due_day_type']
                  ? h(
                      'div',
                      { style: { fontSize: '12px', color: 'var(--cg-danger)', marginTop: '4px' } },
                      errors['due_day_type']
                    )
                  : null
              )
            )
          )
        )
      ),
      h(
        'div',
        { 'data-cg-block-id': 's3', style: { display: 'contents' } },
        h(
          UI.FormSection,
          { icon: 'TrendingUp', title: 'Valor y actualización' },
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
                { 'data-cg-block-id': 'f_currency', style: { display: 'contents' } },
                h(
                  'div',
                  { style: { flex: '1 1 260px', minWidth: 0 } },
                  h(
                    UI.Label,
                    { htmlFor: 'currency', style: { display: 'block', marginBottom: '6px' } },
                    'Moneda',
                    h('span', { style: { color: 'var(--cg-danger)' } }, ' *')
                  ),
                  h(
                    UI.Select,
                    {
                      value: String(values['currency'] ?? ''),
                      onValueChange: (v: string) => setField('currency', v),
                      placeholder: 'Elegir…',
                      clearable: true,
                    },
                    h(UI.SelectItem, { key: 'ARS', value: 'ARS' }, 'Pesos (ARS)'),
                    h(UI.SelectItem, { key: 'USD', value: 'USD' }, 'Dólares (USD)')
                  ),
                  errors['currency']
                    ? h(
                        'div',
                        {
                          style: { fontSize: '12px', color: 'var(--cg-danger)', marginTop: '4px' },
                        },
                        errors['currency']
                      )
                    : null
                )
              ),
              h(
                'div',
                { 'data-cg-block-id': 'f_rent', style: { display: 'contents' } },
                h(
                  'div',
                  { style: { flex: '1 1 260px', minWidth: 0 } },
                  h(
                    UI.Label,
                    { htmlFor: 'rent_amount', style: { display: 'block', marginBottom: '6px' } },
                    'Alquiler inicial',
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
                      id: 'rent_amount',
                      type: 'number',
                      inputMode: 'decimal',
                      value: values['rent_amount'] ?? '',
                      placeholder: 'Ej: 485000',
                      onChange: (e: any) =>
                        setField(
                          'rent_amount',
                          e.target.value === '' ? null : Number(e.target.value)
                        ),
                      style: { paddingLeft: '22px', textAlign: 'right' as const },
                    })
                  ),
                  errors['rent_amount']
                    ? h(
                        'div',
                        {
                          style: { fontSize: '12px', color: 'var(--cg-danger)', marginTop: '4px' },
                        },
                        errors['rent_amount']
                      )
                    : null
                )
              )
            ),
            h(
              'div',
              { style: { display: 'flex', gap: '14px', alignItems: 'flex-start' } },
              h(
                'div',
                { 'data-cg-block-id': 'f_expenses', style: { display: 'contents' } },
                h(
                  'div',
                  { style: { flex: '1 1 260px', minWidth: 0 } },
                  h(
                    UI.Label,
                    {
                      htmlFor: 'expenses_amount',
                      style: { display: 'block', marginBottom: '6px' },
                    },
                    'Expensas a cargo del inquilino'
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
                      id: 'expenses_amount',
                      type: 'number',
                      inputMode: 'decimal',
                      value: values['expenses_amount'] ?? '',
                      placeholder: 'Ej: 68000',
                      onChange: (e: any) =>
                        setField(
                          'expenses_amount',
                          e.target.value === '' ? null : Number(e.target.value)
                        ),
                      style: { paddingLeft: '22px', textAlign: 'right' as const },
                    })
                  ),
                  errors['expenses_amount']
                    ? h(
                        'div',
                        {
                          style: { fontSize: '12px', color: 'var(--cg-danger)', marginTop: '4px' },
                        },
                        errors['expenses_amount']
                      )
                    : null
                )
              ),
              h(
                'div',
                { 'data-cg-block-id': 'f_admin_fee', style: { display: 'contents' } },
                h(
                  'div',
                  { style: { flex: '1 1 260px', minWidth: 0 } },
                  h(
                    UI.Label,
                    {
                      htmlFor: 'admin_fee_percent',
                      style: { display: 'block', marginBottom: '6px' },
                    },
                    'Honorario de administración (%)'
                  ),
                  h(UI.Input, {
                    id: 'admin_fee_percent',
                    type: 'number',
                    value: values['admin_fee_percent'] ?? '',
                    placeholder: 'Ej: 8',
                    onChange: (e: any) =>
                      setField(
                        'admin_fee_percent',
                        e.target.value === '' ? null : Number(e.target.value)
                      ),
                  }),
                  errors['admin_fee_percent']
                    ? h(
                        'div',
                        {
                          style: { fontSize: '12px', color: 'var(--cg-danger)', marginTop: '4px' },
                        },
                        errors['admin_fee_percent']
                      )
                    : null
                )
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
                      htmlFor: 'adjustment_index',
                      style: { display: 'block', marginBottom: '6px' },
                    },
                    'Índice de actualización',
                    h('span', { style: { color: 'var(--cg-danger)' } }, ' *')
                  ),
                  h(
                    UI.Select,
                    {
                      value: String(values['adjustment_index'] ?? ''),
                      onValueChange: (v: string) => setField('adjustment_index', v),
                      placeholder: 'Elegir…',
                      clearable: true,
                    },
                    h(UI.SelectItem, { key: 'ICL', value: 'ICL' }, 'ICL (BCRA)'),
                    h(UI.SelectItem, { key: 'IPC', value: 'IPC' }, 'IPC (INDEC)'),
                    h(UI.SelectItem, { key: 'casa_propia', value: 'casa_propia' }, 'Casa Propia'),
                    h(UI.SelectItem, { key: 'fijo', value: 'fijo' }, 'Escalonado fijo'),
                    h(UI.SelectItem, { key: 'otro', value: 'otro' }, 'Otro')
                  ),
                  errors['adjustment_index']
                    ? h(
                        'div',
                        {
                          style: { fontSize: '12px', color: 'var(--cg-danger)', marginTop: '4px' },
                        },
                        errors['adjustment_index']
                      )
                    : null
                )
              ),
              h(
                'div',
                { 'data-cg-block-id': 'f_period', style: { display: 'contents' } },
                h(
                  'div',
                  { style: { flex: '1 1 260px', minWidth: 0 } },
                  h(
                    UI.Label,
                    {
                      htmlFor: 'adjustment_months',
                      style: { display: 'block', marginBottom: '6px' },
                    },
                    'Se actualiza cada',
                    h('span', { style: { color: 'var(--cg-danger)' } }, ' *')
                  ),
                  h(
                    UI.Select,
                    {
                      value: String(values['adjustment_months'] ?? ''),
                      onValueChange: (v: string) => setField('adjustment_months', v),
                      placeholder: 'Elegir…',
                      clearable: true,
                    },
                    h(UI.SelectItem, { key: '3', value: '3' }, '3 meses'),
                    h(UI.SelectItem, { key: '4', value: '4' }, '4 meses'),
                    h(UI.SelectItem, { key: '6', value: '6' }, '6 meses'),
                    h(UI.SelectItem, { key: '12', value: '12' }, '12 meses')
                  ),
                  errors['adjustment_months']
                    ? h(
                        'div',
                        {
                          style: { fontSize: '12px', color: 'var(--cg-danger)', marginTop: '4px' },
                        },
                        errors['adjustment_months']
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
        { 'data-cg-block-id': 's4', style: { display: 'contents' } },
        h(
          UI.FormSection,
          { icon: 'ShieldCheck', title: 'Garantía' },
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
                { 'data-cg-block-id': 'f_guarantee_type', style: { display: 'contents' } },
                h(
                  'div',
                  { style: { flex: '1 1 260px', minWidth: 0 } },
                  h(
                    UI.Label,
                    { htmlFor: 'guarantee_type', style: { display: 'block', marginBottom: '6px' } },
                    'Tipo de garantía',
                    h('span', { style: { color: 'var(--cg-danger)' } }, ' *')
                  ),
                  h(
                    UI.Select,
                    {
                      value: String(values['guarantee_type'] ?? ''),
                      onValueChange: (v: string) => setField('guarantee_type', v),
                      placeholder: 'Elegir…',
                      clearable: true,
                    },
                    h(
                      UI.SelectItem,
                      { key: 'garante_propietario', value: 'garante_propietario' },
                      'Garante propietario'
                    ),
                    h(
                      UI.SelectItem,
                      { key: 'garante_recibo_sueldo', value: 'garante_recibo_sueldo' },
                      'Garante con recibo de sueldo'
                    ),
                    h(
                      UI.SelectItem,
                      { key: 'deposito', value: 'deposito' },
                      'Depósito en garantía'
                    ),
                    h(
                      UI.SelectItem,
                      { key: 'seguro_caucion', value: 'seguro_caucion' },
                      'Seguro de caución'
                    )
                  ),
                  errors['guarantee_type']
                    ? h(
                        'div',
                        {
                          style: { fontSize: '12px', color: 'var(--cg-danger)', marginTop: '4px' },
                        },
                        errors['guarantee_type']
                      )
                    : null
                )
              ),
              h(
                'div',
                { 'data-cg-block-id': 'f_guarantor', style: { display: 'contents' } },
                h(
                  'div',
                  { style: { flex: '1 1 260px', minWidth: 0 } },
                  h(
                    UI.Label,
                    {
                      htmlFor: 'guarantor_contact_id',
                      style: { display: 'block', marginBottom: '6px' },
                    },
                    'Garante'
                  ),
                  h(
                    UI.Select,
                    {
                      value: String(values['guarantor_contact_id'] ?? ''),
                      onValueChange: (v: string) => setField('guarantor_contact_id', v),
                      placeholder: 'Elegir…',
                      clearable: true,
                    },
                    ...(refOptions['guarantor_contact_id'] ?? []).map((r: any) =>
                      h(UI.SelectItem, { key: String(r.id), value: String(r.id) }, refLabel(r))
                    )
                  ),
                  errors['guarantor_contact_id']
                    ? h(
                        'div',
                        {
                          style: { fontSize: '12px', color: 'var(--cg-danger)', marginTop: '4px' },
                        },
                        errors['guarantor_contact_id']
                      )
                    : null
                )
              )
            ),
            h(
              'div',
              { 'data-cg-block-id': 'f_guarantee_notes', style: { display: 'contents' } },
              h(
                'div',
                { style: { flex: '1 1 100%', minWidth: 0 } },
                h(
                  UI.Label,
                  { htmlFor: 'guarantee_notes', style: { display: 'block', marginBottom: '6px' } },
                  'Detalle de la garantía'
                ),
                h(UI.Input, {
                  id: 'guarantee_notes',
                  type: 'text',
                  value: String(values['guarantee_notes'] ?? ''),
                  placeholder: 'Ej: póliza 4471102, vence 30/09/2027',
                  onChange: (e: any) => setField('guarantee_notes', e.target.value),
                }),
                errors['guarantee_notes']
                  ? h(
                      'div',
                      { style: { fontSize: '12px', color: 'var(--cg-danger)', marginTop: '4px' } },
                      errors['guarantee_notes']
                    )
                  : null
              )
            )
          )
        )
      ),
      h(
        'div',
        { 'data-cg-block-id': 's5', style: { display: 'contents' } },
        h(
          UI.FormSection,
          { icon: 'Wallet', title: 'Depósito' },
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
                { 'data-cg-block-id': 'f_deposit', style: { display: 'contents' } },
                h(
                  'div',
                  { style: { flex: '1 1 260px', minWidth: 0 } },
                  h(
                    UI.Label,
                    { htmlFor: 'deposit_amount', style: { display: 'block', marginBottom: '6px' } },
                    'Monto del depósito'
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
                      id: 'deposit_amount',
                      type: 'number',
                      inputMode: 'decimal',
                      value: values['deposit_amount'] ?? '',
                      placeholder: 'Ej: 485000',
                      onChange: (e: any) =>
                        setField(
                          'deposit_amount',
                          e.target.value === '' ? null : Number(e.target.value)
                        ),
                      style: { paddingLeft: '22px', textAlign: 'right' as const },
                    })
                  ),
                  errors['deposit_amount']
                    ? h(
                        'div',
                        {
                          style: { fontSize: '12px', color: 'var(--cg-danger)', marginTop: '4px' },
                        },
                        errors['deposit_amount']
                      )
                    : null
                )
              ),
              h(
                'div',
                { 'data-cg-block-id': 'f_deposit_status', style: { display: 'contents' } },
                h(
                  'div',
                  { style: { flex: '1 1 260px', minWidth: 0 } },
                  h(
                    UI.Label,
                    { htmlFor: 'deposit_status', style: { display: 'block', marginBottom: '6px' } },
                    'Estado'
                  ),
                  h(
                    UI.Select,
                    {
                      value: String(values['deposit_status'] ?? ''),
                      onValueChange: (v: string) => setField('deposit_status', v),
                      placeholder: 'Elegir…',
                      clearable: true,
                    },
                    h(UI.SelectItem, { key: 'pendiente', value: 'pendiente' }, 'Pendiente'),
                    h(UI.SelectItem, { key: 'recibido', value: 'recibido' }, 'Recibido'),
                    h(UI.SelectItem, { key: 'parcial', value: 'parcial' }, 'Recibido parcial'),
                    h(UI.SelectItem, { key: 'devuelto', value: 'devuelto' }, 'Devuelto'),
                    h(
                      UI.SelectItem,
                      { key: 'retenido_alquiler', value: 'retenido_alquiler' },
                      'Retenido por alquileres'
                    ),
                    h(
                      UI.SelectItem,
                      { key: 'retenido_reparaciones', value: 'retenido_reparaciones' },
                      'Retenido por reparaciones'
                    )
                  ),
                  errors['deposit_status']
                    ? h(
                        'div',
                        {
                          style: { fontSize: '12px', color: 'var(--cg-danger)', marginTop: '4px' },
                        },
                        errors['deposit_status']
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
        { 'data-cg-block-id': 's6', style: { display: 'contents' } },
        h(
          UI.FormSection,
          { icon: 'TriangleAlert', title: 'Incumplimientos' },
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
                { 'data-cg-block-id': 'f_late_fee', style: { display: 'contents' } },
                h(
                  'div',
                  { style: { flex: '1 1 260px', minWidth: 0 } },
                  h(
                    UI.Label,
                    {
                      htmlFor: 'late_fee_percent',
                      style: { display: 'block', marginBottom: '6px' },
                    },
                    'Punitorio diario por mora (%)'
                  ),
                  h(UI.Input, {
                    id: 'late_fee_percent',
                    type: 'number',
                    value: values['late_fee_percent'] ?? '',
                    placeholder: 'Ej: 0.5',
                    onChange: (e: any) =>
                      setField(
                        'late_fee_percent',
                        e.target.value === '' ? null : Number(e.target.value)
                      ),
                  }),
                  errors['late_fee_percent']
                    ? h(
                        'div',
                        {
                          style: { fontSize: '12px', color: 'var(--cg-danger)', marginTop: '4px' },
                        },
                        errors['late_fee_percent']
                      )
                    : null
                )
              ),
              h(
                'div',
                { 'data-cg-block-id': 'f_penalty', style: { display: 'contents' } },
                h(
                  'div',
                  { style: { flex: '1 1 260px', minWidth: 0 } },
                  h(
                    UI.Label,
                    { htmlFor: 'penalty_months', style: { display: 'block', marginBottom: '6px' } },
                    'Multa por rescisión anticipada (meses)'
                  ),
                  h(UI.Input, {
                    id: 'penalty_months',
                    type: 'number',
                    value: values['penalty_months'] ?? '',
                    placeholder: 'Ej: 1',
                    onChange: (e: any) =>
                      setField(
                        'penalty_months',
                        e.target.value === '' ? null : Number(e.target.value)
                      ),
                  }),
                  errors['penalty_months']
                    ? h(
                        'div',
                        {
                          style: { fontSize: '12px', color: 'var(--cg-danger)', marginTop: '4px' },
                        },
                        errors['penalty_months']
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
        editingId ? 'Actualizar' : 'Guardar'
      )
    )
  );
}
