// =====================================================
// PÁGINA DA OBRA — ficha + diário pessoal + anotações
// =====================================================

(function () {

    "use strict";

    const S = window.Stellifer;
    const esc = S.esc;

    if (!S.exigirLogin()) { return; }

    const idItem = Number(new URLSearchParams(window.location.search).get("id"));
    const conteudo = document.getElementById("conteudo");

    let dados = null;               // { item, anotacoes }
    let dialogoAnotacao = null;
    let estado = null;              // anotação sendo editada
    let rolou = false;


    function linhas(texto) {
        return String(texto || "").split(/\r?\n/).map(function (l) { return l.trim(); }).filter(Boolean);
    }

    function galeria(imagens) {
        if (!imagens || imagens.length === 0) { return ""; }
        return '<div class="galeria">' + imagens.map(function (src, i) {
            return '<button type="button" data-zoom="' + esc(src) + '" aria-label="Ampliar imagem ' + (i + 1) + '">' +
                   '<img src="' + esc(src) + '" alt="Imagem ' + (i + 1) + '" loading="lazy"></button>';
        }).join("") + '</div>';
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

    function galeriaVideos(videos) {
        if (!videos || videos.length === 0) { return ""; }
        return '<div class="galeria-videos">' + videos.filter(function (video) {
            return video && (typeof video.youtubeId === "string" && /^[A-Za-z0-9_-]{11}$/.test(video.youtubeId) ||
                typeof video.video === "string");
        }).map(function (video, i) {
            if (video.youtubeId) {
                return '<div class="galeria-video-frame galeria-youtube-frame">' +
                    '<iframe src="' + esc(youtubeEmbedUrl(video.youtubeId)) +
                    '" title="Vídeo do YouTube ' + (i + 1) +
                    '" loading="lazy" referrerpolicy="origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>';
            }
            const src = typeof video === "string" ? video : video.video;
            const rotacao = typeof video === "string" ? 0 : video.rotacao || 0;
            return '<div class="galeria-video-frame"><video controls playsinline preload="metadata" data-rotacao="' + rotacao +
                '" aria-label="Vídeo ' + (i + 1) + '" src="' + esc(src) + '"></video></div>';
        }).join("") + '</div>';
    }

    function ajustarVideo(video) {
        if (!video.videoWidth || !video.videoHeight) { return; }
        const frame = video.parentElement;
        const rotacao = Number(video.dataset.rotacao) || 0;
        const girado = rotacao === 90 || rotacao === 270;
        const larguraVisual = girado ? video.videoHeight : video.videoWidth;
        const alturaVisual = girado ? video.videoWidth : video.videoHeight;
        frame.style.width = "100%";
        frame.style.height = "";
        const larguraDisponivel = frame.clientWidth;
        if (!larguraDisponivel) { return; }
        const escala = Math.min(
            larguraDisponivel / larguraVisual,
            window.innerHeight * 0.7 / alturaVisual
        );
        frame.style.width = Math.round(larguraVisual * escala) + "px";
        frame.style.height = Math.round(alturaVisual * escala) + "px";
        video.style.width = Math.round(video.videoWidth * escala) + "px";
        video.style.height = Math.round(video.videoHeight * escala) + "px";
        video.style.transform = "translate(-50%, -50%) rotate(" + rotacao + "deg)";
    }

    function prepararVideos() {
        conteudo.querySelectorAll(".galeria-video-frame video").forEach(function (video) {
            if (!video.dataset.rotacaoPreparada) {
                video.dataset.rotacaoPreparada = "true";
                video.addEventListener("loadedmetadata", function () { ajustarVideo(video); });
            }
            if (video.readyState >= 1) { ajustarVideo(video); }
        });
    }

    // =================================================
    // DESENHO DA PÁGINA
    // =================================================

    function desenhar() {

        const item = dados.item;
        const o = item.obra;

        document.title = o.titulo + " | Stellifer";

        const momentos = linhas(item.melhoresMomentos);
        const citacoes = linhas(item.citacoes);

        let html =
            '<a class="voltar" href="diario.html">← Voltar ao diário</a>' +

            '<div class="ficha">' +

                '<div class="ficha-capa">' + S.capaHTML(o, "capa") + '</div>' +

                '<div class="ficha-dados">' +
                    '<span class="etiqueta-status status-' + item.status + '">' + esc(S.STATUS[item.status]) + '</span>' +
                    '<h1>' + esc(o.titulo) + (item.favorito ? ' <span title="Favorita" style="color:#d9577a">♥</span>' : "") + '</h1>' +

                    '<div class="ficha-meta">' +
                        '<span>' + esc(S.ICONE_TIPO[o.tipo] || "✦") + " " + esc(o.tipo) + '</span>' +
                        (o.autor ? '<span>✍️ ' + esc(o.autor) + '</span>' : "") +
                    '</div>' +

                    (o.generos.length
                        ? '<div class="generos">' + o.generos.map(function (g) {
                              return '<span class="genero">' + esc(g) + '</span>';
                          }).join("") + '</div>'
                        : "") +

                    '<div class="ficha-resumo">' +
                        '<div class="dado"><span>Minha nota</span><strong>' + S.estrelas(item.nota) + '</strong></div>' +
                        (item.dataInicio ? '<div class="dado"><span>Comecei em</span><strong>' + esc(S.dataBonita(item.dataInicio)) + '</strong></div>' : "") +
                        (item.dataConclusao ? '<div class="dado"><span>Terminei em</span><strong>' + esc(S.dataBonita(item.dataConclusao)) + '</strong></div>' : "") +
                    '</div>' +

                    (o.sinopse ? '<div class="bloco-texto"><h3>Sinopse</h3><p class="sinopse">' + esc(o.sinopse) + '</p></div>' : "") +

                    '<div class="ficha-acoes">' +
                        '<button type="button" class="botao" id="btn-editar">✏️ Editar obra</button>' +
                        '<button type="button" class="botao botao-suave" id="btn-fav" aria-pressed="' + item.favorito + '">' +
                            (item.favorito ? "♥ Favorita" : "♡ Marcar como favorita") + '</button>' +
                        '<button type="button" class="botao botao-suave" id="btn-excluir">🗑️ Remover</button>' +
                    '</div>' +
                '</div>' +

            '</div>';

        // ----- Meu registro pessoal -----

        const videos = Array.isArray(item.videos) ? item.videos : [];
        const temRegistro = item.texto || momentos.length || citacoes.length || item.imagens.length || videos.length;

        html += '<div class="secao"><h2>Meu registro</h2>';

        if (!temRegistro) {
            html += '<div class="vazio"><span class="vazio-icone">📔</span>' +
                    '<strong>Ainda não escrevi nada aqui</strong>' +
                    'Conte o que achou, guarde frases e momentos favoritos.' +
                    '<br><button type="button" class="botao" data-editar>Escrever no diário</button></div>';
        } else {
            html += '<div class="painel">';

            if (item.texto) {
                html += '<div class="bloco-texto"><h3>O que achei</h3><p>' + esc(item.texto) + '</p></div>';
            }
            if (momentos.length) {
                html += '<div class="bloco-texto"><h3>Melhores momentos</h3><ul class="lista-estrelada">' +
                        momentos.map(function (m) { return '<li>' + esc(m) + '</li>'; }).join("") + '</ul></div>';
            }
            if (citacoes.length) {
                html += '<div class="bloco-texto"><h3>Citações</h3>' +
                        citacoes.map(function (c) { return '<blockquote class="citacao">“' + esc(c) + '”</blockquote>'; }).join("") + '</div>';
            }
            if (item.imagens.length) {
                html += '<div class="bloco-texto"><h3>Imagens</h3>' + galeria(item.imagens) + '</div>';
            }
            if (videos.length) {
                html += '<div class="bloco-texto"><h3>Vídeos</h3>' + galeriaVideos(videos) + '</div>';
            }

            html += '</div>';
        }

        html += '</div>';

        // ----- Anotações -----

        html += '<div class="secao"><div class="anotacoes-cabecalho"><h2>Anotações</h2>' +
                '<button type="button" class="botao" id="btn-nova-anotacao">+ Nova anotação</button></div>';

        if (dados.anotacoes.length === 0) {
            html += '<div class="vazio"><span class="vazio-icone">✍️</span>' +
                    '<strong>Nenhuma anotação ainda</strong>' +
                    'Registre o que sentiu em um episódio ou capítulo.</div>';
        } else {
            html += '<div class="linha-do-tempo">' + dados.anotacoes.map(cartaoAnotacao).join("") + '</div>';
        }

        html += '</div>';

        conteudo.innerHTML = html;
        prepararVideos();
    }

    window.addEventListener("resize", prepararVideos);

    function cartaoAnotacao(a) {
        return '<article class="anotacao" id="anotacao-' + a.id + '">' +
            '<div class="anotacao-topo">' +
                '<div class="anotacao-info">' +
                    (a.episodio ? '<span class="episodio">' + esc(a.episodio) + '</span>' : "") +
                    (a.data ? '<span>' + esc(S.dataBonita(a.data)) + '</span>' : "") +
                    (a.nota ? S.estrelas(a.nota) : "") +
                '</div>' +
                '<div class="anotacao-acoes">' +
                    '<button type="button" class="botao-texto" data-editar-anotacao="' + a.id + '">Editar</button>' +
                    '<button type="button" class="botao-texto perigo" data-excluir-anotacao="' + a.id + '">Excluir</button>' +
                '</div>' +
            '</div>' +
            (a.titulo ? '<h3>' + esc(a.titulo) + '</h3>' : "") +
            (a.texto ? '<p>' + esc(a.texto) + '</p>' : "") +
            galeria(a.imagens) +
        '</article>';
    }


    // =================================================
    // ANOTAÇÃO — janela de criar / editar
    // =================================================

    function criarDialogoAnotacao() {

        dialogoAnotacao = document.createElement("dialog");
        dialogoAnotacao.className = "janela";
        dialogoAnotacao.setAttribute("aria-labelledby", "an-titulo-janela");

        dialogoAnotacao.innerHTML =
            '<button type="button" class="janela-fechar" id="an-fechar" aria-label="Fechar">✕</button>' +
            '<form class="janela-corpo" id="an-form" novalidate>' +
                '<h2 id="an-titulo-janela">Nova anotação</h2>' +
                '<div class="erro-form" id="an-erro" role="alert"></div>' +

                '<div class="campos-linha">' +
                    '<div class="campo"><label for="an-episodio">Episódio ou capítulo</label>' +
                    '<input type="text" id="an-episodio" maxlength="60" placeholder="Ex.: Episódio 7, Capítulo 12"></div>' +
                    '<div class="campo"><label for="an-data">Data</label>' +
                    '<input type="date" id="an-data"></div>' +
                '</div>' +

                '<div class="campo"><label for="an-titulo">Título</label>' +
                '<input type="text" id="an-titulo" maxlength="150"></div>' +

                '<div class="campo"><span class="rotulo">Nota deste episódio/capítulo</span>' +
                '<div class="estrelas-input" id="an-nota" role="radiogroup" aria-label="Nota de 1 a 5"></div>' +
                '<small>Independente da nota geral da obra.</small></div>' +

                '<div class="campo"><label for="an-texto">Texto</label>' +
                '<textarea id="an-texto" rows="6" placeholder="O que você sentiu, pensou ou quer lembrar..."></textarea></div>' +

                '<div class="campo"><span class="rotulo">Imagens</span>' +
                '<label class="botao-arquivo">🖼️ Adicionar imagens<input type="file" id="an-imagens" accept="image/*" multiple></label>' +
                '<div class="previa-imagens" id="an-previa"></div></div>' +

                '<div class="janela-acoes">' +
                    '<button type="button" class="botao botao-suave" id="an-cancelar">Cancelar</button>' +
                    '<button type="submit" class="botao" id="an-salvar">Salvar anotação</button>' +
                '</div>' +
            '</form>';

        document.body.appendChild(dialogoAnotacao);
        S.prepararJanela(dialogoAnotacao);

        const caixa = dialogoAnotacao.querySelector("#an-nota");
        for (let i = 1; i <= 5; i++) {
            const b = document.createElement("button");
            b.type = "button";
            b.dataset.valor = i;
            b.textContent = "★";
            b.setAttribute("role", "radio");
            b.setAttribute("aria-label", i + (i === 1 ? " estrela" : " estrelas"));
            caixa.appendChild(b);
        }
        const limpar = document.createElement("button");
        limpar.type = "button";
        limpar.className = "limpar";
        limpar.textContent = "limpar";
        caixa.appendChild(limpar);

        caixa.addEventListener("click", function (e) {
            const b = e.target.closest("button");
            if (!b) { return; }
            estado.nota = b.classList.contains("limpar") ? null : Number(b.dataset.valor);
            desenharNotaAnotacao();
        });

        dialogoAnotacao.querySelector("#an-fechar").addEventListener("click", function () { dialogoAnotacao.close(); });
        dialogoAnotacao.querySelector("#an-cancelar").addEventListener("click", function () { dialogoAnotacao.close(); });

        dialogoAnotacao.querySelector("#an-imagens").addEventListener("change", async function (e) {
            for (const arquivo of Array.from(e.target.files)) {
                try {
                    estado.imagens.push(await S.comprimirImagem(arquivo, 1000, 0.8));
                } catch (erro) {
                    erroAnotacao(erro.message);
                }
            }
            desenharImagensAnotacao();
            e.target.value = "";
        });

        dialogoAnotacao.querySelector("#an-previa").addEventListener("click", function (e) {
            const b = e.target.closest("button[data-i]");
            if (!b) { return; }
            estado.imagens.splice(Number(b.dataset.i), 1);
            desenharImagensAnotacao();
        });

        dialogoAnotacao.querySelector("#an-form").addEventListener("submit", salvarAnotacao);
    }

    function an(id) { return dialogoAnotacao.querySelector("#" + id); }

    function erroAnotacao(msg) {
        const e = an("an-erro");
        e.textContent = msg;
        e.classList.add("visivel");
    }

    function desenharNotaAnotacao() {
        dialogoAnotacao.querySelectorAll("#an-nota button[data-valor]").forEach(function (b) {
            b.classList.toggle("ligada", !!(estado.nota && Number(b.dataset.valor) <= estado.nota));
            b.setAttribute("aria-checked", String(Number(b.dataset.valor) === estado.nota));
        });
    }

    function desenharImagensAnotacao() {
        an("an-previa").innerHTML = estado.imagens.map(function (src, i) {
            return '<div class="previa"><img src="' + esc(src) + '" alt="Imagem ' + (i + 1) + '">' +
                   '<button type="button" data-i="' + i + '" aria-label="Remover imagem ' + (i + 1) + '">✕</button></div>';
        }).join("");
    }

    function abrirAnotacao(anotacao) {

        if (!dialogoAnotacao) { criarDialogoAnotacao(); }

        estado = {
            id: anotacao ? anotacao.id : null,
            nota: anotacao ? anotacao.nota : null,
            imagens: anotacao ? anotacao.imagens.slice() : []
        };

        an("an-titulo-janela").textContent = anotacao ? "Editar anotação" : "Nova anotação";
        an("an-erro").classList.remove("visivel");
        an("an-episodio").value = anotacao ? anotacao.episodio : "";
        an("an-data").value = anotacao ? (anotacao.data || "") : S.hoje();
        an("an-titulo").value = anotacao ? anotacao.titulo : "";
        an("an-texto").value = anotacao ? anotacao.texto : "";

        desenharNotaAnotacao();
        desenharImagensAnotacao();

        dialogoAnotacao.showModal();
        an("an-episodio").focus();
    }

    async function salvarAnotacao(e) {
        e.preventDefault();
        an("an-erro").classList.remove("visivel");

        const titulo = an("an-titulo").value.trim();
        const texto = an("an-texto").value.trim();

        if (!titulo && !texto) {
            erroAnotacao("Escreva um título ou um texto.");
            return;
        }

        const botao = an("an-salvar");
        botao.disabled = true;

        try {
            const resposta = await S.Store.salvarAnotacao(idItem, {
                episodio: an("an-episodio").value.trim(),
                data: an("an-data").value || null,
                nota: estado.nota,
                titulo: titulo,
                texto: texto,
                imagens: estado.imagens
            }, estado.id);

            S.aoSalvar(resposta);
            S.aviso(resposta.mensagem || "Anotação guardada!");
            dialogoAnotacao.close();
            await carregar();
        } catch (erro) {
            erroAnotacao(erro.message || "Não foi possível salvar.");
        } finally {
            botao.disabled = false;
        }
    }


    // =================================================
    // EVENTOS DA PÁGINA
    // =================================================

    function abrirImagem(src) {
        const d = document.createElement("dialog");
        d.className = "janela";
        d.style.width = "min(900px, 94vw)";
        d.innerHTML = '<button type="button" class="janela-fechar" aria-label="Fechar">✕</button>' +
                      '<div class="janela-corpo"><img class="imagem-grande" alt="Imagem ampliada"></div>';
        d.querySelector("img").src = src;
        document.body.appendChild(d);
        S.prepararJanela(d);
        d.querySelector(".janela-fechar").addEventListener("click", function () { d.close(); });
        d.addEventListener("close", function () { d.remove(); });
        d.showModal();
    }

    function editarObra() {
        window.FormObra.abrir({
            item: dados.item,
            aoSalvar: function () { carregar(); }
        });
    }

    conteudo.addEventListener("click", async function (e) {

        if (e.target.closest("#btn-editar") || e.target.closest("[data-editar]")) {
            editarObra();
            return;
        }

        if (e.target.closest("#btn-nova-anotacao")) {
            abrirAnotacao(null);
            return;
        }

        const zoom = e.target.closest("[data-zoom]");
        if (zoom) {
            abrirImagem(zoom.dataset.zoom);
            return;
        }

        const editarA = e.target.closest("[data-editar-anotacao]");
        if (editarA) {
            const a = dados.anotacoes.filter(function (x) { return x.id === Number(editarA.dataset.editarAnotacao); })[0];
            if (a) { abrirAnotacao(a); }
            return;
        }

        const excluirA = e.target.closest("[data-excluir-anotacao]");
        if (excluirA) {
            const ok = await S.confirmar("Excluir anotação?", "Essa anotação será apagada para sempre.", "Excluir");
            if (!ok) { return; }
            try {
                const r = await S.Store.excluirAnotacao(Number(excluirA.dataset.excluirAnotacao));
                S.aoSalvar(r);
                S.aviso(r.mensagem || "Anotação removida.");
                await carregar();
            } catch (erro) {
                S.aviso(erro.message, "erro");
            }
            return;
        }

        if (e.target.closest("#btn-fav")) {
            const novo = !dados.item.favorito;
            try {
                S.aoSalvar(await S.Store.favorito(idItem, novo));
                dados.item.favorito = novo;
                desenhar();
            } catch (erro) {
                S.aviso(erro.message, "erro");
            }
            return;
        }

        if (e.target.closest("#btn-excluir")) {
            const ok = await S.confirmar(
                "Remover do diário?",
                "A obra e todas as anotações dela serão apagadas. Isso não pode ser desfeito.",
                "Remover");
            if (!ok) { return; }
            try {
                S.aoSalvar(await S.Store.excluirItem(idItem));
                window.location.href = "diario.html";
            } catch (erro) {
                S.aviso(erro.message, "erro");
            }
        }
    });


    async function carregar() {
        try {
            dados = await S.Store.item(idItem);
            desenhar();

            // Vindo de "Minhas anotações": rola até a anotação escolhida
            if (!rolou && window.location.hash) {
                rolou = true;
                const alvo = document.querySelector(window.location.hash);
                if (alvo) { alvo.scrollIntoView({ block: "center" }); }
            }
        } catch (erro) {
            conteudo.innerHTML =
                '<a class="voltar" href="diario.html">← Voltar ao diário</a>' +
                '<div class="vazio"><span class="vazio-icone">🌫️</span>' +
                '<strong>Não encontrei essa história</strong>' + esc(erro.message) + '</div>';
        }
    }

    if (!idItem) {
        conteudo.innerHTML =
            '<a class="voltar" href="diario.html">← Voltar ao diário</a>' +
            '<div class="vazio"><span class="vazio-icone">🌫️</span><strong>Nenhuma obra escolhida</strong>' +
            'Abra uma obra pelo seu diário.</div>';
    } else {
        carregar();
    }

})();
