// =====================================================
// DEFINIÇÃO DAS CONQUISTAS
// =====================================================
//
// Este arquivo é usado pelo navegador (páginas) E pelo
// Node (server.js), então as regras ficam em um lugar só.
//
// Cada conquista tem:
//   nome, descricao, xp (recompensa), icone e uma função
//   "regra" que recebe as estatísticas do usuário e diz
//   se ela já pode ser desbloqueada.
//
// Estatísticas recebidas pela regra:
//   obras, concluidas, avaliadas, anotacoes, tipos,
//   favoritos, sequencia (maior sequência de dias seguidos
//   com registros) e xp.

(function (raiz) {

    const CONQUISTAS = [

        // ---------- Primeiros passos ----------
        { nome: "Primeira história", descricao: "Registre sua primeira obra", xp: 20, icone: "📖",
          regra: function (s) { return s.obras >= 1; } },

        { nome: "Crítico iniciante", descricao: "Avalie sua primeira obra", xp: 15, icone: "⭐",
          regra: function (s) { return s.avaliadas >= 1; } },

        { nome: "Memórias guardadas", descricao: "Faça sua primeira anotação", xp: 15, icone: "✍️",
          regra: function (s) { return s.anotacoes >= 1; } },

        { nome: "Final feliz", descricao: "Conclua sua primeira obra", xp: 20, icone: "🏁",
          regra: function (s) { return s.concluidas >= 1; } },

        // ---------- Quantidade de obras ----------
        { nome: "Colecionador", descricao: "Registre 10 obras", xp: 50, icone: "📚",
          regra: function (s) { return s.obras >= 10; } },

        { nome: "Biblioteca estelar", descricao: "Registre 25 obras", xp: 100, icone: "🌌",
          regra: function (s) { return s.obras >= 25; } },

        // ---------- Conclusões ----------
        { nome: "Maratonista", descricao: "Conclua 10 obras", xp: 60, icone: "🏆",
          regra: function (s) { return s.concluidas >= 10; } },

        // ---------- Avaliações ----------
        { nome: "Voz firme", descricao: "Avalie 10 obras", xp: 40, icone: "🎯",
          regra: function (s) { return s.avaliadas >= 10; } },

        // ---------- Anotações ----------
        { nome: "Diarista dedicado", descricao: "Faça 10 anotações", xp: 40, icone: "📝",
          regra: function (s) { return s.anotacoes >= 10; } },

        { nome: "Cronista", descricao: "Faça 50 anotações", xp: 100, icone: "🖋️",
          regra: function (s) { return s.anotacoes >= 50; } },

        // ---------- Categorias ----------
        { nome: "Mundos diferentes", descricao: "Registre histórias de 3 tipos diferentes", xp: 40, icone: "🧭",
          regra: function (s) { return s.tipos >= 3; } },

        { nome: "Explorador de histórias", descricao: "Registre os 6 tipos de obra", xp: 100, icone: "🗺️",
          regra: function (s) { return s.tipos >= 6; } },

        // ---------- Favoritos ----------
        { nome: "Coração cheio", descricao: "Marque 3 obras como favoritas", xp: 30, icone: "💖",
          regra: function (s) { return s.favoritos >= 3; } },

        // ---------- Sequências ----------
        { nome: "Hábito de estrela", descricao: "Registre algo por 3 dias seguidos", xp: 30, icone: "🔥",
          regra: function (s) { return s.sequencia >= 3; } },

        { nome: "Semana estrelada", descricao: "Registre algo por 7 dias seguidos", xp: 80, icone: "🌠",
          regra: function (s) { return s.sequencia >= 7; } },

        // ---------- XP ----------
        { nome: "Estrela nascente", descricao: "Alcance 100 de XP", xp: 25, icone: "🌟",
          regra: function (s) { return s.xp >= 100; } },

        { nome: "Constelação", descricao: "Alcance 300 de XP", xp: 60, icone: "✨",
          regra: function (s) { return s.xp >= 300; } },

        // ---------- Novos marcos ----------
        { nome: "Estante acolhedora", descricao: "Registre 5 obras", xp: 25, icone: "🪴",
          regra: function (s) { return s.obras >= 5; } },

        { nome: "Grande coleção", descricao: "Registre 50 obras", xp: 120, icone: "🗄️",
          regra: function (s) { return s.obras >= 50; } },

        { nome: "Acervo lendário", descricao: "Registre 100 obras", xp: 200, icone: "🏛️",
          regra: function (s) { return s.obras >= 100; } },

        { nome: "Primeiro ciclo", descricao: "Conclua 5 obras", xp: 35, icone: "🎬",
          regra: function (s) { return s.concluidas >= 5; } },

        { nome: "Finalista de histórias", descricao: "Conclua 25 obras", xp: 100, icone: "🎉",
          regra: function (s) { return s.concluidas >= 25; } },

        { nome: "Mestre dos finais", descricao: "Conclua 50 obras", xp: 180, icone: "🏅",
          regra: function (s) { return s.concluidas >= 50; } },

        { nome: "Avaliações de ouro", descricao: "Avalie 25 obras", xp: 70, icone: "🥇",
          regra: function (s) { return s.avaliadas >= 25; } },

        { nome: "Crítico experiente", descricao: "Avalie 50 obras", xp: 120, icone: "🧐",
          regra: function (s) { return s.avaliadas >= 50; } },

        { nome: "Olhar lendário", descricao: "Avalie 100 obras", xp: 200, icone: "🔭",
          regra: function (s) { return s.avaliadas >= 100; } },

        { nome: "Páginas preenchidas", descricao: "Faça 25 anotações", xp: 70, icone: "📓",
          regra: function (s) { return s.anotacoes >= 25; } },

        { nome: "Caderno cheio", descricao: "Faça 100 anotações", xp: 150, icone: "📔",
          regra: function (s) { return s.anotacoes >= 100; } },

        { nome: "Cronista estelar", descricao: "Faça 250 anotações", xp: 250, icone: "🪶",
          regra: function (s) { return s.anotacoes >= 250; } },

        { nome: "Primeiro favorito", descricao: "Marque uma obra como favorita", xp: 15, icone: "💝",
          regra: function (s) { return s.favoritos >= 1; } },

        { nome: "Constelação de favoritos", descricao: "Marque 10 obras como favoritas", xp: 60, icone: "💫",
          regra: function (s) { return s.favoritos >= 10; } },

        { nome: "Amor em coleção", descricao: "Marque 25 obras como favoritas", xp: 120, icone: "💌",
          regra: function (s) { return s.favoritos >= 25; } },

        { nome: "Duas formas de sonhar", descricao: "Registre histórias de 2 tipos diferentes", xp: 20, icone: "🎭",
          regra: function (s) { return s.tipos >= 2; } },

        { nome: "Viajante de histórias", descricao: "Registre histórias de 4 tipos diferentes", xp: 60, icone: "🧳",
          regra: function (s) { return s.tipos >= 4; } },

        { nome: "Quase todo o universo", descricao: "Registre histórias de 5 tipos diferentes", xp: 80, icone: "🪐",
          regra: function (s) { return s.tipos >= 5; } },

        { nome: "Quinzena de histórias", descricao: "Registre algo por 14 dias seguidos", xp: 100, icone: "📅",
          regra: function (s) { return s.sequencia >= 14; } },

        { nome: "Mês inteiro de memórias", descricao: "Registre algo por 30 dias seguidos", xp: 250, icone: "🌙",
          regra: function (s) { return s.sequencia >= 30; } },

        // ---------- Imagens e vídeos ----------
        { nome: "Primeiro registro visual", descricao: "Adicione sua primeira imagem a uma obra ou anotação", xp: 15, icone: "🖼️",
          regra: function (s) { return s.imagens >= 1; } },

        { nome: "Álbum de memórias", descricao: "Guarde 5 imagens no Stellifer", xp: 25, icone: "📸",
          regra: function (s) { return s.imagens >= 5; } },

        { nome: "Olhar atento", descricao: "Guarde 10 imagens no Stellifer", xp: 40, icone: "🌄",
          regra: function (s) { return s.imagens >= 10; } },

        { nome: "Galeria estrelada", descricao: "Guarde 25 imagens no Stellifer", xp: 75, icone: "🎨",
          regra: function (s) { return s.imagens >= 25; } },

        { nome: "Arquivo visual", descricao: "Guarde 50 imagens no Stellifer", xp: 125, icone: "🗃️",
          regra: function (s) { return s.imagens >= 50; } },

        { nome: "Primeiro vídeo", descricao: "Adicione seu primeiro vídeo a uma obra", xp: 15, icone: "🎥",
          regra: function (s) { return s.videos >= 1; } },

        { nome: "Coleção em movimento", descricao: "Adicione 3 vídeos às suas obras", xp: 25, icone: "🎞️",
          regra: function (s) { return s.videos >= 3; } },

        { nome: "Memórias em movimento", descricao: "Adicione 5 vídeos às suas obras", xp: 40, icone: "📽️",
          regra: function (s) { return s.videos >= 5; } },

        { nome: "Cineasta de memórias", descricao: "Adicione 10 vídeos às suas obras", xp: 75, icone: "🎬",
          regra: function (s) { return s.videos >= 10; } },

        { nome: "Festival particular", descricao: "Adicione 25 vídeos às suas obras", xp: 125, icone: "🍿",
          regra: function (s) { return s.videos >= 25; } }
    ];


    // -------------------------------------------------
    // XP e nível
    // -------------------------------------------------

    const XP_POR_NIVEL = 100;

    // O XP das ações é sempre recalculado a partir do diário.
    // Assim, apagar e criar de novo não gera XP infinito.
    const XP_ACOES = { obra: 10, concluida: 20, anotacao: 5 };

    function xpDasAcoes(s) {
        return s.obras * XP_ACOES.obra +
               s.concluidas * XP_ACOES.concluida +
               s.anotacoes * XP_ACOES.anotacao;
    }

    function infoNivel(xp) {
        xp = Math.max(0, xp || 0);
        const nivel = Math.floor(xp / XP_POR_NIVEL) + 1;
        const noNivel = xp % XP_POR_NIVEL;
        return {
            nivel: nivel,
            xpNoNivel: noNivel,
            xpParaProximo: XP_POR_NIVEL,
            porcentagem: Math.round((noNivel / XP_POR_NIVEL) * 100)
        };
    }

    // Maior sequência de dias seguidos, dada uma lista de datas "AAAA-MM-DD"
    function maiorSequencia(datas) {
        const dias = Array.from(new Set(datas.filter(Boolean)))
            .map(function (d) { return Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10)) / 86400000; })
            .sort(function (a, b) { return a - b; });

        let melhor = 0, atual = 0;
        dias.forEach(function (d, i) {
            atual = (i > 0 && d - dias[i - 1] === 1) ? atual + 1 : 1;
            if (atual > melhor) { melhor = atual; }
        });
        return melhor;
    }

    const api = {
        CONQUISTAS: CONQUISTAS,
        XP_POR_NIVEL: XP_POR_NIVEL,
        XP_ACOES: XP_ACOES,
        xpDasAcoes: xpDasAcoes,
        infoNivel: infoNivel,
        maiorSequencia: maiorSequencia
    };

    if (typeof module !== "undefined" && module.exports) {
        module.exports = api;
    } else {
        raiz.StelliferDef = api;
    }

})(typeof window !== "undefined" ? window : globalThis);
