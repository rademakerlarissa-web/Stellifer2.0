// =====================================================
// TEMA CLARO / ESCURO
// =====================================================
//
// • Na primeira visita, segue o tema do aparelho.
// • Depois que a pessoa clica no botão, a escolha fica
//   salva no navegador (localStorage).
// • O tema inicial é aplicado por um pequeno script no
//   <head> do index.html, para a página não "piscar".

(function () {

    const CHAVE = "stellifer-tema";

    const raiz = document.documentElement;

    const botao = document.querySelector("#tema-toggle");

    const metaCor = document.querySelector('meta[name="theme-color"]');

    const prefereEscuro =
        window.matchMedia("(prefers-color-scheme: dark)");


    // -------------------------------------------------
    // LER / SALVAR A ESCOLHA
    // -------------------------------------------------

    function lerEscolha() {

        try {
            return localStorage.getItem(CHAVE);
        } catch (erro) {
            return null;
        }
    }

    function salvarEscolha(tema) {

        try {
            localStorage.setItem(CHAVE, tema);
        } catch (erro) {
            // Sem localStorage: o tema vale só nesta visita.
        }
    }


    // -------------------------------------------------
    // APLICAR O TEMA
    // -------------------------------------------------

    function aplicarTema(tema) {

        raiz.setAttribute("data-tema", tema);

        const escuro = tema === "escuro";

        if (botao) {

            botao.setAttribute("aria-pressed", String(escuro));

            botao.setAttribute(
                "aria-label",
                escuro
                    ? "Mudar para o tema claro"
                    : "Mudar para o tema escuro"
            );

            botao.setAttribute(
                "title",
                escuro ? "Tema claro" : "Tema escuro"
            );
        }

        // Cor da barra do navegador no celular
        if (metaCor) {
            metaCor.setAttribute(
                "content",
                escuro ? "#121a2a" : "#f7f1df"
            );
        }
    }


    // -------------------------------------------------
    // ALTERNAR COM ANIMAÇÃO SUAVE
    // -------------------------------------------------

    function alternarTema() {

        const atual =
            raiz.getAttribute("data-tema") === "escuro"
                ? "escuro"
                : "claro";

        const novo = atual === "escuro" ? "claro" : "escuro";

        raiz.classList.add("tema-transicao");

        aplicarTema(novo);

        salvarEscolha(novo);

        setTimeout(function () {
            raiz.classList.remove("tema-transicao");
        }, 600);
    }


    // -------------------------------------------------
    // INICIAR
    // -------------------------------------------------

    const escolhaSalva = lerEscolha();

    if (escolhaSalva === "claro" || escolhaSalva === "escuro") {

        aplicarTema(escolhaSalva);

    } else {

        aplicarTema(prefereEscuro.matches ? "escuro" : "claro");
    }

    if (botao) {
        botao.addEventListener("click", alternarTema);
    }


    // Se a pessoa nunca escolheu, acompanha o aparelho
    // quando ele muda (por exemplo, ao anoitecer).

    prefereEscuro.addEventListener("change", function (evento) {

        if (lerEscolha()) {
            return;
        }

        aplicarTema(evento.matches ? "escuro" : "claro");
    });

})();
