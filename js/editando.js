// "Veja a IA editando": o roteiro da cena de exemplo vira reel em cinco passos, uma camada por passo.
// 1 só o texto, parado; 2 a voz (cada palavra ganha o seu tempo); 3 a legenda, palavra a palavra;
// 4 os efeitos, cada um preso a uma palavra; 5 tudo, com o som (demo/som.mp3).
// A cena é desenhada aqui mesmo, num quadro de 1080 x 1920 com as cores da cena do kit, e usa o tempo
// real de cada palavra da narração. Os passos andam sozinhos com a seção na tela e respondem ao toque:
// quem escolhe um passo fica nele até sair da seção. "Bruto" é o passo 1; "Pronto", o 5.
import { relogio, mola, sobe, clamp, reduzido } from './tempo.js';
import { som } from './som.js';
import { FRASES, PALAVRAS, EFEITOS, SONS, TRILHA, DURACAO, ancora, mistura, ondaDaVoz, segundos, diferenca } from './linha-do-tempo.js';

const DURA = [0, 2.6, 4.4, 4.4, 5.2];   // segundos de cada passo no modo automático; o 5 é uma volta inteira da cena
const PARADO = 1.25;                    // quem pede menos movimento vê o reel neste instante, parado
const NOMES = ['GANCHO FRACO', 'VÍDEO SEM LEGENDA', 'POSTAR E SUMIR'];

