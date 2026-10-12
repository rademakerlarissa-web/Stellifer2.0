
// =====================================================
// FILTROS DAS ESTATÍSTICAS
// =====================================================

const currentPeriodButton = document.querySelector("#current-period-button");
const generalButton = document.querySelector("#general-button");

const monthSelect = document.querySelector("#month-select");
const yearSelect = document.querySelector("#year-select");




// -----------------------------------------------------
// PERÍODO ATUAL
// -----------------------------------------------------

currentPeriodButton.addEventListener("click", function() {

    // Pega a data atual do computador
    const today = new Date();

    // Mês atual
    const currentMonth = today.getMonth() + 1;

    // Ano atual
    const currentYear = today.getFullYear();


    // Seleciona o mês atual
    monthSelect.value = currentMonth;


    // Seleciona o ano atual
    yearSelect.value = currentYear;


    // Ativa o botão "Período atual"
    currentPeriodButton.classList.add("active");

    // Desativa "Histórico geral"
    generalButton.classList.remove("active");

    updateStatisticsPeriod();
    updateStatistics();

});


// -----------------------------------------------------
// HISTÓRICO GERAL
// -----------------------------------------------------

generalButton.addEventListener("click", function() {

    // Ativa o botão "Histórico geral"
    generalButton.classList.add("active");

    // Desativa "Período atual"
    currentPeriodButton.classList.remove("active");

    updateStatisticsPeriod();

    updateStatistics();

});

//MES
monthSelect.addEventListener("change", function() {

    currentPeriodButton.classList.remove("active");
    generalButton.classList.remove("active");

    updateStatisticsPeriod();
    updateStatistics();

});

//ANO
yearSelect.addEventListener("change", function() {

    currentPeriodButton.classList.remove("active");
    generalButton.classList.remove("active");

    updateStatisticsPeriod();
    updateStatistics();

});

// =====================================================
// PERÍODO PERSONALIZADO
// =====================================================

// =====================================================
// TEXTO DO PERÍODO DAS ESTATÍSTICAS
// =====================================================

const statusPeriodDescription =
    document.querySelector("#status-period-description");


// -----------------------------------------------------
// NOMES DOS MESES
// -----------------------------------------------------

const monthNames = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro"
];



// -----------------------------------------------------
// ATUALIZA O TEXTO DO PERÍODO
// -----------------------------------------------------

function updateStatisticsPeriod() {

    // HISTÓRICO GERAL

    if (generalButton.classList.contains("active")) {

        statusPeriodDescription.textContent =
            "Considerando todo o seu histórico.";

        highlightsTitle.textContent =
            "⭐ Destaques do histórico";

        return;
    }


    // MÊS E ANO SELECIONADOS

    const month =
        Number(monthSelect.value);

    const year =
        Number(yearSelect.value);

    const monthName =
        monthNames[month - 1];


    statusPeriodDescription.textContent =
        `${monthName} de ${year}`;

    highlightsTitle.textContent =
        `⭐ Destaques de ${monthName} de ${year}`;
}

const highlightsTitle =
    document.querySelector("#highlights-title");


// =====================================================
// ATUALIZAR DISTRIBUIÇÃO DAS NOTAS
// =====================================================

function updateRatingChart(ratings) {

    document.querySelector("#rating-5").textContent =
        ratings[5] + "%";

    document.querySelector("#rating-4").textContent =
        ratings[4] + "%";

    document.querySelector("#rating-3").textContent =
        ratings[3] + "%";

    document.querySelector("#rating-2").textContent =
        ratings[2] + "%";

    document.querySelector("#rating-1").textContent =
        ratings[1] + "%";


    // Descobre qual nota possui a maior porcentagem

    let mostFrequentRating = 0;

    for (let rating = 5; rating >= 1; rating--) {

        if (ratings[rating] > (ratings[mostFrequentRating] || 0)) {
            mostFrequentRating = rating;
        }

    }

    document.querySelector("#most-frequent-stars")
        .textContent = mostFrequentRating ? "⭐".repeat(mostFrequentRating) : "—";

    const circle = document.querySelector(".rating-circle");
    if (circle) {
        const cores = {
            5: "var(--rosa-escuro)",
            4: "var(--lilas-escuro)",
            3: "var(--azul-escuro)",
            2: "var(--amarelo)",
            1: "var(--pessego)"
        };
        let ponto = 0;
        const fatias = [];

        [5, 4, 3, 2, 1].forEach(function (nota) {
            const proximo = ponto + (Number(ratings[nota]) || 0);
            if (proximo > ponto) {
                fatias.push(cores[nota] + " " + ponto + "% " + proximo + "%");
            }
            ponto = proximo;
        });

        circle.style.background = fatias.length
            ? "conic-gradient(" + fatias.join(", ") + ")"
            : "conic-gradient(var(--borda) 0% 100%)";
    }

}

