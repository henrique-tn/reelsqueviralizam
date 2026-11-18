// Abertura: a cena de exemplo tocando no celular e a linha do tempo dela, como num editor de vídeo.
//
// A agulha anda com a cena. Arrastar (dedo ou mouse) pausa e mostra o quadro exato (__seek da cena);
// soltar continua dali. Com o som ligado, a mistura da cena (demo/som.mp3) manda no tempo, para a
// imagem não escorregar do som. Com a cena fora da tela, nada anda e o som para.
//
// As faixas: VOZ e LEGENDA saem do tempo real de cada palavra (demo/dados.js); EFEITOS e SOM são os
// efeitos e os sons que a própria cena (demo/cena.html) prende às palavras, com as durações dela.
//
// Também exporta o que o "Veja a IA editando" reaproveita: frases, palavras, efeitos, sons e a mistura.
import '../demo/dados.js';
import { relogio, mola, clamp, reduzido } from './tempo.js';
import { som } from './som.js';

const KIT = window.KIT;

/* ---------- o tempo de cada palavra ---------- */

// O som.mp3 tem meio segundo a mais que a voz: a cena para no último quadro enquanto o sino soa.
export const CAUDA = 0.5;
export const FIM_DA_CENA = KIT.duracao;                                    // 13,45 s
export const DURACAO = Math.round((FIM_DA_CENA + CAUDA) * 100) / 100;     // 13,95 s: uma volta da agulha

const soLetras = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
export const semPontuacao = s => s.replace(/[.,:;!?…]+$/, '');
// A diferença entre dois instantes na volta da agulha (13,9 s depois do fim vem logo antes do 0,1 s).
export const diferenca = (a, b) => ((a - b) % DURACAO + DURACAO * 1.5) % DURACAO - DURACAO / 2;

export const PALAVRAS = KIT.palavras.map(([texto, a, b], n) => ({ texto, a, b: Math.min(b, DURACAO), n }));

// As frases da narração: cada uma termina na palavra com ponto final.
export const FRASES = [];
for (let k = 0, comeco = 0; k < PALAVRAS.length; k++) {
  if (/[.!?…]$/.test(PALAVRAS[k].texto) || k === PALAVRAS.length - 1) {
    const palavras = PALAVRAS.slice(comeco, k + 1);
    FRASES.push({ palavras, a: palavras[0].a, b: palavras.at(-1).b, texto: palavras.map(p => p.texto).join(' ') });
    comeco = k + 1;
  }
}

// Onde o trecho começa dentro da frase i, como a função palavra() da cena: { a: segundo, texto: "Um" }.
export function ancora(i, trecho, ajuste = 0) {
  const frase = FRASES[i];
  const alvo = trecho.split(/\s+/).map(soLetras);
  const lista = frase ? frase.palavras.map(p => soLetras(p.texto)) : [];
  for (let k = 0; k + alvo.length <= lista.length; k++) {
    if (alvo.every((w, j) => lista[k + j] === w)) {
      const achadas = frase.palavras.slice(k, k + alvo.length);
      return { a: achadas[0].a + ajuste, texto: semPontuacao(achadas.map(p => p.texto).join(' ')) };
    }
  }
  console.warn(`Linha do tempo: a frase ${i} da narração não tem "${trecho}".`);
  return { a: (frase ? frase.a : 0) + ajuste, texto: trecho };
}

/* ---------- os efeitos e os sons da cena ---------- */

