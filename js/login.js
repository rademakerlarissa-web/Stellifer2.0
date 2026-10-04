const formulario = document.getElementById("login-form");


formulario.addEventListener("submit", async function (event) {

    event.preventDefault();


    const identificacao =
        document.getElementById("email").value.trim();

    const senha =
        document.getElementById("senha").value;


    try {

        const resposta = await fetch("http://localhost:3000/login", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                identificacao: identificacao,

                senha: senha

            })

        });


        const dados = await resposta.json();


        // Se o login estiver errado
        if (!resposta.ok) {

            alert(dados.mensagem);

            return;
        }


        // Guarda os dados do usuário que acabou de entrar
        localStorage.setItem(
            "usuarioLogado",
            JSON.stringify(dados.usuario)
        );


        alert(dados.mensagem);


        // Por enquanto, volta para a página inicial
        window.location.href = "index.html";


    } catch (erro) {

        console.error(erro);

        alert(
            "Não foi possível conectar ao servidor."
        );

    }

});