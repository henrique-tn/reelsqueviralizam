// Curvas e o relógio da página. Um requestAnimationFrame só para tudo: cada módulo se inscreve
// no relógio, e o que está fora da tela não anima. Quando nada precisa de quadro, o relógio para.

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));

// Cúbica de saída: arranca rápido e assenta devagar. u vai de 0 a 1.
export const sobe = u => 1 - Math.pow(1 - clamp(u), 3);

// Mola: passa um pouco do alvo e volta, 1 - e^(-6u)·cos(10u). Antes de 0 vale 0; depois de 1 vale 1.
export const mola = u => (u <= 0 ? 0 : u >= 1 ? 1 : 1 - Math.exp(-6 * u) * Math.cos(10 * u));

// Quem pede menos movimento no sistema vê os estados finais.
export const reduzido = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

// Um quadro nunca conta mais que isto: depois de uma aba escondida ou de um engasgo,
// a animação continua de onde estava em vez de pular para a frente.
const PASSO_MAX = 0.1;

const ouvintes = new Set();          // { fn, t, ativo }
const vigiados = new Map();          // elemento -> { naTela, ouvintes: Set }
let pedido = 0;
let anterior = 0;

function avisaErro(erro) {
  if (typeof reportError === 'function') reportError(erro);
  else console.error(erro);
}

function quadro(ms) {
  pedido = 0;
  const dt = anterior ? Math.min((ms - anterior) / 1000, PASSO_MAX) : 0;
  anterior = ms;
  let algum = false;
  for (const o of ouvintes) {
    if (!o.ativo) continue;
    algum = true;
    o.t += dt;
    try {
      o.fn(o.t, dt);
    } catch (erro) {
      // um ouvinte com erro sai do relógio, para não travar os outros nem repetir o erro a cada quadro
      ouvintes.delete(o);
      avisaErro(erro);
    }
  }
  if (algum) pedido = requestAnimationFrame(quadro);
  else anterior = 0;
}

function acorda() {
  if (pedido) return;
  anterior = 0;
  pedido = requestAnimationFrame(quadro);
}

const vigia = typeof IntersectionObserver === 'function'
  ? new IntersectionObserver(entradas => {
    for (const e of entradas) {
      const v = vigiados.get(e.target);
      if (!v) continue;
      v.naTela = e.isIntersecting;
      for (const o of v.ouvintes) o.ativo = v.naTela;
    }
    acorda();
  })
  : null;

export const relogio = {
  // fn(t, dt) a cada quadro. t: segundos desde a inscrição; dt: segundos desde o quadro anterior.
  // Devolve uma função que tira fn do relógio.
  cada(fn) {
    const o = { fn, t: 0, ativo: true };
    ouvintes.add(o);
    acorda();
    return () => { ouvintes.delete(o); };
  },

  // Como cada, mas só enquanto el está na tela. t só anda com el à vista: quando ele volta,
  // a animação continua de onde parou. Devolve uma função que tira fn do relógio.
  visivel(el, fn) {
    if (!vigia) return relogio.cada(fn);
    const o = { fn, t: 0, ativo: false };
    let v = vigiados.get(el);
    if (!v) {
      v = { naTela: false, ouvintes: new Set() };
      vigiados.set(el, v);
      vigia.observe(el);
    }
    o.ativo = v.naTela;
    v.ouvintes.add(o);
    ouvintes.add(o);
    if (o.ativo) acorda();
    return () => {
      ouvintes.delete(o);
      v.ouvintes.delete(o);
      if (!v.ouvintes.size) { vigia.unobserve(el); vigiados.delete(el); }
    };
  },
};
