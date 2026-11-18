// "Um pedido para cada efeito": a parede com os 8 efeitos que a cena do kit faz de verdade
// (pagina/demo/cena.html, montada sobre caminho-facil/modelo-de-cena.html), com os nomes que a linha do
// tempo da abertura usa. Cada quadro é um mini reel desenhado aqui, nas cores da cena do kit, e roda o
// efeito em volta, sozinho, enquanto está na tela. O toque (ou o mouse que entra no quadro) recomeça o
// efeito e toca o som dele, com o golpe da imagem no pico do som. Os nomes e os pedidos ficam no HTML.
// Um quadro por vez soa: tocar outro para o som do anterior. O mouse só toca depois de 150 ms sobre o quadro,
// para o caminho até o quadro escolhido não disparar os outros.
//
// Também exporta o que as capas do catálogo (catalogo.js) usam: o palco do reel, o cartão do perfil e as
// curvas dos efeitos (contínuas no tempo, como as da cena do kit; a mola é a do tempo.js, não a da cena).
import { relogio, mola, sobe, clamp, reduzido } from './tempo.js';
import { som } from './som.js';

/* ---------- curvas no tempo do reel, em segundos ---------- */

export const entre = (a, b, p) => a + (b - a) * p;
const u = (t, t0, dur) => (t - t0) / dur;
export const molaEm = (t, t0, dur = 0.5) => mola(u(t, t0, dur));
export const sobeEm = (t, t0, dur = 0.3) => sobe(u(t, t0, dur));
// um tranco: vai de 0 a 1 e volta a 0
export const pulso = (t, t0, dur = 0.4) => { const p = u(t, t0, dur); return p <= 0 || p >= 1 ? 0 : Math.sin(Math.PI * p); };
// o carimbo bate grande e assenta com mola; antes do golpe, não aparece
export const carimbo = (t, t0, dur = 0.5) => { const p = u(t, t0, dur); return p <= 0 ? 0 : entre(1.9, 1, mola(p)); };
// o tremor vai e volta de lado, forte no meio e parado nas pontas
export const tremor = (t, t0, dur = 0.5, forca = 10) => forca * Math.sin(t * 60) * pulso(t, t0, dur);
export const conta = (t, t0, t1, de, para) => Math.round(entre(de, para, sobe(u(t, t0, t1 - t0))));
export const milhar = n => n.toLocaleString('pt-BR');

