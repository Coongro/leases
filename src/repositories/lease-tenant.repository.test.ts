import type { ModuleDatabaseAPI } from '@coongro/plugin-sdk';
import { describe, expect, it, vi } from 'vitest';

/**
 * Las guardas del alta de un co-firmante.
 *
 * El CRUD crudo aceptaba cualquier par (contrato, contacto) y por eso no se publica.
 * Lo que sigue es lo que la operación de negocio mira antes de escribir; sin estos
 * tests, «tiene validaciones» es una afirmación sobre código que nadie ejercitó.
 */
vi.mock('@coongro/contacts/server', () => ({
  ContactRepository: class {},
  contactTable: { id: 'id', name: 'name' },
}));

const { LeaseTenantRepository } = await import('./lease-tenant.repository.js');

/**
 * Base de mentira que responde por turno: cada `ormQuery` consume la próxima
 * respuesta de la cola. El repositorio consulta en orden fijo —contrato, duplicado,
 * escritura—, así que alcanza con encolar lo que cada paso tiene que ver.
 */
function baseCon(respuestas: unknown[][]) {
  const cola = [...respuestas];
  const ormQuery = vi.fn(async () => cola.shift() ?? []);
  return { db: { ormQuery } as unknown as ModuleDatabaseAPI, ormQuery };
}

const CONTRATO_VIGENTE = { id: 'lease-1', status: 'vigente', principal: 'contacto-principal' };

describe('sumar un co-firmante a un contrato', () => {
  it('se niega si el contrato no existe', async () => {
    const { db } = baseCon([[]]);

    await expect(
      new LeaseTenantRepository(db).save({ leaseId: 'lease-fantasma', contactId: 'c-1' })
    ).rejects.toThrow(/no existe ese contrato/i);
  });

  it('se niega sobre un contrato rescindido, nombrando el estado', async () => {
    const { db } = baseCon([[{ ...CONTRATO_VIGENTE, status: 'rescindido' }]]);

    await expect(
      new LeaseTenantRepository(db).save({ leaseId: 'lease-1', contactId: 'c-1' })
    ).rejects.toThrow(/rescindido/);
  });

  it('se niega si la persona ya es el inquilino principal', async () => {
    const { db } = baseCon([[CONTRATO_VIGENTE]]);

    await expect(
      new LeaseTenantRepository(db).save({ leaseId: 'lease-1', contactId: 'contacto-principal' })
    ).rejects.toThrow(/ya es el inquilino principal/i);
  });

  it('se niega si esa persona ya firma este contrato', async () => {
    const { db } = baseCon([[CONTRATO_VIGENTE], [{ id: 'ct-existente' }]]);

    await expect(
      new LeaseTenantRepository(db).save({ leaseId: 'lease-1', contactId: 'c-1' })
    ).rejects.toThrow(/ya figura como co-firmante/i);
  });

  it('da de alta y avisa que fue alta, no corrección', async () => {
    const { db } = baseCon([[CONTRATO_VIGENTE], [], [{ id: 'ct-nuevo' }]]);

    const r = await new LeaseTenantRepository(db).save({
      leaseId: 'lease-1',
      contactId: 'c-1',
      role: 'conyuge',
    });

    expect(r).toEqual({ id: 'ct-nuevo', created: true });
  });

  it('al corregir uno existente no lo choca contra sí mismo', async () => {
    // La consulta de duplicados excluye el id que se está editando; si no lo hiciera,
    // guardar sin cambiar el contacto se rechazaría a sí mismo.
    const { db, ormQuery } = baseCon([[CONTRATO_VIGENTE], [], [{ id: 'ct-1' }]]);

    const r = await new LeaseTenantRepository(db).save({
      id: 'ct-1',
      leaseId: 'lease-1',
      contactId: 'c-1',
      role: 'fiador_solidario',
    });

    expect(r).toEqual({ id: 'ct-1', created: false });
    expect(ormQuery).toHaveBeenCalledTimes(3);
  });
});
