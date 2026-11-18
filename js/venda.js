// O movimento das seções de venda, do "Feitos" ao fecho. Cada seção ganha um evento visual que diz alguma
// coisa: os números da prova contam, a fila da tabela exporta e a soma separada é riscada, os vistos do que
// você recebe batem, os cartões de "para quem" mostram a rotina de cada um, os 7 dias da garantia acendem, a
// resposta da dúvida sobe ao abrir e o fecho toca de novo o pagamento da cena de exemplo.
//
// Tudo anda pelo relógio da página e só com a seção na tela. As entradas tocam uma vez, quando a parte aparece
// bem; quem pede menos movimento vê o estado final. Sem JavaScript, o HTML e o CSS já mostram o estado final.
import { relogio, reduzido } from './tempo.js';
import { som } from './som.js';
import { molaEm, sobeEm, pulso, entre, poe } from './efeitos.js';
import { mistura, FRASES, FIM_DA_CENA, DURACAO } from './linha-do-tempo.js';

// Desenha uma entrada de `duracao` segundos, uma vez, quando `el` aparece bem na tela (a fração dele à vista,
// ou 40% da altura da tela, o que vier antes). desenha(t) recebe Infinity para o estado final.
function quandoAparecer(el, duracao, desenha, fracao = 0.3) {
  if (!el) return;
  if (reduzido) { desenha(Infinity); return; }
  desenha(0);
  let comecou = typeof IntersectionObserver !== 'function';
  let t = 0;
  if (!comecou) {
    const vigia = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && (e.intersectionRatio >= fracao || e.intersectionRect.height >= innerHeight * 0.4)) {
        comecou = true;
        vigia.disconnect();
      }
    }, { threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.75, 1] });
    vigia.observe(el);
  }
  const pare = relogio.visivel(el, (_, dt) => {
    if (!comecou) return;
    t += dt;
    desenha(t);
    if (t >= duracao) pare();
  });
}

/* ---------- 8. prova: os números contam, um depois do outro ---------- */

// <b data-conta="20" data-forma="+# mil">+20 mil</b> conta de 1 a 20 no formato dado e termina no texto do HTML.
// Sem data-conta, o número entra com mola.
export function iniciarProva(secao) {
  const lista = secao && secao.querySelector('.numeros');
  if (!lista) return;
  const itens = [...lista.children].map((li, k) => {
    const b = li.querySelector('b');
    const para = b ? Number(b.dataset.conta) : NaN;
    return { li, b, k, para: Number.isFinite(para) ? para : null, forma: (b && b.dataset.forma) || '#', final: b ? b.textContent : '' };
  });
  quandoAparecer(lista, 2.2, t => {
    for (const it of itens) {
      const t0 = 0.16 * it.k;
      poe(it.li, { y: entre(26, 0, molaEm(t, t0, 0.55)), opacidade: sobeEm(t, t0, 0.2) });
      if (!it.b) continue;
      if (it.para !== null) {
        const p = sobeEm(t, t0 + 0.1, 1.1);
        const texto = p >= 1 ? it.final : it.forma.replace('#', String(Math.max(1, Math.round(it.para * p))));
        if (it.b.textContent !== texto) it.b.textContent = texto;
      } else {
        poe(it.b, { escala: entre(0.6, 1, molaEm(t, t0 + 0.15, 0.5)) });
      }
    }
  });
}

/* ---------- 9. tabela: a fila exporta, a soma separada é riscada e o pacote assenta ---------- */

export function iniciarTabela(secao) {
  const fila = secao && secao.querySelector('.fila');
  if (!fila) return;
  const linhas = [...fila.querySelectorAll('.fila-linha')];
  const soma = fila.querySelector('.fila-total s');
  const preco = fila.querySelector('.fila-pacote b');
  const desconto = fila.querySelector('.fila-desconto');
  const fimLinhas = 0.12 * Math.max(0, linhas.length - 1) + 0.4;
  fila.classList.add('anima');
  quandoAparecer(fila, fimLinhas + 1.4, t => {
    linhas.forEach((linha, k) => {
      const t0 = 0.12 * k;
      linha.style.setProperty('--varre', sobeEm(t, t0, 0.4).toFixed(3));
      linha.style.setProperty('--some', sobeEm(t, t0 + 0.45, 0.35).toFixed(3));
      linha.classList.toggle('varrendo', t >= t0 && t < t0 + 0.7);
    });
    if (soma) soma.style.setProperty('--risco', sobeEm(t, fimLinhas, 0.35).toFixed(3));
    if (preco) poe(preco, { escala: entre(0.82, 1, molaEm(t, fimLinhas + 0.35, 0.55)) });
    if (desconto) poe(desconto, { y: entre(10, 0, sobeEm(t, fimLinhas + 0.6, 0.3)), opacidade: sobeEm(t, fimLinhas + 0.6, 0.25) });
  }, 0.25);
}

