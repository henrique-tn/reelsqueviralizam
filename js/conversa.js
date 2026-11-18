// "Editar virou conversa": o pedido em português e a resposta de cada arquivo, em fila.
// Antes de cada resposta aparecem os três pontos de quem está escrevendo; a mensagem entra com mola e o
// arquivo que respondeu acende na lista ao lado (no celular, embaixo). A conversa roda em volta só com a
// seção na tela e para enquanto o mouse ou o foco estão nela; quem pede menos movimento a vê inteira, parada.
// Os nomes dos arquivos saem do AJUSTES.
import { AJUSTES } from './ajustes.js';
import { relogio, mola, sobe, clamp, reduzido } from './tempo.js';

const ORDEM = ['ideias', 'roteiro', 'motion', 'revisor', 'carrossel', 'postar'];
const PEDIDO = 0.5;        // a mensagem da pessoa entra aqui (s)
const PRIMEIRA = 1.8;      // a primeira resposta...
const ENTRE = 1.7;         // ...e as outras, uma a cada 1,7 s
const DIGITANDO = 0.85;    // os três pontos antes de cada resposta
const PAUSA = 5;           // a conversa inteira fica na tela
const SAIDA = 0.45;        // e sai depressa antes de recomeçar

export function iniciarConversa(secao) {
  const chat = secao.querySelector('[data-chat]');
  const esteira = secao.querySelector('[data-esteira]');
  if (!chat) return;
  const porChave = Object.fromEntries(AJUSTES.produtos.map(p => [p.chave, p]));

  // os nomes de quem responde vêm do AJUSTES, como os da lista
  chat.querySelectorAll('[data-chave]').forEach(m => {
    const p = porChave[m.dataset.chave];
    const quem = m.querySelector('.msg-quem');
    if (p && quem) quem.textContent = p.nome;
    const pontos = m.querySelector('.msg-digitando b');
    if (p && pontos) pontos.textContent = p.nome;
  });

  const arquivos = ORDEM.map(ch => porChave[ch]).filter(p => p && p.ativo !== false);
  if (esteira) {
    esteira.replaceChildren(...arquivos.map(p => {
      const item = document.createElement('li');
      item.className = 'etapa';
      item.dataset.chave = p.chave;
      const n = document.createElement('span');
      n.className = 'etapa-n';
      n.textContent = p.n;
      const nome = document.createElement('span');
      nome.className = 'etapa-nome';
      nome.textContent = p.nome;
      const estado = document.createElement('span');
      estado.className = 'etapa-estado';
      estado.setAttribute('aria-hidden', 'true');
      item.append(n, nome, estado);
      return item;
    }));
  }

  const mensagens = [...chat.querySelectorAll('.msg')]
    .filter(m => !m.hidden)
    .map((el, k) => ({
      el,
      bolha: el.querySelector('.msg-bolha'),
      pontos: el.querySelector('.msg-digitando'),
      bolinhas: [...el.querySelectorAll('.msg-digitando i')],
      chave: el.dataset.chave || null,
      em: k === 0 ? PEDIDO : PRIMEIRA + (k - 1) * ENTRE,
    }));
  const etapas = esteira ? [...esteira.children] : [];
  const etapaDe = chave => etapas.find(e => e.dataset.chave === chave);
  const ultima = mensagens.length ? mensagens.at(-1).em : 0;
  const FIM = ultima + PAUSA;
  const VOLTA = FIM + SAIDA + 0.35;

  const estados = new Map();
  function desenha(tc) {
    const saida = sobe((tc - FIM) / SAIDA);
    for (const m of mensagens) {
      const p = (tc - m.em) / 0.6;
      const v = mola(p);
      if (m.bolha) {
        m.bolha.style.opacity = (clamp(p * 4) * (1 - saida)).toFixed(3);
        m.bolha.style.transform = p >= 1 && saida === 0 ? '' : `translateY(${((1 - v) * 18 - saida * 8).toFixed(2)}px) scale(${(0.92 + 0.08 * v).toFixed(4)})`;
      }
      if (m.pontos) {
        // os três pontos aparecem antes da resposta e encolhem quando ela chega
        const vem = sobe((tc - (m.em - DIGITANDO)) / 0.25);
        const vai = sobe((tc - m.em) / 0.18);
        const ve = vem * (1 - vai);
        m.pontos.style.opacity = ve.toFixed(3);
        m.pontos.style.transform = `scale(${(0.85 + 0.15 * ve).toFixed(3)})`;
        m.bolinhas.forEach((b, k) => {
          const fase = (tc * 5.2 - k * 0.9) % (Math.PI * 2);
          b.style.transform = `translateY(${(-4 * Math.max(0, Math.sin(fase))).toFixed(2)}px)`;
        });
      }
      const etapa = m.chave && etapaDe(m.chave);
      if (etapa) {
        const estado = saida > 0.5 || tc < m.em - DIGITANDO ? 'fila' : tc < m.em ? 'fazendo' : 'feito';
        if (estados.get(etapa) !== estado) {
          etapa.classList.toggle('fazendo', estado === 'fazendo');
          etapa.classList.toggle('pronta', estado === 'feito');
          estados.set(etapa, estado);
        }
        if (estado === 'fazendo') etapa.style.setProperty('--pisca', (0.55 + 0.45 * Math.sin(tc * 9)).toFixed(3));
      }
    }
  }

  if (reduzido) { desenha(FIM - 0.01); return; }

  // para enquanto a pessoa lê com o mouse em cima ou navega pelo teclado dentro da conversa
  let mouseEmCima = false;
  chat.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') mouseEmCima = true; });
  chat.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') mouseEmCima = false; });

  let tc = 0;
  desenha(0);
  relogio.visivel(secao, (_, dt) => {
    if (mouseEmCima || chat.contains(document.activeElement)) return;
    tc = (tc + dt) % VOLTA;
    desenha(tc);
  });
}