const generalStatistics = {

    ratings: {
        5: 35,
        4: 32,
        3: 20,
        2: 9,
        1: 4
    },

    status: {
        completed: 35,
        progress: 8,
        abandoned: 5
    },

    highlights: [
        {
            title: "Frieren",
            type: "Anime",
            rating: 5
        },

        {
            title: "Fullmetal Alchemist",
            type: "Anime",
            rating: 5
        },

        {
            title: "O Castelo Animado",
            type: "Filme",
            rating: 5
        }
    ]

};

// =====================================================
// ATUALIZAR STATUS DAS OBRAS
// =====================================================

function updateStatusChart(status) {

    const completed =
        status.completed;

    const progress =
        status.progress;

    const abandoned =
        status.abandoned;


    const total =
        completed + progress + abandoned;


    // Atualiza os números

    document.querySelector("#total-works")
        .textContent = total;

    document.querySelector("#completed-count")
        .textContent = completed;

    document.querySelector("#progress-count")
        .textContent = progress;

    document.querySelector("#abandoned-count")
        .textContent = abandoned;


    // Calcula as porcentagens

    const completedPercent =
        total ? (completed / total) * 100 : 0;

    const progressPercent =
        total ? completedPercent + (progress / total) * 100 : 0;


    // Atualiza o gráfico

    const statusCircle =
        document.querySelector("#status-circle");


    statusCircle.style.background = total ? `
        conic-gradient(
            var(--verde-escuro) 0% ${completedPercent}%,
            var(--azul-escuro) ${completedPercent}% ${progressPercent}%,
            var(--rosa-escuro) ${progressPercent}% 100%
        )
    ` : "conic-gradient(var(--borda) 0% 100%)";

}

// =====================================================
// ATUALIZAR DESTAQUES
// =====================================================

function updateHighlights(highlights) {
    for (let index = 0; index < 3; index++) {
        const work = highlights[index] || {
            title: "Nenhuma obra",
            type: "—",
            rating: 0
        };

        const number =
            index + 1;


        document.querySelector(
            `#highlight-${number}-title`
        ).textContent = work.title;


        document.querySelector(
            `#highlight-${number}-type`
        ).textContent = work.type;


        document.querySelector(
            `#highlight-${number}-rating`
        ).textContent =
            work.rating ? "⭐".repeat(work.rating) : "Sem avaliação";
    }

}

// =====================================================
// ATUALIZAR TODAS AS ESTATÍSTICAS
// =====================================================

function updateStatistics() {

    let data;

    if (usuarioComSessao()) {
        data = estatisticasDaConta(itensDaConta || []);
    } else if (generalButton.classList.contains("active")) {
        data = generalStatistics;
    } else {

        const month =
            String(monthSelect.value).padStart(2, "0");

        const year =
            yearSelect.value;


        const period =
            `${year}-${month}`;


        data = statisticsData[period];


        if (!data) {

            data = {

                ratings: {
                    5: 0,
                    4: 0,
                    3: 0,
                    2: 0,
                    1: 0
                },

                status: {
                    completed: 0,
                    progress: 0,
                    abandoned: 0
                },

                highlights: []

            };

        }

    }


    // -------------------------------------------------
    // ATUALIZA OS CARDS
    // -------------------------------------------------

    updateRatingChart(data.ratings);

    updateStatusChart(data.status);

    updateHighlights(data.highlights);
    atualizarMediaDiaria(anotacoesDaConta, itensDaConta || []);

}

let itensDaConta = null;
let anotacoesDaConta = [];

function usuarioComSessao() {
    try {
        const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
        return Boolean(usuario && usuario.id_usuario);
    } catch (erro) {
        return false;
    }
}

