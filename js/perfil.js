// =====================================================
// PERFIL
// =====================================================

(function () {

    "use strict";

    const S = window.Stellifer;
    const esc = S.esc;

    if (!S.exigirLogin()) { return; }

    const $ = function (id) { return document.getElementById(id); };

    const janela = $("janela-perfil");
    S.prepararJanela(janela);

    let dados = null;
    let fotoNova;       // undefined = não mexeu | "" = remover | texto = nova foto


    function desenhar() {

        const u = dados.usuario;
        const n = S.nivel(u.xp);
        const s = dados.estatisticas;

        $("foto").src = S.fotoDoUsuario(u);
        $("nome").textContent = u.nome;
        $("usuario-nome").textContent = "@" + u.nome_usuario;
        $("nivel").textContent = "✦ Nível " + n.nivel;
        $("xp-atual").textContent = (u.xp || 0) + " XP";
        $("xp-proximo").textContent = "faltam " + (n.xpParaProximo - n.xpNoNivel) + " XP para o nível " + (n.nivel + 1);

        // Anima a barra
        requestAnimationFrame(function () {
            $("barra-xp").style.width = n.porcentagem + "%";
        });

        $("numeros").innerHTML =
            '<div class="numero-card"><span>Obras no diário</span><strong>' + s.obras + '</strong></div>' +
            '<div class="numero-card"><span>Concluídas</span><strong>' + s.concluidas + '</strong></div>' +
            '<div class="numero-card"><span>Anotações</span><strong>' + s.anotacoes + '</strong></div>' +
            '<div class="numero-card"><span>Favoritas</span><strong>' + s.favoritos + '</strong></div>';

        $("info").innerHTML =
            '<dt>Nome</dt><dd>' + esc(u.nome) + '</dd>' +
            '<dt>Nome de usuário</dt><dd>@' + esc(u.nome_usuario) + '</dd>' +
            '<dt>E-mail</dt><dd>' + esc(u.email) + '</dd>' +
            '<dt>Nível</dt><dd>' + n.nivel + ' (' + (u.xp || 0) + ' XP)</dd>';

        $("resumo-conquistas").textContent =
            dados.conquistasDesbloqueadas + " de " + dados.conquistasTotal + " desbloqueadas";
    }

    async function carregarConquistasMini() {
        try {
            const c = await S.Store.conquistas();

            // Mostra primeiro as desbloqueadas
            const ordenadas = c.conquistas.slice().sort(function (a, b) {
                return Number(b.desbloqueada) - Number(a.desbloqueada);
            });

            $("conquistas-mini").innerHTML = ordenadas.map(function (q) {
                return '<div class="conquista-mini' + (q.desbloqueada ? "" : " travada") +
                       '" title="' + esc(q.nome + " — " + q.descricao) + '" role="img" aria-label="' +
                       esc(q.nome + (q.desbloqueada ? "" : " (bloqueada)")) + '">' + q.icone + '</div>';
            }).join("");
        } catch (e) {
            $("conquistas-mini").textContent = "";
        }
    }

    async function carregar() {
        try {
            dados = await S.Store.perfil();

            // Mantém o que está salvo no navegador em dia
            localStorage.setItem("usuarioLogado", JSON.stringify(Object.assign({}, S.usuario(), dados.usuario)));

            desenhar();
            carregarConquistasMini();
        } catch (erro) {
            $("nome").textContent = "Não foi possível carregar";
            S.aviso(erro.message, "erro");
        }
    }


    // ----- Editar -----

    function erroForm(msg) {
        const e = $("erro-perfil");
        e.textContent = msg;
        e.classList.add("visivel");
    }

    $("btn-editar").addEventListener("click", function () {
        const u = dados.usuario;
        fotoNova = undefined;

        $("erro-perfil").classList.remove("visivel");
        $("ed-nome").value = u.nome;
        $("ed-usuario").value = u.nome_usuario;
        $("ed-email").value = u.email;
        $("ed-senha-atual").value = "";
        $("ed-senha-nova").value = "";
        $("foto-previa").src = S.fotoDoUsuario(u);

        janela.showModal();
        $("ed-nome").focus();
    });

    $("fechar-perfil").addEventListener("click", function () { janela.close(); });
    $("cancelar-perfil").addEventListener("click", function () { janela.close(); });

    $("foto-arquivo").addEventListener("change", async function (e) {
        const arquivo = e.target.files[0];
        if (!arquivo) { return; }

        try {
            fotoNova = await S.comprimirImagem(arquivo, 400, 0.85);
            $("foto-previa").src = fotoNova;
        } catch (erro) {
            erroForm(erro.message);
        }
        e.target.value = "";
    });

    $("foto-remover").addEventListener("click", function () {
        fotoNova = "";
        $("foto-previa").src = "imagens/perfil-placeholder.png";
    });

    $("form-perfil").addEventListener("submit", async function (e) {
        e.preventDefault();
        $("erro-perfil").classList.remove("visivel");

        const nome = $("ed-nome").value.trim();
        const usuario = $("ed-usuario").value.trim();
        const email = $("ed-email").value.trim();
        const atual = $("ed-senha-atual").value;
        const nova = $("ed-senha-nova").value;

        if (!nome || !usuario || !email) { erroForm("Preencha nome, usuário e e-mail."); return; }
        if (/\s/.test(usuario)) { erroForm("O nome de usuário não pode ter espaços."); return; }
        if (!/^\S+@\S+\.\S+$/.test(email)) { erroForm("Digite um e-mail válido."); return; }
        if (nova && !atual) { erroForm("Digite a senha atual para trocar a senha."); return; }
        if (nova && nova.length < 6) { erroForm("A nova senha precisa ter pelo menos 6 caracteres."); return; }

        const corpo = { nome: nome, nome_usuario: usuario, email: email };
        if (fotoNova !== undefined) { corpo.foto_perfil = fotoNova; }
        if (nova) { corpo.senha_atual = atual; corpo.nova_senha = nova; }

        const botao = $("salvar-perfil");
        botao.disabled = true;

        try {
            const r = await S.Store.atualizarPerfil(corpo);

            localStorage.setItem("usuarioLogado", JSON.stringify(Object.assign({}, S.usuario(), r.usuario)));

            janela.close();
            S.aviso(r.mensagem || "Perfil atualizado!");
            await carregar();
        } catch (erro) {
            erroForm(erro.message || "Não foi possível salvar.");
        } finally {
            botao.disabled = false;
        }
    });

    $("btn-sair").addEventListener("click", async function () {
        const ok = await S.confirmar("Sair da conta?", "Você poderá entrar de novo quando quiser.", "Sair");
        if (ok) { S.sair(); }
    });

    carregar();

})();
