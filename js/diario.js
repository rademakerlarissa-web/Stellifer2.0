// =====================================================
// MEU DIÁRIO — lista das obras do usuário
// =====================================================

(function () {

    "use strict";

    const S = window.Stellifer;
    const esc = S.esc;

    if (!S.exigirLogin()) { return; }

    const lista = document.getElementById("lista");
    const filtrosEl = document.getElementById("filtros");
    const busca = document.getElementById("busca");
    const filtroTipo = document.getElementById("filtro-tipo");

    let itens = [];
    let filtroAtual = "todos";

    const FILTROS = [
        ["todos", "Todas"],
        ["em_andamento", "Em andamento"],
        ["concluida", "Concluídas"],
        ["abandonada", "Abandonadas"],
        ["quero", "Quero ler/assistir"],
        ["favoritas", "💖 Favoritas"]
    ];

    S.TIPOS.forEach(function (t) {
        const o = document.createElement("option");
        o.value = t;
        o.textContent = t;
        filtroTipo.appendChild(o);
    });


    function passaNoFiltro(item, filtro) {
        if (filtro === "todos") { return true; }
        if (filtro === "favoritas") { return item.favorito; }
        return item.status === filtro;
    }

    function desenharFiltros() {
        filtrosEl.innerHTML = FILTROS.map(function (f) {
            const total = itens.filter(function (i) { return passaNoFiltro(i, f[0]); }).length;
            return '<button type="button" class="filtro' + (f[0] === filtroAtual ? " ativo" : "") +
                   '" data-filtro="' + f[0] + '" aria-pressed="' + (f[0] === filtroAtual) + '">' +
                   esc(f[1]) + '<span class="contagem">' + total + '</span></button>';
        }).join("");
    }

    function cartao(item) {
        const o = item.obra;

        return '<article class="obra-card">' +
            '<a href="obra.html?id=' + item.id + '" aria-label="Abrir ' + esc(o.titulo) + '">' +
                S.capaHTML(o, "capa") +
                '<div class="obra-card-info">' +
                    '<h3>' + esc(o.titulo) + '</h3>' +
                    '<p class="tipo">' + esc(o.tipo) + (o.autor ? " · " + esc(o.autor) : "") + '</p>' +
                    '<div class="linha-final">' + S.estrelas(item.nota) +
                    (item.totalAnotacoes ? '<small title="Anotações">✍️ ' + item.totalAnotacoes + '</small>' : "") +
                    '</div>' +
                '</div>' +
            '</a>' +
            '<span class="etiqueta-status status-' + item.status + '">' + esc(S.STATUS[item.status]) + '</span>' +
            '<button type="button" class="favorito-botao' + (item.favorito ? " ligado" : "") +
                '" data-fav="' + item.id + '" aria-pressed="' + item.favorito +
                '" aria-label="' + (item.favorito ? "Tirar dos favoritos" : "Marcar como favorita") + '">' +
                (item.favorito ? "♥" : "♡") + '</button>' +
        '</article>';
    }

    function desenhar() {

        desenharFiltros();

        const termo = busca.value.trim().toLowerCase();
        const tipo = filtroTipo.value;

        const visiveis = itens.filter(function (i) {
            if (!passaNoFiltro(i, filtroAtual)) { return false; }
            if (tipo && i.obra.tipo !== tipo) { return false; }
            if (termo) {
                const texto = (i.obra.titulo + " " + i.obra.autor).toLowerCase();
                if (texto.indexOf(termo) === -1) { return false; }
            }
            return true;
        });

        if (itens.length === 0) {
            lista.innerHTML =
                '<div class="vazio"><span class="vazio-icone">✦</span>' +
                '<strong>Seu diário ainda está em branco</strong>' +
                'Que tal guardar a primeira história que marcou você?' +
                '<br><button class="botao" type="button" data-adicionar>+ Adicionar obra</button></div>';
            return;
        }

        if (visiveis.length === 0) {
            lista.innerHTML =
                '<div class="vazio"><span class="vazio-icone">🔍</span>' +
                '<strong>Nada por aqui</strong>Nenhuma obra combina com esse filtro.</div>';
            return;
        }

        lista.innerHTML = '<div class="grade-obras">' + visiveis.map(cartao).join("") + '</div>';
    }

    async function carregar() {
        try {
            itens = await S.Store.itens();
            desenhar();
        } catch (erro) {
            lista.innerHTML = '<div class="vazio"><span class="vazio-icone">☁️</span>' +
                '<strong>Não foi possível abrir o diário</strong>' + esc(erro.message) + '</div>';
        }
    }

    function adicionar(status) {
        window.FormObra.abrir({
            status: status,
            aoSalvar: function (resposta) {
                carregar();
            }
        });
    }


    // ----- Eventos -----

    filtrosEl.addEventListener("click", function (e) {
        const b = e.target.closest("[data-filtro]");
        if (!b) { return; }
        filtroAtual = b.dataset.filtro;
        desenhar();
    });

    busca.addEventListener("input", desenhar);
    filtroTipo.addEventListener("change", desenhar);

    document.getElementById("btn-adicionar").addEventListener("click", function () {
        adicionar(filtroAtual === "quero" ? "quero" : "em_andamento");
    });

    lista.addEventListener("click", async function (e) {

        if (e.target.closest("[data-adicionar]")) {
            adicionar();
            return;
        }

        const fav = e.target.closest("[data-fav]");
        if (fav) {
            const id = Number(fav.dataset.fav);
            const item = itens.filter(function (i) { return i.id === id; })[0];
            if (!item) { return; }

            const novo = !item.favorito;
            item.favorito = novo;
            desenhar();

            try {
                S.aoSalvar(await S.Store.favorito(id, novo));
            } catch (erro) {
                item.favorito = !novo;
                desenhar();
                S.aviso(erro.message, "erro");
            }
        }
    });

    carregar();

    // Vindo do botão "Adicionar obra" da página inicial
    if (new URLSearchParams(window.location.search).get("nova")) {
        adicionar();
    }

})();
