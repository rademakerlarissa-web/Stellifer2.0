// =====================================================
// ROTAS: PERFIL, DIÁRIO, ANOTAÇÕES E CONQUISTAS
// =====================================================
//
// Usado no server.js com:
//     require("./rotas/stellifer")(app, conexao);
//
// ATENÇÃO — nomes de colunas
// Estas rotas assumem os nomes de colunas abaixo. Se no seu
// banco algum nome for diferente, é só ajustar aqui:
//
//   usuario          id_usuario, nome, nome_usuario, email, senha, foto_perfil, xp
//   tipo             id_tipo, nome
//   obra             id_obra, titulo, sinopse, capa, autor, id_tipo
//   genero           id_genero, nome
//   obra_genero      id_obra, id_genero
//   diario           id_diario, nome, descricao, tema, id_usuario
//   item_diario      id_item, id_diario, id_obra, nota, status, data_inicio,
//                    data_conclusao, imagens, texto, melhores_momentos,
//                    citacoes, favorito, data_adicionado
//   anotacao         id_anotacao, id_item, episodio_capitulo, nota, titulo,
//                    data, imagens, texto
//   conquista        id_conquista, nome, descricao, xp
//   usuario_conquista id_usuario, id_conquista
//
//   • item_diario.status precisa aceitar: 'concluida', 'em_andamento',
//     'abandonada' e 'quero' (quero ler/assistir).
//   • imagens guarda um JSON (lista de imagens) → use LONGTEXT.
//   • capa e foto_perfil podem receber imagens em base64 → use LONGTEXT.

const bcrypt = require("bcrypt");
const Def = require("../js/conquistasDef.js");

const STATUS_VALIDOS = ["concluida", "em_andamento", "abandonada", "quero"];
const TIPOS = ["Filme", "Livro", "Anime", "Mangá", "Série", "Dorama"];


