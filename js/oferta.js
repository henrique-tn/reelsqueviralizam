// A conta da oferta: preço do pacote pela data, soma dos avulsos, desconto, contagem e links de compra.
// Funções puras (recebem a hora e os AJUSTES), para o teste rodar no Node: testes/oferta.test.mjs.

export const formatarReais = n => 'R$ ' + Math.round(n).toLocaleString('pt-BR');
export const emBlack = (agora, aj) => agora.getTime() < new Date(aj.fimDaBlack).getTime();
export const precoPacote = (agora, aj) => (emBlack(agora, aj) ? aj.pacote.black : aj.pacote.cheio);
export const produtosAtivos = aj => aj.produtos.filter(p => p.ativo !== false);
export const somaAvulsa = aj => produtosAtivos(aj).reduce((s, p) => s + p.preco, 0);
export const descontoPct = (agora, aj) => Math.round((1 - precoPacote(agora, aj) / somaAvulsa(aj)) * 100);

// Quanto falta para a Black acabar; null quando já acabou.
export function contagem(agora, aj) {
  const resta = new Date(aj.fimDaBlack).getTime() - agora.getTime();
  if (resta <= 0) return null;
  const s = Math.floor(resta / 1000);
  return { dias: Math.floor(s / 86400), horas: Math.floor((s % 86400) / 3600), min: Math.floor((s % 3600) / 60), seg: s % 60 };
}

// Link do checkout de um produto (ou do pacote); vazio ou só espaços vira null.
export function linkDeCompra(chave, aj) {
  const l = ((aj.comprar && aj.comprar[chave]) || '').trim();
  return l || null;
}
