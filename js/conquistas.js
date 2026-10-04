// =====================================================
// CONQUISTAS
// =====================================================

(function () {

    "use strict";

    const S = window.Stellifer;
    const esc = S.esc;

    if (!S.exigirLogin()) { return; }

    function cartao(c) {
        return '<article class="conquista-card' + (c.desbloqueada ? "" : " travada") + '">' +
            '<div class="icone" aria-hidden="true">' + c.icone + '</div>' +
            '<div>' +
                '<h3>' + esc(c.nome) + '</h3>' +
                '<p>' + esc(c.descricao) + '</p>' +
                '<span class="xp">+' + c.xp + ' XP</span>' +
            '</div>' +
            (c.desbloqueada ? "" : '<span class="cadeado" aria-label="Bloqueada">🔒</span>') +
        '</article>';
    }

    S.Store.conquistas().then(function (dados) {

        const lista = dados.conquistas;
        const abertas = lista.filter(function (c) { return c.desbloqueada; });
        const fechadas = lista.filter(function (c) { return !c.desbloqueada; });
        const pct = lista.length ? Math.round((abertas.length / lista.length) * 100) : 0;
        const n = S.nivel(dados.xp);

        document.getElementById("resumo").innerHTML =
            '<div class="anel" style="--p:' + pct + '" data-texto="' + abertas.length + '/' + lista.length + '" ' +
                'role="img" aria-label="' + abertas.length + ' de ' + lista.length + ' conquistas"></div>' +
            '<div>' +
                '<h2>' + (abertas.length === 0
                    ? "Sua primeira estrela está esperando"
                    : abertas.length === lista.length
                        ? "Você acendeu todas as estrelas! ✨"
                        : "Você já acendeu " + abertas.length + (abertas.length === 1 ? " estrela" : " estrelas")) + '</h2>' +
                '<p>Nível ' + n.nivel + ' · ' + (dados.xp || 0) + ' XP no total</p>' +
            '</div>';

        document.getElementById("desbloqueadas").innerHTML = abertas.length
            ? abertas.map(cartao).join("")
            : '<div class="vazio" style="grid-column:1/-1"><span class="vazio-icone">🌙</span>' +
              '<strong>Nenhuma ainda</strong>Registre uma obra para começar.' +
              '<br><a class="botao" href="diario.html">Ir para o diário</a></div>';

        document.getElementById("bloqueadas").innerHTML = fechadas.length
            ? fechadas.map(cartao).join("")
            : '<div class="vazio" style="grid-column:1/-1"><span class="vazio-icone">🌟</span>' +
              '<strong>Tudo desbloqueado!</strong>Novas conquistas podem chegar no futuro.</div>';

    }).catch(function (erro) {
        document.getElementById("resumo").innerHTML =
            '<div class="vazio" style="width:100%"><span class="vazio-icone">☁️</span>' +
            '<strong>Não foi possível carregar</strong>' + esc(erro.message) + '</div>';
    });

})();
