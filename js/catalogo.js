// "Seis arquivos. Um estúdio inteiro.": as capas dos arquivos passam de lado (dedo, setas, miniaturas ou o
// teclado) e o detalhe do arquivo escolhido fica embaixo (no computador, ao lado).
//
// Cada capa é o reel da capa da Kiwify (capas-arquivos.mjs), agora animado em código, nas cores da cena do kit:
// Ideias acende a lista e carimba a ideia que prende; Roteiro escreve as aberturas A, B e C; Motion é a cena
// do pagamento do kit, com mola; Revisor sobe as 8 notas e carimba a que trava; Carrossel passa as lâminas;
// Postar escreve a legenda e solta as hashtags; Manual (só com ativo: true no AJUSTES) abre as folhas em
// leque e mostra o placar das três aberturas. As miniaturas mostram o quadro da loja, parado.
//
// O espaço de cada capa é o [data-video="arquivos.<chave>"] do HTML: com vídeo no AJUSTES, o pagina.js já pôs
// o vídeo no lugar da capa ao vivo. Os textos do detalhe saem do AJUSTES.produtos.
import { AJUSTES } from './ajustes.js';
import { formatarReais, linkDeCompra } from './oferta.js';
import { relogio, clamp, reduzido } from './tempo.js';
import { montaPalco, cartao, molaEm, sobeEm, pulso, carimbo, conta, milhar, entre, poe } from './efeitos.js';

/* ---------- pedaços comuns do reel (1080 x 1920) ---------- */

const cab = (m1, m2, topo = 300, tamanho = 168) =>
  `<div class="rl-p rl-cab" style="top:${topo}px"><p class="rl-m1" style="font-size:${tamanho}px">${m1}</p><p class="rl-m2">${m2}</p></div>`;
const leg = html => `<p class="rl-p rl-leg">${html}</p>`;
const mec = (acesos, total = 3) =>
  `<div class="rl-p rl-mec"><span class="rl-mec-conta">${acesos} DE ${total}</span>${Array.from({ length: total }, (_, k) => `<i class="${k < acesos ? 'on' : ''}"></i>`).join('')}</div>`;
// a linha fina do pé, que anda com a volta da capa, como a barra de um vídeo tocando
const andamento = '<i class="rl-p rl-andamento"></i>';

const IDEIAS = ['MEDO NO BOLSO', 'NOME GRANDE EM RISCO', 'EXPLICADOR DE CRISE', 'HÁBITO QUE CUSTA CARO', 'ERRO QUE TODO MUNDO COMETE'];
const ABERTURAS = [['A', 'REGOU MAIS. MORREU ANTES.'], ['B', 'TERRA ÚMIDA? NÃO REGUE.'], ['C', 'REGAR TODO DIA PODE MATAR.']];
const NOTAS = [['GANCHO VISUAL', 9], ['LEGIBILIDADE', 8], ['SINCRONIA', 8], ['RITMO', 7], ['IDENTIDADE', 9], ['CARA DE IA', 6], ['ZONAS SEGURAS', 8], ['COMPOSIÇÃO', 7]];
const TAGS = [['#bolo', '#receitas', '#bolocaseiro'], ['#receitafacil', '#confeitaria']];
const LEGENDA_POST = 'O segundo erro acontece antes de a massa chegar perto do forno, ainda na tigela.';
// as quatro primeiras lâminas do carrossel de exemplo do kit (arquivos/carrossel/carrosseis/exemplo)
const LAMINAS = [
  { tipo: 'capa', titulo: '3 erros no <mark>cartão de crédito</mark>', texto: 'E o que fazer no lugar de cada um.' },
  { tipo: 'jogo', titulo: 'Os juros do rotativo estão <mark>entre os mais altos</mark> do Brasil.', texto: 'Basta pagar menos que o total da fatura para o restante virar dívida com esses juros.' },
  { tipo: 'ideia', n: 1, titulo: 'Pagar só o mínimo da fatura', texto: 'Isso evita o atraso, mas o resto da fatura vira dívida no rotativo. Sempre que der, pague o total.' },
  { tipo: 'ideia', n: 2, titulo: 'Parcelar olhando só a parcela', texto: 'A parcela que cabe no mês pode esconder juros. Antes de fechar, compare o total parcelado com o preço à vista.' },
  { tipo: 'ideia', n: 3, titulo: 'Tratar o limite como renda', texto: 'O limite é dinheiro que o banco empresta, não dinheiro seu. Antes de comprar, some o que já está comprometido nas próximas faturas.' },
];
const lamina = (l, k) => `
  <div class="rl-p rl-lamina rl-lam-${l.tipo}" style="left:${570 * k}px">
    <div class="rl-p rl-miolo">
      ${l.tipo === 'ideia' ? `<span class="rl-lam-num">${l.n}</span>` : '<i class="rl-selo"></i>'}
      <p class="rl-lam-tit">${l.titulo}</p>
      <p class="rl-lam-txt">${l.texto}</p>
    </div>
    <div class="rl-p rl-lam-pe"><span>@seuperfil</span><span class="rl-lam-barra">${Array.from({ length: 7 }, (_, j) => `<i class="${j <= k ? 'rl-lam-feito' : ''}"></i>`).join('')}</span><span>${k + 1}/7</span></div>
  </div>`;