module.exports = function (app, conexao) {

    const db = conexao.promise();


    // -------------------------------------------------
    // FUNÇÕES AUXILIARES
    // -------------------------------------------------

    function dataParaTexto(d) {
        if (!d) { return null; }
        if (typeof d === "string") { return d.slice(0, 10); }
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const dia = String(d.getDate()).padStart(2, "0");
        return d.getFullYear() + "-" + m + "-" + dia;
    }

    function lerLista(texto) {
        if (!texto) { return []; }
        try {
            const lista = JSON.parse(texto);
            return Array.isArray(lista) ? lista : [];
        } catch (e) {
            return [];
        }
    }

    function limparNota(n) {
        const nota = parseInt(n, 10);
        return nota >= 1 && nota <= 5 ? nota : null;   // só inteiros de 1 a 5
    }

    function vazioParaNulo(v) {
        return v === undefined || v === null || String(v).trim() === "" ? null : v;
    }

    function erro(res, e, msg) {
        console.error(msg, e);
        res.status(500).json({ mensagem: msg });
    }


    // -------------------------------------------------
    // CONVERSÃO DE LINHAS DO BANCO → JSON DA INTERFACE
    // -------------------------------------------------

    function montarItem(l, generos) {
        return {
            id: l.id_item,
            status: l.status,
            nota: l.nota,
            dataInicio: dataParaTexto(l.data_inicio),
            dataConclusao: dataParaTexto(l.data_conclusao),
            texto: l.texto || "",
            melhoresMomentos: l.melhores_momentos || "",
            citacoes: l.citacoes || "",
            favorito: !!l.favorito,
            dataAdicionado: dataParaTexto(l.data_adicionado),
            imagens: lerLista(l.imagens),
            totalAnotacoes: l.total_anotacoes || 0,
            obra: {
                id: l.id_obra,
                titulo: l.titulo,
                sinopse: l.sinopse || "",
                capa: l.capa || "",
                autor: l.autor || "",
                tipo: l.tipo_nome || "",
                generos: generos || []
            }
        };
    }

    function montarAnotacao(l) {
        return {
            id: l.id_anotacao,
            itemId: l.id_item,
            episodio: l.episodio_capitulo || "",
            nota: l.nota,
            titulo: l.titulo || "",
            data: dataParaTexto(l.data),
            imagens: lerLista(l.imagens),
            texto: l.texto || ""
        };
    }

    const SELECT_ITEM = `
        SELECT i.*, o.titulo, o.sinopse, o.capa, o.autor, t.nome AS tipo_nome,
               (SELECT COUNT(*) FROM anotacao a WHERE a.id_item = i.id_item) AS total_anotacoes
        FROM item_diario i
        JOIN obra o ON o.id_obra = i.id_obra
        LEFT JOIN tipo t ON t.id_tipo = o.id_tipo
        JOIN diario d ON d.id_diario = i.id_diario
    `;

    async function generosDasObras(ids) {
        const mapa = {};
        if (ids.length === 0) { return mapa; }
        const [linhas] = await db.query(
            `SELECT og.id_obra, g.nome
             FROM obra_genero og JOIN genero g ON g.id_genero = og.id_genero
             WHERE og.id_obra IN (?)`, [ids]);
        linhas.forEach(function (l) {
            (mapa[l.id_obra] = mapa[l.id_obra] || []).push(l.nome);
        });
        return mapa;
    }


    // -------------------------------------------------
    // DIÁRIO DO USUÁRIO (cria o diário na primeira vez)
    // -------------------------------------------------

    async function diarioDoUsuario(idUsuario) {
        const [diarios] = await db.query(
            "SELECT id_diario FROM diario WHERE id_usuario = ? ORDER BY id_diario LIMIT 1",
            [idUsuario]);

        if (diarios.length > 0) { return diarios[0].id_diario; }

        const [r] = await db.query(
            "INSERT INTO diario (nome, descricao, tema, id_usuario) VALUES (?, ?, ?, ?)",
            ["Meu diário", "Minhas histórias favoritas", "padrao", idUsuario]);
        return r.insertId;
    }

    async function tipoPorNome(nome) {
        const [t] = await db.query("SELECT id_tipo FROM tipo WHERE nome = ?", [nome]);
        if (t.length > 0) { return t[0].id_tipo; }
        const [r] = await db.query("INSERT INTO tipo (nome) VALUES (?)", [nome]);
        return r.insertId;
    }

    async function salvarGeneros(idObra, generos) {
        await db.query("DELETE FROM obra_genero WHERE id_obra = ?", [idObra]);

        const nomes = Array.from(new Set(
            (generos || []).map(function (g) { return String(g).trim(); }).filter(Boolean)
        ));

        for (const nome of nomes) {
            let [g] = await db.query("SELECT id_genero FROM genero WHERE nome = ?", [nome]);
            let idGenero;
            if (g.length > 0) {
                idGenero = g[0].id_genero;
            } else {
                const [r] = await db.query("INSERT INTO genero (nome) VALUES (?)", [nome]);
                idGenero = r.insertId;
            }
            await db.query("INSERT INTO obra_genero (id_obra, id_genero) VALUES (?, ?)", [idObra, idGenero]);
        }
    }


    // -------------------------------------------------
    // ESTATÍSTICAS, XP E CONQUISTAS
    // -------------------------------------------------

    async function estatisticas(idUsuario) {

        const [[r]] = await db.query(`
            SELECT COUNT(*) AS obras,
                   COALESCE(SUM(i.status = 'concluida'), 0) AS concluidas,
                   COALESCE(SUM(i.nota IS NOT NULL), 0) AS avaliadas,
                   COALESCE(SUM(i.favorito = 1), 0) AS favoritos,
                   COUNT(DISTINCT o.id_tipo) AS tipos
            FROM item_diario i
            JOIN diario d ON d.id_diario = i.id_diario
            JOIN obra o ON o.id_obra = i.id_obra
            WHERE d.id_usuario = ? AND i.status <> 'quero'
        `, [idUsuario]);

        const [[a]] = await db.query(`
            SELECT COUNT(*) AS anotacoes
            FROM anotacao n
            JOIN item_diario i ON i.id_item = n.id_item
            JOIN diario d ON d.id_diario = i.id_diario
            WHERE d.id_usuario = ?
        `, [idUsuario]);

        const [datas] = await db.query(`
            SELECT n.data AS dia FROM anotacao n
            JOIN item_diario i ON i.id_item = n.id_item
            JOIN diario d ON d.id_diario = i.id_diario
            WHERE d.id_usuario = ? AND n.data IS NOT NULL
            UNION
            SELECT i.data_inicio FROM item_diario i
            JOIN diario d ON d.id_diario = i.id_diario
            WHERE d.id_usuario = ? AND i.data_inicio IS NOT NULL
            UNION
            SELECT i.data_conclusao FROM item_diario i
            JOIN diario d ON d.id_diario = i.id_diario
            WHERE d.id_usuario = ? AND i.data_conclusao IS NOT NULL
        `, [idUsuario, idUsuario, idUsuario]);

        return {
            obras: Number(r.obras),
            concluidas: Number(r.concluidas),
            avaliadas: Number(r.avaliadas),
            favoritos: Number(r.favoritos),
            tipos: Number(r.tipos),
            anotacoes: Number(a.anotacoes),
            sequencia: Def.maiorSequencia(datas.map(function (l) { return dataParaTexto(l.dia); }))
        };
    }

    // Garante que as conquistas existem na tabela "conquista"
    async function garantirConquistas() {
        const [existentes] = await db.query("SELECT id_conquista, nome FROM conquista");
        const porNome = {};
        existentes.forEach(function (c) { porNome[c.nome] = c.id_conquista; });

        for (const c of Def.CONQUISTAS) {
            if (porNome[c.nome]) {
                await db.query("UPDATE conquista SET descricao = ?, xp = ? WHERE id_conquista = ?",
                    [c.descricao, c.xp, porNome[c.nome]]);
            } else {
                const [r] = await db.query(
                    "INSERT INTO conquista (nome, descricao, xp) VALUES (?, ?, ?)",
                    [c.nome, c.descricao, c.xp]);
                porNome[c.nome] = r.insertId;
            }
        }
        return porNome;
    }

    // Confere as regras, desbloqueia o que for novo e recalcula o XP.
    // Retorna { xp, novas: [nomes das conquistas recém-desbloqueadas] }
    async function atualizarProgresso(idUsuario) {

        const ids = await garantirConquistas();
        const stats = await estatisticas(idUsuario);

        const [jaTem] = await db.query(
            "SELECT id_conquista FROM usuario_conquista WHERE id_usuario = ?", [idUsuario]);
        const desbloqueadas = new Set(jaTem.map(function (l) { return l.id_conquista; }));

        const novas = [];
        let mudou = true;

        // Repete até estabilizar (uma conquista dá XP e pode liberar outra)
        while (mudou) {
            mudou = false;

            let bonus = 0;
            Def.CONQUISTAS.forEach(function (c) {
                if (desbloqueadas.has(ids[c.nome])) { bonus += c.xp; }
            });

            stats.xp = Def.xpDasAcoes(stats) + bonus;

            for (const c of Def.CONQUISTAS) {
                const id = ids[c.nome];
                if (!desbloqueadas.has(id) && c.regra(stats)) {
                    await db.query(
                        "INSERT INTO usuario_conquista (id_usuario, id_conquista) VALUES (?, ?)",
                        [idUsuario, id]);
                    desbloqueadas.add(id);
                    novas.push(c.nome);
                    mudou = true;
                }
            }
        }

        await db.query("UPDATE usuario SET xp = ? WHERE id_usuario = ?", [stats.xp, idUsuario]);

        return { xp: stats.xp, novas: novas, stats: stats };
    }


    // =================================================
    // PERFIL
    // =================================================

    app.get("/perfil/:idUsuario", async (req, res) => {
        try {
            const idUsuario = Number(req.params.idUsuario);

            const [u] = await db.query(
                "SELECT id_usuario, nome, nome_usuario, email, foto_perfil, xp FROM usuario WHERE id_usuario = ?",
                [idUsuario]);

            if (u.length === 0) {
                return res.status(404).json({ mensagem: "Usuário não encontrado." });
            }

            const progresso = await atualizarProgresso(idUsuario);
            const [[c]] = await db.query(
                "SELECT COUNT(*) AS total FROM usuario_conquista WHERE id_usuario = ?", [idUsuario]);

            res.json({
                usuario: {
                    id_usuario: u[0].id_usuario,
                    nome: u[0].nome,
                    nome_usuario: u[0].nome_usuario,
                    email: u[0].email,
                    foto_perfil: u[0].foto_perfil,
                    xp: progresso.xp
                },
                estatisticas: progresso.stats,
                conquistasDesbloqueadas: c.total,
                conquistasTotal: Def.CONQUISTAS.length
            });
        } catch (e) {
            erro(res, e, "Erro ao carregar o perfil.");
        }
    });

    app.put("/perfil/:idUsuario", async (req, res) => {
        try {
            const idUsuario = Number(req.params.idUsuario);
            const { nome, nome_usuario, email, foto_perfil, senha_atual, nova_senha } = req.body;

            if (!nome || !nome_usuario || !email) {
                return res.status(400).json({ mensagem: "Preencha nome, usuário e e-mail." });
            }

            const [repetido] = await db.query(
                "SELECT id_usuario FROM usuario WHERE (nome_usuario = ? OR email = ?) AND id_usuario <> ?",
                [nome_usuario, email, idUsuario]);

            if (repetido.length > 0) {
                return res.status(409).json({ mensagem: "Nome de usuário ou e-mail já em uso." });
            }

            // Troca de senha (opcional)
            if (nova_senha) {
                const [u] = await db.query("SELECT senha FROM usuario WHERE id_usuario = ?", [idUsuario]);
                const ok = u.length > 0 && senha_atual &&
                           await bcrypt.compare(senha_atual, u[0].senha);

                if (!ok) {
                    return res.status(401).json({ mensagem: "A senha atual está incorreta." });
                }

                const hash = await bcrypt.hash(nova_senha, 10);
                await db.query("UPDATE usuario SET senha = ? WHERE id_usuario = ?", [hash, idUsuario]);
            }

            // foto_perfil: undefined = não mexe | "" = remove | texto = nova foto
            if (foto_perfil === undefined) {
                await db.query(
                    "UPDATE usuario SET nome = ?, nome_usuario = ?, email = ? WHERE id_usuario = ?",
                    [nome, nome_usuario, email, idUsuario]);
            } else {
                await db.query(
                    "UPDATE usuario SET nome = ?, nome_usuario = ?, email = ?, foto_perfil = ? WHERE id_usuario = ?",
                    [nome, nome_usuario, email, vazioParaNulo(foto_perfil), idUsuario]);
            }

            const [u] = await db.query(
                "SELECT id_usuario, nome, nome_usuario, email, foto_perfil, xp FROM usuario WHERE id_usuario = ?",
                [idUsuario]);

            res.json({ mensagem: "Perfil atualizado!", usuario: u[0] });
        } catch (e) {
            erro(res, e, "Erro ao atualizar o perfil.");
        }
    });


    // =================================================
    // DIÁRIO — ITENS (obra + registro pessoal)
    // =================================================

    // Lista tudo do diário do usuário
    app.get("/diario/:idUsuario/itens", async (req, res) => {
        try {
            const idUsuario = Number(req.params.idUsuario);

            const [linhas] = await db.query(
                SELECT_ITEM + " WHERE d.id_usuario = ? ORDER BY i.id_item DESC", [idUsuario]);

            const generos = await generosDasObras(linhas.map(function (l) { return l.id_obra; }));

            res.json(linhas.map(function (l) { return montarItem(l, generos[l.id_obra]); }));
        } catch (e) {
            erro(res, e, "Erro ao carregar o diário.");
        }
    });

    // Um item + suas anotações (página da obra)
    app.get("/diario/:idUsuario/itens/:idItem", async (req, res) => {
        try {
            const idUsuario = Number(req.params.idUsuario);
            const idItem = Number(req.params.idItem);

            const [linhas] = await db.query(
                SELECT_ITEM + " WHERE d.id_usuario = ? AND i.id_item = ?", [idUsuario, idItem]);

            if (linhas.length === 0) {
                return res.status(404).json({ mensagem: "Obra não encontrada no seu diário." });
            }

            const generos = await generosDasObras([linhas[0].id_obra]);

            const [anot] = await db.query(
                "SELECT * FROM anotacao WHERE id_item = ? ORDER BY data DESC, id_anotacao DESC", [idItem]);

            res.json({
                item: montarItem(linhas[0], generos[linhas[0].id_obra]),
                anotacoes: anot.map(montarAnotacao)
            });
        } catch (e) {
            erro(res, e, "Erro ao carregar a obra.");
        }
    });

    // Cria obra + item no diário
    app.post("/diario/:idUsuario/itens", async (req, res) => {
        try {
            const idUsuario = Number(req.params.idUsuario);
            const b = req.body;
            const o = b.obra || {};

            if (!o.titulo || !String(o.titulo).trim()) {
                return res.status(400).json({ mensagem: "Informe o título da obra." });
            }
            if (!TIPOS.includes(o.tipo)) {
                return res.status(400).json({ mensagem: "Escolha o tipo da obra." });
            }
            if (!STATUS_VALIDOS.includes(b.status)) {
                return res.status(400).json({ mensagem: "Escolha o status da obra." });
            }

            const idDiario = await diarioDoUsuario(idUsuario);
            const idTipo = await tipoPorNome(o.tipo);

            const [obra] = await db.query(
                "INSERT INTO obra (titulo, sinopse, capa, autor, id_tipo) VALUES (?, ?, ?, ?, ?)",
                [String(o.titulo).trim(), vazioParaNulo(o.sinopse), vazioParaNulo(o.capa),
                 vazioParaNulo(o.autor), idTipo]);

            await salvarGeneros(obra.insertId, o.generos);

            const [item] = await db.query(
                `INSERT INTO item_diario
                 (id_diario, id_obra, nota, status, data_inicio, data_conclusao,
                  imagens, texto, melhores_momentos, citacoes, favorito, data_adicionado)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                [idDiario, obra.insertId, limparNota(b.nota), b.status,
                 vazioParaNulo(b.dataInicio), vazioParaNulo(b.dataConclusao),
                 JSON.stringify(b.imagens || []), vazioParaNulo(b.texto),
                 vazioParaNulo(b.melhoresMomentos), vazioParaNulo(b.citacoes),
                 b.favorito ? 1 : 0]);

            const progresso = await atualizarProgresso(idUsuario);

            res.status(201).json({
                mensagem: "Obra adicionada ao diário!",
                id: item.insertId,
                novasConquistas: progresso.novas,
                xp: progresso.xp
            });
        } catch (e) {
            erro(res, e, "Erro ao adicionar a obra.");
        }
    });

    // Atualiza obra + item
    app.put("/diario/:idUsuario/itens/:idItem", async (req, res) => {
        try {
            const idUsuario = Number(req.params.idUsuario);
            const idItem = Number(req.params.idItem);
            const b = req.body;
            const o = b.obra || {};

            const [achado] = await db.query(
                `SELECT i.id_obra FROM item_diario i
                 JOIN diario d ON d.id_diario = i.id_diario
                 WHERE i.id_item = ? AND d.id_usuario = ?`, [idItem, idUsuario]);

            if (achado.length === 0) {
                return res.status(404).json({ mensagem: "Obra não encontrada no seu diário." });
            }
            if (!o.titulo || !String(o.titulo).trim()) {
                return res.status(400).json({ mensagem: "Informe o título da obra." });
            }
            if (!TIPOS.includes(o.tipo)) {
                return res.status(400).json({ mensagem: "Escolha o tipo da obra." });
            }
            if (!STATUS_VALIDOS.includes(b.status)) {
                return res.status(400).json({ mensagem: "Escolha o status da obra." });
            }

            const idObra = achado[0].id_obra;
            const idTipo = await tipoPorNome(o.tipo);

            await db.query(
                "UPDATE obra SET titulo = ?, sinopse = ?, capa = ?, autor = ?, id_tipo = ? WHERE id_obra = ?",
                [String(o.titulo).trim(), vazioParaNulo(o.sinopse), vazioParaNulo(o.capa),
                 vazioParaNulo(o.autor), idTipo, idObra]);

            await salvarGeneros(idObra, o.generos);

            await db.query(
                `UPDATE item_diario SET nota = ?, status = ?, data_inicio = ?, data_conclusao = ?,
                 imagens = ?, texto = ?, melhores_momentos = ?, citacoes = ?, favorito = ?
                 WHERE id_item = ?`,
                [limparNota(b.nota), b.status, vazioParaNulo(b.dataInicio),
                 vazioParaNulo(b.dataConclusao), JSON.stringify(b.imagens || []),
                 vazioParaNulo(b.texto), vazioParaNulo(b.melhoresMomentos),
                 vazioParaNulo(b.citacoes), b.favorito ? 1 : 0, idItem]);

            const progresso = await atualizarProgresso(idUsuario);

            res.json({ mensagem: "Obra atualizada!", novasConquistas: progresso.novas, xp: progresso.xp });
        } catch (e) {
            erro(res, e, "Erro ao atualizar a obra.");
        }
    });

    // Alterna favorito rapidamente
    app.patch("/diario/:idUsuario/itens/:idItem/favorito", async (req, res) => {
        try {
            const idUsuario = Number(req.params.idUsuario);
            const idItem = Number(req.params.idItem);

            const [r] = await db.query(
                `UPDATE item_diario i JOIN diario d ON d.id_diario = i.id_diario
                 SET i.favorito = ? WHERE i.id_item = ? AND d.id_usuario = ?`,
                [req.body.favorito ? 1 : 0, idItem, idUsuario]);

            if (r.affectedRows === 0) {
                return res.status(404).json({ mensagem: "Obra não encontrada." });
            }

            const progresso = await atualizarProgresso(idUsuario);
            res.json({ mensagem: "Ok", novasConquistas: progresso.novas, xp: progresso.xp });
        } catch (e) {
            erro(res, e, "Erro ao atualizar o favorito.");
        }
    });

    // Remove item (e suas anotações)
    app.delete("/diario/:idUsuario/itens/:idItem", async (req, res) => {
        try {
            const idUsuario = Number(req.params.idUsuario);
            const idItem = Number(req.params.idItem);

            const [achado] = await db.query(
                `SELECT i.id_item FROM item_diario i
                 JOIN diario d ON d.id_diario = i.id_diario
                 WHERE i.id_item = ? AND d.id_usuario = ?`, [idItem, idUsuario]);

            if (achado.length === 0) {
                return res.status(404).json({ mensagem: "Obra não encontrada no seu diário." });
            }

            await db.query("DELETE FROM anotacao WHERE id_item = ?", [idItem]);
            await db.query("DELETE FROM item_diario WHERE id_item = ?", [idItem]);

            const progresso = await atualizarProgresso(idUsuario);
            res.json({ mensagem: "Obra removida do diário.", xp: progresso.xp });
        } catch (e) {
            erro(res, e, "Erro ao remover a obra.");
        }
    });


    // =================================================
    // ANOTAÇÕES
    // =================================================

    // Todas as anotações do usuário (mais novas primeiro) — com a obra junto
    app.get("/diario/:idUsuario/anotacoes", async (req, res) => {
        try {
            const idUsuario = Number(req.params.idUsuario);

            const [linhas] = await db.query(
                `SELECT n.*, o.titulo AS obra_titulo
                 FROM anotacao n
                 JOIN item_diario i ON i.id_item = n.id_item
                 JOIN diario d ON d.id_diario = i.id_diario
                 JOIN obra o ON o.id_obra = i.id_obra
                 WHERE d.id_usuario = ?
                 ORDER BY n.data DESC, n.id_anotacao DESC`, [idUsuario]);

            res.json(linhas.map(function (l) {
                const a = montarAnotacao(l);
                a.obraTitulo = l.obra_titulo;
                return a;
            }));
        } catch (e) {
            erro(res, e, "Erro ao carregar as anotações.");
        }
    });

    async function itemDoUsuario(idUsuario, idItem) {
        const [r] = await db.query(
            `SELECT i.id_item FROM item_diario i
             JOIN diario d ON d.id_diario = i.id_diario
             WHERE i.id_item = ? AND d.id_usuario = ?`, [idItem, idUsuario]);
        return r.length > 0;
    }

    app.post("/diario/:idUsuario/itens/:idItem/anotacoes", async (req, res) => {
        try {
            const idUsuario = Number(req.params.idUsuario);
            const idItem = Number(req.params.idItem);
            const b = req.body;

            if (!(await itemDoUsuario(idUsuario, idItem))) {
                return res.status(404).json({ mensagem: "Obra não encontrada no seu diário." });
            }
            if (!b.titulo && !b.texto) {
                return res.status(400).json({ mensagem: "Escreva um título ou um texto." });
            }

            const [r] = await db.query(
                `INSERT INTO anotacao (id_item, episodio_capitulo, nota, titulo, data, imagens, texto)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [idItem, vazioParaNulo(b.episodio), limparNota(b.nota), vazioParaNulo(b.titulo),
                 vazioParaNulo(b.data), JSON.stringify(b.imagens || []), vazioParaNulo(b.texto)]);

            const progresso = await atualizarProgresso(idUsuario);

            res.status(201).json({
                mensagem: "Anotação guardada!",
                id: r.insertId,
                novasConquistas: progresso.novas,
                xp: progresso.xp
            });
        } catch (e) {
            erro(res, e, "Erro ao salvar a anotação.");
        }
    });

    app.put("/diario/:idUsuario/anotacoes/:idAnotacao", async (req, res) => {
        try {
            const idUsuario = Number(req.params.idUsuario);
            const idAnotacao = Number(req.params.idAnotacao);
            const b = req.body;

            const [r] = await db.query(
                `UPDATE anotacao n
                 JOIN item_diario i ON i.id_item = n.id_item
                 JOIN diario d ON d.id_diario = i.id_diario
                 SET n.episodio_capitulo = ?, n.nota = ?, n.titulo = ?, n.data = ?,
                     n.imagens = ?, n.texto = ?
                 WHERE n.id_anotacao = ? AND d.id_usuario = ?`,
                [vazioParaNulo(b.episodio), limparNota(b.nota), vazioParaNulo(b.titulo),
                 vazioParaNulo(b.data), JSON.stringify(b.imagens || []), vazioParaNulo(b.texto),
                 idAnotacao, idUsuario]);

            if (r.affectedRows === 0) {
                return res.status(404).json({ mensagem: "Anotação não encontrada." });
            }

            const progresso = await atualizarProgresso(idUsuario);
            res.json({ mensagem: "Anotação atualizada!", novasConquistas: progresso.novas, xp: progresso.xp });
        } catch (e) {
            erro(res, e, "Erro ao atualizar a anotação.");
        }
    });

    app.delete("/diario/:idUsuario/anotacoes/:idAnotacao", async (req, res) => {
        try {
            const idUsuario = Number(req.params.idUsuario);
            const idAnotacao = Number(req.params.idAnotacao);

            const [r] = await db.query(
                `DELETE n FROM anotacao n
                 JOIN item_diario i ON i.id_item = n.id_item
                 JOIN diario d ON d.id_diario = i.id_diario
                 WHERE n.id_anotacao = ? AND d.id_usuario = ?`, [idAnotacao, idUsuario]);

            if (r.affectedRows === 0) {
                return res.status(404).json({ mensagem: "Anotação não encontrada." });
            }

            const progresso = await atualizarProgresso(idUsuario);
            res.json({ mensagem: "Anotação removida.", xp: progresso.xp });
        } catch (e) {
            erro(res, e, "Erro ao remover a anotação.");
        }
    });


    // =================================================
    // CONQUISTAS
    // =================================================

    app.get("/conquistas/:idUsuario", async (req, res) => {
        try {
            const idUsuario = Number(req.params.idUsuario);

            const progresso = await atualizarProgresso(idUsuario);

            const [linhas] = await db.query(
                `SELECT c.nome FROM usuario_conquista uc
                 JOIN conquista c ON c.id_conquista = uc.id_conquista
                 WHERE uc.id_usuario = ?`, [idUsuario]);

            const tem = new Set(linhas.map(function (l) { return l.nome; }));

            res.json({
                xp: progresso.xp,
                estatisticas: progresso.stats,
                conquistas: Def.CONQUISTAS.map(function (c) {
                    return {
                        nome: c.nome,
                        descricao: c.descricao,
                        xp: c.xp,
                        icone: c.icone,
                        desbloqueada: tem.has(c.nome)
                    };
                })
            });
        } catch (e) {
            erro(res, e, "Erro ao carregar as conquistas.");
        }
    });

};
