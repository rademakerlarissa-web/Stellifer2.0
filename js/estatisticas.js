
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
        const count = Number(day.dataset.count);

        const text = count === 1
            ? "anotação"
            : "anotações";

        annotationInfo.innerHTML = `
            <strong>${dayName}</strong>
            <span>📝 ${count} ${text}</span>
        `;

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

    let mostFrequentRating = 5;

    for (let rating = 4; rating >= 1; rating--) {

        if (ratings[rating] > ratings[mostFrequentRating]) {
            mostFrequentRating = rating;
        }

    }


    // Cria as estrelas

    const stars =
        "⭐".repeat(mostFrequentRating);


    document.querySelector("#most-frequent-stars")
        .textContent = stars;

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
        (completed / total) * 100;

    const progressPercent =
        completedPercent +
        (progress / total) * 100;


    // Atualiza o gráfico

    const statusCircle =
        document.querySelector("#status-circle");


    statusCircle.style.background = `
        conic-gradient(
            var(--verde-escuro) 0% ${completedPercent}%,
            var(--azul-escuro) ${completedPercent}% ${progressPercent}%,
            var(--rosa-escuro) ${progressPercent}% 100%
        )
    `;

}

// =====================================================
// ATUALIZAR DESTAQUES
// =====================================================

function updateHighlights(highlights) {

    highlights.forEach(function(work, index) {

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
            "⭐".repeat(work.rating);

    });

}

// =====================================================
// ATUALIZAR TODAS AS ESTATÍSTICAS
// =====================================================

function updateStatistics() {

    let data;


    // -------------------------------------------------
    // HISTÓRICO GERAL
    // -------------------------------------------------

    if (generalButton.classList.contains("active")) {

        data = generalStatistics;

    }


    // -------------------------------------------------
    // MÊS / ANO
    // -------------------------------------------------

    else {

        const month =
            String(monthSelect.value).padStart(2, "0");

        const year =
            yearSelect.value;


        const period =
            `${year}-${month}`;


        data = statisticsData[period];


        // Caso ainda não exista dado para esse período

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

                highlights: [
                    {
                        title: "Nenhuma obra",
                        type: "—",
                        rating: 0
                    },

                    {
                        title: "Nenhuma obra",
                        type: "—",
                        rating: 0
                    },

                    {
                        title: "Nenhuma obra",
                        type: "—",
                        rating: 0
                    }
                ]

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



updateStatisticsPeriod();
updateStatistics();