// =====================================================
// FORMULÁRIO DE OBRA (adicionar e editar)
// =====================================================
//
// Usado em diario.html (adicionar) e obra.html (editar).
//
//   FormObra.abrir({ item: null,        → adicionar
//                    item: itemExistente → editar
//                    aoSalvar: function (resposta) { ... } })

(function () {

    "use strict";

    const S = window.Stellifer;
    const esc = S.esc;

    let dialogo = null;
    let estado = null;          // { id, nota, imagens, capa, aoSalvar }
    let temporizadorRascunho = null;
    let filaRascunho = Promise.resolve();
    let dbRascunhos = null;
    let imagensEmProcessamento = false;
    let capaEmProcessamento = false;

    function normalizarVideos(videos) {
        return videos.map(function (video) {
            if (typeof video === "string") { return { video: video, rotacao: 0 }; }
            if (video && typeof video.youtubeId === "string") {
                return { youtubeId: video.youtubeId };
            }
            return {
                video: video.video,
                rotacao: [0, 90, 180, 270].includes(video.rotacao) ? video.rotacao : 0
            };
        });
    }

    function extrairIdYoutube(valor) {
        let url;
        try {
            url = new URL(valor.trim());
        } catch (erro) {
            return "";
        }
        if (url.protocol !== "https:" && url.protocol !== "http:") { return ""; }

        const host = url.hostname.toLowerCase();
        let id = "";
        if (host === "youtu.be") {
            id = url.pathname.split("/").filter(Boolean)[0] || "";
        } else if (["youtube.com", "www.youtube.com", "m.youtube.com", "youtube-nocookie.com", "www.youtube-nocookie.com"].includes(host)) {
            if (url.pathname === "/watch") {
                id = url.searchParams.get("v") || "";
            } else {
                const correspondencia = url.pathname.match(/^\/(?:embed|shorts|live)\/([A-Za-z0-9_-]{11})(?:\/|$)/);
                id = correspondencia ? correspondencia[1] : "";
            }
        }
        return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : "";
    }

    function abrirBancoRascunhos() {
        if (dbRascunhos) { return dbRascunhos; }

        dbRascunhos = new Promise(function (resolve, reject) {
            const pedido = window.indexedDB.open("stellifer-rascunhos", 1);

            pedido.onupgradeneeded = function () {
                if (!pedido.result.objectStoreNames.contains("rascunhos")) {
                    pedido.result.createObjectStore("rascunhos", { keyPath: "chave" });
                }
            };

            pedido.onsuccess = function () {
                pedido.result.onversionchange = function () { pedido.result.close(); };
                resolve(pedido.result);
            };

            pedido.onerror = function () {
                reject(pedido.error || new Error("Não foi possível abrir o armazenamento de rascunhos."));
            };

            pedido.onblocked = function () {
                reject(new Error("O armazenamento de rascunhos está ocupado por outra aba."));
            };
        });

        return dbRascunhos;
    }

    async function lerRascunho(chave) {
        const banco = await abrirBancoRascunhos();

        return new Promise(function (resolve, reject) {
            const transacao = banco.transaction("rascunhos", "readonly");
            const pedido = transacao.objectStore("rascunhos").get(chave);
            pedido.onsuccess = function () { resolve(pedido.result || null); };
            pedido.onerror = function () {
                reject(pedido.error || new Error("Não foi possível ler o rascunho."));
            };
            transacao.onabort = function () {
                reject(transacao.error || new Error("A leitura do rascunho foi interrompida."));
            };
        });
    }

    async function gravarRascunho(rascunho) {
        const banco = await abrirBancoRascunhos();

        return new Promise(function (resolve, reject) {
            const transacao = banco.transaction("rascunhos", "readwrite");
            transacao.objectStore("rascunhos").put(rascunho);
            transacao.oncomplete = resolve;
            transacao.onerror = function () {
                reject(transacao.error || new Error("Não foi possível salvar o rascunho."));
            };
            transacao.onabort = function () {
                reject(transacao.error || new Error("O salvamento do rascunho foi interrompido."));
            };
        });
    }

    async function apagarRascunho(chave) {
        const banco = await abrirBancoRascunhos();

        return new Promise(function (resolve, reject) {
            const transacao = banco.transaction("rascunhos", "readwrite");
            transacao.objectStore("rascunhos").delete(chave);
            transacao.oncomplete = resolve;
            transacao.onerror = function () {
                reject(transacao.error || new Error("Não foi possível remover o rascunho."));
            };
            transacao.onabort = function () {
                reject(transacao.error || new Error("A remoção do rascunho foi interrompida."));
            };
        });
    }

    function chaveDoRascunho(id) {
        const usuario = S.usuario();
        return String(usuario ? usuario.id_usuario : "visitante") + ":" + (id || "novo");
    }

    function normalizarItens(valor, separarPorVirgula) {
        if (Array.isArray(valor)) {
            return valor.map(function (item) { return String(item).trim(); }).filter(Boolean);
        }
        if (typeof valor !== "string" || !valor.trim()) { return []; }
        const separador = separarPorVirgula ? /[\r\n,]+/ : /\r?\n/;
        return valor.split(separador).map(function (item) { return item.trim(); }).filter(Boolean);
    }

    function renderizarItens(id, chaveEstado) {
        const editor = campo(id + "-editor");
        const lista = estado[chaveEstado] || [];
        editor.querySelector(".itens-tags").replaceChildren();

        lista.forEach(function (valor, indice) {
            const tag = document.createElement("span");
            tag.className = "item-tag";
            tag.setAttribute("role", "listitem");
            const texto = document.createElement("span");
            texto.textContent = valor;
            const remover = document.createElement("button");
            remover.type = "button";
            remover.className = "item-tag-remover";
            remover.dataset.indice = indice;
            remover.setAttribute("aria-label", "Remover " + valor);
            remover.textContent = "×";
            remover.disabled = estado.abrindo;
            tag.append(texto, remover);
            editor.querySelector(".itens-tags").appendChild(tag);
        });
    }

    function prepararEditorItens(id, chaveEstado) {
        const editor = campo(id + "-editor");
        const entrada = campo(id + "-entrada");

        entrada.addEventListener("keydown", function (evento) {
            if (evento.key === "Enter") {
                evento.preventDefault();
                const valor = entrada.value.trim();
                if (!valor) { return; }
                if (!estado[chaveEstado].some(function (item) {
                    return item.toLocaleLowerCase() === valor.toLocaleLowerCase();
                })) {
                    estado[chaveEstado].push(valor);
                    renderizarItens(id, chaveEstado);
                    agendarSalvamentoRascunho();
                }
                entrada.value = "";
            } else if (evento.key === "Backspace" && !entrada.value && estado[chaveEstado].length > 0) {
                estado[chaveEstado].pop();
                renderizarItens(id, chaveEstado);
                agendarSalvamentoRascunho();
            }
        });

        entrada.addEventListener("input", agendarSalvamentoRascunho);
        editor.addEventListener("click", function (evento) {
            const botao = evento.target.closest(".item-tag-remover");
            if (!botao) { return; }
            estado[chaveEstado].splice(Number(botao.dataset.indice), 1);
            renderizarItens(id, chaveEstado);
            agendarSalvamentoRascunho();
            entrada.focus();
        });
    }

    function capturarRascunho() {
        return {
            chave: estado.chaveRascunho,
            atualizadoEm: Date.now(),
            nota: estado.nota,
            capa: estado.capa,
            imagens: estado.imagens.slice(),
            videos: estado.videos.slice(),
            formulario: {
                titulo: campo("fo-titulo-obra").value,
                tipo: campo("fo-tipo").value,
                status: campo("fo-status").value,
                autor: campo("fo-autor").value,
                generos: estado.generos.slice(),
                entradaGeneros: campo("fo-generos-entrada").value,
                sinopse: campo("fo-sinopse").value,
                inicio: campo("fo-inicio").value,
                fim: campo("fo-fim").value,
                favorito: campo("fo-favorito").checked,
                texto: campo("fo-texto").value,
                momentos: estado.momentos.slice(),
                entradaMomentos: campo("fo-momentos-entrada").value,
                citacoes: estado.citacoes.slice(),
                entradaCitacoes: campo("fo-citacoes-entrada").value
            }
        };
    }

    function salvarRascunho() {
        if (!estado || estado.descartado || !estado.chaveRascunho) { return; }

        const rascunho = capturarRascunho();
        const status = campo("fo-rascunho-status");
        status.textContent = "Salvando rascunho...";

        filaRascunho = filaRascunho.then(function () {
            return gravarRascunho(rascunho);
        }).then(function () {
            if (estado && estado.chaveRascunho === rascunho.chave) {
                status.textContent = "Rascunho salvo neste navegador.";
                estado.erroRascunhoNotificado = false;
            }
        }).catch(function (erro) {
            console.error("Erro ao salvar rascunho:", erro);
            if (estado && estado.chaveRascunho === rascunho.chave) {
                status.textContent = "Não foi possível salvar o rascunho: " + erro.message;
                if (!estado.erroRascunhoNotificado) {
                    estado.erroRascunhoNotificado = true;
                    S.aviso("Não foi possível salvar seu rascunho neste navegador.", "erro");
                }
            }
        });
    }

    function agendarSalvamentoRascunho() {
        if (!estado || estado.descartado) { return; }
        window.clearTimeout(temporizadorRascunho);
        temporizadorRascunho = window.setTimeout(salvarRascunho, 400);
    }

    function restaurarRascunho(rascunho) {
        const f = rascunho.formulario || {};
        campo("fo-titulo-obra").value = f.titulo || "";
        campo("fo-tipo").value = f.tipo || "";
        campo("fo-status").value = f.status || campo("fo-status").value;
        campo("fo-autor").value = f.autor || "";
        estado.generos = normalizarItens(f.generos, true);
        campo("fo-generos-entrada").value = f.entradaGeneros || "";
        campo("fo-sinopse").value = f.sinopse || "";
        campo("fo-inicio").value = f.inicio || "";
        campo("fo-fim").value = f.fim || "";
        campo("fo-favorito").checked = Boolean(f.favorito);
        campo("fo-texto").value = f.texto || "";
        estado.momentos = normalizarItens(f.momentos, false);
        campo("fo-momentos-entrada").value = f.entradaMomentos || "";
        estado.citacoes = normalizarItens(f.citacoes, false);
        campo("fo-citacoes-entrada").value = f.entradaCitacoes || "";
        estado.nota = rascunho.nota || null;
        estado.capa = rascunho.capa || "";
        estado.imagens = Array.isArray(rascunho.imagens) ? rascunho.imagens : [];
        estado.videos = normalizarVideos(Array.isArray(rascunho.videos) ? rascunho.videos : []);
        renderizarItens("fo-generos", "generos");
        renderizarItens("fo-momentos", "momentos");
        renderizarItens("fo-citacoes", "citacoes");
        desenharNota();
        desenharCapa();
        desenharImagens();
        desenharVideos();
        campo("fo-rascunho-status").textContent = "Rascunho recuperado automaticamente.";
    }


    function opcoes(lista, atual) {
        return lista.map(function (v) {
            return '<option value="' + esc(v[0]) + '"' + (v[0] === atual ? " selected" : "") + ">" +
                   esc(v[1]) + "</option>";
        }).join("");
    }

    function criarDialogo() {

        const tipos = [["", "Escolha..."]].concat(S.TIPOS.map(function (t) { return [t, t]; }));
        const status = Object.keys(S.STATUS).map(function (k) { return [k, S.STATUS[k]]; });

        dialogo = document.createElement("dialog");
        dialogo.className = "janela";
        dialogo.setAttribute("aria-labelledby", "fo-titulo");

        dialogo.innerHTML =
            '<button type="button" class="janela-fechar" id="fo-fechar" aria-label="Fechar">✕</button>' +
            '<form class="janela-corpo" id="fo-form" novalidate>' +

                '<h2 id="fo-titulo">Adicionar obra</h2>' +

                '<div class="erro-form" id="fo-erro" role="alert"></div>' +

                '<div class="campo"><label for="fo-titulo-obra">Título *</label>' +
                '<input type="text" id="fo-titulo-obra" maxlength="200" required></div>' +

                '<div class="campos-linha">' +
                    '<div class="campo"><label for="fo-tipo">Tipo *</label>' +
                    '<select id="fo-tipo">' + opcoes(tipos, "") + '</select></div>' +
                    '<div class="campo"><label for="fo-status">Status *</label>' +
                    '<select id="fo-status">' + opcoes(status, "em_andamento") + '</select></div>' +
                '</div>' +

                '<div class="campos-linha">' +
                    '<div class="campo"><label for="fo-autor">Autor / criador</label>' +
                    '<input type="text" id="fo-autor" maxlength="150"></div>' +
                    '<div class="campo"><span class="rotulo">Gêneros</span>' +
                    '<div class="itens-editor" id="fo-generos-editor">' +
                    '<div class="itens-tags" role="list" aria-label="Gêneros adicionados"></div>' +
                    '<input type="text" id="fo-generos-entrada" placeholder="Digite um gênero e pressione Enter" aria-label="Adicionar gênero"></div>' +
                    '<small>Pressione Enter para adicionar cada gênero.</small></div>' +
                '</div>' +

                '<div class="campo"><label for="fo-sinopse">Sinopse</label>' +
                '<textarea id="fo-sinopse" rows="3"></textarea></div>' +

                '<div class="campo"><span class="rotulo">Capa</span>' +
                    '<div class="foto-edicao" style="margin-bottom:0">' +
                        '<div class="foto-redonda" id="fo-capa-previa" style="border-radius:12px;width:70px;height:100px;display:none"></div>' +
                        '<div class="foto-botoes">' +
                            '<label class="botao-arquivo">📷 Escolher imagem' +
                            '<input type="file" id="fo-capa-arquivo" accept="image/*"></label>' +
                            '<button type="button" class="botao-texto perigo" id="fo-capa-remover" hidden>Remover capa</button>' +
                        '</div>' +
                    '</div>' +
                '</div>' +

                '<div class="campo"><span class="rotulo">Minha nota</span>' +
                    '<div class="estrelas-input" id="fo-nota" role="radiogroup" aria-label="Minha nota de 1 a 5"></div>' +
                '</div>' +

                '<div class="campos-linha">' +
                    '<div class="campo"><label for="fo-inicio">Comecei em</label>' +
                    '<input type="date" id="fo-inicio"></div>' +
                    '<div class="campo"><label for="fo-fim">Terminei em</label>' +
                    '<input type="date" id="fo-fim"></div>' +
                '</div>' +

                '<label class="campo-marcar"><input type="checkbox" id="fo-favorito"> 💖 É uma das minhas favoritas</label>' +

                '<div class="campo"><label for="fo-texto">O que achei</label>' +
                '<textarea id="fo-texto" rows="4" placeholder="Escreva livremente sobre essa história..."></textarea></div>' +

                '<div class="campo"><span class="rotulo">Melhores momentos</span>' +
                '<div class="itens-editor" id="fo-momentos-editor">' +
                '<div class="itens-tags" role="list" aria-label="Melhores momentos adicionados"></div>' +
                '<input type="text" id="fo-momentos-entrada" placeholder="Digite um momento e pressione Enter" aria-label="Adicionar melhor momento"></div>' +
                '<small>Pressione Enter para adicionar cada momento.</small></div>' +

                '<div class="campo"><span class="rotulo">Citações</span>' +
                '<div class="itens-editor" id="fo-citacoes-editor">' +
                '<div class="itens-tags" role="list" aria-label="Citações adicionadas"></div>' +
                '<input type="text" id="fo-citacoes-entrada" placeholder="Digite uma citação e pressione Enter" aria-label="Adicionar citação"></div>' +
                '<small>Pressione Enter para adicionar cada citação.</small></div>' +

                '<div class="campo"><span class="rotulo">Imagens</span>' +
                    '<label class="botao-arquivo">🖼️ Adicionar imagens' +
                    '<input type="file" id="fo-imagens" accept="image/*" multiple></label>' +
                    '<div class="previa-imagens" id="fo-previa"></div>' +
                '</div>' +

                '<div class="campo"><span class="rotulo">Vídeos</span>' +
                    '<label for="fo-video-youtube">Link do YouTube</label>' +
                    '<div class="campos-linha">' +
                        '<input type="url" id="fo-video-youtube" placeholder="https://www.youtube.com/watch?v=..." autocomplete="url">' +
                        '<button type="button" class="botao botao-suave" id="fo-video-adicionar">Adicionar vídeo</button>' +
                    '</div>' +
                    '<small>O Stellifer guarda apenas o identificador do vídeo; o conteúdo é reproduzido pelo YouTube.</small>' +
                    '<div class="previa-imagens" id="fo-videos-previa"></div>' +
                '</div>' +

                '<small id="fo-rascunho-status" role="status" aria-live="polite"></small>' +

                '<div class="janela-acoes">' +
                    '<button type="button" class="botao botao-suave" id="fo-cancelar">Cancelar</button>' +
                    '<button type="submit" class="botao" id="fo-salvar">Salvar</button>' +
                '</div>' +

            '</form>';

        document.body.appendChild(dialogo);
        S.prepararJanela(dialogo);
        dialogo.addEventListener("close", function () {
            if (estado && !estado.descartado && !estado.abrindo) {
                window.clearTimeout(temporizadorRascunho);
                salvarRascunho();
            }
        });
        dialogo.addEventListener("cancel", function (e) {
            e.preventDefault();
            dialogo.close();
        });

        // Estrelas de nota
        const caixa = dialogo.querySelector("#fo-nota");
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
            desenharNota();
            agendarSalvamentoRascunho();
        });

        dialogo.querySelector("#fo-fechar").addEventListener("click", function () { dialogo.close(); });
        dialogo.querySelector("#fo-cancelar").addEventListener("click", function () { dialogo.close(); });

        prepararEditorItens("fo-generos", "generos");
        prepararEditorItens("fo-momentos", "momentos");
        prepararEditorItens("fo-citacoes", "citacoes");

        // Capa
        dialogo.querySelector("#fo-capa-arquivo").addEventListener("change", async function (e) {
            const arquivo = e.target.files[0];
            if (!arquivo) { return; }
            capaEmProcessamento = true;
            atualizarControlesDeImagem();
            desenharCapa();
            try {
                estado.capa = await S.comprimirImagem(arquivo, 600, 0.82);
                agendarSalvamentoRascunho();
            } catch (erro) {
                mostrarErro(erro.message);
            } finally {
                capaEmProcessamento = false;
                atualizarControlesDeImagem();
                desenharCapa();
                e.target.value = "";
            }
        });

        dialogo.querySelector("#fo-capa-remover").addEventListener("click", function () {
            estado.capa = "";
            desenharCapa();
            agendarSalvamentoRascunho();
        });

        // Imagens da obra
        dialogo.querySelector("#fo-imagens").addEventListener("change", async function (e) {
            const arquivos = Array.from(e.target.files);
            if (arquivos.length === 0) { return; }

            imagensEmProcessamento = true;
            estado.imagensPendentes = arquivos.length;
            atualizarControlesDeImagem();
            desenharImagens();

            try {
                const erros = [];
                for (const arquivo of arquivos) {
                    try {
                        estado.imagens.push(await S.comprimirImagem(arquivo, 1000, 0.8));
                    } catch (erro) {
                        erros.push(erro.message);
                    } finally {
                        estado.imagensPendentes -= 1;
                        desenharImagens();
                    }
                }
                agendarSalvamentoRascunho();
                if (erros.length > 0) {
                    mostrarErro(erros.length === 1
                        ? erros[0]
                        : erros.length + " imagens não puderam ser carregadas. " + erros[0]);
                }
            } catch (erro) {
                mostrarErro(erro.message);
            } finally {
                imagensEmProcessamento = false;
                estado.imagensPendentes = 0;
                desenharImagens();
                atualizarControlesDeImagem();
                e.target.value = "";
            }
        });

        dialogo.querySelector("#fo-previa").addEventListener("click", function (e) {
            const b = e.target.closest("button[data-i]");
            if (!b) { return; }
            estado.imagens.splice(Number(b.dataset.i), 1);
            desenharImagens();
            agendarSalvamentoRascunho();
        });

        function adicionarVideoYoutube() {
            const entrada = campo("fo-video-youtube");
            const youtubeId = extrairIdYoutube(entrada.value);
            if (!youtubeId) {
                mostrarErro("Informe um link válido de vídeo do YouTube.");
                entrada.focus();
                return;
            }
            if (estado.videos.some(function (video) { return video.youtubeId === youtubeId; })) {
                mostrarErro("Esse vídeo já foi adicionado à obra.");
                entrada.focus();
                return;
            }
            estado.videos.push({ youtubeId: youtubeId });
            entrada.value = "";
            campo("fo-erro").classList.remove("visivel");
            desenharVideos();
            agendarSalvamentoRascunho();
        }

        dialogo.querySelector("#fo-video-adicionar").addEventListener("click", adicionarVideoYoutube);
        campo("fo-video-youtube").addEventListener("keydown", function (e) {
            if (e.key === "Enter") {
                e.preventDefault();
                adicionarVideoYoutube();
            }
        });

        dialogo.querySelector("#fo-videos-previa").addEventListener("click", function (e) {
            const botao = e.target.closest("button[data-video-i]");
            if (!botao) { return; }
            if (botao.hasAttribute("data-rotacionar")) {
                const video = estado.videos[Number(botao.dataset.videoI)];
                if (!video || !video.video) { return; }
                video.rotacao = (video.rotacao + 90) % 360;
                desenharVideos();
                agendarSalvamentoRascunho();
                return;
            }
            estado.videos.splice(Number(botao.dataset.videoI), 1);
            desenharVideos();
            agendarSalvamentoRascunho();
        });

        dialogo.querySelector("#fo-form").addEventListener("input", agendarSalvamentoRascunho);
        dialogo.querySelector("#fo-form").addEventListener("change", agendarSalvamentoRascunho);
        dialogo.querySelector("#fo-form").addEventListener("submit", salvar);
    }

    function campo(id) {
        return dialogo.querySelector("#" + id);
    }

    function atualizarControlesDeImagem() {
        const ocupado = imagensEmProcessamento || capaEmProcessamento;
        campo("fo-salvar").disabled = ocupado;
        campo("fo-imagens").disabled = ocupado;
        campo("fo-capa-arquivo").disabled = ocupado;
    }

    function mostrarErro(msg) {
        const e = campo("fo-erro");
        e.textContent = msg;
        e.classList.add("visivel");
        e.scrollIntoView({ block: "nearest" });
    }

    function desenharNota() {
        dialogo.querySelectorAll("#fo-nota button[data-valor]").forEach(function (b) {
            const ligada = estado.nota && Number(b.dataset.valor) <= estado.nota;
            b.classList.toggle("ligada", !!ligada);
            b.setAttribute("aria-checked", String(Number(b.dataset.valor) === estado.nota));
        });
    }

    function desenharCapa() {
        const previa = campo("fo-capa-previa");
        const remover = campo("fo-capa-remover");

        if (estado.capa) {
            previa.classList.remove("capa-processando");
            previa.style.display = "block";
            previa.innerHTML = '<img src="' + esc(estado.capa) + '" alt="Prévia da capa">';
            remover.hidden = false;
        } else if (capaEmProcessamento) {
            previa.classList.add("capa-processando");
            previa.style.display = "flex";
            previa.innerHTML = '<span class="indicador-carregamento" aria-hidden="true"></span>' +
                '<span role="status">Carregando</span>';
            remover.hidden = true;
        } else {
            previa.classList.remove("capa-processando");
            previa.style.display = "none";
            previa.innerHTML = "";
            remover.hidden = true;
        }
    }

    function desenharImagens() {
        const imagens = estado.imagens.map(function (src, i) {
            return '<div class="previa"><img src="' + esc(src) + '" alt="Imagem ' + (i + 1) + '">' +
                   '<button type="button" data-i="' + i + '" aria-label="Remover imagem ' + (i + 1) + '">✕</button></div>';
        }).join("");
        const carregando = Array.from({ length: estado.imagensPendentes || 0 }, function () {
            return '<div class="previa previa-carregando" role="status" aria-label="Processando imagem">' +
                '<span class="indicador-carregamento" aria-hidden="true"></span>' +
                '<span>Carregando</span></div>';
        }).join("");
        campo("fo-previa").innerHTML = imagens + carregando;
    }

    function desenharVideos() {
        campo("fo-videos-previa").innerHTML = estado.videos.map(function (video, i) {
            if (video.youtubeId) {
                return '<div class="previa previa-video-link"><span aria-hidden="true">▶</span>' +
                    '<span>Vídeo do YouTube · ' + esc(video.youtubeId) + '</span>' +
                    '<button type="button" data-video-i="' + i +
                    '" aria-label="Remover vídeo do YouTube ' + (i + 1) + '">✕</button></div>';
            }
            return '<div class="previa previa-video"><video src="' + esc(video.video) +
                '" style="transform:rotate(' + video.rotacao + 'deg)" muted preload="metadata" aria-label="Prévia do vídeo ' + (i + 1) + '"></video>' +
                '<button type="button" data-video-i="' + i + '" data-rotacionar aria-label="Girar vídeo ' + (i + 1) + ' 90 graus" title="Girar 90°">↻</button>' +
                '<button type="button" data-video-i="' + i +
                '" aria-label="Remover vídeo ' + (i + 1) + '">✕</button></div>';
        }).join("");
    }

    async function salvar(e) {
        e.preventDefault();

        campo("fo-erro").classList.remove("visivel");
        if (imagensEmProcessamento || capaEmProcessamento) {
            mostrarErro("Aguarde as mídias terminarem de carregar.");
            return;
        }

        const titulo = campo("fo-titulo-obra").value.trim();
        const tipo = campo("fo-tipo").value;
        const status = campo("fo-status").value;
        const inicio = campo("fo-inicio").value;
        const fim = campo("fo-fim").value;

        if (!titulo) { mostrarErro("Informe o título da obra."); campo("fo-titulo-obra").focus(); return; }
        if (!tipo) { mostrarErro("Escolha o tipo da obra."); campo("fo-tipo").focus(); return; }
        if (inicio && fim && fim < inicio) {
            mostrarErro("A data de término não pode ser antes da data de início.");
            return;
        }

        const dados = {
            status: status,
            nota: estado.nota,
            dataInicio: inicio || null,
            dataConclusao: fim || null,
            favorito: campo("fo-favorito").checked,
            texto: campo("fo-texto").value.trim(),
            melhoresMomentos: estado.momentos.join("\n"),
            citacoes: estado.citacoes.join("\n"),
            imagens: estado.imagens,
            videos: estado.videos,
            obra: {
                titulo: titulo,
                tipo: tipo,
                autor: campo("fo-autor").value.trim(),
                sinopse: campo("fo-sinopse").value.trim(),
                capa: estado.capa,
                generos: estado.generos.slice()
            }
        };

        const botao = campo("fo-salvar");
        botao.disabled = true;

        try {
            const resposta = await S.Store.salvarItem(dados, estado.id);
            window.clearTimeout(temporizadorRascunho);
            estado.descartado = true;
            try {
                await filaRascunho;
                await apagarRascunho(estado.chaveRascunho);
            } catch (erroRascunho) {
                console.error("Erro ao remover rascunho após salvar a obra:", erroRascunho);
                campo("fo-rascunho-status").textContent =
                    "A obra foi salva, mas não foi possível limpar o rascunho.";
            }
            S.aoSalvar(resposta);
            S.aviso(resposta.mensagem || "Salvo!");
            dialogo.close();
            if (estado.aoSalvar) { estado.aoSalvar(resposta); }
        } catch (erro) {
            mostrarErro(erro.message || "Não foi possível salvar.");
        } finally {
            botao.disabled = false;
        }
    }

    async function abrir(opcoesAbrir) {

        if (!dialogo) { criarDialogo(); }

        const item = opcoesAbrir.item || null;
        const obra = item ? item.obra : {};

        estado = {
            id: item ? item.id : null,
            nota: item ? item.nota : null,
            imagens: item ? item.imagens.slice() : [],
            videos: item && Array.isArray(item.videos) ? normalizarVideos(item.videos) : [],
            imagensPendentes: 0,
            capa: obra.capa || "",
            aoSalvar: opcoesAbrir.aoSalvar,
            chaveRascunho: chaveDoRascunho(item ? item.id : null),
            descartado: false,
            abrindo: true
        };

        campo("fo-titulo").textContent = item ? "Editar obra" : "Adicionar obra";
        campo("fo-erro").classList.remove("visivel");
        campo("fo-rascunho-status").textContent = "Procurando um rascunho salvo...";

        estado.generos = normalizarItens(obra.generos || [], false);
        estado.momentos = normalizarItens(item ? item.melhoresMomentos : "", false);
        estado.citacoes = normalizarItens(item ? item.citacoes : "", false);
        campo("fo-titulo-obra").value = obra.titulo || "";
        campo("fo-tipo").value = obra.tipo || "";
        campo("fo-status").value = item ? item.status : (opcoesAbrir.status || "em_andamento");
        campo("fo-autor").value = obra.autor || "";
        campo("fo-sinopse").value = obra.sinopse || "";
        campo("fo-inicio").value = item && item.dataInicio ? item.dataInicio : "";
        campo("fo-fim").value = item && item.dataConclusao ? item.dataConclusao : "";
        campo("fo-favorito").checked = item ? item.favorito : false;
        campo("fo-texto").value = item ? item.texto : "";
        campo("fo-generos-entrada").value = "";
        campo("fo-momentos-entrada").value = "";
        campo("fo-citacoes-entrada").value = "";
        renderizarItens("fo-generos", "generos");
        renderizarItens("fo-momentos", "momentos");
        renderizarItens("fo-citacoes", "citacoes");

        const formulario = campo("fo-form");
        formulario.querySelectorAll("input, select, textarea, button").forEach(function (controle) {
            controle.disabled = true;
        });

        desenharNota();
        desenharCapa();
        desenharImagens();
        desenharVideos();

        dialogo.scrollTop = 0;
        formulario.scrollTop = 0;
        dialogo.showModal();

        try {
            const rascunho = await lerRascunho(estado.chaveRascunho);
            if (!dialogo.open) { return; }
            if (rascunho) {
                restaurarRascunho(rascunho);
            } else {
                campo("fo-rascunho-status").textContent = "";
            }
        } catch (erro) {
            console.error("Erro ao recuperar rascunho:", erro);
            if (dialogo.open) {
                campo("fo-rascunho-status").textContent =
                    "Rascunhos indisponíveis: " + erro.message;
                S.aviso("Não foi possível acessar seus rascunhos neste navegador.", "erro");
            }
        } finally {
            if (dialogo.open) {
                estado.abrindo = false;
                formulario.querySelectorAll("input, select, textarea, button").forEach(function (controle) {
                    controle.disabled = false;
                });
                campo("fo-salvar").disabled = imagensEmProcessamento || capaEmProcessamento;
                campo("fo-titulo-obra").focus();
            }
        }
    }

    window.FormObra = { abrir: abrir };

})();
