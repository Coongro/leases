import { describe, expect, it } from 'vitest';

import { leaseDeletionBlockedMessage } from './lease-deletion.js';

describe('leaseDeletionBlockedMessage', () => {
  it('un contrato que no movió nada se puede borrar', () => {
    // El caso que motivó todo: se cargó mal y todavía no pasó nada con él.
    expect(
      leaseDeletionBlockedMessage(
        { label: 'Belgrano 1240 · 1°B' },
        { billedPeriods: 0, appliedAdjustments: 0 }
      )
    ).toBeNull();
  });

  it('con períodos liquidados no, y ofrece rescindir', () => {
    const message = leaseDeletionBlockedMessage(
      { label: 'Belgrano 1240 · 1°B' },
      { billedPeriods: 3, appliedAdjustments: 0 }
    );
    expect(message).toContain('3 períodos liquidados');
    expect(message).toContain('rescindirlo');
  });

  it('una actualización aplicada alcanza para frenarlo', () => {
    // Dejó registrado que el alquiler pasó de un monto a otro: ese rastro no se borra.
    const message = leaseDeletionBlockedMessage(
      { label: '1°B' },
      { billedPeriods: 0, appliedAdjustments: 1 }
    );
    expect(message).toContain('1 actualización aplicada');
  });

  it('enumera las dos causas cuando están las dos', () => {
    const message = leaseDeletionBlockedMessage(
      { label: '1°B' },
      { billedPeriods: 2, appliedAdjustments: 3 }
    );
    expect(message).toContain('2 períodos liquidados y 3 actualizaciones aplicadas');
  });

  it('el singular y el plural no se rompen por concatenar', () => {
    const uno = leaseDeletionBlockedMessage({}, { billedPeriods: 1, appliedAdjustments: 0 });
    expect(uno).toContain('1 período liquidado');
    expect(uno).not.toContain('1 períodos');
  });

  it('sin identificar el contrato la frase igual se lee', () => {
    const message = leaseDeletionBlockedMessage(
      { label: '  ' },
      { billedPeriods: 1, appliedAdjustments: 0 }
    );
    expect(message).toContain('Este contrato');
  });
});
