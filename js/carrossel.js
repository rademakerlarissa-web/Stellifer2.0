// =====================================================
// CARROSSEL PERSONALIZADO DA PÁGINA INICIAL
// =====================================================

(function () {

    "use strict";

    const container = document.querySelector(".carousel-container");
    const slidesContainer = document.querySelector(".carousel-slides");
    const indicatorsContainer = document.querySelector(".carousel-indicators");
    const previousButton = document.querySelector(".carousel-button.prev");
    const nextButton = document.querySelector(".carousel-button.next");
    const carouselTime = 10000;
    const fundosPasteis = [
        { titulo: "Minhas histórias, minhas memórias.", texto: "Um lugar para guardar aquilo que vivi através das histórias." },
        { titulo: "Cada história deixa uma marca.", texto: "Registre seus momentos favoritos." },
        { titulo: "Reviva suas histórias.", texto: "Relembre o que você sentiu, pensou e viveu." }
    ];
    let currentSlide = 0;
    let carouselInterval = null;

    if (!container || !slidesContainer || !indicatorsContainer) { return; }

    function slides() {
        return Array.from(slidesContainer.querySelectorAll(".carousel-slide"));
    }

    function mostrarSlide(index) {
        const lista = slides();
        if (lista.length === 0) { return; }

        currentSlide = (index + lista.length) % lista.length;
        lista.forEach(function (slide, i) {
            const ativo = i === currentSlide;
            slide.classList.toggle("active", ativo);
            slide.setAttribute("aria-hidden", String(!ativo));
        });

        indicatorsContainer.querySelectorAll(".indicator").forEach(function (indicator, i) {
            indicator.classList.toggle("active", i === currentSlide);
            indicator.setAttribute("aria-pressed", String(i === currentSlide));
        });
    }

    function reiniciarTemporizador() {
        window.clearInterval(carouselInterval);
        if (slides().length > 1) {
            carouselInterval = window.setInterval(function () {
                mostrarSlide(currentSlide + 1);
            }, carouselTime);
        }
    }

    function montarSlide(dados, index, pastel) {
        const slide = document.createElement("div");
        slide.className = "carousel-slide" + (pastel ? " carousel-pastel carousel-pastel-" + (index % 3 + 1) : "");

        if (dados.imagem) {
            const imagem = document.createElement("img");
            imagem.src = dados.imagem;
            imagem.alt = dados.alt || "Imagem adicionada ao diário";
            imagem.loading = index === 0 ? "eager" : "lazy";
            slide.appendChild(imagem);
            if (dados.citacao) {
                const legenda = document.createElement("div");
                legenda.className = "carousel-caption carousel-citacao";
                const totalPalavras = dados.citacao.trim().match(/\S+/g);
                const quantidadePalavras = totalPalavras ? totalPalavras.length : 0;
                if (quantidadePalavras > 40) {
                    legenda.classList.add("carousel-citacao-muito-longa");
                } else if (quantidadePalavras > 20) {
                    legenda.classList.add("carousel-citacao-longa");
                }
                const citacao = document.createElement("blockquote");
                citacao.textContent = "“" + dados.citacao + "”";
                const obra = document.createElement("cite");
                obra.textContent = dados.obra || "Obra do diário";
                legenda.append(citacao, obra);
                slide.appendChild(legenda);
            }
        } else {
            const legenda = document.createElement("div");
            legenda.className = "carousel-caption";
            const titulo = document.createElement("h2");
            titulo.textContent = dados.titulo;
            const texto = document.createElement("p");
            texto.textContent = dados.texto;
            legenda.append(titulo, texto);
            slide.appendChild(legenda);
        }

        return slide;
    }

    function renderizar(imagens) {
        const lista = Array.isArray(imagens) && imagens.length > 0
            ? imagens
            : fundosPasteis;
        const pastel = !(Array.isArray(imagens) && imagens.length > 0);

        slidesContainer.replaceChildren();
        indicatorsContainer.replaceChildren();

        lista.forEach(function (dados, index) {
            slidesContainer.appendChild(montarSlide(dados, index, pastel));
            const indicador = document.createElement("button");
            indicador.type = "button";
            indicador.className = "indicator";
            indicador.setAttribute("aria-label", "Mostrar imagem " + (index + 1));
            indicador.addEventListener("click", function () {
                mostrarSlide(index);
                reiniciarTemporizador();
            });
            indicatorsContainer.appendChild(indicador);
        });

        const temVariosSlides = lista.length > 1;
        previousButton.hidden = !temVariosSlides;
        nextButton.hidden = !temVariosSlides;
        indicatorsContainer.hidden = !temVariosSlides;
        currentSlide = 0;
        mostrarSlide(currentSlide);
        reiniciarTemporizador();
    }

    previousButton.addEventListener("click", function () {
        mostrarSlide(currentSlide - 1);
        reiniciarTemporizador();
    });

    nextButton.addEventListener("click", function () {
        mostrarSlide(currentSlide + 1);
        reiniciarTemporizador();
    });

    window.atualizarCarrosselInicio = renderizar;
    renderizar([]);

})();
