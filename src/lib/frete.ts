export interface FreteResult {
  valor: number;
  label: string;
}

export function calcularFrete(
  tipoEntrega: 'retirada' | 'delivery',
  cep: string
): FreteResult {
  if (tipoEntrega === 'retirada') {
    return { valor: 0, label: 'Retirada no local · Grátis' };
  }

  const digits = cep.replace(/\D/g, '');
  if (digits.length < 7) return { valor: 0, label: '' };

  const n = parseInt(digits.slice(0, 8).padEnd(8, '0'), 10);

  // Alphaville / Gênesis / CENIC (dentro do condomínio)
  if (n >= 6454700 && n <= 6454999) {
    return { valor: 50, label: 'Motoboy · Gênesis / CENIC' };
  }
  // Região Barueri / Alphaville
  if (n >= 6400000 && n <= 6499999) {
    return { valor: 30, label: 'Motoboy · Região Barueri' };
  }
  // Grande SP (CEPs 01000000 a 09999999)
  if (n >= 1000000 && n <= 9999999) {
    return { valor: 25, label: 'Sedex · Grande SP (estimativa)' };
  }
  // Nacional
  return { valor: 35, label: 'Sedex · Envio nacional (estimativa)' };
}