export function poe(el, { x = 0, y = 0, escala = 1, giro = 0, opacidade = 1 } = {}) {
  if (!el) return;
  el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${giro}deg) scale(${Math.max(0, escala).toFixed(4)})`;
  el.style.opacity = clamp(opacidade).toFixed(3);
}

/* ---------- o palco: um quadro do tamanho do vídeo, escalado para a caixa ---------- */

const escalas = new Map();
const vigiaTamanho = typeof ResizeObserver === 'function'
  ? new ResizeObserver(entradas => { for (const e of entradas) escalas.get(e.target)?.(); })
  : null;

// Monta o reel (largura x altura em px do vídeo) dentro da caixa e o mantém do tamanho dela.
export function montaPalco(caixa, html, { largura = 1080, altura = 1920, classe = '' } = {}) {
  const palco = document.createElement('div');
  palco.className = `rl-palco ${classe}`.trim();
  palco.style.width = `${largura}px`;
  palco.style.height = `${altura}px`;
  palco.innerHTML = html;
  caixa.append(palco);
  const escala = () => { palco.style.transform = `scale(${(caixa.clientWidth || 0) / largura})`; };
  escalas.set(caixa, escala);
  // o ResizeObserver já mede a caixa logo que começa a vigiar; sem ele, mede aqui uma vez
  if (vigiaTamanho) vigiaTamanho.observe(caixa); else escala();
  return palco;
}

// O cartão do perfil da cena do kit (640 x 500): número de seguidores e a barra embaixo dele.
export const cartao = (numero = '312') => `
  <svg class="rl-p" viewBox="0 0 640 500" style="left:0;top:0;width:640px;height:500px" aria-hidden="true">
    <rect x="10" y="10" width="620" height="480" rx="40" class="f-tinta"/>
    <circle cx="120" cy="120" r="66" class="f-fundo"/>
    <circle cx="120" cy="100" r="24" class="f-tinta"/>
    <path d="M76 162a44 40 0 0 1 88 0z" class="f-tinta"/>
    <rect x="220" y="76" width="300" height="34" rx="17" class="f-fundo"/>
    <rect x="220" y="130" width="200" height="26" rx="13" class="f-fundo" opacity=".55"/>
    <text x="60" y="262" class="f-fundo rl-cartao-rotulo">SEGUIDORES</text>
    <rect x="60" y="430" width="520" height="12" rx="6" class="f-fundo" opacity=".25"/>
  </svg>
  <p class="rl-p rl-num">${numero}</p>
  <i class="rl-p rl-barra"></i>`;

/* ---------- os 8 quadros (1080 x 1440, o recorte do reel na grade do perfil) ---------- */

// golpe: o instante, dentro da volta, em que o efeito acontece; sons: o que toca (em s depois do golpe);
// final: o instante mostrado a quem pede menos movimento. Os sons foram medidos: a "subida" chega ao pico
// em 2,06 s, e o "baque", a "falha", o "pop", o "ding" e a "mensagem" batem logo no começo.
const QUADROS = {
  // o número dos seguidores conta junto com a subida e assenta no pico dela
  contador: {
    dura: 3.8, golpe: 0.5, final: 3.4, sons: [{ em: 0, som: 'subida' }],
    html: () => `<div class="rl-p rl-cartao" style="left:124px;top:395px;transform:scale(1.3)">${cartao('312')}</div>`,
    pega: p => ({ num: p.querySelector('.rl-num') }),
    desenha(e, t) {
      const de = this.golpe + 0.4, ate = this.golpe + 2.06;
      const p = clamp((t - de) / (ate - de));
      const texto = milhar(Math.round(entre(312, 12480, p * p)));
      if (e.num.textContent !== texto) e.num.textContent = texto;
      e.num.classList.toggle('subiu', t >= ate);
      poe(e.num, { escala: 1 + 0.1 * pulso(t, ate, 0.4) });
    },
  },

  // "SUMIU" bate torto no calendário de um post só, e o calendário sente o golpe
  carimbo: {
    dura: 3.0, golpe: 0.6, final: 1.6, sons: [{ em: 0, som: 'baque' }],
    html: () => {
      const dias = [0, 1].map(l => [0, 1, 2, 3, 4].map(c => {
        const cheio = l === 0 && c === 0;
        return `<rect x="${24 + 114 * c}" y="${30 + 130 * l}" width="96" height="108" rx="16" class="${cheio ? 'f-destaque' : 'rl-vazio'}"/>`;
      }).join('')).join('');
      return `<svg class="rl-p rl-calendario" viewBox="0 0 600 400" style="left:90px;top:330px;width:900px;height:600px" aria-hidden="true">
          ${dias}<path d="M52 86l16 16 30-34" class="s-sombra" stroke-width="12"/>
        </svg>
        <p class="rl-p rl-etq rl-etq-grande" style="left:560px;top:760px">SUMIU</p>`;
    },
    pega: p => ({ cal: p.querySelector('.rl-calendario'), etq: p.querySelector('.rl-etq') }),
    desenha(e, t) {
      const g = this.golpe;
      poe(e.etq, { escala: carimbo(t, g), opacidade: sobeEm(t, g, 0.08), giro: -4 });
      poe(e.cal, { escala: 1 - 0.025 * pulso(t, g + 0.06, 0.25) });
    },
  },

  // o número treme meio segundo, como o perfil travado do gancho
  tremor: {
    dura: 2.6, golpe: 0.6, final: 1.4, sons: [{ em: 0, som: 'falha' }],
    html: () => `<p class="rl-p rl-rotulo-grande" style="top:430px">SEGUIDORES</p>
      <p class="rl-p rl-tit rl-num-solto" style="top:520px;font-size:380px">312</p>`,
    pega: p => ({ num: p.querySelector('.rl-num-solto') }),
    // a cena do kit treme 10 px num celular inteiro; no quadro pequeno da parede, mais forte, para dar para ver
    desenha(e, t) { poe(e.num, { x: tremor(t, this.golpe, 0.5, 46) }); },
  },

  // a cada erro contado, uma bolinha do progresso acende com um pulso
  pulso: {
    dura: 3.6, golpe: 0.4, final: 3.2, sons: [{ em: 0, som: 'mensagem' }, { em: 0.9, som: 'mensagem' }, { em: 1.8, som: 'mensagem' }],
    html: () => `<div class="rl-p rl-mec rl-mec-grande" style="left:110px;top:470px;width:860px">
        <span class="rl-mec-conta">0 DE 3</span><i></i><i></i><i></i>
      </div>
      <p class="rl-p rl-leg rl-leg-grande" style="top:820px"></p>`,
    pega: p => ({ conta: p.querySelector('.rl-mec-conta'), pontos: [...p.querySelectorAll('.rl-mec i')], leg: p.querySelector('.rl-leg') }),
    desenha(e, t) {
      const marcas = [0, 0.9, 1.8].map(m => this.golpe + m);
      const feitos = marcas.filter(m => t >= m).length;
      const conta = `${feitos} DE 3`;
      if (e.conta.textContent !== conta) e.conta.textContent = conta;
      e.pontos.forEach((ponto, k) => {
        ponto.classList.toggle('on', t >= marcas[k]);
        poe(ponto, { escala: 1 + 0.5 * pulso(t, marcas[k], 0.4) });
      });
      const palavra = ['', 'UM', 'DOIS', 'TRÊS'][feitos];
      if (e.leg.textContent !== palavra) e.leg.textContent = palavra;
      poe(e.leg, { escala: feitos ? entre(0.82, 1, molaEm(t, marcas[feitos - 1], 0.35)) : 1 });
    },
  },

  // o número do erro entra com mola: cresce, passa do tamanho e volta
  mola: {
    dura: 2.6, golpe: 0.5, final: 1.4, sons: [{ em: 0, som: 'pop' }],
    html: () => `<p class="rl-p rl-rotulo-grande" style="top:250px">ERRO</p>
      <p class="rl-p rl-tit rl-num-erro" style="top:330px;font-size:700px">1</p>`,
    pega: p => ({ n: p.querySelector('.rl-num-erro') }),
    desenha(e, t) {
      const g = this.golpe;
      poe(e.n, { escala: entre(0.4, 1, molaEm(t, g, 0.4)), opacidade: t >= g ? 1 : 0 });
    },
  },

  // o nome do erro sobe de baixo, logo depois do número
  subida: {
    dura: 2.6, golpe: 0.5, final: 1.4, sons: [{ em: 0, som: 'whoosh' }],
    html: () => `<p class="rl-p rl-rotulo-grande" style="top:230px">ERRO</p>
      <p class="rl-p rl-tit" style="top:300px;font-size:380px;color:var(--reel-destaque)">3</p>
      <p class="rl-p rl-tit rl-nome-erro" style="top:760px;font-size:150px">POSTAR E SUMIR</p>`,
    pega: p => ({ nome: p.querySelector('.rl-nome-erro') }),
    desenha(e, t) {
      const g = this.golpe;
      poe(e.nome, { y: entre(170, 0, sobeEm(t, g, 0.4)), opacidade: sobeEm(t, g, 0.25) });
    },
  },

  // a barra enche embaixo do número, da esquerda para a direita
  barra: {
    dura: 3.0, golpe: 0.5, final: 1.6, sons: [{ em: 0, som: 'brilho' }],
    html: () => `<p class="rl-p rl-rotulo-grande" style="top:380px">SEGUIDORES</p>
      <p class="rl-p rl-tit" style="top:450px;font-size:250px">12.480</p>
      <div class="rl-p rl-trilho-grande" style="left:120px;top:800px"><i></i></div>`,
    pega: p => ({ trilho: p.querySelector('.rl-trilho-grande'), cheio: p.querySelector('.rl-trilho-grande i') }),
    desenha(e, t) {
      const g = this.golpe;
      e.cheio.style.transform = `scaleX(${sobeEm(t, g, 0.55).toFixed(4)})`;
      poe(e.trilho, { escala: 1 + 0.035 * pulso(t, g + 0.5, 0.3) });
    },
  },

  // os raios abrem em volta do título, e ele dá um tranco
  raios: {
    dura: 3.0, golpe: 0.5, final: 1.6, sons: [{ em: 0, som: 'ding' }],
    html: () => `<p class="rl-p rl-tit rl-cresce" style="top:470px;font-size:200px;line-height:.98">VOLTA A<br><span style="color:var(--reel-destaque)">CRESCER</span></p>
      <svg class="rl-p rl-raios-grandes" viewBox="0 0 1080 1440" style="left:0;top:0;width:1080px;height:1440px" aria-hidden="true">
        <path d="M150 420L84 362M930 420L996 362M120 700H40M960 700H1040M150 980L84 1038M930 980L996 1038" class="s-destaque" stroke-width="18"/>
      </svg>`,
    pega: p => ({ tit: p.querySelector('.rl-cresce'), raios: p.querySelector('.rl-raios-grandes') }),
    desenha(e, t) {
      const g = this.golpe;
      poe(e.raios, { escala: entre(0.7, 1, molaEm(t, g, 0.5)), opacidade: sobeEm(t, g, 0.15) });
      poe(e.tit, { escala: 1 + 0.08 * pulso(t, g, 0.45) });
    },
  },
};

/* ---------- a seção ---------- */

// O mouse só toca um quadro quando se mexe de verdade: a página rolando sob o mouse parado não conta.
let mexeuEm = -1e9, mx = -1, my = -1;
addEventListener('pointermove', e => {
  if (e.pointerType !== 'mouse' || (e.clientX === mx && e.clientY === my)) return;
  mx = e.clientX;
  my = e.clientY;
  mexeuEm = performance.now();
}, { capture: true, passive: true });

// O quadro que está soando agora: tocar outro para os sons dele (os que tocam e os que ainda iam tocar).
let daVez = null;
function calaDaVez() {
  if (!daVez) return;
  for (const a of daVez.audios) { try { a.pause(); } catch { /* já parou */ } }
  daVez.audios = [];
  daVez.pendentes = [];
  daVez.soandoAte = 0;
  daVez.botao.classList.remove('tocando');
  daVez = null;
}

// Os 8 sons da parede baixam quando a seção chega perto da tela, para o som não chegar depois do golpe.
function preCarregaSons(secao, nomes) {
  const baixa = () => nomes.forEach(nome => {
    const a = new Audio();
    a.preload = 'auto';
    a.src = new URL(`../sons/${nome}.mp3`, import.meta.url).href;
  });
  if (typeof IntersectionObserver !== 'function') return baixa();
  const vigia = new IntersectionObserver(entradas => {
    if (!entradas.some(e => e.isIntersecting)) return;
    vigia.disconnect();
    baixa();
  }, { rootMargin: '800px 0px' });
  vigia.observe(secao);
}

export function iniciarEfeitos(secao) {
  if (!secao) return;
  const botoes = [...secao.querySelectorAll('[data-efeito]')];
  // o nome que o leitor de tela ouve diz "com som" só quando o som está ligado
  const rotulos = botoes.map(b => b.getAttribute('aria-label') || '');
  const mostraSom = ligado => {
    secao.classList.toggle('som-ligado', ligado);
    botoes.forEach((b, k) => b.setAttribute('aria-label', ligado ? `${rotulos[k]}, com som` : rotulos[k]));
  };
  som.aoMudar(mostraSom);
  mostraSom(som.ligado());
  preCarregaSons(secao, [...new Set(Object.values(QUADROS).flatMap(d => d.sons.map(s => s.som)))]);

  botoes.forEach((botao, k) => {
    const def = QUADROS[botao.dataset.efeito];
    const caixa = botao.querySelector('.efeito-tela');
    if (!def || !caixa) return;
    const palco = montaPalco(caixa, def.html(), { altura: 1440, classe: 'rl-quadro' });
    const desenha = t => def.desenha.call(def, q.e, t);
    const q = { e: def.pega(palco), t: reduzido ? def.final : (k * 0.37) % def.dura, pendentes: [], soandoAte: 0, tocouEm: -1e9, audios: [], botao };
    desenha(q.t);

    // toca um som do quadro e acende a etiqueta dele enquanto soa; diz se tocou (com o som desligado, não)
    function soa(nome) {
      const audio = som.tocar(nome, { volume: 0.7 });
      if (!audio) return false;
      q.audios.push(audio);
      daVez = q;
      q.soandoAte = performance.now() + 700;
      botao.classList.add('tocando');
      if (reduzido) setTimeout(() => { if (performance.now() >= q.soandoAte) botao.classList.remove('tocando'); }, 720);
      return true;
    }
    // recomeça o efeito logo antes do golpe; o primeiro som sai já, dentro do toque (o celular exige)
    function toca() {
      calaDaVez();
      q.audios = [];
      const pendentes = def.sons.map(s => ({ t: def.golpe + s.em, som: s.som }));
      if (!reduzido) {
        q.t = def.golpe - 0.02;
        desenha(q.t);
      }
      const primeiro = pendentes.shift();
      // só um toque que soou segura o clique que vem logo atrás (o mouse que entrou e clicou)
      if (primeiro && soa(primeiro.som)) q.tocouEm = performance.now();
      q.pendentes = reduzido ? [] : pendentes;
    }

    // o mouse que entra e se mexe arma o quadro; ele toca se ficar 150 ms em cima (passar por cima não toca)
    let armado = false, espera = 0;
    botao.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') armado = true; });
    botao.addEventListener('pointerleave', () => { armado = false; clearTimeout(espera); espera = 0; });
    botao.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse' || !armado || espera || performance.now() - mexeuEm > 80) return;
      espera = setTimeout(() => { espera = 0; if (!armado) return; armado = false; toca(); }, 150);
    });
    // dedo, teclado e o clique do mouse; o clique logo depois de o mouse entrar não toca de novo
    botao.addEventListener('click', () => { if (performance.now() - q.tocouEm > 450) toca(); });

    if (reduzido) return;
    relogio.visivel(botao, (_, dt) => {
      q.t += dt;
      if (q.t >= def.dura) { q.t -= def.dura; q.pendentes = []; }
      while (q.pendentes.length && q.pendentes[0].t <= q.t) soa(q.pendentes.shift().som);
      if (q.soandoAte && performance.now() >= q.soandoAte) { q.soandoAte = 0; botao.classList.remove('tocando'); }
      if (daVez === q && !q.pendentes.length && q.audios.every(a => a.paused || a.ended)) daVez = null;
      desenha(q.t);
    });
  });
}
