// =====================================================
// STELLIFER — FUNÇÕES COMPARTILHADAS DAS PÁGINAS
// (perfil, meu diário, obra, conquistas)
// =====================================================
//
// 1. Ajudantes (datas, estrelas, textos, imagens, avisos)
// 2. Comunicação com o servidor (Store)
// 3. Modo de demonstração (quando o servidor está desligado)
//
// Se o servidor Node não estiver rodando, as páginas continuam
// funcionando com dados de exemplo guardados só neste navegador,
// e um aviso aparece no topo. Assim dá para ver e testar o visual
// sem o banco de dados.

(function () {

    "use strict";

    const API = "http://localhost:3000";
    const Def = window.StelliferDef;

    const STATUS = {
        concluida:    "Concluída",
        em_andamento: "Em andamento",
        abandonada:   "Abandonada",
        quero:        "Quero ler/assistir"
    };

    const TIPOS = ["Filme", "Livro", "Anime", "Mangá", "Série", "Dorama"];

    const ICONE_TIPO = {
        "Filme": "🎬", "Livro": "📖", "Anime": "🌸",
        "Mangá": "📚", "Série": "📺", "Dorama": "🌙"
    };


    // =================================================
    // 1. AJUDANTES
    // =================================================

    function esc(texto) {
        return String(texto === undefined || texto === null ? "" : texto)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho",
                   "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

    // "2026-10-04" → "4 de outubro de 2026"
    function dataBonita(iso, curta) {
        if (!iso) { return ""; }
        const p = String(iso).slice(0, 10).split("-");
        if (p.length !== 3) { return ""; }
        const mes = MESES[Number(p[1]) - 1];
        return curta
            ? Number(p[2]) + " de " + mes
            : Number(p[2]) + " de " + mes + " de " + p[0];
    }

    function hoje() {
        const d = new Date();
        return d.getFullYear() + "-" +
               String(d.getMonth() + 1).padStart(2, "0") + "-" +
               String(d.getDate()).padStart(2, "0");
    }

    // Estrelas para mostrar (somente leitura)
    function estrelas(nota) {
        if (!nota) {
            return '<span class="sem-nota">sem nota</span>';
        }
        let html = '<span class="estrelas" role="img" aria-label="' + nota + ' de 5 estrelas">';
        for (let i = 1; i <= 5; i++) {
            html += '<span class="' + (i <= nota ? "cheia" : "vazia") + '">★</span>';
        }
        return html + "</span>";
    }

    function capaHTML(obra, classe) {
        if (obra.capa) {
            return '<img class="' + (classe || "") + '" src="' + esc(obra.capa) +
                   '" alt="Capa de ' + esc(obra.titulo) + '" loading="lazy">';
        }
        return '<div class="capa-vazia ' + (classe || "") + '" aria-hidden="true">' +
               '<span>' + (ICONE_TIPO[obra.tipo] || "✦") + '</span></div>';
    }

    // Lê uma imagem escolhida pelo usuário e devolve um texto (data URL)
    // já reduzido, para não pesar no banco de dados.
    function comprimirImagem(arquivo, ladoMaximo, qualidade) {
        ladoMaximo = ladoMaximo || 900;
        qualidade = qualidade || 0.82;

        return new Promise(function (resolve, reject) {

            if (!arquivo || !/^image\//.test(arquivo.type)) {
                reject(new Error("Escolha um arquivo de imagem."));
                return;
            }

            function renderizarImagem(img, largura, altura, liberar) {
                const escala = Math.min(1, ladoMaximo / Math.max(largura, altura));
                const canvas = document.createElement("canvas");
                canvas.width = Math.max(1, Math.round(largura * escala));
                canvas.height = Math.max(1, Math.round(altura * escala));

                const contexto = canvas.getContext("2d");
                if (!contexto) {
                    if (liberar) { liberar(); }
                    reject(new Error("Não foi possível preparar a imagem."));
                    return;
                }

                contexto.fillStyle = "#ffffff";
                contexto.fillRect(0, 0, canvas.width, canvas.height);
                contexto.drawImage(img, 0, 0, canvas.width, canvas.height);
                if (liberar) { liberar(); }

                canvas.toBlob(function (blob) {
                    if (!blob) {
                        reject(new Error("Não foi possível reduzir a imagem."));
                        return;
                    }

                    const leitor = new FileReader();
                    leitor.onerror = function () {
                        reject(new Error("Não foi possível concluir a leitura da imagem."));
                    };
                    leitor.onload = function () { resolve(leitor.result); };
                    leitor.readAsDataURL(blob);
                }, "image/jpeg", qualidade);
            }

            function carregarImagemTradicional() {
                const leitor = new FileReader();
                leitor.onerror = function () {
                    reject(new Error("Não foi possível ler a imagem."));
                };
                leitor.onload = function () {
                    const img = new Image();
                    img.onerror = rejeitarImagemInvalida;
                    img.onload = function () {
                        try {
                            renderizarImagem(img, img.naturalWidth, img.naturalHeight);
                        } catch (erro) {
                            reject(erro);
                        }
                    };
                    img.src = leitor.result;
                };
                leitor.readAsDataURL(arquivo);
            }

            if (typeof window.createImageBitmap === "function") {
                window.createImageBitmap(arquivo).then(function (bitmap) {
                    renderizarImagem(bitmap, bitmap.width, bitmap.height, function () {
                        bitmap.close();
                    });
                }).catch(function () {
                    carregarImagemTradicional();
                });
                return;
            }

            carregarImagemTradicional();

            function rejeitarImagemInvalida() {
                reject(new Error("A imagem é inválida ou não pôde ser decodificada."));
            }
        });
    }

    // Aviso flutuante
    function aviso(mensagem, tipo) {
        let area = document.getElementById("avisos");

        if (!area) {
            area = document.createElement("div");
            area.id = "avisos";
            area.setAttribute("role", "status");
            area.setAttribute("aria-live", "polite");
            document.body.appendChild(area);
        }

        const el = document.createElement("div");
        el.className = "aviso" + (tipo ? " aviso-" + tipo : "");
        el.textContent = mensagem;
        area.appendChild(el);

        requestAnimationFrame(function () { el.classList.add("aviso-visivel"); });

        setTimeout(function () {
            el.classList.remove("aviso-visivel");
            setTimeout(function () { el.remove(); }, 400);
        }, 4200);
    }

    // Mostra avisos de conquistas e atualiza o XP guardado
    function aoSalvar(resposta) {
        if (!resposta) { return; }

        (resposta.novasConquistas || []).forEach(function (nome) {
            aviso("🏆 Conquista desbloqueada: " + nome, "conquista");
        });

        if (typeof resposta.xp === "number") {
            const u = usuario();
            if (u) {
                u.xp = resposta.xp;
                localStorage.setItem("usuarioLogado", JSON.stringify(u));
            }
        }
    }

    // Janela de confirmação
    function confirmar(titulo, texto, textoBotao) {
        return new Promise(function (resolve) {

            const d = document.createElement("dialog");
            d.className = "janela janela-pequena";

            d.innerHTML =
                '<div class="janela-corpo">' +
                '<h2>' + esc(titulo) + '</h2>' +
                '<p class="janela-texto">' + esc(texto) + '</p>' +
                '<div class="janela-acoes">' +
                '<button type="button" class="botao botao-suave" data-r="0">Cancelar</button>' +
                '<button type="button" class="botao botao-perigo" data-r="1">' +
                esc(textoBotao || "Confirmar") + '</button>' +
                '</div></div>';

            document.body.appendChild(d);

            function fechar(valor) {
                d.close();
                d.remove();
                resolve(valor);
            }

            d.addEventListener("click", function (e) {
                const b = e.target.closest("[data-r]");
                if (b) { fechar(b.dataset.r === "1"); }
                else if (e.target === d) { fechar(false); }
            });

            d.addEventListener("cancel", function (e) {
                e.preventDefault();
                fechar(false);
            });

            d.showModal();
        });
    }

    // Abre / fecha uma <dialog> com clique no fundo
    function prepararJanela(dialogo) {
        dialogo.addEventListener("click", function (e) {
            if (e.target === dialogo) { dialogo.close(); }
        });
    }


    // =================================================
    // USUÁRIO
    // =================================================

    function usuario() {
        try {
            return JSON.parse(localStorage.getItem("usuarioLogado"));
        } catch (e) {
            return null;
        }
    }

    // Se não houver login, manda para a página de login
    function exigirLogin() {
        const u = usuario();
        if (!u) {
            window.location.replace("login.html");
            return null;
        }
        return u;
    }

    function sair() {
        localStorage.removeItem("usuarioLogado");
        window.location.href = "login.html";
    }

    function fotoDoUsuario(u) {
        return (u && u.foto_perfil) ? u.foto_perfil : "imagens/perfil-placeholder.png";
    }


    // =================================================
    // 2. COMUNICAÇÃO COM O SERVIDOR
    // =================================================

    let modoDemo = false;

    class ErroServidor extends Error {}

    async function chamar(metodo, caminho, corpo) {

        let resposta;

        try {
            resposta = await fetch(API + caminho, {
                method: metodo,
                headers: { "Content-Type": "application/json" },
                body: corpo === undefined ? undefined : JSON.stringify(corpo)
            });
        } catch (e) {
            const falha = new Error("sem-servidor");
            falha.semServidor = true;
            throw falha;
        }

        let dados = {};
        try { dados = await resposta.json(); } catch (e) { /* sem corpo */ }

        if (!resposta.ok) {
            throw new ErroServidor(dados.mensagem || "Algo deu errado.");
        }

        return dados;
    }

    // Tenta o servidor; se ele estiver desligado, usa a demonstração.
    async function tentar(remoto, demo) {

        if (!modoDemo) {
            try {
                return await remoto();
            } catch (e) {
                if (!e.semServidor) { throw e; }
                modoDemo = true;
                mostrarFaixaDemo();
            }
        }

        return demo();
    }

    function mostrarFaixaDemo() {

        if (document.getElementById("faixa-demo")) { return; }

        const faixa = document.createElement("div");
        faixa.id = "faixa-demo";
        faixa.setAttribute("role", "note");
        faixa.innerHTML =
            "✦ O servidor não respondeu. Você está vendo uma <strong>demonstração</strong> " +
            "— o que você fizer aqui fica salvo só neste navegador.";

        const cabecalho = document.querySelector("header");
        if (cabecalho) { cabecalho.insertAdjacentElement("afterend", faixa); }
    }

    const Store = {

        perfil: function () {
            const u = usuario();
            return tentar(
                function () { return chamar("GET", "/perfil/" + u.id_usuario); },
                function () { return Demo.perfil(); }
            );
        },

        atualizarPerfil: function (dados) {
            const u = usuario();
            return tentar(
                function () { return chamar("PUT", "/perfil/" + u.id_usuario, dados); },
                function () { return Demo.atualizarPerfil(dados); }
            );
        },

        itens: function () {
            const u = usuario();
            return tentar(
                function () { return chamar("GET", "/diario/" + u.id_usuario + "/itens"); },
                function () { return Demo.itens(); }
            );
        },

        item: function (id) {
            const u = usuario();
            return tentar(
                function () { return chamar("GET", "/diario/" + u.id_usuario + "/itens/" + id); },
                function () { return Demo.item(id); }
            );
        },

        salvarItem: function (dados, id) {
            const u = usuario();
            return tentar(
                function () {
                    return id
                        ? chamar("PUT", "/diario/" + u.id_usuario + "/itens/" + id, dados)
                        : chamar("POST", "/diario/" + u.id_usuario + "/itens", dados);
                },
                function () { return Demo.salvarItem(dados, id); }
            );
        },

        favorito: function (id, valor) {
            const u = usuario();
            return tentar(
                function () {
                    return chamar("PATCH", "/diario/" + u.id_usuario + "/itens/" + id + "/favorito",
                                  { favorito: valor });
                },
                function () { return Demo.favorito(id, valor); }
            );
        },

        excluirItem: function (id) {
            const u = usuario();
            return tentar(
                function () { return chamar("DELETE", "/diario/" + u.id_usuario + "/itens/" + id); },
                function () { return Demo.excluirItem(id); }
            );
        },

        anotacoes: function () {
            const u = usuario();
            return tentar(
                function () { return chamar("GET", "/diario/" + u.id_usuario + "/anotacoes"); },
                function () { return Demo.anotacoes(); }
            );
        },

        salvarAnotacao: function (idItem, dados, idAnotacao) {
            const u = usuario();
            return tentar(
                function () {
                    return idAnotacao
                        ? chamar("PUT", "/diario/" + u.id_usuario + "/anotacoes/" + idAnotacao, dados)
                        : chamar("POST", "/diario/" + u.id_usuario + "/itens/" + idItem + "/anotacoes", dados);
                },
                function () { return Demo.salvarAnotacao(idItem, dados, idAnotacao); }
            );
        },

        excluirAnotacao: function (id) {
            const u = usuario();
            return tentar(
                function () { return chamar("DELETE", "/diario/" + u.id_usuario + "/anotacoes/" + id); },
                function () { return Demo.excluirAnotacao(id); }
            );
        },

        conquistas: function () {
            const u = usuario();
            return tentar(
                function () { return chamar("GET", "/conquistas/" + u.id_usuario); },
                function () { return Demo.conquistas(); }
            );
        }
    };


    // =================================================
    // 3. MODO DE DEMONSTRAÇÃO (guardado no navegador)
    // =================================================

    const Demo = (function () {

        function chave() {
            const u = usuario();
            return "stellifer-demo-" + (u ? u.id_usuario : "visitante");
        }

        function ler() {
            let d = null;
            try { d = JSON.parse(localStorage.getItem(chave())); } catch (e) { d = null; }

            if (!d) {
                d = semear();
                gravar(d);
            }
            return d;
        }

        function gravar(d) {
            try {
                localStorage.setItem(chave(), JSON.stringify(d));
            } catch (e) {
                aviso("Sem espaço no navegador para guardar mais imagens.", "erro");
                throw new ErroServidor("Sem espaço no navegador para guardar a demonstração.");
            }
        }

        // Dados de exemplo para a primeira visita
        function semear() {

            const d = hoje();
            const ontem = deslocar(d, -1);
            const anteontem = deslocar(d, -2);

            return {
                proximoItem: 4,
                proximaAnotacao: 4,
                conquistas: [],
                itens: [
                    {
                        id: 1, status: "em_andamento", nota: 5, dataInicio: anteontem, dataConclusao: null,
                        texto: "Uma história calma e cheia de saudade. Cada episódio parece uma carta para o passado.",
                        melhoresMomentos: "O reencontro na vila\nA conversa sob as estrelas",
                        citacoes: "As coisas que parecem pequenas podem guardar o maior significado.",
                        favorito: true, imagens: [],
                        obra: { id: 1, titulo: "Uma jornada de exemplo", autor: "Autora de exemplo", tipo: "Anime",
                                capa: "imagens/obra1.jpg", sinopse: "Esta é uma obra de exemplo para você ver como o diário fica.",
                                generos: ["Fantasia", "Aventura"] }
                    },
                    {
                        id: 2, status: "concluida", nota: 4, dataInicio: deslocar(d, -20), dataConclusao: ontem,
                        texto: "Terminei de ler numa noite de chuva.", melhoresMomentos: "", citacoes: "",
                        favorito: false, imagens: [],
                        obra: { id: 2, titulo: "Livro de exemplo", autor: "Autor de exemplo", tipo: "Livro",
                                capa: "imagens/obra2.jpg", sinopse: "", generos: ["Aventura"] }
                    },
                    {
                        id: 3, status: "quero", nota: null, dataInicio: null, dataConclusao: null,
                        texto: "", melhoresMomentos: "", citacoes: "", favorito: false, imagens: [],
                        obra: { id: 3, titulo: "Série para assistir", autor: "", tipo: "Série",
                                capa: "imagens/obra3.jpg", sinopse: "", generos: [] }
                    }
                ],
                anotacoes: [
                    { id: 1, itemId: 1, episodio: "Episódio 1", nota: 4, titulo: "O começo",
                      data: anteontem, imagens: [], texto: "A abertura já me deixou com o coração apertado." },
                    { id: 2, itemId: 1, episodio: "Episódio 7", nota: 5, titulo: "Esse foi especial",
                      data: ontem, imagens: [], texto: "Sem dúvida o melhor até agora. Chorei no final." },
                    { id: 3, itemId: 2, episodio: "Capítulo 12", nota: 4, titulo: "A virada",
                      data: ontem, imagens: [], texto: "Não esperava aquele final de capítulo!" }
                ]
            };
        }

        function deslocar(iso, dias) {
            const p = iso.split("-");
            const dt = new Date(+p[0], +p[1] - 1, +p[2] + dias);
            return dt.getFullYear() + "-" + String(dt.getMonth() + 1).padStart(2, "0") +
                   "-" + String(dt.getDate()).padStart(2, "0");
        }

        function copia(x) { return JSON.parse(JSON.stringify(x)); }

        function estatisticas(d) {
            const validos = d.itens.filter(function (i) { return i.status !== "quero"; });
            const tipos = new Set(validos.map(function (i) { return i.obra.tipo; }));

            const datas = [];
            d.anotacoes.forEach(function (a) { datas.push(a.data); });
            validos.forEach(function (i) { datas.push(i.dataInicio, i.dataConclusao); });

            return {
                obras: validos.length,
                concluidas: validos.filter(function (i) { return i.status === "concluida"; }).length,
                avaliadas: validos.filter(function (i) { return i.nota; }).length,
                favoritos: validos.filter(function (i) { return i.favorito; }).length,
                tipos: tipos.size,
                anotacoes: d.anotacoes.length,
                sequencia: Def.maiorSequencia(datas)
            };
        }

        // Mesmo cálculo do servidor
        function progresso(d) {
            const stats = estatisticas(d);
            const novas = [];
            let mudou = true;

            while (mudou) {
                mudou = false;

                let bonus = 0;
                Def.CONQUISTAS.forEach(function (c) {
                    if (d.conquistas.indexOf(c.nome) !== -1) { bonus += c.xp; }
                });
                stats.xp = Def.xpDasAcoes(stats) + bonus;

                Def.CONQUISTAS.forEach(function (c) {
                    if (d.conquistas.indexOf(c.nome) === -1 && c.regra(stats)) {
                        d.conquistas.push(c.nome);
                        novas.push(c.nome);
                        mudou = true;
                    }
                });
            }

            const u = usuario();
            if (u) {
                u.xp = stats.xp;
                localStorage.setItem("usuarioLogado", JSON.stringify(u));
            }

            return { xp: stats.xp, novas: novas, stats: stats };
        }

        function resposta(msg, p, extra) {
            return Object.assign({ mensagem: msg, novasConquistas: p.novas, xp: p.xp }, extra || {});
        }

        function validarItem(dados) {
            const o = dados.obra || {};
            if (!o.titulo || !String(o.titulo).trim()) { throw new ErroServidor("Informe o título da obra."); }
            if (TIPOS.indexOf(o.tipo) === -1) { throw new ErroServidor("Escolha o tipo da obra."); }
            if (!STATUS[dados.status]) { throw new ErroServidor("Escolha o status da obra."); }
        }

        return {

            perfil: function () {
                const d = ler();
                const p = progresso(d);
                gravar(d);

                const u = usuario();
                return Promise.resolve({
                    usuario: u,
                    estatisticas: p.stats,
                    conquistasDesbloqueadas: d.conquistas.length,
                    conquistasTotal: Def.CONQUISTAS.length
                });
            },

            atualizarPerfil: function (dados) {
                if (!dados.nome || !dados.nome_usuario || !dados.email) {
                    return Promise.reject(new ErroServidor("Preencha nome, usuário e e-mail."));
                }
                if (dados.nova_senha) {
                    return Promise.reject(new ErroServidor(
                        "A troca de senha só funciona com o servidor ligado."));
                }

                const u = usuario();
                u.nome = dados.nome;
                u.nome_usuario = dados.nome_usuario;
                u.email = dados.email;
                if (dados.foto_perfil !== undefined) { u.foto_perfil = dados.foto_perfil || null; }

                try {
                    localStorage.setItem("usuarioLogado", JSON.stringify(u));
                } catch (e) {
                    return Promise.reject(new ErroServidor("Sem espaço no navegador para essa foto."));
                }

                return Promise.resolve({ mensagem: "Perfil atualizado!", usuario: u });
            },

            itens: function () {
                const d = ler();
                const lista = copia(d.itens).map(function (i) {
                    i.totalAnotacoes = d.anotacoes.filter(function (a) { return a.itemId === i.id; }).length;
                    return i;
                });
                return Promise.resolve(lista.sort(function (a, b) { return b.id - a.id; }));
            },

            item: function (id) {
                const d = ler();
                const item = d.itens.filter(function (i) { return i.id === Number(id); })[0];
                if (!item) { return Promise.reject(new ErroServidor("Obra não encontrada no seu diário.")); }

                const anot = d.anotacoes
                    .filter(function (a) { return a.itemId === item.id; })
                    .sort(function (a, b) {
                        return (b.data || "").localeCompare(a.data || "") || b.id - a.id;
                    });

                return Promise.resolve(copia({ item: item, anotacoes: anot }));
            },

            salvarItem: function (dados, id) {
                try { validarItem(dados); } catch (e) { return Promise.reject(e); }

                const d = ler();
                const novo = {
                    dataAdicionado: id
                        ? (d.itens.find(function (item) { return item.id === Number(id); }) || {}).dataAdicionado || null
                        : new Date().toISOString().slice(0, 10),
                    status: dados.status,
                    nota: dados.nota ? Number(dados.nota) : null,
                    dataInicio: dados.dataInicio || null,
                    dataConclusao: dados.dataConclusao || null,
                    texto: dados.texto || "",
                    melhoresMomentos: dados.melhoresMomentos || "",
                    citacoes: dados.citacoes || "",
                    favorito: !!dados.favorito,
                    imagens: dados.imagens || [],
                    obra: {
                        titulo: String(dados.obra.titulo).trim(),
                        autor: dados.obra.autor || "",
                        tipo: dados.obra.tipo,
                        capa: dados.obra.capa || "",
                        sinopse: dados.obra.sinopse || "",
                        generos: dados.obra.generos || []
                    }
                };

                let novoId = id ? Number(id) : null;

                if (novoId) {
                    const pos = d.itens.findIndex(function (i) { return i.id === novoId; });
                    if (pos === -1) { return Promise.reject(new ErroServidor("Obra não encontrada.")); }
                    novo.id = novoId;
                    novo.obra.id = d.itens[pos].obra.id;
                    d.itens[pos] = novo;
                } else {
                    novoId = d.proximoItem++;
                    novo.id = novoId;
                    novo.obra.id = novoId;
                    d.itens.push(novo);
                }

                const p = progresso(d);
                gravar(d);
                return Promise.resolve(resposta(id ? "Obra atualizada!" : "Obra adicionada ao diário!", p, { id: novoId }));
            },

            favorito: function (id, valor) {
                const d = ler();
                const item = d.itens.filter(function (i) { return i.id === Number(id); })[0];
                if (item) { item.favorito = !!valor; }
                const p = progresso(d);
                gravar(d);
                return Promise.resolve(resposta("Ok", p));
            },

            excluirItem: function (id) {
                const d = ler();
                d.itens = d.itens.filter(function (i) { return i.id !== Number(id); });
                d.anotacoes = d.anotacoes.filter(function (a) { return a.itemId !== Number(id); });
                const p = progresso(d);
                gravar(d);
                return Promise.resolve(resposta("Obra removida do diário.", p));
            },

            anotacoes: function () {
                const d = ler();
                const lista = copia(d.anotacoes).map(function (a) {
                    const item = d.itens.filter(function (i) { return i.id === a.itemId; })[0];
                    a.obraTitulo = item ? item.obra.titulo : "";
                    return a;
                });
                lista.sort(function (a, b) {
                    return (b.data || "").localeCompare(a.data || "") || b.id - a.id;
                });
                return Promise.resolve(lista);
            },

            salvarAnotacao: function (idItem, dados, idAnotacao) {
                if (!dados.titulo && !dados.texto) {
                    return Promise.reject(new ErroServidor("Escreva um título ou um texto."));
                }

                const d = ler();
                const campos = {
                    episodio: dados.episodio || "",
                    nota: dados.nota ? Number(dados.nota) : null,
                    titulo: dados.titulo || "",
                    data: dados.data || null,
                    imagens: dados.imagens || [],
                    texto: dados.texto || ""
                };

                if (idAnotacao) {
                    const a = d.anotacoes.filter(function (x) { return x.id === Number(idAnotacao); })[0];
                    if (!a) { return Promise.reject(new ErroServidor("Anotação não encontrada.")); }
                    Object.assign(a, campos);
                } else {
                    campos.id = d.proximaAnotacao++;
                    campos.itemId = Number(idItem);
                    d.anotacoes.push(campos);
                }

                const p = progresso(d);
                gravar(d);
                return Promise.resolve(resposta(idAnotacao ? "Anotação atualizada!" : "Anotação guardada!", p));
            },

            excluirAnotacao: function (id) {
                const d = ler();
                d.anotacoes = d.anotacoes.filter(function (a) { return a.id !== Number(id); });
                const p = progresso(d);
                gravar(d);
                return Promise.resolve(resposta("Anotação removida.", p));
            },

            conquistas: function () {
                const d = ler();
                const p = progresso(d);
                gravar(d);

                return Promise.resolve({
                    xp: p.xp,
                    estatisticas: p.stats,
                    conquistas: Def.CONQUISTAS.map(function (c) {
                        return {
                            nome: c.nome, descricao: c.descricao, xp: c.xp, icone: c.icone,
                            desbloqueada: d.conquistas.indexOf(c.nome) !== -1
                        };
                    })
                });
            }
        };

    })();


    // =================================================
    // EXPORTAR
    // =================================================

    window.Stellifer = {
        STATUS: STATUS,
        TIPOS: TIPOS,
        ICONE_TIPO: ICONE_TIPO,
        esc: esc,
        dataBonita: dataBonita,
        hoje: hoje,
        estrelas: estrelas,
        capaHTML: capaHTML,
        comprimirImagem: comprimirImagem,
        aviso: aviso,
        aoSalvar: aoSalvar,
        confirmar: confirmar,
        prepararJanela: prepararJanela,
        usuario: usuario,
        exigirLogin: exigirLogin,
        sair: sair,
        fotoDoUsuario: fotoDoUsuario,
        nivel: Def.infoNivel,
        Store: Store
    };

})();
