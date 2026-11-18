// Página de venda: a Black, os preços, a tabela, os botões de compra, os espaços de vídeo,
// o botão fixo do celular e a chave de som. Os números saem de ajustes.js; as contas, de oferta.js.
//
// Atributos que este arquivo preenche (servem para qualquer seção):
//   [data-preco="pacote"]          preço do pacote na data ("R$ 147" na Black, "R$ 297" depois)
//   [data-preco-cheio]             preço do pacote depois da Black ("R$ 297")
//   [data-preco-produto="<chave>"] preço avulso de um produto ("R$ 97")
//   [data-soma]                    soma dos avulsos ativos ("R$ 462")
//   [data-desconto]                quanto o pacote sai mais barato que a soma, com o % ("74%")
//   [data-dia-fim]                 o último dia da Black ("30/11")
//   [data-contador]                quanto falta ("12d 11:59:47"); ="dias", "horas", "min" ou "seg" dá só a parte
//   [data-so-na-black]             some depois da Black;  [data-so-depois-da-black] só aparece depois dela
//   [data-se-ativo="<chave>"]      some se o produto estiver com ativo: false
//   [data-comprar="<chave>"]       com link no AJUSTES, abre o checkout; sem link, rola até #tabela
//   [data-video="<caminho>"]       com vídeo em AJUSTES.videos (ex.: "abertura", "arquivos.motion"), o vídeo entra
//                                  no lugar do que está dentro; sem vídeo, fica o conteúdo ao vivo (vazio: some)
//   [data-som-chave]               botão que liga e silencia o som; o texto de [data-som-estado] acompanha
//   [data-tabela]                  lista que recebe uma linha por produto ativo (nome, preço, "Comprar só este")
//   [data-feitos]                  dentro de #feitos, recebe os vídeos de AJUSTES.videos.feitos
// Na Black, o <html> ganha a classe "na-black" (para o CSS que mudar com a data).
import { AJUSTES } from './ajustes.js';
import { formatarReais, emBlack, precoPacote, produtosAtivos, somaAvulsa, descontoPct, contagem, linkDeCompra } from './oferta.js';
import { relogio, reduzido } from './tempo.js';
import { som } from './som.js';
// As seções animadas entram por import() no fim deste arquivo: se uma delas (ou o demo/dados.js) falhar,
// o preço, a tabela e os botões de compra continuam funcionando.

const $ = (seletor, raiz = document) => raiz.querySelector(seletor);
const $$ = (seletor, raiz = document) => [...raiz.querySelectorAll(seletor)];
const dois = n => String(n).padStart(2, '0');

/* ---------- a hora da oferta ---------- */

// ?agora=<ISO> simula outra data, só para teste e só no computador de quem testa (localhost).
// Para o visitante vale a hora real, e o endereço com ?agora não muda nada.
const agora = (() => {
  const local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  const pedida = local ? new URLSearchParams(location.search).get('agora') : null;
  const inicio = pedida ? Date.parse(pedida.replace(/ /g, '+')) : NaN;
  if (Number.isNaN(inicio)) return () => new Date();
  const partida = Date.now();
  return () => new Date(inicio + (Date.now() - partida));
})();

const FIM = new Date(AJUSTES.fimDaBlack).getTime();
const DIA_FIM = AJUSTES.fimDaBlack.replace(/^\d{4}-(\d{2})-(\d{2}).*$/, '$2/$1');
const porChave = Object.fromEntries(AJUSTES.produtos.map(p => [p.chave, p]));

/* ---------- preços, Black e contadores ---------- */

const textoDaContagem = c => `${c.dias ? `${c.dias}d ` : ''}${dois(c.horas)}:${dois(c.min)}:${dois(c.seg)}`;
const PARTES = { dias: c => String(c.dias), horas: c => dois(c.horas), min: c => dois(c.min), seg: c => dois(c.seg) };

function escreveContador(el, c) {
  const parte = PARTES[el.dataset.contador];
  const texto = parte ? parte(c) : textoDaContagem(c);
  if (el.textContent !== texto) el.textContent = texto;
}

let naBlack = null;