// Os efeitos que demo/cena.html faz, presos às mesmas palavras e com as mesmas durações.
// nome: o rótulo na faixa; selo: o nome sob o celular (quando dois efeitos caem na mesma palavra).
const MOLDE_EFEITOS = [
  { nome: 'Contador', de: [0, 'Três', 0.1], ate: [0, 'travando'] },                        // seguidores: 296 → 312
  { nome: 'Carimbo', selo: 'Carimbo + tremor', de: [0, 'travando'], dura: 0.5 },           // "TRAVADO" entra torto e o número treme
  { nome: 'Pulso', de: [0, 'perfil'], dura: 0.4 },                                         // o cartão do perfil aperta
  { nome: 'Mola', selo: 'Mola + subida', de: [1, 'Um'], dura: 0.4 },                       // o 1 cresce passando do ponto; o nome sobe
  { nome: 'Mola', de: [1, 'gancho'], dura: 0.45 },                                         // o gráfico de quem continua assistindo
  { nome: 'Carimbo', selo: 'Carimbo + pulso', de: [1, 'três segundos'], dura: 0.95 },      // "3 SEGUNDOS", que pulsa depois
  { nome: 'Mola', selo: 'Mola + subida', de: [2, 'Dois'], dura: 0.4 },
  { nome: 'Mola', de: [2, 'vídeo'], dura: 0.45 },                                          // o celular sem legenda
  { nome: 'Mola', de: [2, 'sem som'], dura: 0.45 },                                        // o alto-falante mudo
  { nome: 'Mola', selo: 'Mola + subida', de: [3, 'Três'], dura: 0.4 },
  { nome: 'Mola', de: [3, 'postar'], dura: 0.45 },                                         // o calendário com um post só
  { nome: 'Carimbo', de: [3, 'sumir'], dura: 0.45 },                                       // "SUMIU"
  { nome: 'Mola', de: [4, 'Arrume'], dura: 0.4 },                                          // "ARRUME OS 3"
  { nome: 'Contador', selo: 'Contador + barra', de: [4, 'o perfil'], ate: [4, 'crescer'] }, // 312 → 12.480, e a barra enche
  { nome: 'Mola', selo: 'Mola + raios', de: [4, 'crescer'], dura: 0.7 },                   // "VOLTA A CRESCER", a seta e os raios
];

// Os sons do bloco SONS da cena (o som.mp3 já traz a mistura pronta). dura: o tamanho de cada arquivo.
const MOLDE_SONS = [
  { nome: 'falha', de: [0, 'travando'], dura: 0.6 },
  { nome: 'pop', de: [1, 'Um'], dura: 0.9 },
  { nome: 'pop', de: [2, 'Dois'], dura: 0.9 },
  { nome: 'pop', de: [3, 'Três'], dura: 0.9 },
  { nome: 'whoosh', de: [4, 'o perfil'], dura: 0.8 },     // o whoosh-longo da cena
  { nome: 'ding', de: [4, 'crescer'], dura: 2.0 },
];
export const TRILHA = 'calma';

// Cada item vira { nome, selo, a, b, palavra }: começa na palavra e termina onde assenta,
// sem passar do começo do próximo (uma faixa só, sem sobreposição) nem do fim do tempo dado.
function resolve(molde, teto) {
  const lista = molde.map(m => {
    const inicio = ancora(...m.de);
    const fim = m.ate ? ancora(...m.ate).a : inicio.a + m.dura;
    return { nome: m.nome, selo: m.selo || m.nome, a: inicio.a, b: fim, palavra: inicio.texto };
  }).sort((x, y) => x.a - y.a);
  lista.forEach((item, k) => { item.b = Math.min(item.b, lista[k + 1] ? lista[k + 1].a : teto, teto); });
  return lista;
}
export const EFEITOS = resolve(MOLDE_EFEITOS, FIM_DA_CENA);
export const SONS = resolve(MOLDE_SONS, DURACAO);

/* ---------- a mistura: um áudio só para a página ---------- */

