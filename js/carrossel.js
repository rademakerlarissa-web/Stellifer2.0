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
    const citationsSection = document.querySelector(".citacoes-mobile");
    const citationsSlidesContainer = document.querySelector(".citacoes-mobile-slides");
    const citationsIndicatorsContainer = document.querySelector(".citacoes-mobile-indicators");
    const citationsPreviousButton = document.querySelector(".citacoes-mobile-button.prev");
    const citationsNextButton = document.querySelector(".citacoes-mobile-button.next");
    const videoCarouselSection = document.querySelector("#video-carousel-section");
    const videoCarouselStage = document.querySelector(".video-carousel-stage");
    const videoSlidesContainer = document.querySelector(".video-carousel-slides");
    const videoCaption = document.querySelector(".video-carousel-caption");
    const videoIndicatorsContainer = document.querySelector(".video-carousel-indicators");
    const videoPreviousButton = document.querySelector(".video-carousel-button.prev");
    const videoNextButton = document.querySelector(".video-carousel-button.next");
    const carouselTime = 10000;
    const fundosPasteis = [
        { titulo: "Minhas histórias, minhas memórias.", texto: "Um lugar para guardar aquilo que vivi através das histórias." },
        { titulo: "Cada história deixa uma marca.", texto: "Registre seus momentos favoritos." },
        { titulo: "Reviva suas histórias.", texto: "Relembre o que você sentiu, pensou e viveu." }
    ];
    let currentSlide = 0;
    let carouselInterval = null;
    let currentCitation = 0;
    let citationsInterval = null;
    let renderVersion = 0;
    let currentVideo = 0;

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

    function mostrarCitacao(index) {
        const lista = Array.from(citationsSlidesContainer.querySelectorAll(".citacao-mobile-slide"));
        if (lista.length === 0) { return; }

        currentCitation = (index + lista.length) % lista.length;
        lista.forEach(function (slide, i) {
            const ativo = i === currentCitation;
            slide.classList.toggle("active", ativo);
            slide.setAttribute("aria-hidden", String(!ativo));
        });

        citationsIndicatorsContainer.querySelectorAll(".citacoes-mobile-indicator").forEach(function (indicator, i) {
            indicator.classList.toggle("active", i === currentCitation);
            indicator.setAttribute("aria-pressed", String(i === currentCitation));
        });
    }

    function reiniciarTemporizadorCitacoes() {
        window.clearInterval(citationsInterval);
        const total = citationsSlidesContainer.querySelectorAll(".citacao-mobile-slide").length;
        if (total > 1) {
            citationsInterval = window.setInterval(function () {
                mostrarCitacao(currentCitation + 1);
            }, carouselTime);
        }
    }

    function renderizarCitacoes(citacoes) {
        if (!citationsSection || !citationsSlidesContainer || !citationsIndicatorsContainer) { return; }

        const lista = Array.isArray(citacoes)
            ? citacoes.filter(function (item) {
                return item && typeof item.citacao === "string" && item.citacao.trim();
            })
            : [];

        citationsSlidesContainer.replaceChildren();
        citationsIndicatorsContainer.replaceChildren();
        citationsSection.classList.toggle("has-citations", lista.length > 0);
        if (lista.length === 0) {
            window.clearInterval(citationsInterval);
            return;
        }

        lista.forEach(function (item, index) {
            const slide = document.createElement("article");
            slide.className = "citacao-mobile-slide";
            slide.setAttribute("aria-hidden", "true");

            const citacao = document.createElement("blockquote");
            citacao.textContent = "“" + item.citacao.trim() + "”";
            const obra = document.createElement("cite");
            obra.textContent = item.obra || "Obra do diário";
            slide.append(citacao, obra);
            citationsSlidesContainer.appendChild(slide);

            const indicator = document.createElement("button");
            indicator.type = "button";
            indicator.className = "citacoes-mobile-indicator";
            indicator.setAttribute("aria-label", "Mostrar citação " + (index + 1));
            indicator.addEventListener("click", function () {
                mostrarCitacao(index);
                reiniciarTemporizadorCitacoes();
            });
            citationsIndicatorsContainer.appendChild(indicator);
        });

        const temVariasCitacoes = lista.length > 1;
        citationsPreviousButton.hidden = !temVariasCitacoes;
        citationsNextButton.hidden = !temVariasCitacoes;
        citationsIndicatorsContainer.hidden = !temVariasCitacoes;
        currentCitation = 0;
        mostrarCitacao(currentCitation);
        reiniciarTemporizadorCitacoes();
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

    function imagemHorizontal(dados) {
        return new Promise(function (resolve) {
            const imagem = new Image();
            imagem.onload = function () {
                resolve(imagem.naturalWidth / imagem.naturalHeight >= 1.2);
            };
            imagem.onerror = function () { resolve(false); };
            imagem.src = dados.imagem;
        });
    }

    function mostrarVideo(index) {
        if (!videoSlidesContainer || !videoIndicatorsContainer) { return; }
        const lista = Array.from(videoSlidesContainer.querySelectorAll(".video-carousel-slide"));
        if (lista.length === 0) { return; }

        currentVideo = (index + lista.length) % lista.length;
        lista.forEach(function (slide, i) {
            const ativo = i === currentVideo;
            const video = slide.querySelector("video");
            const iframe = slide.querySelector("iframe");
            slide.classList.toggle("active", ativo);
            slide.setAttribute("aria-hidden", String(!ativo));
            if (ativo) {
                videoCarouselStage.style.width = "100%";
                videoCarouselStage.style.height = "";
                videoCarouselStage.style.aspectRatio = "16 / 9";
                videoCarouselStage.classList.remove("has-metadata");
                if (video) {
                    video.preload = "metadata";
                    video.load();
                } else if (iframe && iframe.src === "about:blank") {
                    iframe.src = youtubeEmbedUrl(iframe.dataset.youtubeId);
                }
            } else {
                if (video) { video.pause(); }
                if (iframe) { iframe.src = "about:blank"; }
            }
        });

        const indicador = videoIndicatorsContainer.querySelectorAll(".indicator");
        indicador.forEach(function (botao, i) {
            botao.classList.toggle("active", i === currentVideo);
            botao.setAttribute("aria-pressed", String(i === currentVideo));
        });
        const ativo = lista[currentVideo].querySelector("video");
        if (ativo) { ajustarMolduraVideo(ativo); }
        videoCaption.textContent = lista[currentVideo].dataset.titulo;
    }

    function youtubeEmbedUrl(id) {
        const parametros = new URLSearchParams({
            playsinline: "1",
            rel: "0",
            modestbranding: "1"
        });
        if ((window.location.protocol === "http:" || window.location.protocol === "https:") &&
            window.location.origin !== "null") {
            parametros.set("origin", window.location.origin);
        }
        return "https://www.youtube.com/embed/" + encodeURIComponent(id) + "?" + parametros.toString();
    }

    function ajustarMolduraVideo(video) {
        if (!video.videoWidth || !video.videoHeight) { return; }

        const larguraDisponivel = videoCarouselStage.parentElement.clientWidth;
        if (!larguraDisponivel) { return; }
        const alturaMaxima = window.innerHeight * (window.innerWidth <= 650 ? 0.6 : 0.7);
        const rotacao = Number(video.dataset.rotacao) || 0;
        const girado = rotacao === 90 || rotacao === 270;
        const larguraVisual = girado ? video.videoHeight : video.videoWidth;
        const alturaVisual = girado ? video.videoWidth : video.videoHeight;
        const escala = Math.min(larguraDisponivel / larguraVisual, alturaMaxima / alturaVisual);

        videoCarouselStage.style.width = Math.round(larguraVisual * escala) + "px";
        videoCarouselStage.style.height = Math.round(alturaVisual * escala) + "px";
        videoCarouselStage.style.aspectRatio = larguraVisual + " / " + alturaVisual;
        video.style.width = Math.round(video.videoWidth * escala) + "px";
        video.style.height = Math.round(video.videoHeight * escala) + "px";
        video.style.transform = "rotate(" + rotacao + "deg)";
        videoCarouselStage.classList.add("has-metadata");
    }

    function renderizarVideos(videos) {
        if (!videoCarouselSection || !videoSlidesContainer || !videoIndicatorsContainer) { return; }

        const lista = Array.isArray(videos)
            ? videos.filter(function (item) {
                return item && (
                    typeof item.youtubeId === "string" && /^[A-Za-z0-9_-]{11}$/.test(item.youtubeId) ||
                    typeof item.video === "string" && /^data:video\/(mp4|webm);base64,/.test(item.video)
                );
            })
            : [];

        videoSlidesContainer.replaceChildren();
        videoIndicatorsContainer.replaceChildren();
        videoCarouselSection.hidden = lista.length === 0;
        videoCarouselStage.style.aspectRatio = "16 / 9";
        if (lista.length === 0) { return; }

        lista.forEach(function (item, index) {
            const slide = document.createElement("div");
            slide.className = "video-carousel-slide";
            slide.dataset.titulo = item.titulo || "Vídeo " + (index + 1);
            slide.setAttribute("aria-hidden", "true");

            if (item.youtubeId) {
                const iframe = document.createElement("iframe");
                iframe.dataset.youtubeId = item.youtubeId;
                iframe.src = "about:blank";
                iframe.title = slide.dataset.titulo;
                iframe.loading = "lazy";
                iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
                iframe.allowFullscreen = true;
                iframe.referrerPolicy = "origin";
                slide.appendChild(iframe);
            } else {
                const video = document.createElement("video");
                video.controls = true;
                video.playsInline = true;
                video.preload = "none";
                video.src = item.video;
                video.dataset.rotacao = [0, 90, 180, 270].includes(item.rotacao) ? item.rotacao : 0;
                video.setAttribute("aria-label", slide.dataset.titulo);
                video.addEventListener("loadedmetadata", function () {
                    if (index === currentVideo) { ajustarMolduraVideo(video); }
                });
                slide.appendChild(video);
            }

            videoSlidesContainer.appendChild(slide);

            const indicador = document.createElement("button");
            indicador.type = "button";
            indicador.className = "indicator";
            indicador.setAttribute("aria-label", "Mostrar vídeo " + (index + 1));
            indicador.addEventListener("click", function () { mostrarVideo(index); });
            videoIndicatorsContainer.appendChild(indicador);
        });

        const variosVideos = lista.length > 1;
        videoPreviousButton.hidden = !variosVideos;
        videoNextButton.hidden = !variosVideos;
        videoIndicatorsContainer.hidden = !variosVideos;
        currentVideo = 0;
        mostrarVideo(currentVideo);
    }

    async function renderizar(imagens, citacoes, videos) {
        const versao = ++renderVersion;
        const imagensValidas = Array.isArray(imagens)
            ? await Promise.all(imagens.map(async function (dados) {
                return dados && dados.imagem && await imagemHorizontal(dados) ? dados : null;
            }))
            : [];

        if (versao !== renderVersion) { return; }

        const imagensPaisagem = imagensValidas.filter(Boolean);
        const lista = imagensPaisagem.length > 0 ? imagensPaisagem : fundosPasteis;
        const pastel = imagensPaisagem.length === 0;

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
        renderizarCitacoes(citacoes);
        renderizarVideos(videos);
    }

    previousButton.addEventListener("click", function () {
        mostrarSlide(currentSlide - 1);
        reiniciarTemporizador();
    });

    nextButton.addEventListener("click", function () {
        mostrarSlide(currentSlide + 1);
        reiniciarTemporizador();
    });

    citationsPreviousButton.addEventListener("click", function () {
        mostrarCitacao(currentCitation - 1);
        reiniciarTemporizadorCitacoes();
    });

    citationsNextButton.addEventListener("click", function () {
        mostrarCitacao(currentCitation + 1);
        reiniciarTemporizadorCitacoes();
    });

    videoPreviousButton.addEventListener("click", function () {
        mostrarVideo(currentVideo - 1);
    });

    videoNextButton.addEventListener("click", function () {
        mostrarVideo(currentVideo + 1);
    });

    window.addEventListener("resize", function () {
        const ativo = videoSlidesContainer.querySelector(".video-carousel-slide.active video");
        if (ativo) { ajustarMolduraVideo(ativo); }
    });

    window.atualizarCarrosselInicio = renderizar;
    renderizar([]);

})();