function aplicarOferta() {
  const hora = agora();
  naBlack = emBlack(hora, AJUSTES);
  const preco = formatarReais(precoPacote(hora, AJUSTES));
  $$('[data-preco="pacote"]').forEach(el => { el.textContent = preco; });
  $$('[data-preco-cheio]').forEach(el => { el.textContent = formatarReais(AJUSTES.pacote.cheio); });
  $$('[data-soma]').forEach(el => { el.textContent = formatarReais(somaAvulsa(AJUSTES)); });
  $$('[data-desconto]').forEach(el => { el.textContent = `${descontoPct(hora, AJUSTES)}%`; });
  $$('[data-dia-fim]').forEach(el => { el.textContent = DIA_FIM; });
  $$('[data-preco-produto]').forEach(el => {
    const p = porChave[el.dataset.precoProduto];
    if (p) el.textContent = formatarReais(p.preco);
  });
  $$('[data-se-ativo]').forEach(el => { el.hidden = porChave[el.dataset.seAtivo]?.ativo === false; });

  // a faixa, os contadores e o que só vale na Black somem depois da data
  const faixa = document.getElementById('black');
  if (faixa) faixa.hidden = !naBlack;
  $$('[data-contador], [data-so-na-black]').forEach(el => { el.hidden = !naBlack; });
  $$('[data-so-depois-da-black]').forEach(el => { el.hidden = naBlack; });
  document.documentElement.classList.toggle('na-black', naBlack);

  const c = contagem(hora, AJUSTES);
  if (c) $$('[data-contador]').forEach(el => escreveContador(el, c));
}

// Cada contador anda de segundo em segundo, só enquanto está na tela (o relógio é um só).
function vigiarContadores() {
  for (const el of $$('[data-contador]')) {
    let ultimo = -1;
    relogio.visivel(el, () => {
      const hora = agora();
      const s = Math.floor(hora.getTime() / 1000);
      if (s === ultimo) return;
      ultimo = s;
      const c = contagem(hora, AJUSTES);
      if (c) escreveContador(el, c);
      else if (naBlack) aplicarOferta();
    });
  }
  // a luz de gravação da faixa pisca no ritmo dos segundos
  const faixa = document.getElementById('black');
  if (faixa && !reduzido) {
    let ultimo = -1;
    relogio.visivel(faixa, () => {
      const s = Math.floor(agora().getTime() / 1000);
      if (s !== ultimo) { ultimo = s; faixa.dataset.pulso = String(s % 2); }
    });
  }
  // a virada da data com a página aberta, mesmo com os contadores fora da tela
  const falta = FIM - agora().getTime();
  if (falta > 0 && falta < 2 ** 31 - 1) setTimeout(aplicarOferta, falta + 50);
}

/* ---------- tabela: separado × pacote ---------- */

function montarTabela() {
  const lista = $('[data-tabela]');
  if (!lista) return;
  lista.replaceChildren(...produtosAtivos(AJUSTES).map(p => {
    const linha = document.createElement('li');
    linha.className = 'fila-linha';
    const n = document.createElement('span');
    n.className = 'fila-n';
    n.textContent = p.n;
    const nome = document.createElement('span');
    nome.className = 'fila-nome';
    nome.textContent = p.nome;
    const preco = document.createElement('span');
    preco.className = 'fila-preco';
    preco.dataset.precoProduto = p.chave;
    preco.textContent = formatarReais(p.preco);
    const botao = document.createElement('a');
    botao.className = 'botao-mini';
    botao.href = '#tabela';
    botao.dataset.comprar = p.chave;
    botao.append('Comprar só este');
    const oculto = document.createElement('span');
    oculto.className = 'so-leitor';
    oculto.textContent = `: ${p.nome}`;
    botao.append(oculto);
    linha.append(n, nome, preco, botao);
    return linha;
  }));
}

/* ---------- botões de compra ---------- */

function irParaTabela() {
  const tabela = document.getElementById('tabela');
  if (!tabela) return;
  tabela.scrollIntoView({ behavior: reduzido ? 'auto' : 'smooth', block: 'start' });
  // o foco vai junto, para quem navega pelo teclado continuar dali
  const titulo = $('h2', tabela) || tabela;
  if (!titulo.hasAttribute('tabindex')) titulo.setAttribute('tabindex', '-1');
  titulo.focus({ preventScroll: true });
}