/* ---------- curvas no tempo da cena ---------- */
const u = (t, t0, dur) => (t - t0) / dur;
const molaEm = (t, t0, dur = 0.5) => mola(u(t, t0, dur));
const sobeEm = (t, t0, dur = 0.3) => sobe(u(t, t0, dur));
const pulso = (t, t0, dur = 0.4) => { const p = u(t, t0, dur); return p <= 0 || p >= 1 ? 0 : Math.sin(Math.PI * p); };
const entre = (a, b, p) => a + (b - a) * p;
const conta = (t, t0, t1, de, para) => Math.round(entre(de, para, sobe(u(t, t0, t1 - t0))));
const milhar = n => n.toLocaleString('pt-BR');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
function poe(el, { x = 0, y = 0, escala = 1, giro = 0, opacidade = 1 } = {}) {
  el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${giro}deg) scale(${escala.toFixed(4)})`;
  el.style.opacity = clamp(opacidade).toFixed(3);
}
// carimbo: bate grande e assenta com mola, torto
const carimbo = (t, t0) => { const p = u(t, t0, 0.5); return p <= 0 ? 0 : entre(1.9, 1, mola(p)); };

/* ---------- os instantes da cena, presos às palavras ---------- */
const A = (i, trecho, ajuste) => ancora(i, trecho, ajuste).a;
const T = {
  travando: A(0, 'travando'),
  perfil: A(0, 'perfil'),
  itens: [
    { entra: A(1, 'Um'), des: A(1, 'gancho'), tag: A(1, 'três segundos') },
    { entra: A(2, 'Dois'), des: A(2, 'vídeo'), tag: A(2, 'sem som') },
    { entra: A(3, 'Três'), des: A(3, 'postar'), tag: A(3, 'sumir') },
  ],
  arrume: A(4, 'Arrume'),
  volta: A(4, 'o perfil'),
  cresce: A(4, 'crescer'),
};

// A legenda em blocos de até 3 palavras, como a do kit; uma palavra sozinha no fim da frase junta com o bloco anterior.
const BLOCOS = [];
FRASES.forEach((f, i) => {
  const daFrase = [];
  let atual = [];
  f.palavras.forEach((p, k) => {
    atual.push(p);
    if (atual.length >= 3 || /[.,:;?!…]$/.test(p.texto) || k === f.palavras.length - 1) { daFrase.push(atual); atual = []; }
  });
  if (daFrase.length > 1 && daFrase.at(-1).length === 1 && daFrase.at(-2).length <= 3) daFrase.at(-2).push(...daFrase.pop());
  daFrase.forEach(palavras => BLOCOS.push({ frase: i, palavras }));
});
const DESTAQUES = new Set(['tres', 'erros', 'perfil', 'gancho', 'fraco', 'segundos', 'legenda', 'som', 'sumir', 'crescer']);
const limpa = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');

/* ---------- o reel, em 1080 x 1920 ---------- */

const cartao = () => `
  <div class="r-cartao">
    <svg viewBox="0 0 560 400" aria-hidden="true">
      <rect width="560" height="400" rx="40" class="f-tinta"/>
      <circle cx="104" cy="104" r="56" class="f-fundo"/>
      <circle cx="104" cy="88" r="21" class="f-tinta"/>
      <path d="M66 141a38 34 0 0 1 76 0z" class="f-tinta"/>
      <rect x="196" y="70" width="270" height="30" rx="15" class="f-fundo"/>
      <rect x="196" y="120" width="170" height="22" rx="11" class="f-fundo" opacity=".5"/>
      <text x="48" y="232" class="f-fundo r-cartao-rotulo">SEGUIDORES</text>
      <rect x="48" y="368" width="464" height="12" rx="6" class="f-fundo" opacity=".22"/>
    </svg>
    <p class="r-num">296</p>
    <i class="r-barra"></i>
  </div>`;

function montarReel(caixa) {
  const frases = FRASES.map(f => `
    <div class="r-frase"><span class="r-quando"><i>–,––</i><b>${segundos(f.a).replace(' s', '')}</b></span><p class="r-fala">${f.palavras.map(p => `<span>${esc(p.texto)}</span>`).join(' ')}</p></div>`).join('');
  const sons = SONS.map(s => `<i style="left:${((s.a / DURACAO) * 100).toFixed(2)}%"></i>`).join('');
  const calendario = [0, 1].map(l => [0, 1, 2, 3, 4].map(c => {
    const cheio = l === 0 && c === 0;
    return `<rect x="${24 + 114 * c}" y="${30 + 130 * l}" width="96" height="108" rx="16" class="${cheio ? 'f-destaque' : 'r-vazio'}"/>`;
  }).join('')).join('');
  caixa.innerHTML = `
    <div class="r-palco">
      <div class="r-pontos"></div>

      <div class="r-camada r-efeitos">
        <div class="r-cena">
          <p class="r-tit r-grande" style="top:300px">3 ERROS</p>
          <p class="r-tit" style="top:504px;font-size:78px">QUE TRAVAM O SEU PERFIL</p>
          ${cartao()}
          <p class="r-carimbo" style="left:556px;top:1004px">TRAVADO</p>
        </div>
        <div class="r-cena">
          <p class="r-erro">ERRO</p>
          <p class="r-tit r-n">1</p>
          <p class="r-tit r-nome">GANCHO FRACO</p>
          <div class="r-item">
            <svg class="r-des" viewBox="0 0 600 400" style="left:240px;top:730px" aria-hidden="true">
              <path d="M48 24V352H572" class="s-tinta" stroke-width="12"/>
              <path d="M64 58C132 60 160 94 184 238S268 316 556 326" class="s-alerta r-traco" stroke-width="16" pathLength="1"/>
              <path d="M184 36V352" class="s-tinta" stroke-width="6" stroke-dasharray="14 14"/>
            </svg>
            <p class="r-carimbo r-tag" style="left:446px;top:796px">3 SEGUNDOS</p>
          </div>
          <div class="r-item">
            <svg class="r-des" viewBox="0 0 600 400" style="left:240px;top:730px" aria-hidden="true">
              <rect x="196" y="12" width="208" height="376" rx="34" class="f-sombra s-tinta" stroke-width="12"/>
              <path d="M278 152L344 200 278 248z" class="f-tinta"/>
              <rect x="226" y="318" width="148" height="22" rx="11" class="s-tinta" stroke-width="5" stroke-dasharray="12 10"/>
            </svg>
            <svg class="r-tag" viewBox="0 0 200 160" style="left:644px;top:772px;width:220px;height:176px" aria-hidden="true">
              <path d="M22 60H62L110 22V138L62 100H22z" class="f-alerta s-sombra" stroke-width="10"/>
              <path d="M138 58L182 102M182 58L138 102" class="s-alerta" stroke-width="18"/>
            </svg>
          </div>
          <div class="r-item">
            <svg class="r-des" viewBox="0 0 600 400" style="left:240px;top:740px" aria-hidden="true">
              ${calendario}
              <path d="M52 86l16 16 30-34" class="s-sombra" stroke-width="12"/>
            </svg>
            <p class="r-carimbo r-tag" style="left:560px;top:1004px">SUMIU</p>
          </div>
        </div>
        <div class="r-cena">
          <p class="r-tit r-arrume" style="top:300px;font-size:84px">ARRUME OS 3</p>
          <p class="r-tit r-grande r-cresce" style="top:408px;font-size:122px">VOLTA A CRESCER</p>
          <svg class="r-raios" viewBox="0 0 1080 600" aria-hidden="true">
            <path d="M176 112L118 62M904 112L962 62M156 320H86M924 320H994" class="s-destaque" stroke-width="14"/>
          </svg>
          ${cartao()}
          <svg class="r-seta" viewBox="0 0 120 140" aria-hidden="true">
            <path d="M60 8L112 70H80V132H40V70H8z" class="f-destaque s-sombra" stroke-width="8"/>
          </svg>
        </div>
        <div class="r-progresso"><span class="r-conta">0 DE 3</span><i></i><i></i><i></i></div>
      </div>

      <div class="r-camada r-roteiro">
        <p class="r-roteiro-titulo">roteiro.txt</p>
        ${frases}
      </div>

      <p class="r-legenda"></p>

      <div class="r-faixa r-voz">
        <span class="r-faixa-nome">VOZ</span>
        <div class="r-area">
          <div class="r-onda">${ondaDaVoz(0.06)}</div>
          <div class="r-onda r-onda-tocada">${ondaDaVoz(0.06)}</div>
          <i class="r-cabeca"></i>
        </div>
      </div>
      <div class="r-faixa r-som">
        <span class="r-faixa-nome">SOM</span>
        <div class="r-area">
          <div class="r-som-linha"><b></b>${sons}</div>
          <i class="r-cabeca"></i>
        </div>
      </div>
    </div>`;

  const $ = s => caixa.querySelector(s);
  const $$ = s => [...caixa.querySelectorAll(s)];
  const cenas = $$('.r-cena');
  const lista = cenas[1];
  return {
    palco: $('.r-palco'),
    pontos: $('.r-pontos'),
    efeitos: $('.r-efeitos'),
    roteiro: $('.r-roteiro'),
    falas: $$('.r-fala span'),
    quandos: $$('.r-quando'),
    legenda: $('.r-legenda'),
    voz: $('.r-voz'),
    vozTocada: $('.r-onda-tocada'),
    somFaixa: $('.r-som'),
    sons: $$('.r-som-linha i'),
    cabecas: $$('.r-cabeca'),
    cenas,
    gancho: {
      num: cenas[0].querySelector('.r-num'),
      cartao: cenas[0].querySelector('.r-cartao'),
      trava: cenas[0].querySelector('.r-carimbo'),
    },
    lista: {
      n: lista.querySelector('.r-n'),
      nome: lista.querySelector('.r-nome'),
      itens: [...lista.querySelectorAll('.r-item')].map(it => ({
        el: it, des: it.querySelector('.r-des'), tag: it.querySelector('.r-tag'), traco: it.querySelector('.r-traco'),
      })),
    },
    paga: {
      arrume: cenas[2].querySelector('.r-arrume'),
      cresce: cenas[2].querySelector('.r-cresce'),
      raios: cenas[2].querySelector('.r-raios'),
      num: cenas[2].querySelector('.r-num'),
      barra: cenas[2].querySelector('.r-barra'),
      seta: cenas[2].querySelector('.r-seta'),
    },
    progresso: { conta: $('.r-conta'), pontos: $$('.r-progresso i') },
  };
}

/* ---------- a seção ---------- */

export function iniciarEditando(secao) {
  const caixa = secao.querySelector('[data-reel]');
  if (!caixa) return;
  const visor = secao.querySelector('[data-visor]') || caixa;
  const leitura = secao.querySelector('[data-leitura]');
  const rotuloPasso = secao.querySelector('[data-visor-passo]');
  // no celular os passos viram uma fileira de números, e o texto do passo da vez aparece numa linha só dele
  const textoPasso = secao.querySelector('[data-passo-texto]');
  const botoesPasso = [...secao.querySelectorAll('[data-passo]')];
  const botoesIr = [...secao.querySelectorAll('[data-ir]')];
  const r = montarReel(caixa);

  // a cena de 1080 x 1920 ocupa a caixa inteira, em qualquer tamanho
  const escala = () => { r.palco.style.transform = `scale(${(caixa.clientWidth || 1) / 1080})`; };
  escala();
  if (typeof ResizeObserver === 'function') new ResizeObserver(escala).observe(caixa);

  let passo = reduzido ? 5 : 1;
  let auto = !reduzido;
  let t = reduzido ? PARADO : 0;       // o tempo da cena
  let tPasso = 0;                      // há quanto tempo o passo atual começou (modo automático)
  let naTela = false, visorNaTela = false;

  /* --- as camadas: cada uma entra com mola e sai depressa quando o passo muda --- */
  const camadas = {};
  const alvos = n => ({
    roteiro: n <= 3 ? 1 : 0,
    apagado: n === 3 ? 1 : 0,          // na legenda, o roteiro fica de fundo
    voz: n >= 2 ? 1 : 0,
    legenda: n >= 3 ? 1 : 0,
    efeitos: n >= 4 ? 1 : 0,
    som: n === 5 ? 1 : 0,
  });
  const agora = () => performance.now() / 1000;
  for (const [nome, v] of Object.entries(alvos(passo))) camadas[nome] = { de: v, para: v, desde: -10 };
  function valor(c) {
    const p = (agora() - c.desde) / (c.para > c.de ? 0.6 : 0.32);
    if (reduzido || p >= 1) return c.para;
    return entre(c.de, c.para, c.para > c.de ? mola(p) : sobe(p));
  }
  function mira(n) {
    for (const [nome, v] of Object.entries(alvos(n))) {
      const c = camadas[nome];
      if (c.para === v) continue;
      c.de = valor(c);
      c.para = v;
      c.desde = agora();
    }
  }

  /* --- o som: só no passo 5, com o visor bem à vista --- */
  function acertaSom() {
    const deve = som.ligado() && passo === 5 && visorNaTela && !document.hidden && !reduzido;
    if (deve) { if (!mistura.tocando('editando')) mistura.tocar('editando', t); }
    else mistura.parar('editando');
  }
  som.aoMudar(() => { acertaSom(); escreveLeitura(true); });
  mistura.aoLiberar(acertaSom);
  document.addEventListener('visibilitychange', acertaSom);

  /* --- trocar de passo --- */
  function mudaPasso(n, { manual = false, zera = false } = {}) {
    if (manual) auto = false;
    if (zera || n === 1) t = reduzido ? PARADO : 0;
    passo = n;
    tPasso = 0;
    mira(n);
    botoesPasso.forEach(b => {
      const k = +b.dataset.passo;
      b.setAttribute('aria-pressed', String(k === n));
      b.classList.toggle('passou', k < n);
      b.classList.toggle('atual', k === n);
      b.style.setProperty('--progresso', '0');
    });
    botoesIr.forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.ir === n)));
    if (rotuloPasso) rotuloPasso.textContent = String(n);
    const daVez = botoesPasso.find(b => +b.dataset.passo === n);
    const texto = daVez && daVez.querySelector('.passo-texto');
    if (textoPasso && texto) textoPasso.replaceChildren(...[...texto.childNodes].map(no => no.cloneNode(true)));
    acertaSom();
    escreveLeitura(true);
    desenha();
  }
  const escolhe = n => mudaPasso(n, { manual: true, zera: true });
  botoesPasso.forEach(b => b.addEventListener('click', () => escolhe(+b.dataset.passo)));
  botoesIr.forEach(b => b.addEventListener('click', () => escolhe(+b.dataset.ir)));

  /* --- na tela: ao voltar, o modo automático recomeça do passo 1 --- */
  if (typeof IntersectionObserver === 'function') {
    new IntersectionObserver(([e]) => {
      const antes = naTela;
      naTela = e.isIntersecting;
      if (naTela && !antes && !reduzido) { auto = true; mudaPasso(1); }
      acertaSom();
    }).observe(secao);
    new IntersectionObserver(([e]) => { visorNaTela = e.intersectionRatio >= 0.5; acertaSom(); }, { threshold: [0, 0.5, 1] }).observe(visor);
  } else {
    naTela = visorNaTela = true;
  }

  /* --- a leitura sob o reel: o que a camada do passo está fazendo agora --- */
  let leituraAtual = '';
  const ultimoAte = (lista, s) => { let achado = null; for (const m of lista) if (m.a <= s) achado = m; return achado; };
  function escreveLeitura(forca = false) {
    if (!leitura) return;
    let html;
    const p = ultimoAte(PALAVRAS, t) || PALAVRAS[0];
    const palavra = `“${esc(p.texto.replace(/[.,:;!?…]+$/, ''))}”`;
    if (passo === 1) html = `<b>Roteiro</b> ${FRASES.length} frases, ${PALAVRAS.length} palavras`;
    else if (passo === 2) html = `<b>Voz</b> ${palavra} começa em ${segundos(p.a)}`;
    else if (passo === 3) html = `<b>Legenda</b> ${palavra} acende em ${segundos(p.a)}`;
    else if (passo === 4 || reduzido) {
      const e = ultimoAte(EFEITOS, t) || EFEITOS[0];
      html = `<b>Efeito</b> ${esc(e.nome.toLowerCase())} na palavra “${esc(e.palavra)}”`;
    } else if (!som.ligado()) html = '<b>Som</b> toque na tela para ouvir';
    else {
      const s = ultimoAte(SONS, t);
      html = s && t - s.a < 1.2 ? `<b>Som</b> ${esc(s.nome)} na palavra “${esc(s.palavra)}”` : `<b>Trilha</b> ${TRILHA}, do começo ao fim`;
    }
    if (html !== leituraAtual || forca) { leitura.innerHTML = html; leituraAtual = html; }
  }

  /* --- um quadro --- */
  let blocoAtual = null, falaAtual = '', cenaAtual = -1, itemAtual = -1;
  function desenha() {
    const v = {};
    for (const nome of Object.keys(camadas)) v[nome] = valor(camadas[nome]);

    // camadas: o roteiro sobe e sai; a voz e o som sobem do pé; a legenda e os efeitos crescem no lugar
    poe(r.roteiro, { y: (1 - clamp(v.roteiro)) * -70, escala: 1 - 0.14 * v.apagado, opacidade: clamp(v.roteiro) * (1 - 0.7 * clamp(v.apagado)) });
    poe(r.voz, { y: (1 - v.voz) * 260, opacidade: v.voz * 3 });
    poe(r.somFaixa, { y: (1 - v.som) * 220, opacidade: v.som * 3 });
    poe(r.legenda, { escala: 0.86 + 0.14 * v.legenda, opacidade: v.legenda * 2 });
    poe(r.efeitos, { escala: 0.94 + 0.06 * v.efeitos, opacidade: v.efeitos * 2 });
    r.pontos.style.opacity = clamp(v.efeitos).toFixed(3);

    const p = t / DURACAO;
    r.vozTocada.style.clipPath = `inset(0 ${((1 - p) * 100).toFixed(2)}% 0 0)`;
    r.cabecas.forEach(c => { c.style.left = `${(p * 100).toFixed(2)}%`; });
    r.sons.forEach((el, k) => el.classList.toggle('ativo', t >= SONS[k].a && t < SONS[k].a + 0.4));

    // roteiro: no passo 1, só o texto; com a voz, cada palavra acende quando é falada e cada frase ganha o seu segundo
    const comVoz = passo >= 2;
    let k = -1;
    if (comVoz) PALAVRAS.forEach((w, n) => { if (w.a <= t) k = n; });
    const chaveFala = `${comVoz}|${k}`;
    if (chaveFala !== falaAtual) {
      r.falas.forEach((el, n) => {
        el.className = !comVoz ? '' : n < k ? 'dito' : n === k ? 'agora' : 'falta';
      });
      r.quandos.forEach((el, n) => el.classList.toggle('visto', comVoz && FRASES[n].a <= t));
      falaAtual = chaveFala;
    }

    // legenda: o bloco da vez, com a palavra falada em destaque
    if (v.legenda > 0.01) {
      let bloco = BLOCOS[0];
      for (const b of BLOCOS) if (b.palavras[0].a <= t) bloco = b;
      if (bloco !== blocoAtual) {
        r.legenda.innerHTML = bloco.palavras.map(w => `<span class="${DESTAQUES.has(limpa(w.texto)) ? 'r-forte' : ''}">${esc(w.texto)}</span>`).join(' ');
        blocoAtual = bloco;
      }
      [...r.legenda.children].forEach((el, n) => {
        const w = bloco.palavras[n];
        el.classList.toggle('falta', w.a > t);
        el.classList.toggle('agora', w.a <= t && t < w.b + 0.08);
      });
    }

    // efeitos: a cena de verdade, com cada efeito preso à sua palavra
    if (v.efeitos > 0.01) desenhaEfeitos();

    escreveLeitura();
  }

  function desenhaEfeitos() {
    const cena = t < FRASES[1].a ? 0 : t < FRASES[4].a ? 1 : 2;
    if (cena !== cenaAtual) { r.cenas.forEach((c, n) => { c.style.visibility = n === cena ? 'visible' : 'hidden'; }); cenaAtual = cena; }

    const feitos = T.itens.filter(it => t >= it.entra).length;
    r.progresso.conta.textContent = `${feitos} DE 3`;
    r.progresso.pontos.forEach((el, n) => {
      el.classList.toggle('aceso', n < feitos);
      poe(el, { escala: 1 + 0.5 * pulso(t, T.itens[n].entra, 0.4) });
    });

    if (cena === 0) {
      const g = r.gancho;
      g.num.textContent = milhar(conta(t, 0.1, T.travando, 296, 312));
      poe(g.num, { x: 10 * Math.sin(t * 60) * pulso(t, T.travando, 0.5) });
      poe(g.cartao, { escala: 1 - 0.04 * pulso(t, T.perfil, 0.4) });
      poe(g.trava, { escala: carimbo(t, T.travando), opacidade: sobeEm(t, T.travando, 0.08), giro: -6 });
    } else if (cena === 1) {
      const l = r.lista;
      const n = t < FRASES[2].a ? 0 : t < FRASES[3].a ? 1 : 2;
      if (n !== itemAtual) {
        l.n.textContent = String(n + 1);
        l.nome.textContent = NOMES[n];
        l.itens.forEach((it, j) => { it.el.style.visibility = j === n ? '' : 'hidden'; });   // '' herda da cena: escondida com ela
        itemAtual = n;
      }
      const it = T.itens[n], el = l.itens[n];
      poe(l.n, { escala: entre(0.4, 1, molaEm(t, it.entra, 0.4)) });
      poe(l.nome, { y: entre(40, 0, sobeEm(t, it.entra + 0.1, 0.3)), opacidade: sobeEm(t, it.entra + 0.1, 0.2) });
      poe(el.des, { escala: entre(0.7, 1, molaEm(t, it.des, 0.45)), opacidade: sobeEm(t, it.des, 0.12) });
      if (el.traco) el.traco.style.strokeDashoffset = (1 - sobeEm(t, it.des + 0.1, 0.7)).toFixed(3);
      const tag = n === 1 ? molaEm(t, it.tag, 0.45) : carimbo(t, it.tag) + 0.1 * pulso(t, it.tag + 0.55, 0.4);
      poe(el.tag, { escala: tag, opacidade: sobeEm(t, it.tag, 0.08), giro: n === 1 ? 0 : -4 });
    } else {
      const g = r.paga;
      const fim = T.cresce + 0.6;
      poe(g.arrume, { escala: entre(0.8, 1, molaEm(t, T.arrume, 0.4)) });
      poe(g.cresce, { escala: molaEm(t, T.cresce, 0.55), opacidade: sobeEm(t, T.cresce, 0.1) });
      g.num.textContent = milhar(conta(t, T.volta, fim, 312, 12480));
      g.num.classList.toggle('subiu', t >= T.cresce);
      g.barra.style.transform = `scaleX(${sobe(u(t, T.volta, fim - T.volta)).toFixed(4)})`;
      poe(g.seta, { y: entre(60, 0, molaEm(t, T.cresce, 0.5)), opacidade: sobeEm(t, T.cresce, 0.1) });
      poe(g.raios, { escala: entre(0.7, 1, molaEm(t, T.cresce + 0.2, 0.5)), opacidade: sobeEm(t, T.cresce + 0.2, 0.15) });
    }
  }

  /* --- o relógio --- */
  relogio.visivel(secao, (_, dt) => {
    if (reduzido) return;
    if (auto) {
      tPasso += dt;
      if (passo < 5 && tPasso >= DURA[passo]) mudaPasso(passo + 1, { zera: passo === 1 || passo === 4 });
    }
    if (passo >= 2) {
      t += dt;
      if (t >= DURACAO) {
        if (auto && passo === 5) { mudaPasso(1); return; }   // o reel pronto tocou uma volta inteira
        t -= DURACAO;
      }
      // com o som saindo, ele manda; se ficou para trás (começou atrasado), é ele que pula
      const doSom = mistura.tempo('editando');
      if (doSom !== null) {
        if (Math.abs(diferenca(doSom, t)) > 0.25) mistura.acerta('editando', t);
        else if (!(t < 0.3 && doSom > DURACAO - 0.3)) t = Math.min(doSom, DURACAO - 0.001);
      }
    }
    const barra = botoesPasso.find(b => +b.dataset.passo === passo);
    if (barra) barra.style.setProperty('--progresso', auto ? clamp(passo === 5 ? t / DURACAO : tPasso / DURA[passo]).toFixed(3) : '0');
    desenha();
  });

  mudaPasso(passo);
}