function estatisticasDaConta(itens) {
    let filtrados = itens;

    if (!generalButton.classList.contains("active")) {
        const periodo = String(yearSelect.value) + "-" +
            String(monthSelect.value).padStart(2, "0");

        filtrados = itens.filter(function (item) {
            return [item.dataInicio, item.dataConclusao].some(function (data) {
                return data && String(data).slice(0, 7) === periodo;
            });
        });
    }

    const contagemNotas = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const avaliados = filtrados.filter(function (item) {
        const nota = Number(item.nota);
        return Number.isInteger(nota) && nota >= 1 && nota <= 5;
    });

    avaliados.forEach(function (item) {
        contagemNotas[Number(item.nota)] += 1;
    });

    const ratings = {};
    [1, 2, 3, 4, 5].forEach(function (nota) {
        ratings[nota] = avaliados.length
            ? Math.round((contagemNotas[nota] / avaliados.length) * 100)
            : 0;
    });

    const status = {
        completed: filtrados.filter(function (item) { return item.status === "concluida"; }).length,
        progress: filtrados.filter(function (item) { return item.status === "em_andamento"; }).length,
        abandoned: filtrados.filter(function (item) { return item.status === "abandonada"; }).length
    };

    const highlights = avaliados
        .slice()
        .sort(function (a, b) {
            return Number(b.nota) - Number(a.nota) ||
                String(a.obra.titulo).localeCompare(String(b.obra.titulo));
        })
        .slice(0, 3)
        .map(function (item) {
            return {
                title: item.obra.titulo,
                type: item.obra.tipo || "—",
                rating: Number(item.nota)
            };
        });

    return { ratings: ratings, status: status, highlights: highlights };
}

function dataDaAtividade(data) {
    if (!data) { return null; }
    const partes = String(data).slice(0, 10).split("-");
    if (partes.length !== 3) { return null; }

    const ano = Number(partes[0]);
    const mes = Number(partes[1]);
    const dia = Number(partes[2]);
    const valor = Date.UTC(ano, mes - 1, dia);
    const dataUtc = new Date(valor);

    if (dataUtc.getUTCFullYear() !== ano ||
        dataUtc.getUTCMonth() !== mes - 1 ||
        dataUtc.getUTCDate() !== dia) {
        return null;
    }
    return valor;
}

