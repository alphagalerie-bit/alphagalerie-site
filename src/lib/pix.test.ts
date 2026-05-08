import { describe, it, expect } from 'vitest';

function gerarPayloadPixTestable(
  valor: number,
  txid: string,
  pixKey: string,
  pixName: string,
  pixCity: string
): string {
  function field(id: string, val: string): string {
    const len = val.length.toString().padStart(2, '0');
    return `${id}${len}${val}`;
  }

  const merchantAccount = field('00', 'BR.GOV.BCB.PIX') + field('01', pixKey);

  const payload =
    field('00', '01') +
    field('26', merchantAccount) +
    field('52', '0000') +
    field('53', '986') +
    field('54', valor.toFixed(2)) +
    field('58', 'BR') +
    field('59', pixName.slice(0, 25)) +
    field('60', pixCity.slice(0, 15)) +
    field('62', field('05', txid.slice(0, 25)));

  const crcPayload = payload + '6304';
  let crc = 0xffff;
  for (let i = 0; i < crcPayload.length; i++) {
    crc ^= crcPayload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
    }
    crc &= 0xffff;
  }

  return payload + '6304' + crc.toString(16).toUpperCase().padStart(4, '0');
}

const KEY = 'test@pix.example.com';
const NAME = 'Alpha Galerie Teste';
const CITY = 'Sao Paulo';

describe('gerarPayloadPix', () => {
  it('deve começar com "000201" (payload format indicator)', () => {
    const result = gerarPayloadPixTestable(100.0, 'TXID001', KEY, NAME, CITY);
    expect(result.startsWith('000201')).toBe(true);
  });

  it('deve conter "6304" seguido de exatamente 4 caracteres hexadecimais no final (CRC)', () => {
    const result = gerarPayloadPixTestable(50.5, 'TXID002', KEY, NAME, CITY);
    const crcBlock = result.slice(-8);
    expect(crcBlock.slice(0, 4)).toBe('6304');
    const hexChars = crcBlock.slice(4);
    expect(hexChars).toHaveLength(4);
    expect(/^[0-9A-F]{4}$/.test(hexChars)).toBe(true);
  });

  it('deve conter o valor formatado com 2 casas decimais no payload', () => {
    const result = gerarPayloadPixTestable(199.9, 'TXID003', KEY, NAME, CITY);
    expect(result).toContain('5406199.90');
  });

  it('deve conter o valor 0.01 corretamente formatado', () => {
    const result = gerarPayloadPixTestable(0.01, 'TXID004', KEY, NAME, CITY);
    expect(result).toContain('54040.01');
  });

  it('deve conter "BR.GOV.BCB.PIX" no merchantAccount (campo 26)', () => {
    const result = gerarPayloadPixTestable(10.0, 'TXID005', KEY, NAME, CITY);
    expect(result).toContain('BR.GOV.BCB.PIX');
  });

  it('deve truncar txid em 25 caracteres', () => {
    const longTxid = 'A'.repeat(30);
    const shortTxid = 'A'.repeat(25);
    const result1 = gerarPayloadPixTestable(10.0, longTxid, KEY, NAME, CITY);
    const result2 = gerarPayloadPixTestable(10.0, shortTxid, KEY, NAME, CITY);
    expect(result1).toBe(result2);
  });

  it('dois payloads com valores diferentes devem ter CRCs diferentes', () => {
    const r1 = gerarPayloadPixTestable(100.0, 'TXID', KEY, NAME, CITY);
    const r2 = gerarPayloadPixTestable(200.0, 'TXID', KEY, NAME, CITY);
    const crc1 = r1.slice(-4);
    const crc2 = r2.slice(-4);
    expect(crc1).not.toBe(crc2);
  });
});