function ligarCompras() {
  // com link: o próprio link leva ao checkout (Ctrl+clique abre noutra aba); sem link: aponta a tabela
  $$('a[data-comprar]').forEach(a => { a.href = linkDeCompra(a.dataset.comprar, AJUSTES) || '#tabela'; });
  // um ouvinte só, para valer também nos botões que as seções criarem depois
  document.addEventListener('click', e => {
    const botao = e.target instanceof Element ? e.target.closest('[data-comprar]') : null;
    if (!botao) return;
    const link = linkDeCompra(botao.dataset.comprar, AJUSTES);
    if (link) {
      if (botao.tagName === 'A') botao.href = link;
      else location.assign(link);
      return;
    }
    e.preventDefault();
    irParaTabela();
  });
}

/* ---------- espaços de vídeo ---------- */

function videoDe(caminho) {
  return caminho.split('.').reduce((o, k) => (o == null ? o : o[k]), AJUSTES.videos);
}

// Nenhum vídeo baixa ao abrir a página (preload="none", sem autoplay): cada um só carrega e toca quando
// aparece na tela, e pausa quando sai. O da abertura fica de fora, porque quem o toca é a linha do tempo.
// Quem pede menos movimento vê o pôster e toca pelo controle do próprio vídeo.
const vigiaVideos = typeof IntersectionObserver === 'function'
  ? new IntersectionObserver(entradas => {
    for (const e of entradas) {
      const video = e.target;
      if (e.isIntersecting) video.play().catch(() => {});
      else if (!video.paused) video.pause();
    }
  }, { threshold: 0.25 })
  : null;

function criarVideo(v, { sozinho = true } = {}) {
  const video = document.createElement('video');
  // o atributo e a propriedade: sem a propriedade, o navegador não deixa tocar sem som
  video.muted = true;
  video.playsInline = true;
  video.loop = true;
  for (const a of ['muted', 'playsinline', 'loop']) video.setAttribute(a, '');
  video.preload = 'none';
  if (v.poster) video.poster = v.poster;
  if (v.legenda) video.setAttribute('aria-label', v.legenda);
  video.src = v.src;
  if (sozinho) {
    if (reduzido || !vigiaVideos) video.controls = true;
    else vigiaVideos.observe(video);
  }
  return video;
}

function montarVideos() {
  for (const espaco of $$('[data-video]')) {
    const v = videoDe(espaco.dataset.video);
    if (v && v.src) {
      espaco.replaceChildren(criarVideo(v, { sozinho: espaco.dataset.video !== 'abertura' }));
      espaco.classList.add('com-video');
    } else if (!espaco.children.length) {
      espaco.hidden = true;
    }
  }
  // "Feitos com os arquivos" só aparece com algum vídeo na lista
  const secao = document.getElementById('feitos');
  if (!secao) return;
  const feitos = (AJUSTES.videos.feitos || []).filter(v => v && v.src);
  secao.hidden = !feitos.length;
  const trilho = $('[data-feitos]', secao);
  if (!feitos.length || !trilho) return;
  trilho.replaceChildren(...feitos.map(v => {
    const figura = document.createElement('figure');
    figura.className = 'feito';
    figura.append(criarVideo(v));
    if (v.legenda) {
      const legenda = document.createElement('figcaption');
      legenda.textContent = v.legenda;
      figura.append(legenda);
    }
    return figura;
  }));
}

/* ---------- botão fixo do celular ---------- */