/* ---------- 10. o que você recebe: os vistos batem, um por um ---------- */

export function iniciarRecebe(secao) {
  const lista = secao && secao.querySelector('.lista-linhas');
  const itens = lista ? [...lista.children].filter(li => !li.hidden) : [];
  if (!itens.length) return;
  quandoAparecer(lista, 0.22 * itens.length + 0.7, t => {
    itens.forEach((li, k) => {
      const t0 = 0.22 * k;
      li.style.setProperty('--visto', molaEm(t, t0 + 0.12, 0.5).toFixed(3));
      poe(li, { y: entre(12, 0, molaEm(t, t0, 0.5)), opacidade: sobeEm(t, t0, 0.2) });
    });
  });
}

/* ---------- 11. para quem cria: os cartões entram e cada ícone mostra a rotina ---------- */

export function iniciarPraQuem(secao) {
  const lista = secao && secao.querySelector('.rotinas');
  const cartoes = lista ? [...lista.children] : [];
  if (!cartoes.length) return;
  const ponteiro = lista.querySelector('[data-ponteiro]');
  const celulas = [...lista.querySelectorAll('[data-celula]')];
  const legenda = lista.querySelector('[data-legenda]');
  const pontinhos = [...lista.querySelectorAll('[data-pontinho]')];
  quandoAparecer(lista, 3.2, t => {
    cartoes.forEach((c, k) => poe(c, { y: entre(24, 0, molaEm(t, 0.12 * k, 0.6)), opacidade: sobeEm(t, 0.12 * k, 0.25) }));
    // sem tempo: o ponteiro do cronômetro dá uma volta inteira
    if (ponteiro) ponteiro.style.transform = `rotate(${(360 * sobeEm(t, 0.35, 1.1)).toFixed(1)}deg)`;
    // a página no nicho: a grade do perfil enche, um vídeo por vez
    celulas.forEach((cel, k) => cel.classList.toggle('cheia', t >= 0.55 + 0.13 * k));
    // quem ensina: a legenda do vídeo se escreve
    if (legenda) legenda.style.strokeDashoffset = (1 - sobeEm(t, 0.8, 0.6)).toFixed(3);
    // quem paga editor: os três pontos de quem responde na conversa
    pontinhos.forEach((p, k) => {
      const salto = pulso(t, 1.0 + 0.12 * k, 0.32) + pulso(t, 1.75 + 0.12 * k, 0.32) + pulso(t, 2.5 + 0.12 * k, 0.32);
      p.style.transform = `translateY(${(-3.5 * salto).toFixed(2)}px)`;
    });
  }, 0.25);
}

/* ---------- 12. preço: os 7 dias da garantia acendem ---------- */

export function iniciarPreco(secao) {
  const faixa = secao && secao.querySelector('.garantia');
  const dias = faixa ? [...faixa.querySelectorAll('i')] : [];
  if (!dias.length) return;
  const selo = faixa.querySelector('.garantia-selo');
  quandoAparecer(faixa, 1.7, t => {
    dias.forEach((d, k) => {
      const t0 = 0.1 + 0.11 * k;
      d.classList.toggle('aceso', t >= t0);
      poe(d, { escala: 1 + 0.2 * pulso(t, t0, 0.3) });
    });
    if (selo) poe(selo, { escala: molaEm(t, 0.95, 0.5), opacidade: sobeEm(t, 0.95, 0.1) });
  }, 0.6);
}

/* ---------- 13. dúvidas: a resposta sobe quando a pergunta abre ---------- */

