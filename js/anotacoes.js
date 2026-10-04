// =====================================================
// MINHAS ANOTAÇÕES — todas, da mais nova para a mais antiga
// =====================================================

(function () {

    "use strict";

    const S = window.Stellifer;
    const esc = S.esc;

    if (!S.exigirLogin()) { return; }

    const lista = document.getElementById("lista");
    const busca = document.getElementById("busca");

    let todas = [];

    const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
                   "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

    function grupo(data) {
        if (!data) { return "Sem data"; }
        return MESES[Number(data.slice(5, 7)) - 1] + " de " + data.slice(0, 4);
    }

    function cartao(a) {
        return '<article class="anotacao">' +
            '<div class="anotacao-topo"><div class="anotacao-info">' +
                (a.episodio ? '<span class="episodio">' + esc(a.episodio) + '</span>' : "") +
                (a.data ? '<span>' + esc(S.dataBonita(a.data)) + '</span>' : "") +
                (a.nota ? S.estrelas(a.nota) : "") +
            '</div></div>' +
            (a.titulo ? '<h3>' + esc(a.titulo) + '</h3>' : "") +
            (a.texto ? '<p>' + esc(a.texto) + '</p>' : "") +
            '<div class="anotacao-rodape"><a class="voltar" style="margin:0" href="obra.html?id=' + a.itemId + '#anotacao-' + a.id + '">' +
                '📖 ' + esc(a.obraTitulo) + ' →</a></div>' +
        '</article>';
    }

    function desenhar() {

        const termo = busca.value.trim().toLowerCase();

        const visiveis = todas.filter(function (a) {
            if (!termo) { return true; }
            return (a.titulo + " " + a.texto + " " + a.episodio + " " + a.obraTitulo)
                .toLowerCase().indexOf(termo) !== -1;
        });

        if (todas.length === 0) {
            lista.innerHTML = '<div class="vazio"><span class="vazio-icone">✍️</span>' +
                '<strong>Nenhuma anotação ainda</strong>Abra uma obra do seu diário e registre o primeiro momento.' +
                '<br><a class="botao" href="diario.html">Ir para o diário</a></div>';
            return;
        }

        if (visiveis.length === 0) {
            lista.innerHTML = '<div class="vazio"><span class="vazio-icone">🔍</span>' +
                '<strong>Nada encontrado</strong>Tente outra palavra.</div>';
            return;
        }

        let html = "";
        let atual = null;

        visiveis.forEach(function (a) {
            const g = grupo(a.data);
            if (g !== atual) {
                if (atual !== null) { html += "</div>"; }
                html += '<h2 style="font-family:var(--fonte-titulo);font-weight:500;font-size:22px;margin:30px 0 16px">' +
                        esc(g) + '</h2><div class="linha-do-tempo">';
                atual = g;
            }
            html += cartao(a);
        });

        lista.innerHTML = html + "</div>";
    }

    busca.addEventListener("input", desenhar);

    S.Store.anotacoes().then(function (dados) {
        todas = dados;
        desenhar();
    }).catch(function (erro) {
        lista.innerHTML = '<div class="vazio"><span class="vazio-icone">☁️</span>' +
            '<strong>Não foi possível carregar</strong>' + esc(erro.message) + '</div>';
    });

})();
