// Som da página. O navegador só deixa tocar som depois de um gesto da pessoa, então a página começa
// muda e liga sozinha no primeiro toque em qualquer lugar. Depois desse toque, quem manda é a chave
// de som (os botões [data-som-chave], ligados em pagina.js).
//
// O toque conta quando o navegador já libera o som: no mouse, ao apertar (pointerdown); no dedo, ao
// soltar (pointerup), porque o começo de um toque ainda pode virar rolagem e não libera som nenhum.
// Como nem todo navegador aceita o mesmo evento (o Safari do iPhone pode não aceitar o pointerup), o
// touchend e o click tentam de novo, gesto após gesto, até um play() dar certo. "Som ligado" só aparece
// depois que o som destravou de verdade.

const ouvintes = new Set();
const tocadores = new Map();         // nome -> elementos de áudio reaproveitados
const POR_SOM = 4;                   // até 4 cópias do mesmo efeito tocando juntas
let ligado = false;
let decidido = false;                // já houve o primeiro toque, ou a pessoa já usou a chave
let querSom = false;                 // o último pedido foi de ligar (o toque na página ou a chave)
let destravado = false;              // um play() feito num gesto já deu certo
const destravadores = new Set();     // fn() -> promessa do play(); chamadas dentro do gesto

// Chama os destravadores dentro do gesto; resolve true quando um deles tocou de verdade.
function destravar() {
  if (destravado || !destravadores.size) { destravado = true; return Promise.resolve(true); }
  const tentativas = [...destravadores].map(fn => {
    try { return Promise.resolve(fn()); } catch (erro) { return Promise.reject(erro); }
  });
  return Promise.any(tentativas).then(() => { destravado = true; return true; }, () => false);
}

function avisa() {
  for (const fn of ouvintes) {
    try { fn(ligado); } catch (erro) { if (typeof reportError === 'function') reportError(erro); else console.error(erro); }
  }
}

function tocador(nome) {
  let lista = tocadores.get(nome);
  if (!lista) { lista = []; tocadores.set(nome, lista); }
  const livre = lista.find(a => a.paused || a.ended);
  if (livre) return livre;
  if (lista.length < POR_SOM) {
    const novo = new Audio(new URL(`../sons/${nome}.mp3`, import.meta.url).href);
    novo.preload = 'auto';
    lista.push(novo);
    return novo;
  }
  // todas tocando: recomeça a mais antiga
  const velho = lista.shift();
  lista.push(velho);
  return velho;
}

export const som = {
  ligado: () => ligado,

  // Pede o som; ele só fica "ligado" depois que o navegador deixou tocar (chame dentro de um gesto).
  ligar() {
    decidido = true;
    querSom = true;
    if (ligado) return;
    destravar().then(ok => {
      if (!ok || !querSom || ligado) return;   // não destravou: o próximo gesto tenta de novo
      ligado = true;
      avisa();
    });
  },

  silenciar() {
    decidido = true;
    querSom = false;
    if (!ligado) return;
    ligado = false;
    avisa();
  },

  // Toca sons/<nome>.mp3, só com o som ligado. Devolve o elemento de áudio (ou null, com o som desligado).
  tocar(nome, { volume = 0.6 } = {}) {
    if (!ligado) return null;
    const a = tocador(nome);
    a.volume = volume;
    a.currentTime = 0;
    a.play().catch(() => {});
    return a;
  },

  // fn() é chamada dentro de cada gesto até o som destravar, e devolve a promessa do play() que destrava.
  aoDestravar(fn) {
    destravadores.add(fn);
    return () => { destravadores.delete(fn); };
  },

  // fn(ligado) a cada troca. Devolve uma função que tira fn da lista.
  aoMudar(fn) {
    ouvintes.add(fn);
    return () => { ouvintes.delete(fn); };
  },
};

// O primeiro toque liga o som. Se o navegador ainda não deixou tocar, cada gesto seguinte tenta de novo.
function primeiroToque(e) {
  if (ligado && destravado) return;
  if (decidido && !querSom) return;      // a pessoa silenciou pela chave
  // a chave de som decide sozinha: se o primeiro toque ligasse o som, o clique dela desligaria em seguida
  if (e.target instanceof Element && e.target.closest('[data-som-chave]')) return;
  som.ligar();
}
addEventListener('pointerdown', e => { if (e.pointerType === 'mouse') primeiroToque(e); }, true);
addEventListener('pointerup', e => { if (e.pointerType !== 'mouse') primeiroToque(e); }, true);
addEventListener('touchend', primeiroToque, { capture: true, passive: true });
addEventListener('click', primeiroToque, true);
addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') primeiroToque(e); }, true);

// para o teste de fumaça (testes/pagina.test.mjs)
window.__som = som;