function atualizarMediaDiaria(anotacoes, itens) {
    const hoje = new Date();
    const hojeUtc = Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    const datasAnotacoes = anotacoes.map(function (anotacao) {
        return dataDaAtividade(anotacao.data);
    }).filter(function (data) { return data !== null; });
    const datasObras = itens.map(function (item) {
        return dataDaAtividade(item.dataAdicionado);
    }).filter(function (data) { return data !== null; });
    let inicio;
    let fim = hojeUtc;
    let descricao;

    if (generalButton.classList.contains("active")) {
        const datas = datasAnotacoes.concat(datasObras)
            .filter(function (data) { return data <= hojeUtc; });
        inicio = datas.length ? Math.min.apply(null, datas) : null;
        descricao = "Média diária no histórico geral";
    } else {
        const ano = Number(yearSelect.value);
        const mes = Number(monthSelect.value);
        inicio = Date.UTC(ano, mes - 1, 1);
        fim = Math.min(Date.UTC(ano, mes, 0), hojeUtc);
        descricao = "Média diária em " + monthNames[mes - 1] + " de " + ano;
    }

    const diasPorSemana = Array(7).fill(0);
    const anotacoesPorSemana = Array(7).fill(0);
    const obrasPorSemana = Array(7).fill(0);
    const diasDaSemana = document.querySelectorAll(".week-day");
    const contarNoPeriodo = function (datas) {
        return inicio !== null && fim >= inicio
            ? datas.filter(function (data) {
                return data >= inicio && data <= fim;
            }).length
            : 0;
    };
    let totalAnotacoes = contarNoPeriodo(datasAnotacoes);
    let totalObras = contarNoPeriodo(datasObras);
    let descricaoResumo = "Total no período selecionado";

    if (generalButton.classList.contains("active")) {
        const mesesNoHistorico = inicio !== null
            ? (hoje.getFullYear() - new Date(inicio).getUTCFullYear()) * 12 +
                hoje.getMonth() - new Date(inicio).getUTCMonth() + 1
            : 0;
        totalAnotacoes = mesesNoHistorico
            ? Math.round(totalAnotacoes / mesesNoHistorico)
            : 0;
        totalObras = mesesNoHistorico
            ? Math.round(totalObras / mesesNoHistorico)
            : 0;
        descricaoResumo = "Média por mês no histórico geral";
    }

    const maiorTotalResumo = Math.max(totalAnotacoes, totalObras);
    const barraAnotacoesResumo = document.querySelector("#annotation-summary-bar");
    const barraObrasResumo = document.querySelector("#work-summary-bar");
    document.querySelector("#annotation-total").textContent = String(totalAnotacoes);
    document.querySelector("#work-total").textContent = String(totalObras);
    document.querySelector("#activity-summary-description").textContent = descricaoResumo;
    barraAnotacoesResumo.style.width = maiorTotalResumo
        ? Math.round((totalAnotacoes / maiorTotalResumo) * 100) + "%"
        : "0%";
    barraObrasResumo.style.width = maiorTotalResumo
        ? Math.round((totalObras / maiorTotalResumo) * 100) + "%"
        : "0%";
    barraAnotacoesResumo.style.zIndex = totalAnotacoes <= totalObras ? "2" : "1";
    barraObrasResumo.style.zIndex = totalObras < totalAnotacoes ? "2" : "1";
    document.querySelector(".activity-summary").setAttribute(
        "aria-label",
        descricaoResumo + ": " + totalAnotacoes + " anotações e " +
            totalObras + " obras"
    );

    if (inicio !== null && fim >= inicio) {
        for (let data = inicio; data <= fim; data += 86400000) {
            diasPorSemana[new Date(data).getUTCDay()] += 1;
        }

        datasAnotacoes.forEach(function (data) {
            if (data >= inicio && data <= fim) {
                anotacoesPorSemana[new Date(data).getUTCDay()] += 1;
            }
        });
        datasObras.forEach(function (data) {
            if (data >= inicio && data <= fim) {
                obrasPorSemana[new Date(data).getUTCDay()] += 1;
            }
        });
    }

    const medias = Array(7).fill(null).map(function (_, dia) {
        return {
            anotacoes: diasPorSemana[dia]
                ? Math.round(anotacoesPorSemana[dia] / diasPorSemana[dia])
                : 0,
            obras: diasPorSemana[dia]
                ? Math.round(obrasPorSemana[dia] / diasPorSemana[dia])
                : 0,
            total: diasPorSemana[dia]
                ? (anotacoesPorSemana[dia] + obrasPorSemana[dia]) / diasPorSemana[dia]
                : 0
        };
    });
    const maiorMedia = Math.max.apply(null, medias.map(function (media) {
        return Math.max(media.anotacoes, media.obras);
    }));
    const maiorTotal = Math.max.apply(null, medias.map(function (media) {
        return media.total;
    }));

    document.querySelector("#weekly-activity-description").textContent = descricao;
    diasDaSemana.forEach(function (dia) {
        const indice = Number(dia.dataset.weekday);
        const media = medias[indice];
        const anotacoesBarra = dia.querySelector(".bar-annotations");
        const obrasBarra = dia.querySelector(".bar-works");
        const anotacoesValor = dia.querySelector(".weekday-annotation-value");
        const obrasValor = dia.querySelector(".weekday-work-value");
        const nomeDia = dia.dataset.label;

        anotacoesValor.textContent = String(media.anotacoes);
        obrasValor.textContent = String(media.obras);
        const textoAnotacoes = media.anotacoes === 1 ? "anotação" : "anotações";
        const textoObras = media.obras === 1 ? "obra" : "obras";
        dia.setAttribute(
            "aria-label",
            nomeDia + ": média de " + media.anotacoes + " " + textoAnotacoes +
                " e " + media.obras + " " + textoObras + " por ocorrência"
        );
        anotacoesBarra.style.height = maiorMedia
            ? Math.round((media.anotacoes / maiorMedia) * 90) + "%"
            : "0%";
        obrasBarra.style.height = maiorMedia
            ? Math.round((media.obras / maiorMedia) * 90) + "%"
            : "0%";
        anotacoesBarra.style.zIndex = media.anotacoes <= media.obras ? "2" : "1";
        obrasBarra.style.zIndex = media.obras < media.anotacoes ? "2" : "1";
        dia.classList.toggle("is-busiest", maiorTotal > 0 && media.total === maiorTotal);
    });
}

window.atualizarResumoInicio = function (itens, anotacoes) {
    itensDaConta = itens;
    anotacoesDaConta = anotacoes;
    updateStatistics();
};

if (usuarioComSessao()) {
    itensDaConta = [];
}
updateStatisticsPeriod();
updateStatistics();