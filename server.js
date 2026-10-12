//Principal arquivo do back-end do Stellifer 2.0
//Responsável por iniciar o servidor, conectar ao MySQL e definir as rotas da API.

//protegendo o MySQL com variáveis de ambiente
require('dotenv').config();// Importa o módulo dotenv para carregar variáveis de ambiente do arquivo .env
const mysql = require('mysql2');// Importa o módulo mysql2 para conectar ao banco de dados MySQL


const express = require("express");// Importa o Express para criar o servidor
const cors = require("cors");// Importa o CORS para permitir comunicação entre front-end e back-end
const bcrypt = require("bcrypt");// Importa o bcrypt para criptografar senhas

// Cria uma instância do Express e define a porta do servidor
const app = express();
const PORT = 3000;


// Permite que o servidor receba dados em JSON com limite de 30MB para suportar imagens e vídeos em base64
app.use(express.json({ limit: "30mb" }));

// Permite comunicação entre o front-end e o back-end
app.use(cors());


// ================================
// CONEXÃO COM O MYSQL
// ================================

// Cria a conexão com o banco de dados MySQL usando as variáveis de ambiente
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

// Conecta ao banco de dados MySQL e trata erros de conexão
db.connect((erro) => {

    if (erro) {

        console.error("❌ Erro ao conectar ao MySQL:");
        console.error(erro.message);

        return;
    }

    console.log("✅ Conectado ao MySQL!");
});


// ================================
// ROTA DE TESTE
// ================================

app.get("/", (req, res) => {

    res.send("Stellifer está funcionando! ✨");

});


// ================================
// CADASTRO DE USUÁRIO
// ================================

app.post("/cadastro", async (req, res) => {

    const {
        nome,
        nome_usuario,
        email,
        senha
    } = req.body;


    // Verifica se todos os campos foram preenchidos
    if (!nome || !nome_usuario || !email || !senha) {

        return res.status(400).json({
            mensagem: "Preencha todos os campos."
        });

    }


    try {

        // Verifica se o nome de usuário ou e-mail já existem no banco de dados
        const [usuarios] = await db.promise().query(
            `
            SELECT id_usuario
            FROM usuario
            WHERE nome_usuario = ? OR email = ?
            `,
            [nome_usuario, email]
        );


        if (usuarios.length > 0) {

            return res.status(409).json({
                mensagem: "Nome de usuário ou e-mail já cadastrado."
            });

        }


        // Criptografa a senha
        const senhaCriptografada = await bcrypt.hash(senha, 10);// 10 é o número de salt rounds, que define a complexidade da criptografia
        


        // Insere o usuário no banco
        await db.promise().query(
            `
            INSERT INTO usuario
            (nome, nome_usuario, email, senha)
            VALUES (?, ?, ?, ?)
            `,
            [
                nome,
                nome_usuario,
                email,
                senhaCriptografada
            ]
        );


        res.status(201).json({
            mensagem: "Conta criada com sucesso!"
        });


    } catch (erro) {

        console.error("Erro ao cadastrar usuário:", erro);

        res.status(500).json({
            mensagem: "Erro ao criar a conta."
        });

    }

});

// ================================
// LOGIN DE USUÁRIO
// ================================

app.post("/login", async (req, res) => {

    const {
        identificacao,
        senha
    } = req.body;


    // Verifica se os campos foram preenchidos
    if (!identificacao || !senha) {

        return res.status(400).json({
            mensagem: "Preencha todos os campos."
        });

    }


    try {

        // Procura pelo e-mail OU nome de usuário
        const [usuarios] = await db.promise().query(
            `
            SELECT *
            FROM usuario
            WHERE email = ? OR nome_usuario = ?
            `,
            [
                identificacao,
                identificacao
            ]
        );


        // Usuário não encontrado
        if (usuarios.length === 0) {

            return res.status(401).json({
                mensagem: "E-mail, nome de usuário ou senha incorretos."
            });

        }


        const usuario = usuarios[0];


        // Compara a senha digitada com o hash armazenado
        const senhaCorreta = await bcrypt.compare(
            senha,
            usuario.senha
        );


        // Senha incorreta
        if (!senhaCorreta) {

            return res.status(401).json({
                mensagem: "E-mail, nome de usuário ou senha incorretos."
            });

        }


        // Login realizado
        res.status(200).json({

            mensagem: "Login realizado com sucesso!",

            usuario: {
                id_usuario: usuario.id_usuario,
                nome: usuario.nome,
                nome_usuario: usuario.nome_usuario,
                email: usuario.email,
                foto_perfil: usuario.foto_perfil,
                xp: usuario.xp
            }

        });


    } catch (erro) {

        console.error("Erro ao realizar login:", erro);

        res.status(500).json({
            mensagem: "Erro ao realizar login."
        });

    }

});


// ================================
// PERFIL, DIÁRIO, ANOTAÇÕES E CONQUISTAS
// ================================

require("./rotas/stellifer")(app, db);


// ================================
// INICIA O SERVIDOR
// ================================

app.listen(PORT, () => {

    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);

});