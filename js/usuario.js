// ========================================
// USUÁRIO LOGADO
// ========================================

let usuarioLogado = null;

try {
    usuarioLogado = JSON.parse(localStorage.getItem("usuarioLogado"));
} catch (erro) {
    usuarioLogado = null;
}

if (!usuarioLogado || !usuarioLogado.id_usuario) {
    usuarioLogado = null;
}


// ========================================
// ELEMENTOS DO PERFIL
// ========================================

const perfilCard = document.querySelector(".perfil-card");

const loginOverlay = document.querySelector(
    ".login-overlay"
);


// ========================================
// ELEMENTOS DAS CONQUISTAS
// ========================================

const conquistasCard = document.querySelector(
    ".conquistas-card"
);


// ========================================
// VERIFICA SE EXISTE LOGIN
// ========================================

if (usuarioLogado) {

    // ------------------------------------
    // PERFIL
    // ------------------------------------

    if (perfilCard) {
        perfilCard.classList.remove("bloqueado");
    }

    if (loginOverlay) {
        loginOverlay.style.display = "none";
    }


    // ------------------------------------
    // CONQUISTAS
    // ------------------------------------

    if (conquistasCard) {
        conquistasCard.classList.remove("bloqueado");
    }


} else {

    // ------------------------------------
    // USUÁRIO NÃO LOGADO
    // ------------------------------------

    if (perfilCard) {
        perfilCard.classList.add("bloqueado");
    }

    if (loginOverlay) {
        loginOverlay.style.display = "flex";
    }


    if (conquistasCard) {
        conquistasCard.classList.add("bloqueado");
    }

}

// ========================================
// DADOS DO USUÁRIO NO CARD DE PERFIL
// ========================================

if (usuarioLogado) {

    const nomeEl = document.getElementById("perfil-nome");
    const usuarioEl = document.getElementById("perfil-usuario");
    const nivelEl = document.getElementById("perfil-nivel");
    const fotoEl = document.getElementById("perfil-foto");

    if (nomeEl) { nomeEl.textContent = usuarioLogado.nome; }
    if (usuarioEl) { usuarioEl.textContent = "@" + usuarioLogado.nome_usuario; }
    if (fotoEl && usuarioLogado.foto_perfil) { fotoEl.src = usuarioLogado.foto_perfil; }

    if (nivelEl && window.StelliferDef) {
        nivelEl.textContent = "✦ Nível " + window.StelliferDef.infoNivel(usuarioLogado.xp).nivel;
    }

    // Clicar no card abre o perfil completo
    const cartao = document.querySelector(".perfil-card");
    if (cartao) {
        cartao.style.cursor = "pointer";
        cartao.addEventListener("click", function () {
            window.location.href = "perfil.html";
        });
    }
}
