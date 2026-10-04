
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
// FREQUÊNCIA DE ANOTAÇÕES
// =====================================================

const weekDays = document.querySelectorAll(".week-day");
const annotationInfo = document.querySelector("#annotation-info");


weekDays.forEach(function(day) {

    day.addEventListener("click", function() {

        const dayName = day.dataset.day;
        const annotations = Number(day.dataset.annotations || 0);
        const works = Number(day.dataset.works || 0);
        const annotationText = annotations === 1 ? "anotação" : "anotações";
        const workText = works === 1 ? "obra adicionada" : "obras adicionadas";
        const heading = document.createElement("strong");
        const detail = document.createElement("span");

        heading.textContent = dayName;
        detail.textContent = "📝 " + annotations + " " + annotationText +
            " · 📚 " + works + " " + workText;
        annotationInfo.replaceChildren(heading, detail);

    });

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

}

let itensDaConta = null;

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

function atualizarSemanaDaConta(anotacoes, itens) {
    const hoje = new Date();
    const inicioSemana = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    inicioSemana.setDate(inicioSemana.getDate() - ((inicioSemana.getDay() + 6) % 7));

    const contagens = [0, 0, 0, 0, 0, 0, 0];
    const anotacoesPorDia = [0, 0, 0, 0, 0, 0, 0];
    const obrasPorDia = [0, 0, 0, 0, 0, 0, 0];
    anotacoes.forEach(function (anotacao) {
        if (!anotacao.data) { return; }
        const partes = String(anotacao.data).slice(0, 10).split("-");
        if (partes.length !== 3) { return; }
        const data = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
        const diferenca = Math.floor((data - inicioSemana) / 86400000);
        if (diferenca >= 0 && diferenca < 7) {
            anotacoesPorDia[diferenca] += 1;
            contagens[diferenca] += 1;
        }
    });
    itens.forEach(function (item) {
        if (!item.dataAdicionado) { return; }
        const partes = String(item.dataAdicionado).slice(0, 10).split("-");
        if (partes.length !== 3) { return; }
        const data = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
        const diferenca = Math.floor((data - inicioSemana) / 86400000);
        if (diferenca >= 0 && diferenca < 7) {
            obrasPorDia[diferenca] += 1;
            contagens[diferenca] += 1;
        }
    });

    const maximo = Math.max.apply(null, contagens);
    weekDays.forEach(function (dia, indice) {
        const total = contagens[indice];
        dia.dataset.count = String(total);
        dia.dataset.annotations = String(anotacoesPorDia[indice]);
        dia.dataset.works = String(obrasPorDia[indice]);
        dia.querySelector(".bar").style.height = maximo
            ? Math.max(8, Math.round((total / maximo) * 90)) + "%"
            : "0%";
    });
}

window.atualizarResumoInicio = function (itens, anotacoes) {
    itensDaConta = itens;
    updateStatistics();
    atualizarSemanaDaConta(anotacoes, itens);
};

if (usuarioComSessao()) {
    itensDaConta = [];
    atualizarSemanaDaConta([], []);
}
updateStatisticsPeriod();
updateStatistics();