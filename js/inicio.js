// =====================================================
// RESUMO PERSONALIZADO DA PÁGINA INICIAL
// =====================================================

(function () {

    "use strict";

    let usuario;
    try {
        usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
    } catch (erro) {
        usuario = null;
    }

    if (!usuario || !usuario.id_usuario) { return; }

    const API = "http://localhost:3000";
    const listaObras = document.querySelector(".works-grid");
    const listaAnotacoes = document.querySelector(".notes-grid");
    const listaConquistas = document.querySelector(".conquistas-lista");
    let itens = [];
    let anotacoes = [];
    let videosInicio = [];

    function estadoVazio(conteiner, titulo, texto, classe) {
        conteiner.replaceChildren();
        const mensagem = document.createElement("div");
        mensagem.className = "resumo-vazio" + (classe ? " " + classe : "");
        const cabecalho = document.createElement("strong");
        cabecalho.textContent = titulo;
        const descricao = document.createElement("span");
        descricao.textContent = texto;
        mensagem.append(cabecalho, descricao);
        conteiner.appendChild(mensagem);
    }

    async function obterJson(caminho) {
        const resposta = await fetch(API + caminho);
        let dados = {};
        try {
            dados = await resposta.json();
        } catch (erro) {
            throw new Error("O servidor retornou uma resposta inválida.");
        }
        if (!resposta.ok) {
            throw new Error(dados.mensagem || "Não foi possível carregar os dados.");
        }
        return dados;
    }

    function formatarData(data) {
        if (!data) { return "Data não informada"; }
        const partes = String(data).slice(0, 10).split("-");
        if (partes.length !== 3) { return "Data não informada"; }
        const dataLocal = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
        return new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long" }).format(dataLocal);
    }

    function renderizarObras(lista) {
        listaObras.replaceChildren();
        const emAndamento = lista.filter(function (item) {
            return item.status === "em_andamento";
        }).slice(0, 3);

        if (emAndamento.length === 0) {
            estadoVazio(listaObras, "Nada em andamento", "As obras que você estiver vivendo aparecerão aqui.", "obra-vazia");
            return;
        }

        emAndamento.forEach(function (item) {
            const cartao = document.createElement("article");
            cartao.className = "work-card";
            const link = document.createElement("a");
            link.href = "obra.html?id=" + encodeURIComponent(item.id);

            if (item.obra.capa) {
                const imagem = document.createElement("img");
                imagem.src = item.obra.capa;
                imagem.alt = "Capa de " + item.obra.titulo;
                link.appendChild(imagem);
            } else {
                const capaVazia = document.createElement("div");
                capaVazia.className = "work-cover-placeholder";
                capaVazia.setAttribute("aria-hidden", "true");
                capaVazia.textContent = "✦";
                link.appendChild(capaVazia);
            }

            const info = document.createElement("div");
            info.className = "work-info";
            const titulo = document.createElement("h3");
            titulo.textContent = item.obra.titulo;
            const tipo = document.createElement("p");
            tipo.textContent = item.obra.tipo || "Obra";
            const avaliacao = document.createElement("span");
            const nota = Number(item.nota);
            avaliacao.textContent = Number.isInteger(nota) && nota >= 1 && nota <= 5
                ? "⭐".repeat(nota)
                : "Sem avaliação";
            info.append(titulo, tipo, avaliacao);
            link.appendChild(info);
            cartao.appendChild(link);
            listaObras.appendChild(cartao);
        });
    }

    function renderizarAnotacoes(lista) {
        listaAnotacoes.replaceChildren();
        if (lista.length === 0) {
            estadoVazio(listaAnotacoes, "Nenhuma anotação ainda", "Seus registros recentes aparecerão aqui.", "anotacao-vazia");
            return;
        }

        lista.slice(0, 3).forEach(function (anotacao) {
            const cartao = document.createElement("article");
            cartao.className = "note-card";
            const data = document.createElement("span");
            data.className = "note-date";
            data.textContent = formatarData(anotacao.data);
            const titulo = document.createElement("h3");
            titulo.textContent = anotacao.titulo || anotacao.obraTitulo || "Anotação";
            const texto = document.createElement("p");
            texto.textContent = anotacao.texto || "Sem texto adicional.";
            const link = document.createElement("a");
            link.href = "anotacoes.html#anotacao-" + encodeURIComponent(anotacao.id);
            link.textContent = "Ler anotação →";
            cartao.append(data, titulo, texto, link);
            listaAnotacoes.appendChild(cartao);
        });
    }

    function renderizarConquistas(lista) {
        listaConquistas.replaceChildren();
        const alcancadas = lista.filter(function (conquista) {
            return conquista.desbloqueada;
        }).slice(0, 3);

        if (alcancadas.length === 0) {
            estadoVazio(listaConquistas, "Nenhuma conquista alcançada ainda", "Continue registrando suas histórias para desbloquear estrelas.", "conquista-vazia");
            return;
        }

        alcancadas.forEach(function (conquista) {
            const cartao = document.createElement("div");
            cartao.className = "conquista";
            const icone = document.createElement("div");
            icone.className = "conquista-icone";
            icone.textContent = conquista.icone;
            const info = document.createElement("div");
            info.className = "conquista-info";
            const nome = document.createElement("strong");
            nome.textContent = conquista.nome;
            const descricao = document.createElement("span");
            descricao.textContent = conquista.descricao;
            info.append(nome, descricao);
            cartao.append(icone, info);
            listaConquistas.appendChild(cartao);
        });
    }

    function atualizarCarrossel() {
        if (typeof window.atualizarCarrosselInicio !== "function") { return; }

        const imagens = [];
        const videos = videosInicio.slice();
        const citacoesInicio = [];
        const usadas = new Set();
        const gruposPorObra = new Map();
        const grupos = [];

        function extrairCitacoes(valor) {
            if (Array.isArray(valor)) {
                return valor.map(function (citacao) {
                    return String(citacao).trim();
                }).filter(Boolean);
            }
            if (typeof valor !== "string") { return []; }
            return valor.split(/\r?\n/).map(function (citacao) {
                return citacao.trim();
            }).filter(Boolean);
        }

        function grupoDaObra(itemId, titulo, citacoes) {
            const chave = String(itemId);
            if (!gruposPorObra.has(chave)) {
                const grupo = { titulo: titulo, citacoes: citacoes, imagens: [] };
                gruposPorObra.set(chave, grupo);
                grupos.push(grupo);
            }
            return gruposPorObra.get(chave);
        }

        function adicionarImagem(grupo, src, alt) {
            if (typeof src !== "string" || !src.trim() || usadas.has(src)) { return; }
            usadas.add(src);
            const indice = grupo.imagens.length;
            grupo.imagens.push({
                imagem: src,
                alt: alt,
                citacao: grupo.citacoes.length ? grupo.citacoes[indice % grupo.citacoes.length] : "",
                obra: grupo.titulo
            });
        }

        itens.forEach(function (item) {
            const titulo = item.obra && item.obra.titulo ? item.obra.titulo : "obra do diário";
            const citacoes = extrairCitacoes(item.citacoes);
            const grupo = grupoDaObra(item.id, titulo, citacoes);
            citacoes.forEach(function (citacao) {
                citacoesInicio.push({ citacao: citacao, obra: titulo });
            });
            if (item.obra) {
                adicionarImagem(grupo, item.obra.capa, "Capa de " + titulo);
            }
            (Array.isArray(item.imagens) ? item.imagens : []).forEach(function (src, index) {
                adicionarImagem(grupo, src, "Imagem " + (index + 1) + " de " + titulo);
            });
        });

        anotacoes.forEach(function (anotacao) {
            const titulo = anotacao.obraTitulo || "anotação";
            const item = itens.find(function (obra) { return String(obra.id) === String(anotacao.itemId); });
            const citacoes = item ? extrairCitacoes(item.citacoes) : [];
            const grupo = grupoDaObra(anotacao.itemId, titulo, citacoes);
            (Array.isArray(anotacao.imagens) ? anotacao.imagens : []).forEach(function (src, index) {
                adicionarImagem(grupo, src, "Imagem " + (index + 1) + " da anotação de " + titulo);
            });
        });

        let restantes = true;
        let indice = 0;
        while (restantes) {
            restantes = false;
            grupos.forEach(function (grupo) {
                if (indice < grupo.imagens.length) {
                    imagens.push(grupo.imagens[indice]);
                    restantes = true;
                }
            });
            indice += 1;
        }

        window.atualizarCarrosselInicio(imagens, citacoesInicio, videos);
    }

    estadoVazio(listaObras, "Carregando seu diário...", "", "obra-vazia");
    estadoVazio(listaAnotacoes, "Carregando anotações...", "", "anotacao-vazia");
    estadoVazio(listaConquistas, "Carregando conquistas...", "", "conquista-vazia");

    const caminho = "/diario/" + encodeURIComponent(usuario.id_usuario);

    obterJson(caminho + "/itens").then(function (dados) {
        if (!Array.isArray(dados)) {
            throw new Error("O servidor retornou uma lista de obras inválida.");
        }
        itens = dados;
        atualizarCarrossel();
        window.atualizarResumoInicio(itens, anotacoes);
        renderizarObras(itens);
    }).catch(function (erro) {
        estadoVazio(listaObras, "Não foi possível carregar o diário", erro.message, "obra-vazia");
    });

    function carregarVideosInicio() {
        obterJson(caminho + "/videos").then(function (dados) {
            if (!Array.isArray(dados)) {
                throw new Error("O servidor retornou uma lista de vídeos inválida.");
            }
            videosInicio = dados;
            atualizarCarrossel();
        }).catch(function (erro) {
            console.error("Não foi possível carregar os vídeos do carrossel:", erro);
        });
    }

    carregarVideosInicio();
    window.addEventListener("pageshow", function (evento) {
        if (evento.persisted) { carregarVideosInicio(); }
    });

    obterJson(caminho + "/anotacoes").then(function (dados) {
        if (!Array.isArray(dados)) {
            throw new Error("O servidor retornou uma lista de anotações inválida.");
        }
        anotacoes = dados;
        atualizarCarrossel();
        window.atualizarResumoInicio(itens, anotacoes);
        renderizarAnotacoes(anotacoes);
    }).catch(function (erro) {
        estadoVazio(listaAnotacoes, "Não foi possível carregar as anotações", erro.message, "anotacao-vazia");
    });

    obterJson("/conquistas/" + encodeURIComponent(usuario.id_usuario)).then(function (dados) {
        if (!Array.isArray(dados.conquistas)) {
            throw new Error("O servidor retornou uma lista de conquistas inválida.");
        }
        renderizarConquistas(dados.conquistas);
        usuario.xp = dados.xp;
        localStorage.setItem("usuarioLogado", JSON.stringify(usuario));
        const nivel = document.getElementById("perfil-nivel");
        if (nivel && window.StelliferDef) {
            nivel.textContent = "✦ Nível " + window.StelliferDef.infoNivel(dados.xp).nivel;
        }
    }).catch(function (erro) {
        estadoVazio(listaConquistas, "Não foi possível carregar as conquistas", erro.message, "conquista-vazia");
    });

})();