// Aparece quando o celular da abertura sai da tela e se esconde onde já há um botão de compra à vista
// (o da própria abertura, logo abaixo do celular, também conta).
function ligarBotaoFixo() {
  const botao = document.getElementById('botao-fixo');
  const vitrine = document.querySelector('#abertura .vitrine');
  if (!botao || !vitrine || typeof IntersectionObserver !== 'function') return;
  const comBotao = [document.querySelector('#abertura .botao'), ...['tabela', 'preco', 'fecho'].map(id => document.getElementById(id))].filter(Boolean);
  const naTela = new Map([[vitrine, true]]);
  const ajusta = () => {
    const mostra = !naTela.get(vitrine) && !comBotao.some(el => naTela.get(el));
    botao.classList.toggle('ativo', mostra);
  };
  // Uma seção só conta como "na tela" quando passa da faixa de baixo (os últimos 20% da tela) e
  // enquanto não saiu por cima; sem essa margem, uma seção encostada na borda já contaria.
  const vigia = new IntersectionObserver(entradas => {
    for (const e of entradas) naTela.set(e.target, e.isIntersecting);
    ajusta();
  }, { rootMargin: '-1px 0px -20% 0px' });
  [vitrine, ...comBotao].forEach(el => vigia.observe(el));
}

/* ---------- chave de som ---------- */

function ligarChavesDeSom() {
  const chaves = $$('[data-som-chave]');
  const mostra = ligado => chaves.forEach(chave => {
    const estado = $('[data-som-estado]', chave);
    if (estado) estado.textContent = ligado ? 'ligado' : 'desligado';
    chave.setAttribute('aria-pressed', String(ligado));
  });
  chaves.forEach(chave => chave.addEventListener('click', () => (som.ligado() ? som.silenciar() : som.ligar())));
  som.aoMudar(mostra);
  mostra(som.ligado());
}

/* ---------- partida ---------- */

// Liga uma parte sem deixar o erro dela derrubar as outras (o erro aparece no console, com o nome).
function iniciar(nome, fn) {
  try {
    fn();
  } catch (erro) {
    console.error(`Falhou ao iniciar: ${nome}.`, erro);
  }
}

iniciar('tabela', montarTabela);
iniciar('oferta', aplicarOferta);
iniciar('contadores', vigiarContadores);
iniciar('compras', ligarCompras);
iniciar('vídeos', montarVideos);
iniciar('botão fixo', ligarBotaoFixo);
iniciar('som', ligarChavesDeSom);

// Seções animadas: cada módulo entra por import(), e um módulo que não carrega só tira as seções dele.
// Para uma seção nova: ponha o módulo na lista e uma linha [nome, módulo, função, id da seção] abaixo.
const MODULOS = {
  linha: import('./linha-do-tempo.js'), editando: import('./editando.js'), conversa: import('./conversa.js'),
  catalogo: import('./catalogo.js'), efeitos: import('./efeitos.js'), venda: import('./venda.js'),
};
const SECOES = [
  ['linha do tempo', 'linha', 'iniciarLinhaDoTempo', 'abertura'],
  ['editando', 'editando', 'iniciarEditando', 'editando'],
  ['conversa', 'conversa', 'iniciarConversa', 'conversa'],
  ['arquivos', 'catalogo', 'iniciarCatalogo', 'arquivos'],
  ['efeitos', 'efeitos', 'iniciarEfeitos', 'efeitos'],
  ['prova', 'venda', 'iniciarProva', 'prova'],
  ['tabela em movimento', 'venda', 'iniciarTabela', 'tabela'],
  ['o que você recebe', 'venda', 'iniciarRecebe', 'recebe'],
  ['para quem', 'venda', 'iniciarPraQuem', 'pra-quem'],
  ['preço', 'venda', 'iniciarPreco', 'preco'],
  ['dúvidas', 'venda', 'iniciarDuvidas', 'duvidas'],
  ['fecho', 'venda', 'iniciarFecho', 'fecho'],
];
// as seções começam na ordem da página, depois de todos os módulos chegarem (ou falharem)
const chaves = Object.keys(MODULOS);
Promise.allSettled(chaves.map(k => MODULOS[k])).then(resultados => {
  const carregados = {};
  resultados.forEach((r, k) => {
    if (r.status === 'fulfilled') carregados[chaves[k]] = r.value;
    else console.error(`Falhou ao carregar o módulo: ${chaves[k]}.`, r.reason);
  });
  for (const [nome, modulo, funcao, id] of SECOES) {
    const m = carregados[modulo];
    if (m) iniciar(nome, () => m[funcao](document.getElementById(id)));
  }
});
