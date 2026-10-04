// ========================================
// USUÁRIO LOGADO
// ========================================

const usuarioLogado = JSON.parse(
    localStorage.getItem("usuarioLogado")
);


// ========================================
// ELEMENTOS DO PERFIL
// ========================================

const perfilBloqueado = document.querySelector(
    ".perfil-conteudo-bloqueado"
);

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

    if (perfilBloqueado) {
        perfilBloqueado.classList.remove("bloqueado");
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

    if (perfilBloqueado) {
        perfilBloqueado.classList.add("bloqueado");
    }

    if (loginOverlay) {
        loginOverlay.style.display = "flex";
    }


    if (conquistasCard) {
        conquistasCard.classList.add("bloqueado");
    }

}