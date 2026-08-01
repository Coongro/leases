/**
 * Inquilino — composición y render (generado por el Builder de Vistas).
 *
 * ⚠️ ARCHIVO REGENERABLE: se reescribe al guardar el diseño en el Builder.
 * La lógica custom va en `handlers.ts` (nunca se pisa). Diseño: `spec.json`.
 */
import { getHostReact, getHostUI, usePlugin } from '@coongro/plugin-sdk';

import { useInquilinoView } from './use-inquilino.js';

const React = getHostReact();
const h = React.createElement;
// Componentes del HOST: el diseño vive en core — una actualización de
// ui-components se refleja acá sin regenerar esta vista.
const UI = getHostUI() as any;

export function InquilinoView() {
  const {
    views: { closeDialog },
  } = usePlugin();
  const { values, errors, setField, submit } = useInquilinoView();

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
          { icon: 'User', title: 'Quién alquila' },
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
                    { htmlFor: 'kind', style: { display: 'block', marginBottom: '6px' } },
                    'Tipo',
                    h('span', { style: { color: 'var(--cg-danger)' } }, ' *')
                  ),
                  h(
                    UI.Select,
                    {
                      value: String(values['kind'] ?? ''),
                      onValueChange: (v: string) => setField('kind', v),
                      placeholder: 'Elegir…',
                      clearable: true,
                    },
                    h(
                      UI.SelectItem,
                      {
                        key: 'persona',
                        value: 'persona',
                        icon: h(UI.DynamicIcon, { icon: 'User', size: 16 }),
                      },
                      'Persona'
                    ),
                    h(
                      UI.SelectItem,
                      {
                        key: 'empresa',
                        value: 'empresa',
                        icon: h(UI.DynamicIcon, { icon: 'Building2', size: 16 }),
                      },
                      'Empresa'
                    )
                  ),
                  errors['kind']
                    ? h(
                        'div',
                        {
                          style: { fontSize: '12px', color: 'var(--cg-danger)', marginTop: '4px' },
                        },
                        errors['kind']
                      )
                    : null
                )
              ),
              h(
                'div',
                { 'data-cg-block-id': 'f_name', style: { display: 'contents' } },
                h(
                  'div',
                  { style: { flex: '1 1 260px', minWidth: 0 } },
                  h(
                    UI.Label,
                    { htmlFor: 'name', style: { display: 'block', marginBottom: '6px' } },
                    'Nombre y apellido o razón social',
                    h('span', { style: { color: 'var(--cg-danger)' } }, ' *')
                  ),
                  h(UI.Input, {
                    id: 'name',
                    type: 'text',
                    value: String(values['name'] ?? ''),
                    placeholder: 'Ej: Martín Aguirre',
                    onChange: (e: any) => setField('name', e.target.value),
                  }),
                  errors['name']
                    ? h(
                        'div',
                        {
                          style: { fontSize: '12px', color: 'var(--cg-danger)', marginTop: '4px' },
                        },
                        errors['name']
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
                { 'data-cg-block-id': 'f_doc_type', style: { display: 'contents' } },
                h(
                  'div',
                  { style: { flex: '1 1 260px', minWidth: 0 } },
                  h(
                    UI.Label,
                    { htmlFor: 'document_type', style: { display: 'block', marginBottom: '6px' } },
                    'Documento',
                    h('span', { style: { color: 'var(--cg-danger)' } }, ' *')
                  ),
                  h(
                    UI.Select,
                    {
                      value: String(values['document_type'] ?? ''),
                      onValueChange: (v: string) => setField('document_type', v),
                      placeholder: 'Elegir…',
                      clearable: true,
                    },
                    h(UI.SelectItem, { key: 'dni', value: 'dni' }, 'DNI'),
                    h(UI.SelectItem, { key: 'cuit', value: 'cuit' }, 'CUIT'),
                    h(UI.SelectItem, { key: 'cuil', value: 'cuil' }, 'CUIL'),
                    h(UI.SelectItem, { key: 'pasaporte', value: 'pasaporte' }, 'Pasaporte')
                  ),
                  errors['document_type']
                    ? h(
                        'div',
                        {
                          style: { fontSize: '12px', color: 'var(--cg-danger)', marginTop: '4px' },
                        },
                        errors['document_type']
                      )
                    : null
                )
              ),
              h(
                'div',
                { 'data-cg-block-id': 'f_doc', style: { display: 'contents' } },
                h(
                  'div',
                  { style: { flex: '1 1 260px', minWidth: 0 } },
                  h(
                    UI.Label,
                    {
                      htmlFor: 'document_number',
                      style: { display: 'block', marginBottom: '6px' },
                    },
                    'Número',
                    h('span', { style: { color: 'var(--cg-danger)' } }, ' *')
                  ),
                  h(UI.Input, {
                    id: 'document_number',
                    type: 'text',
                    value: String(values['document_number'] ?? ''),
                    placeholder: 'Ej: 32.145.678',
                    onChange: (e: any) => setField('document_number', e.target.value),
                  }),
                  errors['document_number']
                    ? h(
                        'div',
                        {
                          style: { fontSize: '12px', color: 'var(--cg-danger)', marginTop: '4px' },
                        },
                        errors['document_number']
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
          { icon: 'IdCard', title: 'Datos personales' },
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
                { 'data-cg-block-id': 'f_nationality', style: { display: 'contents' } },
                h(
                  'div',
                  { style: { flex: '1 1 260px', minWidth: 0 } },
                  h(
                    UI.Label,
                    { htmlFor: 'nationality', style: { display: 'block', marginBottom: '6px' } },
                    'Nacionalidad'
                  ),
                  h(UI.Input, {
                    id: 'nationality',
                    type: 'text',
                    value: String(values['nationality'] ?? ''),
                    placeholder: 'Ej: argentina',
                    onChange: (e: any) => setField('nationality', e.target.value),
                  }),
                  errors['nationality']
                    ? h(
                        'div',
                        {
                          style: { fontSize: '12px', color: 'var(--cg-danger)', marginTop: '4px' },
                        },
                        errors['nationality']
                      )
                    : null
                )
              ),
              h(
                'div',
                { 'data-cg-block-id': 'f_marital', style: { display: 'contents' } },
                h(
                  'div',
                  { style: { flex: '1 1 260px', minWidth: 0 } },
                  h(
                    UI.Label,
                    { htmlFor: 'marital_status', style: { display: 'block', marginBottom: '6px' } },
                    'Estado civil'
                  ),
                  h(
                    UI.Select,
                    {
                      value: String(values['marital_status'] ?? ''),
                      onValueChange: (v: string) => setField('marital_status', v),
                      placeholder: 'Elegir…',
                      clearable: true,
                    },
                    h(UI.SelectItem, { key: 'soltero', value: 'soltero' }, 'Soltero/a'),
                    h(UI.SelectItem, { key: 'casado', value: 'casado' }, 'Casado/a'),
                    h(UI.SelectItem, { key: 'divorciado', value: 'divorciado' }, 'Divorciado/a'),
                    h(UI.SelectItem, { key: 'viudo', value: 'viudo' }, 'Viudo/a'),
                    h(
                      UI.SelectItem,
                      { key: 'union_convivencial', value: 'union_convivencial' },
                      'Unión convivencial'
                    )
                  ),
                  errors['marital_status']
                    ? h(
                        'div',
                        {
                          style: { fontSize: '12px', color: 'var(--cg-danger)', marginTop: '4px' },
                        },
                        errors['marital_status']
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
                { 'data-cg-block-id': 'f_spouse', style: { display: 'contents' } },
                h(
                  'div',
                  { style: { flex: '1 1 260px', minWidth: 0 } },
                  h(
                    UI.Label,
                    { htmlFor: 'spouse_name', style: { display: 'block', marginBottom: '6px' } },
                    'Cónyuge'
                  ),
                  h(UI.Input, {
                    id: 'spouse_name',
                    type: 'text',
                    value: String(values['spouse_name'] ?? ''),
                    placeholder: 'Ej: Carla Beltrán',
                    onChange: (e: any) => setField('spouse_name', e.target.value),
                  }),
                  errors['spouse_name']
                    ? h(
                        'div',
                        {
                          style: { fontSize: '12px', color: 'var(--cg-danger)', marginTop: '4px' },
                        },
                        errors['spouse_name']
                      )
                    : null
                )
              ),
              h(
                'div',
                { 'data-cg-block-id': 'f_spouse_doc', style: { display: 'contents' } },
                h(
                  'div',
                  { style: { flex: '1 1 260px', minWidth: 0 } },
                  h(
                    UI.Label,
                    {
                      htmlFor: 'spouse_document',
                      style: { display: 'block', marginBottom: '6px' },
                    },
                    'Documento del cónyuge'
                  ),
                  h(UI.Input, {
                    id: 'spouse_document',
                    type: 'text',
                    value: String(values['spouse_document'] ?? ''),
                    placeholder: 'Ej: 30.987.654',
                    onChange: (e: any) => setField('spouse_document', e.target.value),
                  }),
                  errors['spouse_document']
                    ? h(
                        'div',
                        {
                          style: { fontSize: '12px', color: 'var(--cg-danger)', marginTop: '4px' },
                        },
                        errors['spouse_document']
                      )
                    : null
                )
              )
            ),
            h(
              'div',
              { 'data-cg-block-id': 'f_job', style: { display: 'contents' } },
              h(
                'div',
                { style: { flex: '1 1 100%', minWidth: 0 } },
                h(
                  UI.Label,
                  { htmlFor: 'occupation', style: { display: 'block', marginBottom: '6px' } },
                  'Profesión u ocupación'
                ),
                h(UI.Input, {
                  id: 'occupation',
                  type: 'text',
                  value: String(values['occupation'] ?? ''),
                  placeholder: 'Ej: empleado de comercio',
                  onChange: (e: any) => setField('occupation', e.target.value),
                }),
                errors['occupation']
                  ? h(
                      'div',
                      { style: { fontSize: '12px', color: 'var(--cg-danger)', marginTop: '4px' } },
                      errors['occupation']
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
          { icon: 'Building2', title: 'Si es empresa' },
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
                { 'data-cg-block-id': 'f_rep', style: { display: 'contents' } },
                h(
                  'div',
                  { style: { flex: '1 1 260px', minWidth: 0 } },
                  h(
                    UI.Label,
                    {
                      htmlFor: 'legal_representative',
                      style: { display: 'block', marginBottom: '6px' },
                    },
                    'Representante legal'
                  ),
                  h(UI.Input, {
                    id: 'legal_representative',
                    type: 'text',
                    value: String(values['legal_representative'] ?? ''),
                    placeholder: 'Ej: Roberto Puig',
                    onChange: (e: any) => setField('legal_representative', e.target.value),
                  }),
                  errors['legal_representative']
                    ? h(
                        'div',
                        {
                          style: { fontSize: '12px', color: 'var(--cg-danger)', marginTop: '4px' },
                        },
                        errors['legal_representative']
                      )
                    : null
                )
              ),
              h(
                'div',
                { 'data-cg-block-id': 'f_legal', style: { display: 'contents' } },
                h(
                  'div',
                  { style: { flex: '1 1 260px', minWidth: 0 } },
                  h(
                    UI.Label,
                    { htmlFor: 'legal_form', style: { display: 'block', marginBottom: '6px' } },
                    'Forma jurídica'
                  ),
                  h(
                    UI.Select,
                    {
                      value: String(values['legal_form'] ?? ''),
                      onValueChange: (v: string) => setField('legal_form', v),
                      placeholder: 'Elegir…',
                      clearable: true,
                    },
                    h(UI.SelectItem, { key: 'sa', value: 'sa' }, 'S.A.'),
                    h(UI.SelectItem, { key: 'srl', value: 'srl' }, 'S.R.L.'),
                    h(UI.SelectItem, { key: 'sas', value: 'sas' }, 'S.A.S.'),
                    h(
                      UI.SelectItem,
                      { key: 'sociedad_de_hecho', value: 'sociedad_de_hecho' },
                      'Sociedad de hecho'
                    ),
                    h(
                      UI.SelectItem,
                      { key: 'monotributista', value: 'monotributista' },
                      'Monotributista'
                    ),
                    h(UI.SelectItem, { key: 'cooperativa', value: 'cooperativa' }, 'Cooperativa'),
                    h(UI.SelectItem, { key: 'otra', value: 'otra' }, 'Otra')
                  ),
                  errors['legal_form']
                    ? h(
                        'div',
                        {
                          style: { fontSize: '12px', color: 'var(--cg-danger)', marginTop: '4px' },
                        },
                        errors['legal_form']
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
          { icon: 'Phone', title: 'Contacto' },
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
                { 'data-cg-block-id': 'f_email', style: { display: 'contents' } },
                h(
                  'div',
                  { style: { flex: '1 1 260px', minWidth: 0 } },
                  h(
                    UI.Label,
                    { htmlFor: 'email', style: { display: 'block', marginBottom: '6px' } },
                    'Email'
                  ),
                  h(UI.Input, {
                    id: 'email',
                    type: 'text',
                    value: String(values['email'] ?? ''),
                    placeholder: 'Ej: martin.aguirre@gmail.com',
                    onChange: (e: any) => setField('email', e.target.value),
                  }),
                  errors['email']
                    ? h(
                        'div',
                        {
                          style: { fontSize: '12px', color: 'var(--cg-danger)', marginTop: '4px' },
                        },
                        errors['email']
                      )
                    : null
                )
              ),
              h(
                'div',
                { 'data-cg-block-id': 'f_phone', style: { display: 'contents' } },
                h(
                  'div',
                  { style: { flex: '1 1 260px', minWidth: 0 } },
                  h(
                    UI.Label,
                    { htmlFor: 'phone', style: { display: 'block', marginBottom: '6px' } },
                    'Teléfono'
                  ),
                  h(UI.Input, {
                    id: 'phone',
                    type: 'text',
                    value: String(values['phone'] ?? ''),
                    placeholder: 'Ej: 341 555-8899',
                    onChange: (e: any) => setField('phone', e.target.value),
                  }),
                  errors['phone']
                    ? h(
                        'div',
                        {
                          style: { fontSize: '12px', color: 'var(--cg-danger)', marginTop: '4px' },
                        },
                        errors['phone']
                      )
                    : null
                )
              )
            ),
            h(
              'div',
              { 'data-cg-block-id': 'f_phone2', style: { display: 'contents' } },
              h(
                'div',
                { style: { flex: '1 1 100%', minWidth: 0 } },
                h(
                  UI.Label,
                  { htmlFor: 'phone_alt', style: { display: 'block', marginBottom: '6px' } },
                  'Teléfono alternativo'
                ),
                h(UI.Input, {
                  id: 'phone_alt',
                  type: 'text',
                  value: String(values['phone_alt'] ?? ''),
                  placeholder: 'Ej: 341 444-1122',
                  onChange: (e: any) => setField('phone_alt', e.target.value),
                }),
                errors['phone_alt']
                  ? h(
                      'div',
                      { style: { fontSize: '12px', color: 'var(--cg-danger)', marginTop: '4px' } },
                      errors['phone_alt']
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
          { icon: 'MapPin', title: 'Domicilio' },
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
                { 'data-cg-block-id': 'f_street', style: { display: 'contents' } },
                h(
                  'div',
                  { style: { flex: '1 1 260px', minWidth: 0 } },
                  h(
                    UI.Label,
                    { htmlFor: 'address', style: { display: 'block', marginBottom: '6px' } },
                    'Calle y altura'
                  ),
                  h(UI.Input, {
                    id: 'address',
                    type: 'text',
                    value: String(values['address'] ?? ''),
                    placeholder: 'Ej: Mitre 2345',
                    onChange: (e: any) => setField('address', e.target.value),
                  }),
                  errors['address']
                    ? h(
                        'div',
                        {
                          style: { fontSize: '12px', color: 'var(--cg-danger)', marginTop: '4px' },
                        },
                        errors['address']
                      )
                    : null
                )
              ),
              h(
                'div',
                { 'data-cg-block-id': 'f_city', style: { display: 'contents' } },
                h(
                  'div',
                  { style: { flex: '1 1 260px', minWidth: 0 } },
                  h(
                    UI.Label,
                    { htmlFor: 'city', style: { display: 'block', marginBottom: '6px' } },
                    'Localidad'
                  ),
                  h(UI.Input, {
                    id: 'city',
                    type: 'text',
                    value: String(values['city'] ?? ''),
                    placeholder: 'Ej: Rosario',
                    onChange: (e: any) => setField('city', e.target.value),
                  }),
                  errors['city']
                    ? h(
                        'div',
                        {
                          style: { fontSize: '12px', color: 'var(--cg-danger)', marginTop: '4px' },
                        },
                        errors['city']
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
                { 'data-cg-block-id': 'f_zip', style: { display: 'contents' } },
                h(
                  'div',
                  { style: { flex: '1 1 260px', minWidth: 0 } },
                  h(
                    UI.Label,
                    { htmlFor: 'zip_code', style: { display: 'block', marginBottom: '6px' } },
                    'Código postal'
                  ),
                  h(UI.Input, {
                    id: 'zip_code',
                    type: 'text',
                    value: String(values['zip_code'] ?? ''),
                    placeholder: 'Ej: S2000',
                    onChange: (e: any) => setField('zip_code', e.target.value),
                  }),
                  errors['zip_code']
                    ? h(
                        'div',
                        {
                          style: { fontSize: '12px', color: 'var(--cg-danger)', marginTop: '4px' },
                        },
                        errors['zip_code']
                      )
                    : null
                )
              ),
              h(
                'div',
                { 'data-cg-block-id': 'f_province', style: { display: 'contents' } },
                h(
                  'div',
                  { style: { flex: '1 1 260px', minWidth: 0 } },
                  h(
                    UI.Label,
                    { htmlFor: 'province', style: { display: 'block', marginBottom: '6px' } },
                    'Provincia'
                  ),
                  h(
                    UI.Select,
                    {
                      value: String(values['province'] ?? ''),
                      onValueChange: (v: string) => setField('province', v),
                      placeholder: 'Elegir…',
                      clearable: true,
                    },
                    h(
                      UI.SelectItem,
                      { key: 'buenos_aires', value: 'buenos_aires' },
                      'Buenos Aires'
                    ),
                    h(
                      UI.SelectItem,
                      { key: 'caba', value: 'caba' },
                      'Ciudad Autónoma de Buenos Aires'
                    ),
                    h(UI.SelectItem, { key: 'catamarca', value: 'catamarca' }, 'Catamarca'),
                    h(UI.SelectItem, { key: 'chaco', value: 'chaco' }, 'Chaco'),
                    h(UI.SelectItem, { key: 'chubut', value: 'chubut' }, 'Chubut'),
                    h(UI.SelectItem, { key: 'cordoba', value: 'cordoba' }, 'Córdoba'),
                    h(UI.SelectItem, { key: 'corrientes', value: 'corrientes' }, 'Corrientes'),
                    h(UI.SelectItem, { key: 'entre_rios', value: 'entre_rios' }, 'Entre Ríos'),
                    h(UI.SelectItem, { key: 'formosa', value: 'formosa' }, 'Formosa'),
                    h(UI.SelectItem, { key: 'jujuy', value: 'jujuy' }, 'Jujuy'),
                    h(UI.SelectItem, { key: 'la_pampa', value: 'la_pampa' }, 'La Pampa'),
                    h(UI.SelectItem, { key: 'la_rioja', value: 'la_rioja' }, 'La Rioja'),
                    h(UI.SelectItem, { key: 'mendoza', value: 'mendoza' }, 'Mendoza'),
                    h(UI.SelectItem, { key: 'misiones', value: 'misiones' }, 'Misiones'),
                    h(UI.SelectItem, { key: 'neuquen', value: 'neuquen' }, 'Neuquén'),
                    h(UI.SelectItem, { key: 'rio_negro', value: 'rio_negro' }, 'Río Negro'),
                    h(UI.SelectItem, { key: 'salta', value: 'salta' }, 'Salta'),
                    h(UI.SelectItem, { key: 'san_juan', value: 'san_juan' }, 'San Juan'),
                    h(UI.SelectItem, { key: 'san_luis', value: 'san_luis' }, 'San Luis'),
                    h(UI.SelectItem, { key: 'santa_cruz', value: 'santa_cruz' }, 'Santa Cruz'),
                    h(UI.SelectItem, { key: 'santa_fe', value: 'santa_fe' }, 'Santa Fe'),
                    h(
                      UI.SelectItem,
                      { key: 'santiago_del_estero', value: 'santiago_del_estero' },
                      'Santiago del Estero'
                    ),
                    h(
                      UI.SelectItem,
                      { key: 'tierra_del_fuego', value: 'tierra_del_fuego' },
                      'Tierra del Fuego'
                    ),
                    h(UI.SelectItem, { key: 'tucuman', value: 'tucuman' }, 'Tucumán')
                  ),
                  errors['province']
                    ? h(
                        'div',
                        {
                          style: { fontSize: '12px', color: 'var(--cg-danger)', marginTop: '4px' },
                        },
                        errors['province']
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
        'Guardar'
      )
    )
  );
}
