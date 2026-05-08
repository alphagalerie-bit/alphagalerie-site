const PIX_KEY = import.meta.env.VITE_PIX_KEY as string;
const PIX_NAME = import.meta.env.VITE_PIX_NAME as string;
const PIX_CITY = import.meta.env.VITE_PIX_CITY as string;

export function gerarPayloadPix(valor: number, txid: string): string {
  function field(id: string, val: string): string {
    const len = val.length.toString().padStart(2, '0');
    return `${id}${len}${val}`;
  }

  const merchantAccount = field('00', 'BR.GOV.BCB.PIX') + field('01', PIX_KEY);

  const payload =
    field('00', '01') +
    field('26', merchantAccount) +
    field('52', '0000') +
    field('53', '986') +
    field('54', valor.toFixed(2)) +
    field('58', 'BR') +
    field('59', PIX_NAME.slice(0, 25)) +
    field('60', PIX_CITY.slice(0, 15)) +
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