/* ---------- as capas: html, o que cada uma mexe e o desenho de cada instante da volta ---------- */
// dura: a volta, em s; loja: o instante igual ao da capa da Kiwify (miniatura); final: o que vê quem pede menos movimento.

const CAPAS = {
  ideias: {
    dura: 6.8, loja: 2.6, final: 4.6,
    html: () => cab('10 IDEIAS', 'PRO SEU NICHO') +
      IDEIAS.map((texto, k) => `<div class="rl-p rl-linha apagada" style="top:${612 + k * 106}px"><span class="rl-bola">${k + 1}</span><span class="rl-txt">${texto}</span>${
        k === 2 ? '<span class="rl-p rl-etq">PRENDE</span>' : ''}</div>`).join('') +
      leg('O <b>ÂNGULO</b> QUE PRENDE') + andamento,
    pega: p => ({ linhas: [...p.querySelectorAll('.rl-linha')], etq: p.querySelector('.rl-linha .rl-etq') }),
    // a IA escreve as ideias uma a uma; a terceira acende e leva o carimbo de que prende
    desenha(e, t) {
      const em = [0.5, 1.1, 1.7, 2.9, 3.5];
      e.linhas.forEach((linha, k) => {
        const estado = t < em[k] ? 'apagada' : k === 2 ? 'acende' : 'feita';
        if (linha.dataset.estado !== estado) {
          linha.classList.remove('apagada', 'feita', 'acende');
          linha.classList.add(estado);
          linha.dataset.estado = estado;
        }
        poe(linha, { escala: estado === 'apagada' ? 1 : entre(0.94, k === 2 ? 1.045 : 1, molaEm(t, em[k], 0.45)) });
      });
      poe(e.etq, { escala: carimbo(t, 2.1), opacidade: sobeEm(t, 2.1, 0.08), giro: -6 });
    },
  },

  roteiro: {
    dura: 7.4, loja: 4.6, final: 5.6,
    html: () => mec(0) + cab('3 ABERTURAS', 'PRO MESMO VÍDEO', 300, 150) +
      ABERTURAS.map(([letra], k) => `<div class="rl-p rl-abert" style="top:${600 + k * 182}px"><span class="rl-letra">${letra}</span><span class="rl-fala"><span class="rl-digitado"></span><i class="rl-cursor"></i></span></div>`).join('') +
      leg('QUAL DAS TRÊS <b>PRENDE</b>?') + andamento,
    pega: p => ({
      conta: p.querySelector('.rl-mec-conta'),
      pontos: [...p.querySelectorAll('.rl-mec i')],
      linhas: [...p.querySelectorAll('.rl-abert')].map(el => ({ el, txt: el.querySelector('.rl-digitado'), cursor: el.querySelector('.rl-cursor') })),
    }),
    // as três aberturas se escrevem uma depois da outra, e o progresso conta as prontas
    desenha(e, t) {
      const inicio = [0.4, 2.0, 3.5], letras = 20;   // letras por segundo
      const fins = ABERTURAS.map(([, frase], k) => inicio[k] + frase.length / letras);
      let ativa = -1;
      ABERTURAS.forEach(([, frase], k) => {
        const n = clamp(Math.floor((t - inicio[k]) * letras), 0, frase.length);
        const linha = e.linhas[k];
        const texto = frase.slice(0, n);
        if (linha.txt.textContent !== texto) linha.txt.textContent = texto;
        if (t >= inicio[k] && t < fins[k] + 0.4) ativa = k;
      });
      e.linhas.forEach((linha, k) => {
        linha.el.classList.toggle('ativa', k === ativa);
        // o cursor fica firme enquanto escreve e pisca na pausa
        const escrevendo = t < fins[k];
        linha.cursor.style.visibility = k === ativa && (escrevendo || (t * 2.4) % 1 < 0.55) ? 'visible' : 'hidden';
      });
      const prontas = fins.filter(f => t >= f).length;
      const texto = `${prontas} DE 3`;
      if (e.conta.textContent !== texto) e.conta.textContent = texto;
      e.pontos.forEach((ponto, k) => {
        ponto.classList.toggle('on', k < prontas);
        poe(ponto, { escala: 1 + 0.5 * pulso(t, fins[k], 0.4) });
      });
    },
  },

  motion: {
    dura: 5.4, loja: 4.2, final: 4.2,
    html: () => mec(3) +
      `<p class="rl-p rl-tit rl-arrume" style="top:300px;font-size:84px">ARRUME OS 3</p>
      <p class="rl-p rl-tit rl-cresce" style="top:410px;font-size:124px;color:var(--reel-destaque)">VOLTA A CRESCER</p>
      <svg class="rl-p rl-raios" viewBox="0 0 1080 600" style="left:0;top:600px;width:1080px;height:600px" aria-hidden="true">
        <path d="M170 110L110 60M910 110L970 60M150 320H80M930 320H1000" class="s-destaque" stroke-width="14"/>
      </svg>
      <div class="rl-p rl-cartao" style="left:220px;top:640px">${cartao('312')}</div>
      <svg class="rl-p rl-seta" viewBox="0 0 120 140" style="left:690px;top:880px;width:120px;height:140px" aria-hidden="true">
        <path d="M60 8L112 70H80V132H40V70H8z" class="f-destaque s-sombra" stroke-width="8"/>
      </svg>` + leg('ARRUME OS TRÊS,') + andamento,
    pega: p => ({
      arrume: p.querySelector('.rl-arrume'), cresce: p.querySelector('.rl-cresce'), raios: p.querySelector('.rl-raios'),
      num: p.querySelector('.rl-num'), barra: p.querySelector('.rl-barra'), seta: p.querySelector('.rl-seta'), leg: p.querySelector('.rl-leg'),
    }),
    // o pagamento da cena do kit: "Arrume os três, e o perfil volta a crescer.", com a legenda em blocos
    desenha(e, t) {
      const arrume = 0.3, volta = 0.9, cresce = 1.6, fim = cresce + 0.6;
      poe(e.arrume, { escala: entre(0.8, 1, molaEm(t, arrume, 0.4)) });
      poe(e.cresce, { escala: molaEm(t, cresce, 0.55) + 0.08 * pulso(t, fim, 0.45), opacidade: sobeEm(t, cresce, 0.1) });
      const numero = milhar(conta(t, volta, fim, 312, 12480));
      if (e.num.textContent !== numero) e.num.textContent = numero;
      e.num.classList.toggle('subiu', t >= cresce);
      poe(e.num, { escala: 1 + 0.1 * pulso(t, fim, 0.4) });
      e.barra.style.transform = `scaleX(${sobeEm(t, volta, fim - volta).toFixed(4)})`;
      poe(e.seta, { y: entre(60, 0, molaEm(t, cresce, 0.5)), opacidade: sobeEm(t, cresce, 0.1) });
      poe(e.raios, { escala: entre(0.7, 1, molaEm(t, cresce + 0.2, 0.5)), opacidade: sobeEm(t, cresce + 0.2, 0.15) });
      const bloco = t < volta ? 'ARRUME OS TRÊS,' : t < cresce ? 'E O PERFIL' : 'VOLTA A <b>CRESCER.</b>';
      if (e.leg.dataset.bloco !== bloco) { e.leg.innerHTML = bloco; e.leg.dataset.bloco = bloco; }
    },
  },

  revisor: {
    dura: 6.6, loja: 4, final: 4,
    html: () => cab('8 NOTAS', 'ANTES DE POSTAR') +
      `<div class="rl-p rl-painel">${NOTAS.map(([rotulo, n]) => `<div class="rl-nota${n <= 6 ? ' rl-nota-trava' : ''}"><span>${rotulo}</span><span class="rl-trilho"><i></i></span><b>${n}</b>${
        n <= 6 ? '<span class="rl-p rl-etq">TRAVA</span>' : ''}</div>`).join('')}</div>` +
      leg('UMA NOTA <b>TRAVA</b> O POST') + andamento,
    pega: p => ({
      notas: [...p.querySelectorAll('.rl-nota')].map(el => ({ el, barra: el.querySelector('.rl-trilho i'), num: el.querySelector('b') })),
      trava: p.querySelector('.rl-nota-trava'),
      etq: p.querySelector('.rl-nota-trava .rl-etq'),
    }),
    // as 8 notas sobem uma depois da outra; a da cara de IA fica vermelha e leva o carimbo
    desenha(e, t) {
      e.notas.forEach((nota, k) => {
        const p = sobeEm(t, 0.4 + 0.22 * k, 0.5);
        nota.barra.style.width = `${(NOTAS[k][1] * 10 * p).toFixed(2)}%`;
        const n = String(Math.round(NOTAS[k][1] * p));
        if (nota.num.textContent !== n) nota.num.textContent = n;
      });
      const trava = 2.8;
      e.trava.classList.toggle('vermelha', t >= trava);
      poe(e.etq, { escala: carimbo(t, trava), opacidade: sobeEm(t, trava, 0.08), giro: -6 });
    },
  },

  carrossel: {
    dura: 7.2, loja: 0.6, final: 0.6,
    html: () => cab('CARROSSEL', 'PRONTO EM PNG') +
      `<div class="rl-p rl-laminas">${LAMINAS.map(lamina).join('')}</div>` +
      `<div class="rl-p rl-pontos">${'<i></i>'.repeat(7)}</div>` + andamento,
    pega: p => ({ faixa: p.querySelector('.rl-laminas'), pontos: [...p.querySelectorAll('.rl-pontos i')] }),
    // as lâminas passam uma por vez, como o dedo arrastando o post, e voltam para a capa no fim
    desenha(e, t) {
      let pos = [1.2, 2.5, 3.8].reduce((soma, em) => soma + molaEm(t, em, 0.6), 0);
      pos -= 3 * molaEm(t, 6.2, 0.7);
      e.faixa.style.transform = `translateX(${(-570 * pos).toFixed(1)}px)`;
      const atual = Math.round(clamp(pos, 0, 6));
      e.pontos.forEach((ponto, k) => {
        const classe = k === atual ? 'on' : k === atual + 1 ? 'meio' : '';
        if (ponto.className !== classe) ponto.className = classe;
      });
    },
  },

  postar: {
    dura: 7.0, loja: 5, final: 5,
    html: () => cab('5 HASHTAGS', 'E A HORA DE POSTAR') +
      `<div class="rl-p rl-post"><i class="rl-p rl-av"></i><i class="rl-p rl-nome1"></i><i class="rl-p rl-nome2"></i>
        <p><span class="rl-escrito"></span><span class="rl-mais"> mais</span></p></div>
      <p class="rl-p rl-etq rl-hora" style="left:742px;top:566px">18H</p>` +
      TAGS.map((linha, l) => `<div class="rl-p rl-tags" style="top:${966 + l * 96}px">${linha.map(tag => `<span>${tag}</span>`).join('')}</div>`).join('') +
      leg('E UM <b>GANCHO</b> NOVO') + andamento,
    pega: p => ({
      escrito: p.querySelector('.rl-escrito'), mais: p.querySelector('.rl-mais'), hora: p.querySelector('.rl-hora'),
      tags: [...p.querySelectorAll('.rl-tags span')],
    }),
    // a legenda se escreve, o horário bate como carimbo e as hashtags entram com mola, uma por uma
    desenha(e, t) {
      const n = clamp(Math.floor((t - 0.4) * 52), 0, LEGENDA_POST.length);
      if (e.escrito.textContent.length !== n) e.escrito.textContent = LEGENDA_POST.slice(0, n);
      e.mais.style.opacity = n >= LEGENDA_POST.length ? '' : '0';
      poe(e.hora, { escala: carimbo(t, 2.3), opacidade: sobeEm(t, 2.3, 0.08), giro: 6 });
      e.tags.forEach((tag, k) => {
        const t0 = 2.9 + 0.2 * k;
        poe(tag, { escala: molaEm(t, t0, 0.45), opacidade: sobeEm(t, t0, 0.1), giro: entre(-8, 0, molaEm(t, t0, 0.45)) });
      });
    },
  },

  manual: {
    dura: 6.4, loja: 4, final: 4,
    html: () => cab('10 MÓDULOS', 'DA IDEIA AOS NÚMEROS', 284) +
      `<div class="rl-p rl-folha f3"></div><div class="rl-p rl-folha f2"></div>
      <div class="rl-p rl-folha f1">
        <div class="rl-p rl-faixa"><b>01</b><span>POR QUE<br>FUNCIONA</span></div>
        <p class="rl-p rl-pronto">PRONTO NA MÃO</p>
        <i class="rl-p rl-ln" style="top:228px;width:360px"></i><i class="rl-p rl-ln" style="top:256px;width:330px"></i><i class="rl-p rl-ln" style="top:284px;width:250px"></i>
        <div class="rl-p rl-placar">
          <div><b>2 MIL</b><span>MANCHETE</span></div>
          <div><b>27 MIL</b><span>PERGUNTA</span></div>
          <div><b>5 MILHÕES</b><span>PARADOXO</span></div>
        </div>
        <i class="rl-p rl-fita"></i>
      </div>` + leg('O MÉTODO <b>INTEIRO</b>') + andamento,
    pega: p => ({ f3: p.querySelector('.f3'), f2: p.querySelector('.f2'), placar: [...p.querySelectorAll('.rl-placar div')] }),
    // as folhas de trás se abrem em leque e o placar das três aberturas entra, linha por linha; a vencedora
    // (5 milhões) pulsa e fica na cor de alerta da cena (--reel-alerta)
    desenha(e, t) {
      const abre = molaEm(t, 0.3, 0.6);
      e.f3.style.transform = `rotate(${(-8 * abre).toFixed(2)}deg) translate(${(-44 * abre).toFixed(1)}px, ${(18 * abre).toFixed(1)}px)`;
      e.f2.style.transform = `rotate(${(5 * abre).toFixed(2)}deg) translate(${(38 * abre).toFixed(1)}px, ${(6 * abre).toFixed(1)}px)`;
      e.placar.forEach((linha, k) => {
        const t0 = 1.0 + 0.45 * k;
        poe(linha, { y: entre(30, 0, sobeEm(t, t0, 0.3)), opacidade: sobeEm(t, t0, 0.2), escala: k === 2 ? 1 + 0.06 * pulso(t, 2.5, 0.4) : 1 });
      });
      e.placar[2].classList.toggle('vence', t >= 2.5);
    },
  },
};