export function iniciarDuvidas(secao) {
  if (!secao || reduzido) return;
  for (const caixa of secao.querySelectorAll('details')) {
    const resposta = caixa.querySelector('p');
    const pergunta = caixa.querySelector('summary');
    if (!resposta || !pergunta) continue;
    let pare = null;
    // o estado de partida entra antes de a caixa abrir, para a resposta não aparecer inteira por um quadro
    pergunta.addEventListener('click', () => { if (!caixa.open) poe(resposta, { y: 10, opacidade: 0 }); });
    caixa.addEventListener('toggle', () => {
      if (pare) { pare(); pare = null; }
      if (!caixa.open) { resposta.style.transform = ''; resposta.style.opacity = ''; return; }
      let t = 0;
      pare = relogio.visivel(caixa, (_, dt) => {
        t += dt;
        poe(resposta, { y: entre(10, 0, molaEm(t, 0, 0.45)), opacidade: sobeEm(t, 0, 0.2) });
        if (t >= 0.5) { pare(); pare = null; resposta.style.transform = ''; resposta.style.opacity = ''; }
      });
    });
  }
}

/* ---------- 14. fecho: o pagamento da cena de exemplo, de novo, curto ---------- */

// Toca no celular a última frase da cena ("Arrume os três, e o perfil volta a crescer."), com o fim parado
// por um instante, em volta. Com o som ligado, a primeira volta depois de o fecho entrar na tela sai com a
// mistura da cena (demo/som.mp3, a mesma da abertura, com outro dono); as voltas seguintes são mudas.
export function iniciarFecho(secao) {
  const vitrine = secao && secao.querySelector('[data-fecho-cena]');
  const quadro = vitrine && vitrine.querySelector('iframe');
  if (!quadro) return;
  const DONO = 'fecho';
  const A = FRASES[4] ? FRASES[4].a : Math.max(0, FIM_DA_CENA - 2.2);
  const PAUSA = 1.8;                       // o último quadro fica parado antes de recomeçar
  const FIM = DURACAO + PAUSA;
  let t = reduzido ? FIM_DA_CENA : A;     // o segundo da cena
  let visto = 0;
  let comSom = true;                       // a volta atual ainda pode sair com som

  const janela = () => {
    try {
      const w = quadro.contentWindow;
      return w && typeof w.__seek === 'function' ? w : null;
    } catch { return null; }
  };
  let desenhado = -1, janelaDesenhada = null;
  function desenha() {
    const w = janela();
    const alvo = Math.min(t, FIM_DA_CENA);
    if (w && (alvo !== desenhado || w !== janelaDesenhada)) {
      w.__seek(alvo);
      desenhado = alvo;
      janelaDesenhada = w;
    }
  }
  // A cena redesenha o próprio quadro quando as letras dela chegam (fonts.ready); o quadro do fecho entra depois.
  const acertaQuadro = () => {
    janelaDesenhada = null;
    desenha();
    const w = janela();
    if (w && w.document && w.document.fonts) w.document.fonts.ready.then(() => { janelaDesenhada = null; desenha(); });
  };
  quadro.addEventListener('load', acertaQuadro);
  acertaQuadro();
  if (reduzido) return;

  function acertaSom() {
    const deve = comSom && som.ligado() && visto >= 0.5 && !document.hidden && t < DURACAO - 0.25;
    if (deve) {
      if (!mistura.tocando(DONO) && (mistura.livre() || mistura.dono() === DONO)) mistura.tocar(DONO, t);
    } else {
      mistura.parar(DONO);
    }
  }
  som.aoMudar(acertaSom);
  mistura.aoLiberar(acertaSom);
  document.addEventListener('visibilitychange', acertaSom);

  if (typeof IntersectionObserver === 'function') {
    new IntersectionObserver(([e]) => {
      const antes = visto;
      visto = e.isIntersecting ? e.intersectionRatio : 0;
      // ao voltar à tela, a cena recomeça do começo da frase, e essa volta pode ter som de novo
      if (visto > 0 && antes === 0) { t = A; comSom = true; desenhado = -1; }
      acertaSom();
    }, { threshold: [0, 0.5, 1] }).observe(vitrine);
  } else {
    visto = 1;
  }

  relogio.visivel(vitrine, (_, dt) => {
    t += dt;
    const doSom = mistura.tempo(DONO);
    if (doSom !== null) {
      // com o som saindo, ele manda; se ficou para trás, é ele que pula
      if (Math.abs(doSom - t) > 0.25) mistura.acerta(DONO, t);
      else t = doSom;
    }
    if (t >= DURACAO - 0.05 && mistura.tocando(DONO)) { comSom = false; mistura.parar(DONO); }
    if (t >= FIM) { t = A; acertaSom(); }
    desenha();
  });
}
