const formulario = document.getElementById("cadastro-form");


formulario.addEventListener("submit", async function (event) {

    event.preventDefault();


    const nome = document.getElementById("nome").value.trim();

    const nomeUsuario =
        document.getElementById("nome_usuario").value.trim();

    const email =
        document.getElementById("email").value.trim();

    const senha =
        document.getElementById("senha").value;

    const confirmarSenha =
        document.getElementById("confirmar-senha").value;


    // Verifica se as senhas são iguais
    if (senha !== confirmarSenha) {

        alert("As senhas não coincidem.");

        return;
    }


    try {

        const resposta = await fetch("http://localhost:3000/cadastro", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                nome: nome,

                nome_usuario: nomeUsuario,

                email: email,

                senha: senha

            })

        });


        const dados = await resposta.json();


        if (!resposta.ok) {

            alert(dados.mensagem);

            return;
        }


        alert(dados.mensagem);


        // Depois de cadastrar, vai para o login
        window.location.href = "login.html";


    } catch (erro) {

        console.error(erro);

        alert(
            "Não foi possível conectar ao servidor."
        );

    }

});