/* ---------- a seção ---------- */

export function iniciarCatalogo(secao) {
  if (!secao) return;
  const rolo = secao.querySelector('[data-capas]');
  const detalhe = secao.querySelector('[data-arquivo]');
  if (!rolo || !detalhe) return;
  const porChave = Object.fromEntries(AJUSTES.produtos.map(p => [p.chave, p]));
  const ativo = el => !el.hidden && porChave[el.dataset.chave] && porChave[el.dataset.chave].ativo !== false;

  // as capas e as miniaturas dos produtos ativos (o pagina.js já escondeu as dos inativos)
  const capas = [...rolo.querySelectorAll('.capa')].filter(ativo).map((slide, k, lista) => {
    const chave = slide.dataset.chave, p = porChave[chave], def = CAPAS[chave];
    slide.setAttribute('aria-label', `${k + 1} de ${lista.length}: ${p.nome}`);
    const caixa = slide.querySelector('.capa-viva');      // sem ela, é o vídeo do AJUSTES que está no lugar
    let viva = null;
    if (caixa && def) {
      viva = { e: def.pega(montaPalco(caixa, def.html())), t: reduzido ? def.final : 0, andamento: null };
      viva.andamento = caixa.querySelector('.rl-andamento');
      def.desenha(viva.e, viva.t);
      if (viva.andamento) viva.andamento.style.transform = `scaleX(${reduzido ? 1 : 0})`;
    }
    return { slide, chave, p, def, viva };
  });
  if (!capas.length) return;
  const total = capas.length;

  const minis = [...secao.querySelectorAll('[data-escolhe]')].filter(b => porChave[b.dataset.escolhe] && porChave[b.dataset.escolhe].ativo !== false);
  minis.forEach(botao => {
    const p = porChave[botao.dataset.escolhe], def = CAPAS[botao.dataset.escolhe];
    const nome = botao.querySelector('[data-mini-nome]');
    if (nome) nome.textContent = p.nome;
    const tela = botao.querySelector('.miniatura-tela');
    if (tela && def) def.desenha(def.pega(montaPalco(tela, def.html())), def.loja);
  });

  /* --- o detalhe do arquivo escolhido --- */
  const $ = s => detalhe.querySelector(s);
  const campos = {
    n: $('[data-arquivo-n]'), nome: $('[data-arquivo-nome]'), promessa: $('[data-arquivo-promessa]'), faz: $('[data-arquivo-faz]'),
    roda: $('[data-arquivo-roda]'), preco: $('[data-arquivo-preco]'), comprar: $('[data-arquivo-comprar]'), comprarNome: $('[data-arquivo-comprar-nome]'),
  };
  const partes = [...detalhe.children];
  let trocaEm = -1;
  let pareTroca = null;
  // o texto novo sobe no lugar, uma parte logo depois da outra; o relógio só fica ligado durante a troca
  function animaTroca() {
    trocaEm = performance.now();
    // o ponto de partida já no quadro da troca, para o texto novo não aparecer inteiro por um instante
    partes.forEach(el => { el.style.transform = 'translateY(14px)'; el.style.opacity = '0'; });
    if (pareTroca) return;
    pareTroca = relogio.visivel(detalhe, () => {
      const s = (performance.now() - trocaEm) / 1000;
      partes.forEach((el, k) => {
        const t0 = 0.04 * k;
        el.style.transform = `translateY(${((1 - molaEm(s, t0, 0.5)) * 14).toFixed(2)}px)`;
        el.style.opacity = sobeEm(s, t0, 0.18).toFixed(3);
      });
      if (s > 0.8) {
        partes.forEach(el => { el.style.transform = ''; el.style.opacity = ''; });
        pareTroca();
        pareTroca = null;
      }
    });
  }
  function mostraDetalhe(p, { anima = true } = {}) {
    if (campos.n) campos.n.textContent = p.n;
    if (campos.nome) campos.nome.textContent = p.nome;
    if (campos.promessa) campos.promessa.textContent = p.promessa;
    if (campos.faz) campos.faz.replaceChildren(...p.faz.map(frase => { const li = document.createElement('li'); li.textContent = frase; return li; }));
    if (campos.roda) campos.roda.textContent = p.roda;
    if (campos.preco) campos.preco.textContent = formatarReais(p.preco);
    if (campos.comprar) {
      campos.comprar.dataset.comprar = p.chave;
      campos.comprar.href = linkDeCompra(p.chave, AJUSTES) || '#tabela';
    }
    if (campos.comprarNome) campos.comprarNome.textContent = `: ${p.nome}`;
    if (anima && !reduzido) animaTroca();
  }

  /* --- escolher um arquivo --- */
  let atual = -1;
  let indo = false;                 // a rolagem foi pedida por um botão e ainda está andando
  function escolhe(k, { rolar = true, suave = true, anima = true } = {}) {
    k = ((k % total) + total) % total;
    if (k !== atual) {
      atual = k;
      capas.forEach((c, j) => c.slide.classList.toggle('atual', j === k));
      minis.forEach(b => b.setAttribute('aria-current', String(b.dataset.escolhe === capas[k].chave)));
      mostraDetalhe(capas[k].p, { anima });
      const viva = capas[k].viva;
      if (viva && !reduzido) viva.t = 0;          // a capa escolhida recomeça do começo
    }
    if (rolar) {
      const s = capas[k].slide;
      const x = s.offsetLeft + s.offsetWidth / 2 - rolo.clientWidth / 2;
      if (Math.abs(rolo.scrollLeft - x) > 1) {
        indo = true;
        rolo.scrollTo({ left: x, behavior: suave && !reduzido ? 'smooth' : 'auto' });
      }
    }
  }
  // o centro de cada capa e a largura da janela só mudam com o tamanho: medidos uma vez e de novo no
  // ResizeObserver, para a rolagem não ler e escrever o layout capa por capa
  let centros = [], passos = [], meiaJanela = 0;
  const medir = () => {
    meiaJanela = rolo.clientWidth / 2;
    centros = capas.map(c => c.slide.offsetLeft + c.slide.offsetWidth / 2);
    passos = capas.map(c => c.slide.offsetWidth + 14);
  };
  medir();
  const maisPerto = () => {
    const meio = rolo.scrollLeft + meiaJanela;
    let melhor = 0, menor = Infinity;
    centros.forEach((x, k) => {
      const d = Math.abs(x - meio);
      if (d < menor) { menor = d; melhor = k; }
    });
    return melhor;
  };
  // as vizinhas encolhem e apagam conforme se afastam do meio
  function perto() {
    const meio = rolo.scrollLeft + meiaJanela;
    const valores = centros.map((x, k) => clamp(1 - Math.abs(x - meio) / passos[k]).toFixed(3));
    capas.forEach((c, k) => c.slide.style.setProperty('--perto', valores[k]));
  }
  let parou = 0;
  rolo.addEventListener('scroll', () => {
    perto();
    clearTimeout(parou);
    parou = setTimeout(() => { indo = false; escolhe(maisPerto(), { rolar: false }); }, 120);
  }, { passive: true });
  if (typeof ResizeObserver === 'function') new ResizeObserver(() => { medir(); perto(); if (atual >= 0 && !indo) escolhe(atual, { suave: false }); }).observe(rolo);

  secao.querySelectorAll('[data-seta]').forEach(b => b.addEventListener('click', () => escolhe(atual + Number(b.dataset.seta))));
  minis.forEach(b => b.addEventListener('click', () => escolhe(capas.findIndex(c => c.chave === b.dataset.escolhe))));
  capas.forEach((c, k) => c.slide.addEventListener('click', () => {
    if (k === atual && c.viva && !reduzido) c.viva.t = 0;   // tocar na capa da vez a recomeça
    escolhe(k);
  }));
  rolo.addEventListener('keydown', e => {
    const passo = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (passo) escolhe(atual + passo);
    else if (e.key === 'Home') escolhe(0);
    else if (e.key === 'End') escolhe(total - 1);
    else return;
    e.preventDefault();
  });

  escolhe(0, { suave: false, anima: false });
  perto();

  /* --- as capas andando: cada uma só com ela na tela; quem pede menos movimento vê o quadro final --- */
  if (reduzido) return;
  for (const c of capas) {
    if (!c.viva) continue;
    const v = c.viva;
    relogio.visivel(c.slide, (_, dt) => {
      v.t = (v.t + dt) % c.def.dura;
      c.def.desenha(v.e, v.t);
      if (v.andamento) v.andamento.style.transform = `scaleX(${(v.t / c.def.dura).toFixed(4)})`;
    });
  }
}