// A abertura e o "Veja a IA editando" revezam no mesmo som.mp3, e só um toca por vez.
// Quem solta o som avisa os outros, para quem ainda o quer pegar de volta.
//
// O arquivo vem inteiro (fetch) e toca de um blob: assim o áudio pula para qualquer segundo em
// qualquer servidor, mesmo nos que não atendem pedido de um pedaço do arquivo (o servir.mjs, por exemplo).
// Enquanto ele não chega, cada seção anda no próprio relógio; quando chega, o dono entra no tempo certo.
export const mistura = (() => {
  const audio = new Audio();
  audio.preload = 'none';
  audio.loop = true;
  const endereco = new URL('../demo/som.mp3', import.meta.url).href;
  const interessados = new Set();
  const avisa = () => { for (const fn of interessados) fn(); };
  let dono = null;
  let pronto = false;          // o áudio já tem o arquivo inteiro e pode pular para qualquer segundo
  let buscando = false;
  let partida = null;          // o segundo pedido antes de o áudio saber a própria duração
  let soando = false;          // o som está saindo de verdade: o relógio dele já andou depois de começar
  let marco = null;            // onde o relógio do áudio estava quando ele começou (ou pulou)
  const esperaAndar = () => { soando = false; marco = audio.currentTime; };
  audio.addEventListener('loadedmetadata', () => { if (dono && partida !== null) audio.currentTime = partida; partida = null; });
  audio.addEventListener('playing', esperaAndar);
  audio.addEventListener('seeked', () => { if (!audio.paused) esperaAndar(); });
  for (const evento of ['pause', 'waiting', 'seeking', 'emptied', 'ended']) audio.addEventListener(evento, () => { soando = false; marco = null; });

  function busca() {
    if (buscando) return;
    buscando = true;
    fetch(endereco)
      .then(r => (r.ok ? r.blob() : Promise.reject(new Error(String(r.status)))))
      .then(blob => { audio.src = URL.createObjectURL(blob); })
      .catch(() => { audio.src = endereco; })   // sem fetch: toca do endereço mesmo
      .finally(() => { pronto = true; dono = null; avisa(); });
  }

  // O toque libera o áudio no celular: o Safari só deixa um áudio tocar sozinho depois de um play() feito
  // dentro de um toque. Enquanto o som.mp3 não chegou, o play() é de um silêncio de poucos bytes (assim o
  // arquivo não é baixado duas vezes); a pausa vem só depois de o play() dar certo, porque um pause() logo
  // em seguida cancela o play() e a promessa falha. O som.js chama isto a cada gesto até dar certo.
  const SILENCIO = 'data:audio/wav;base64,UklGRiwAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQgAAACAgICAgICAgA==';
  som.aoDestravar(() => {
    if (!audio.paused) return Promise.resolve();          // já está tocando: destravado
    const comArquivo = pronto;
    if (!comArquivo && !buscando) audio.src = SILENCIO;
    audio.muted = true;                                   // com o arquivo já aqui, o teste não pode soar
    const p = Promise.resolve(audio.play());
    return p.then(() => { if (!dono || !comArquivo) audio.pause(); })
      .finally(() => { audio.muted = false; busca(); });
  });

  return {
    tocar(quem, t) {
      dono = quem;
      if (!pronto) { busca(); return; }    // o som entra quando o arquivo chegar
      partida = audio.readyState < 1 ? t : null;
      try { audio.currentTime = t; } catch { /* sem dados ainda: vale a partida, no loadedmetadata */ }
      const p = audio.play();
      if (p) p.catch(() => { if (dono === quem && audio.paused) dono = null; });
    },
    parar(quem) {
      if (dono !== quem) return;
      dono = null;
      audio.pause();
      avisa();
    },
    // O tempo do som, para o dono, só com o som saindo de verdade; null nos outros casos, e então cada
    // seção anda no próprio relógio (assim a cena não para enquanto o áudio começa).
    tempo(quem) {
      if (dono !== quem || audio.paused) return null;
      if (!soando && marco !== null && Math.abs(audio.currentTime - marco) > 0.01) soando = true;
      return soando ? audio.currentTime : null;
    },
    tocando: quem => dono === quem && !audio.paused,
    // O som corre atrás da cena (depois de o áudio demorar a começar, por exemplo).
    acerta(quem, t) { if (dono === quem && pronto) { try { audio.currentTime = t; } catch { /* sem dados */ } } },
    livre: () => dono === null,
    dono: () => dono,
    aoLiberar(fn) { interessados.add(fn); },
  };
})();

/* ---------- desenho das faixas ---------- */

const dois = n => String(n).padStart(2, '0');
const pct = s => `${((s / DURACAO) * 100).toFixed(3)}%`;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

export function relogioTexto(s) {
  const cs = Math.floor(Math.max(0, s) * 100 + 1e-6);
  return `${dois(Math.floor(cs / 6000))}:${dois(Math.floor(cs / 100) % 60)},${dois(cs % 100)}`;
}
export const segundos = s => `${s.toFixed(2).replace('.', ',')} s`;

