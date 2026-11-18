// AJUSTES: tudo o que muda na venda sem mexer no resto da página.
// Data da Black, preços, os produtos, os links da Kiwify e os vídeos. Uma informação por linha.

export const AJUSTES = {
  // A Black acaba aqui. Depois disso o pacote passa ao preço cheio, e a faixa e os contadores somem.
  fimDaBlack: '2026-11-30T23:59:59-03:00',

  pacote: { nome: 'Pacote completo', black: 147, cheio: 297 },

  // Os produtos, na ordem da vitrine. `ativo: false` tira o produto da tabela, da soma e do pacote.
  produtos: [
    {
      chave: 'ideias', n: '01', nome: 'Ideias que Prendem',
      promessa: 'A IA acha 10 ideias para o seu nicho, cada uma com o ângulo que prende e o porquê.',
      faz: [
        'Pergunta o seu nicho e o seu público antes de sugerir.',
        'Usa as receitas de assunto que mais prenderam no método.',
        'Entrega cada ideia já com a primeira frase do vídeo.',
      ],
      roda: 'No chat do Claude', preco: 67, ativo: true,
    },
    {
      chave: 'roteiro', n: '02', nome: 'Roteiro de 3 Aberturas',
      promessa: 'Um corpo e três aberturas diferentes para o mesmo vídeo, prontos para narrar.',
      faz: [
        'Promessa, progresso e pagamento em cada frase.',
        'Três aberturas, cada uma com um tipo de gancho.',
        'Lista dos fatos com a fonte, antes de você gravar.',
      ],
      roda: 'No chat do Claude', preco: 97, ativo: true,
    },
    {
      chave: 'motion', n: '03', nome: 'Kit de Motion',
      promessa: 'A IA narra, anima, põe legenda, efeito e trilha e entrega o vídeo em MP4.',
      faz: [
        'Voz com o tempo exato de cada palavra.',
        '26 efeitos sonoros e 4 trilhas prontos para usar.',
        'Vídeo final em Full HD, no formato 9:16.',
      ],
      roda: 'No Claude Code, no computador', preco: 97, ativo: true,
    },
    {
      chave: 'revisor', n: '04', nome: 'Revisor de 8 Notas',
      promessa: 'Antes de postar, a IA dá 8 notas ao vídeo e diz o que trava a visualização.',
      faz: [
        'Olha o primeiro quadro, a legenda e as zonas seguras.',
        'Aponta o que deixa o vídeo com cara de IA.',
        'Separa o que trava o post do que é só polimento.',
      ],
      roda: 'No chat do Claude, com prints do vídeo', preco: 67, ativo: true,
    },
    {
      chave: 'carrossel', n: '05', nome: 'Kit de Carrossel',
      promessa: 'A IA escreve e desenha o carrossel e entrega as lâminas em PNG.',
      faz: [
        'De 6 a 10 lâminas em 1080x1350.',
        'Capa de até 6 palavras e lâmina de resumo.',
        'Numeração e o seu @ em todas as lâminas.',
      ],
      roda: 'No Claude Code, no computador', preco: 67, ativo: true,
    },
    {
      chave: 'postar', n: '06', nome: 'Postar e Crescer',
      promessa: 'Legenda, hashtags e horário, e a leitura dos números que muda o próximo vídeo.',
      faz: [
        'Primeira linha da legenda com um gancho novo.',
        '5 hashtags de alto volume do assunto.',
        'Lê os números do post e diz o que mudar.',
      ],
      roda: 'No chat do Claude', preco: 67, ativo: true,
    },
    {
      // Fica fora do pacote e da tabela até os três testes do módulo 6 (ebook/00-sumario.md).
      chave: 'manual', n: '07', nome: 'Manual do Método',
      promessa: 'O método inteiro em 10 módulos, da ideia aos números.',
      faz: [
        'Por que o formato narrado prende.',
        'O vídeo de 5 milhões, frase por frase.',
        'Um caminho sem instalar nada.',
      ],
      roda: 'PDF', preco: 67, ativo: false,
    },
  ],

  // Links do checkout da Kiwify, um por produto. Vazio: o botão rola até a tabela de preços.
  comprar: {
    pacote: 'https://pay.kiwify.com.br/7VDsTlA',
    ideias: 'https://pay.kiwify.com.br/Jq1rlJC',
    roteiro: 'https://pay.kiwify.com.br/9qNAqYC',
    motion: 'https://pay.kiwify.com.br/t0Ua5hJ',
    revisor: 'https://pay.kiwify.com.br/f9tZi7d',
    carrossel: 'https://pay.kiwify.com.br/Jz6XJaB',
    postar: 'https://pay.kiwify.com.br/uyFxqgz',
    manual: 'https://pay.kiwify.com.br/o5cAM21',
  },

  // Vídeos em pagina/videos/ (MP4 H.264, 9:16, até 8 MB). Cada um: { src: 'videos/x.mp4', poster: 'videos/x.jpg', legenda: '...' }.
  // null: o espaço mostra a cena ou a capa ao vivo. `feitos` vazio: a faixa "Feitos com os arquivos" não aparece.
  // Cada vídeo só baixa e toca quando aparece na tela. O da abertura segue a agulha: exporte com keyframe curto
  // (ffmpeg ... -g 15), senão o arraste da agulha engasga.
  videos: {
    abertura: null,
    arquivos: {
      ideias: null,
      roteiro: null,
      motion: null,
      revisor: null,
      carrossel: null,
      postar: null,
    },
    feitos: [],
    prova: null,
  },
};
