import { describe, it, expect } from 'vitest';
import { calcularFrete } from './frete';

describe('calcularFrete', () => {
  it('returns zero and free label for retirada', () => {
    const r = calcularFrete('retirada', '');
    expect(r.valor).toBe(0);
    expect(r.label).toMatch(/retirada/i);
  });

  it('returns zero and free label for delivery with empty CEP', () => {
    const r = calcularFrete('delivery', '');
    expect(r.valor).toBe(0);
    expect(r.label).toBe('');
  });

  it('returns R$ 30 for CEP in Barueri range', () => {
    // CEP 06400000 to 06499999 — Barueri
    const r = calcularFrete('delivery', '06454-600');
    expect(r.valor).toBe(30);
    expect(r.label).toMatch(/Barueri/);
  });

  it('returns R$ 50 for CEP in Gênesis / CENIC range', () => {
    // CEP 06454600 to 06454999
    const r = calcularFrete('delivery', '06454-700');
    expect(r.valor).toBe(50);
    expect(r.label).toMatch(/G.nesis/);
  });

  it('returns R$ 25 for Grande SP', () => {
    const r = calcularFrete('delivery', '01310-100');
    expect(r.valor).toBe(25);
    expect(r.label).toMatch(/Grande SP/);
  });

  it('returns R$ 35 for national delivery', () => {
    const r = calcularFrete('delivery', '80010-010');
    expect(r.valor).toBe(35);
    expect(r.label).toMatch(/nacional/i);
  });
});