// Barulho fixo por barra: a onda tem sempre o mesmo desenho.
const ruido = k => { const x = Math.sin(k * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// A onda da voz: barras onde há palavra, quase nada no silêncio. Viewbox 1000 x 100, esticada na faixa.
export function ondaDaVoz(passo = 0.045) {
  const n = Math.ceil(DURACAO / passo);
  const largura = (passo / DURACAO) * 1000;
  let barras = '';
  for (let k = 0; k < n; k++) {
    const s = (k + 0.5) * passo;
    const p = PALAVRAS.find(w => s >= w.a && s <= w.b);
    let h = 0.07;
    if (p) {
      const u = (s - p.a) / Math.max(p.b - p.a, 0.05);
      h = 0.16 + 0.84 * Math.pow(Math.sin(Math.PI * clamp(u)), 0.55) * (0.38 + 0.62 * ruido(k));
    }
    const alto = h * 100;
    barras += `<rect x="${(k * largura).toFixed(2)}" y="${(50 - alto / 2).toFixed(2)}" width="${(largura * 0.58).toFixed(2)}" height="${alto.toFixed(2)}"/>`;
  }
  return `<svg viewBox="0 0 1000 100" preserveAspectRatio="none" aria-hidden="true">${barras}</svg>`;
}

const LETRA = 11;   // px do rótulo de marca (mono): cada letra ocupa 0,6 em
const precisa = nome => Math.ceil(nome.length * LETRA * 0.6) + 7;   // o nome começa 6 px depois do traço

function montarFaixas(faixas) {
  const regua = faixas.querySelector('[data-regua]');
  let tiques = '';
  for (let s = 0; s <= DURACAO + 1e-6; s += 0.5) {
    const cheio = Math.abs(s - Math.round(s)) < 1e-6;
    tiques += `<i class="${cheio ? 'tique' : 'tique meio'}" style="left:${pct(s)}"></i>`;
    if (cheio && s < DURACAO - 0.4) tiques += `<span class="tique-n" style="left:${pct(s)}">0:${dois(s)}</span>`;
  }
  regua.innerHTML = tiques;

  const voz = faixas.querySelector('[data-faixa="voz"]');
  const onda = ondaDaVoz();
  voz.innerHTML = `<div class="onda">${onda}</div><div class="onda onda-tocada">${onda}</div>`;

  const legenda = faixas.querySelector('[data-faixa="legenda"]');
  legenda.innerHTML = FRASES.map(f =>
    `<div class="bloco" style="left:${pct(f.a)};width:${pct(f.b - f.a)}"><span>${esc(f.texto)}</span></div>`).join('');

  const marcas = (lista, classe) => lista.map(m =>
    `<div class="marcador ${classe}" style="left:${pct(m.a)};width:${pct(m.b - m.a)}"><span class="marcador-barra"></span><span class="marcador-nome">${esc(m.nome)}</span></div>`).join('');
  faixas.querySelector('[data-faixa="efeitos"]').innerHTML = marcas(EFEITOS, 'marcador-efeito');
  faixas.querySelector('[data-faixa="som"]').innerHTML = `<span class="trilha"></span>${marcas(SONS, 'marcador-som')}`;

  return {
    tocada: voz.querySelector('.onda-tocada'),
    blocos: [...legenda.children],
    efeitos: [...faixas.querySelectorAll('.marcador-efeito')],
    sons: [...faixas.querySelectorAll('.marcador-som')],
  };
}

// O rótulo de cada marca só aparece se couber até a próxima marca (o nome inteiro está no selo).
function ajustaRotulos(largura, lista, elementos) {
  lista.forEach((m, k) => {
    const ate = lista[k + 1] ? lista[k + 1].a : DURACAO;
    const cabe = ((ate - m.a) / DURACAO) * largura >= precisa(m.nome);
    elementos[k].classList.toggle('sem-nome', !cabe);
  });
}

/* ---------- a abertura ---------- */

export function iniciarLinhaDoTempo(secao) {
  const $ = s => secao.querySelector(s);
  const linha = $('[data-linha]');
  const pista = $('[data-pista]');
  const faixas = $('[data-faixas]');
  if (!linha || !pista || !faixas) return;
  const rolagem = $('[data-rolagem]');
  const miolo = rolagem.firstElementChild;
  const rotulos = $('.linha-rotulos');
  const agulha = $('[data-agulha]');
  const tela = $('.tela');
  const vitrine = $('.vitrine');
  const selo = $('.selo-efeito');
  const seloNome = $('[data-selo]');
  const tempoTexto = $('[data-tempo]');
  const botaoTocar = $('[data-tocar]');

  linha.style.setProperty('--duracao', DURACAO);
  const { tocada, blocos, efeitos, sons } = montarFaixas(faixas);
  const total = $('[data-total]');
  if (total) total.textContent = relogioTexto(DURACAO);
  pista.setAttribute('aria-valuemax', DURACAO.toFixed(2));

  let t = 0;
  let tocando = !reduzido;              // quem pede menos movimento começa com a cena parada no gancho
  let arrastando = false;
  let midiaNaTela = false;              // celular ou linha do tempo com algum pedaço na tela
  let somNaTela = false;                // celular ou linha do tempo bem à vista: só então o som toca
  const visto = new Map();

  /* --- geometria, refeita quando o tamanho muda --- */
  // medidas guardadas aqui, para o quadro não ler o layout logo depois de escrever nele
  let larguraFaixas = 1, inicioFaixas = 0, larguraRotulos = 0, sobraRolagem = 0, janelaRolagem = 0, posRolagem = 0;
  const medir = () => {
    larguraFaixas = faixas.clientWidth || 1;
    larguraRotulos = rotulos ? rotulos.offsetWidth : 0;
    inicioFaixas = faixas.getBoundingClientRect().left - miolo.getBoundingClientRect().left;
    janelaRolagem = rolagem.clientWidth;
    sobraRolagem = rolagem.scrollWidth - janelaRolagem;
    posRolagem = rolagem.scrollLeft;
    ajustaRotulos(larguraFaixas, EFEITOS, efeitos);
    ajustaRotulos(larguraFaixas, SONS, sons);
  };
  medir();
  if (typeof ResizeObserver === 'function') {
    const vigia = new ResizeObserver(medir);
    vigia.observe(faixas);
    vigia.observe(rolagem);
  }

  /* --- o som --- */
  function acertaSom() {
    const deve = som.ligado() && tocando && !arrastando && somNaTela && !document.hidden;
    if (deve) {
      if (!mistura.tocando('abertura') && (mistura.livre() || mistura.dono() === 'abertura')) mistura.tocar('abertura', t);
    } else {
      mistura.parar('abertura');
    }
  }
  som.aoMudar(acertaSom);
  mistura.aoLiberar(acertaSom);
  document.addEventListener('visibilitychange', acertaSom);

  if (typeof IntersectionObserver === 'function') {
    const vigia = new IntersectionObserver(entradas => {
      for (const e of entradas) visto.set(e.target, e.isIntersecting ? e.intersectionRatio : 0);
      const fone = visto.get(vitrine) || 0, tl = visto.get(linha) || 0;
      midiaNaTela = fone > 0 || tl > 0;
      somNaTela = fone >= 0.35 || tl >= 0.6;
      acertaSom();
    }, { threshold: [0, 0.35, 0.6, 1] });
    [vitrine, linha].filter(Boolean).forEach(el => vigia.observe(el));
  } else {
    midiaNaTela = somNaTela = true;
  }

  /* --- ir para um instante (teclado, toque curto) --- */
  function irPara(novo) {
    t = clamp(novo, 0, DURACAO - 0.001);
    if (mistura.tocando('abertura')) mistura.tocar('abertura', t);
    desenha(0, true);
  }
  const tempoEm = x => {
    const r = faixas.getBoundingClientRect();
    return clamp((x - r.left) / r.width, 0, 0.99999) * DURACAO;
  };

  /* --- arrastar a agulha: o mouse arrasta na hora; o dedo, quando o gesto é de lado --- */
  let ponteiro = null, x0 = 0, y0 = 0, xPonteiro = 0, decidindo = false;
  function comecaArraste(e) {
    decidindo = false;
    arrastando = true;
    try { pista.setPointerCapture(e.pointerId); } catch { /* o ponteiro já saiu */ }
    linha.classList.add('arrastando');
    t = tempoEm(e.clientX);
    acertaSom();
    desenha(0, true);
  }
  pista.addEventListener('pointerdown', e => {
    if (ponteiro !== null || (e.pointerType === 'mouse' && e.button !== 0)) return;
    ponteiro = e.pointerId;
    x0 = xPonteiro = e.clientX;
    y0 = e.clientY;
    if (e.pointerType === 'mouse') { e.preventDefault(); pista.focus({ preventScroll: true }); comecaArraste(e); }
    else decidindo = true;
  });
  pista.addEventListener('pointermove', e => {
    if (e.pointerId !== ponteiro) return;
    xPonteiro = e.clientX;
    if (decidindo) {
      const dx = e.clientX - x0, dy = e.clientY - y0;
      if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) comecaArraste(e);
      return;
    }
    if (arrastando) { t = tempoEm(e.clientX); desenha(0, true); }
  });
  function solta(e) {
    if (e.pointerId !== ponteiro) return;
    const toqueCurto = decidindo && e.type === 'pointerup';
    ponteiro = null;
    decidindo = false;
    if (arrastando) {
      arrastando = false;
      linha.classList.remove('arrastando');
      acertaSom();
    } else if (toqueCurto) {
      irPara(tempoEm(e.clientX));   // um toque na faixa leva a agulha até o dedo
    }
    desenha(0, true);
  }
  pista.addEventListener('pointerup', solta);
  pista.addEventListener('pointercancel', solta);
  // no toque, a captura implícita prende o ponteiro ao filho sob o dedo; quando a pista pega a captura, o filho
  // perde a dele e o evento sobe até aqui: só a perda da própria pista encerra o arraste
  pista.addEventListener('lostpointercapture', e => { if (e.target === pista) solta(e); });

  pista.addEventListener('keydown', e => {
    const passo = { ArrowRight: 0.5, ArrowUp: 0.5, ArrowLeft: -0.5, ArrowDown: -0.5, PageUp: 2, PageDown: -2 }[e.key];
    if (passo !== undefined) irPara(t + passo);
    else if (e.key === 'Home') irPara(0);
    else if (e.key === 'End') irPara(DURACAO);
    else return;
    e.preventDefault();
  });

  /* --- tocar e pausar --- */
  function mostraBotao() {
    linha.classList.toggle('pausada', !tocando);
    if (botaoTocar) botaoTocar.setAttribute('aria-label', tocando ? 'Pausar a cena' : 'Tocar a cena');
  }
  if (botaoTocar) botaoTocar.addEventListener('click', () => { tocando = !tocando; mostraBotao(); acertaSom(); desenha(0, true); });
  mostraBotao();

  /* --- a rolagem lateral (celular): a linha acompanha a agulha; quem rola com a mão manda por 2,5 s --- */
  let minhaRolagem = -1, mexeuNaRolagem = -1e9;
  rolagem.addEventListener('scroll', () => {
    posRolagem = rolagem.scrollLeft;
    if (Math.abs(posRolagem - minhaRolagem) > 2) mexeuNaRolagem = performance.now();
  }, { passive: true });
  const rola = x => { minhaRolagem = posRolagem = x; rolagem.scrollLeft = x; };

  function seguir(dt) {
    const sobra = sobraRolagem;
    if (sobra < 2) return;
    const janela = janelaRolagem - larguraRotulos;     // a parte visível das faixas (os rótulos ficam presos)
    if (arrastando) {
      // o dedo perto da borda empurra a linha para aquele lado (só aqui o layout é lido, durante o arraste)
      const r = rolagem.getBoundingClientRect();
      const esq = r.left + larguraRotulos + 28, dir = r.right - 28;
      let v = 0;
      if (xPonteiro > dir) v = Math.min(1.5, (xPonteiro - dir) / 28);
      else if (xPonteiro < esq) v = -Math.min(1.5, (esq - xPonteiro) / 28);
      if (v) { rola(clamp(posRolagem + v * 520 * dt, 0, sobra)); t = tempoEm(xPonteiro); }
      return;
    }
    if (performance.now() - mexeuNaRolagem < 2500) return;
    const x = inicioFaixas + (t / DURACAO) * larguraFaixas;   // a agulha, contada do começo do conteúdo
    const alvo = clamp(x - larguraRotulos - janela * 0.3, 0, sobra);
    const atual = posRolagem;
    if (Math.abs(alvo - atual) < 0.5) return;
    rola(dt > 0 ? atual + (alvo - atual) * Math.min(1, dt * 12) : alvo);
  }

  /* --- o vídeo, quando o AJUSTES tiver um no lugar da cena: segue a agulha --- */
  function acertaVideo(v) {
    const fim = (isFinite(v.duration) && v.duration > 0 ? v.duration : DURACAO) - 0.05;
    const alvo = Math.min(t, fim);
    if (tocando && !arrastando) {
      if (v.paused) v.play().catch(() => {});
      if (Math.abs(v.currentTime - alvo) > 0.35) v.currentTime = alvo;
    } else {
      if (!v.paused) v.pause();
      if (Math.abs(v.currentTime - alvo) > 0.04) v.currentTime = alvo;
    }
  }

  function janelaDaCena() {
    const quadro = tela && tela.querySelector('iframe');
    try {
      const w = quadro && quadro.contentWindow;
      return w && typeof w.__seek === 'function' ? w : null;
    } catch { return null; }
  }

  /* --- um quadro --- */
  let tDesenhado = -1, janelaDesenhada = null;
  let iEfeito = -2, iLegenda = -2, iSom = -2, nomeSelo = '', trocaSelo = -1e9, ariaEm = -1;
  const acha = (lista, s) => lista.findIndex(m => s >= m.a && s < m.b);

  function desenha(dt, forca = false) {
    const janela = janelaDaCena();
    if (janela && (t !== tDesenhado || janela !== janelaDesenhada)) {
      janela.__seek(Math.min(t, FIM_DA_CENA));
      tDesenhado = t;
      janelaDesenhada = janela;
    }
    const video = tela && tela.querySelector('video');
    if (video) acertaVideo(video);

    const p = t / DURACAO;
    agulha.style.left = `${(p * 100).toFixed(3)}%`;
    tocada.style.clipPath = `inset(0 ${((1 - p) * 100).toFixed(3)}% 0 0)`;

    const e = acha(EFEITOS, t), l = acha(FRASES, t), s = acha(SONS, t);
    if (e !== iEfeito) { efeitos.forEach((el, k) => el.classList.toggle('ativo', k === e)); iEfeito = e; }
    if (l !== iLegenda) { blocos.forEach((el, k) => el.classList.toggle('ativo', k === l)); iLegenda = l; }
    if (s !== iSom) { sons.forEach((el, k) => el.classList.toggle('ativo', k === s)); iSom = s; }

    // o selo: o efeito que está acontecendo; entre um e outro, o último, apagado
    let ultimo = 0;
    EFEITOS.forEach((m, k) => { if (m.a <= t) ultimo = k; });
    const nome = (e >= 0 ? EFEITOS[e] : EFEITOS[ultimo]).selo;
    if (selo) selo.classList.toggle('aceso', e >= 0);
    if (seloNome && nome !== nomeSelo) {
      seloNome.textContent = nome;
      if (nomeSelo && !reduzido) trocaSelo = performance.now();
      nomeSelo = nome;
    }
    if (seloNome) {
      const u = (performance.now() - trocaSelo) / 420;
      seloNome.style.transform = u < 1 ? `translateY(${((1 - mola(u)) * 7).toFixed(2)}px)` : '';
    }

    const texto = relogioTexto(t);
    if (tempoTexto && tempoTexto.textContent !== texto) tempoTexto.textContent = texto;

    // o leitor de tela ouve a posição quando ela muda pela mão; tocando, uma vez por segundo
    const segundo = Math.floor(t);
    if (forca || !tocando || arrastando || segundo !== ariaEm) {
      ariaEm = segundo;
      const v = t.toFixed(1);
      if (pista.getAttribute('aria-valuenow') !== v) {
        pista.setAttribute('aria-valuenow', v);
        pista.setAttribute('aria-valuetext', `${v.replace('.', ',')} de ${DURACAO.toFixed(1).replace('.', ',')} segundos`);
      }
    }

    seguir(dt);
  }

  relogio.visivel(secao, (_, dt) => {
    if (!midiaNaTela) return;
    if (!arrastando && tocando) {
      const doSom = mistura.tempo('abertura');
      t += dt;
      if (t >= DURACAO) t -= DURACAO;
      if (doSom !== null) {
        // com o som saindo, ele manda; se ficou para trás (começou atrasado), é ele que pula
        if (Math.abs(diferenca(doSom, t)) > 0.25) mistura.acerta('abertura', t);
        else if (!(t < 0.3 && doSom > DURACAO - 0.3)) t = Math.min(doSom, DURACAO - 0.001);   // na virada, espera o som virar também
      }
    }
    desenha(dt);
  });
  desenha(0, true);
  // a cena chega depois (iframe) e as letras dela também: quando chegam, o quadro da agulha é desenhado de novo
  const redesenha = () => { janelaDesenhada = null; desenha(0, true); };
  const quadroDaCena = tela && tela.querySelector('iframe');
  if (quadroDaCena) quadroDaCena.addEventListener('load', redesenha);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(redesenha);

  // para o teste de fumaça (testes/pagina.test.mjs)
  window.__linhaDoTempo = { tempo: () => t, duracao: () => DURACAO };
}
