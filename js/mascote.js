// =====================================================
// MASCOTE DO STELLIFER
// =====================================================
//
// Um garotinho que mora no site: passeia, escala os cards,
// cochila, dança, brinca de ioiô e reage quando você troca
// de página. Se você trocar de página demais, ele fica
// zangado!
//
// COMO ESTE ARQUIVO ESTÁ ORGANIZADO
//   1. Opções e textos       (cores, estilos, falas)
//   2. Desenho (SVG)         (o corpo do garotinho)
//   3. Pose e expressões     (como ele se mexe)
//   4. Comportamento         (o que ele decide fazer)
//   5. Percepção de páginas  (curiosidade e birra)
//   6. Interação             (clicar, arrastar)
//   7. Painel de personalização
//   8. Início
//
// Tudo fica dentro de uma função para não conflitar com
// os outros scripts do site.

(function () {

    "use strict";


    // =================================================
    // 1. OPÇÕES E TEXTOS
    // =================================================

    const CHAVES = {
        config: "stellifer-mascote",
        navs: "stellifer-mascote-navs",
        saida: "stellifer-mascote-saida",
        visto: "stellifer-mascote-visto"
    };

    // Quantas trocas de página, em quanto tempo, deixam ele zangado
    const LIMITE_TROCAS = 4;
    const JANELA_MS = 40000;

    // Se a página nova abrir até 12 s depois de sair da outra,
    // ele entende que você "trocou de página".
    const SAIDA_MS = 12000;

    const REDUZIR = !!(window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches);

    // Onde ele pode subir (topo dos cards, título, botão...)
    const SELETOR_PLATAFORMAS = [
        ".stat-card",
        ".highlight-work",
        ".work-card",
        ".note-card",
        ".conquistas-card",
        ".perfil-card",
        ".carousel-container",
        ".welcome h1",
        ".add-button"
    ].join(",");

    const PELES = [
        ["#f3d2b3", "Claro"],
        ["#e2b184", "Dourado"],
        ["#c68b5c", "Moreno claro"],
        ["#a06b44", "Moreno"],
        ["#7a4a2e", "Moreno escuro"],
        ["#4f2f1f", "Escuro"]
    ];

    const CORES_CABELO = [
        ["#23150f", "Preto"],
        ["#4a2c1a", "Castanho"],
        ["#b8782e", "Mel"],
        ["#b84a3a", "Ruivo"],
        ["#2e4a7a", "Azul-noite"],
        ["#4a7a52", "Verde-musgo"]
    ];

    const ESTILOS_CABELO = [
        ["curto", "Curtinho"],
        ["cacheado", "Cacheado"],
        ["afro", "Black power"],
        ["topete", "Topetinho"]
    ];

    const ROUPAS = [
        { nome: "Verde-gramado", camisa: "#7fa36f", calca: "#5b6f87" },
        { nome: "Azul-céu", camisa: "#6aa6c9", calca: "#8a6a4f" },
        { nome: "Amarelo-sol", camisa: "#f0c75e", calca: "#5b6f87" },
        { nome: "Rosa", camisa: "#e58fa0", calca: "#5f6f5a" },
        { nome: "Lilás", camisa: "#9c8bc4", calca: "#4b5a73" },
        { nome: "Laranja", camisa: "#e8915a", calca: "#4f6a86" }
    ];

    const ACESSORIOS = [
        ["nenhum", "Nenhum"],
        ["estrela", "Estrelinha"],
        ["chapeu", "Chapéu de palha"],
        ["oculos", "Óculos"],
        ["lenco", "Lenço"]
    ];

    const TAMANHOS = [
        ["p", "Pequeno", 0.75],
        ["m", "Médio", 1],
        ["g", "Grande", 1.3]
    ];

    const AGITOS = [
        ["calmo", "Calmo"],
        ["normal", "Normal"],
        ["travesso", "Travesso"]
    ];

    const AGITO_VALORES = {
        calmo: { espera: 1.8, vel: 0.75, danca: 0.7 },
        normal: { espera: 1, vel: 1, danca: 1 },
        travesso: { espera: 0.55, vel: 1.3, danca: 1.6 }
    };

    const PADRAO = {
        ativo: true,
        nome: "Stellifer",
        pele: "#a06b44",
        cabelo: "cacheado",
        corCabelo: "#23150f",
        roupa: 2,
        acessorio: "estrela",
        tamanho: "m",
        agito: "normal"
    };

    // Falas do mascote
    const FALAS = {
        novo: function (n) {
            return "Oi! Eu sou o " + n + "! 👋 Dá pra me personalizar no botão do canto.";
        },
        volta: ["Oi de novo! 👋", "Voltei!", "Bom te ver por aqui!"],
        clique: function (n) {
            return [
                "Oi! 👋",
                "Hehe, cócegas!",
                "Quer brincar?",
                "Eu sou o " + n + "!",
                "Que história vamos guardar hoje? 📖",
                "Vamos ler mais um capítulo?"
            ];
        },
        curioso: [
            "Ué? Pra onde você foi? 👀",
            "Opa, o que é isso?",
            "Me espera! 👀",
            "Tem coisa nova aqui?",
            "Hm… o que será que tem ali?"
        ],
        bravo: [
            "Para de trocar de página!",
            "Tô ficando tonto!! 💢",
            "Chega! Eu cansei!"
        ],
        emburrado: ["hmpf...", "Não tô falando com você.", "...", "Me deixa."],
        passou: ["Tá bom, tá bom… já passou.", "Hmpf. Tô melhor.", "Pronto, passou! 😌"],
        acordar: ["Ahn? Eu dormi? 😴", "*bocejo*", "Hã? Quê?"],
        ioio: ["Olha esse truque!", "Sobe e desce, sobe e desce!"],
        danca: ["♪ la la la ♪", "Olha meu passinho!"],
        largado: ["Wheee!", "Uiii!"]
    };


    // =================================================
    // UTILIDADES
    // =================================================

    function clamp(v, a, b) {
        return Math.min(b, Math.max(a, v));
    }

    function lerp(a, b, k) {
        return a + (b - a) * k;
    }

    function rnd(a, b) {
        return a + Math.random() * (b - a);
    }

    function pick(lista) {
        return lista[Math.floor(Math.random() * lista.length)];
    }

    function f(n) {
        return Math.round(n * 100) / 100;
    }

    // Escurece uma cor "#rrggbb"
    function escurecer(hex, fator) {

        const n = parseInt(hex.slice(1), 16);

        const r = Math.round(((n >> 16) & 255) * fator);
        const g = Math.round(((n >> 8) & 255) * fator);
        const b = Math.round((n & 255) * fator);

        return "rgb(" + r + "," + g + "," + b + ")";
    }

    function ler(chave, padrao) {

        try {

            const v = localStorage.getItem(chave);

            return v === null ? padrao : JSON.parse(v);

        } catch (erro) {

            return padrao;
        }
    }

    function gravar(chave, valor) {

        try {
            localStorage.setItem(chave, JSON.stringify(valor));
        } catch (erro) {
            // Sem localStorage: vale só nesta visita.
        }
    }

    // Garante que a configuração só tenha valores válidos
    function sanear(c) {

        c = (c && typeof c === "object") ? c : {};

        const d = PADRAO;

        function em(lista, v, padrao) {
            return lista.some(function (x) { return x[0] === v; }) ? v : padrao;
        }

        return {
            ativo: c.ativo !== false,
            nome: (typeof c.nome === "string" && c.nome.trim())
                ? c.nome.trim().slice(0, 14)
                : d.nome,
            pele: em(PELES, c.pele, d.pele),
            cabelo: em(ESTILOS_CABELO, c.cabelo, d.cabelo),
            corCabelo: em(CORES_CABELO, c.corCabelo, d.corCabelo),
            roupa: (Number.isInteger(c.roupa) && c.roupa >= 0 && c.roupa < ROUPAS.length)
                ? c.roupa
                : d.roupa,
            acessorio: em(ACESSORIOS, c.acessorio, d.acessorio),
            tamanho: em(TAMANHOS, c.tamanho, d.tamanho),
            agito: em(AGITOS, c.agito, d.agito)
        };
    }


    // =================================================
    // 2. DESENHO (SVG)
    // =================================================
    //
    // Medidas: os pés ficam na origem (0, 0) e o garotinho
    // tem uns 100 de altura. O desenho inteiro usa classes
    // (m-pele, m-camisa...) pintadas por variáveis CSS, e é
    // assim que a personalização funciona.

    function marcacaoSVG() {

        return `
<svg class="m-svg" viewBox="-60 -125 120 135" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">

  <ellipse class="m-sombra" cx="0" cy="0.5" rx="19" ry="4.2"/>

  <g class="m-pose">

    <!-- área clicável -->
    <rect class="m-hit" x="-26" y="-106" width="52" height="110" rx="22"/>

    <!-- pernas -->
    <g transform="translate(-7 -26)"><g class="m-perna-e">
      <rect class="m-calca" x="-4.6" y="0" width="9.2" height="20" rx="4.2"/>
      <ellipse class="m-sapato" cx="0.6" cy="21.6" rx="7" ry="4.2"/>
    </g></g>
    <g transform="translate(7 -26)"><g class="m-perna-d">
      <rect class="m-calca" x="-4.6" y="0" width="9.2" height="20" rx="4.2"/>
      <ellipse class="m-sapato" cx="-0.6" cy="21.6" rx="7" ry="4.2"/>
    </g></g>

    <!-- cós da calça, pescoço e camisa -->
    <rect class="m-calca" x="-14.5" y="-31" width="29" height="11" rx="5.5"/>
    <rect class="m-pele-s" x="-3.8" y="-63" width="7.6" height="9" rx="3"/>
    <rect class="m-camisa" x="-15" y="-58" width="30" height="31" rx="12"/>
    <path class="m-estrela-peito" d="M0 -50 L1.5 -45.5 L6 -44 L1.5 -42.5 L0 -38 L-1.5 -42.5 L-6 -44 L-1.5 -45.5 Z"/>

    <!-- lenço (acessório) -->
    <g class="m-a-lenco">
      <path d="M-13 -58 Q0 -50 13 -58 L10 -51 Q0 -44.5 -10 -51 Z" fill="#e9707f"/>
      <path d="M-2.5 -48 L4 -48 L2.4 -39 Z" fill="#d9566a"/>
    </g>

    <!-- braços -->
    <g transform="translate(-16 -50)"><g class="m-braco-e">
      <rect class="m-pele" x="-3.7" y="5" width="7.4" height="15" rx="3.7"/>
      <circle class="m-pele" cx="0" cy="21.5" r="4.6"/>
      <rect class="m-camisa" x="-5.2" y="-2" width="10.4" height="11" rx="5"/>
    </g></g>
    <g transform="translate(16 -50)"><g class="m-braco-d">
      <rect class="m-pele" x="-3.7" y="5" width="7.4" height="15" rx="3.7"/>
      <circle class="m-pele" cx="0" cy="21.5" r="4.6"/>
      <rect class="m-camisa" x="-5.2" y="-2" width="10.4" height="11" rx="5"/>
    </g></g>

    <!-- cabeça -->
    <g transform="translate(0 -74)"><g class="m-cabeca">

      <!-- cabelo de trás (black power) -->
      <circle class="m-cabelo m-h-afro" cx="0" cy="-8" r="26.5"/>

      <!-- orelhas e rosto -->
      <circle class="m-pele-s" cx="-18.6" cy="3" r="4.3"/>
      <circle class="m-pele-s" cx="18.6" cy="3" r="4.3"/>
      <ellipse class="m-pele" cx="0" cy="0" rx="19" ry="18"/>

      <!-- feições -->
      <g class="m-feicoes">
        <ellipse class="m-rubor" cx="-11.5" cy="8.5" rx="3.8" ry="2.4"/>
        <ellipse class="m-rubor" cx="11.5" cy="8.5" rx="3.8" ry="2.4"/>

        <g class="m-olhos-abertos">
          <g class="m-olho-e" transform="translate(-7 3)">
            <ellipse rx="3" ry="3.9" fill="#2a1810"/>
            <circle cx="-0.9" cy="-1.5" r="1.15" fill="#ffffff"/>
          </g>
          <g class="m-olho-d" transform="translate(7 3)">
            <ellipse rx="3" ry="3.9" fill="#2a1810"/>
            <circle cx="-0.9" cy="-1.5" r="1.15" fill="#ffffff"/>
          </g>
        </g>
        <g class="m-olhos-fechados" style="display:none">
          <path d="M-10.8 3.6 Q-7 7.2 -3.2 3.6"/>
          <path d="M3.2 3.6 Q7 7.2 10.8 3.6"/>
        </g>
        <g class="m-olhos-felizes" style="display:none">
          <path d="M-10.8 5 Q-7 0.2 -3.2 5"/>
          <path d="M3.2 5 Q7 0.2 10.8 5"/>
        </g>

        <path class="m-sobr-e" d=""/>
        <path class="m-sobr-d" d=""/>
        <path class="m-nariz" d="M-1.3 7.2 Q0 8.8 1.3 7.2"/>
        <path class="m-boca" d=""/>
      </g>

      <!-- cabelo da frente -->
      <g class="m-h-curto">
        <path class="m-cabelo" d="M-19.6 -1.5 C-22 -18 -9 -25 0 -25 C9 -25 22 -18 19.6 -1.5 C17.5 -7 13.5 -10 8.5 -11 C5.5 -13.5 -1 -12.8 -4.2 -10.6 C-8 -11.4 -14 -9.2 -16.6 -4 C-17.6 -2.6 -18.6 -1.8 -19.6 -1.5 Z"/>
      </g>
      <g class="m-h-topete">
        <path class="m-traco-cabelo" d="M0.5 -24 C-3 -33 4 -37 9 -33"/>
      </g>
      <g class="m-h-cacheado">
        <circle class="m-cabelo" cx="-14" cy="-13" r="7.5"/>
        <circle class="m-cabelo" cx="-7" cy="-19" r="8"/>
        <circle class="m-cabelo" cx="2" cy="-21" r="8"/>
        <circle class="m-cabelo" cx="11" cy="-18" r="8"/>
        <circle class="m-cabelo" cx="16" cy="-10" r="7"/>
        <circle class="m-cabelo" cx="-17.5" cy="-4" r="4.6"/>
        <circle class="m-cabelo" cx="17.5" cy="-4" r="4.6"/>
        <circle class="m-cabelo" cx="-10" cy="-10.5" r="4.5"/>
        <circle class="m-cabelo" cx="-3" cy="-12" r="4.6"/>
        <circle class="m-cabelo" cx="4.5" cy="-12" r="4.6"/>
        <circle class="m-cabelo" cx="11.5" cy="-10" r="4.4"/>
      </g>
      <g class="m-h-afro">
        <path class="m-cabelo" d="M-17 -5 C-17 -15 -9 -19 0 -19 C9 -19 17 -15 17 -5 C13 -10 7 -13 0 -13 C-7 -13 -13 -10 -17 -5 Z"/>
      </g>

      <!-- acessórios da cabeça -->
      <g class="m-a-chapeu"><g class="m-ac-pos">
        <ellipse cx="0" cy="-15" rx="28" ry="5.5" fill="#ecd58a" stroke="#c9ab5a" stroke-width="1.2"/>
        <path d="M-16.5 -16 C-16.5 -39 16.5 -39 16.5 -16 Z" fill="#f0d98f" stroke="#c9ab5a" stroke-width="1.2"/>
        <path d="M-16.3 -19 Q0 -14.5 16.3 -19 L16.4 -15.5 Q0 -11 -16.4 -15.5 Z" fill="#c0707c"/>
      </g></g>

      <g class="m-a-oculos">
        <circle cx="-7" cy="3" r="6" fill="rgba(255,255,255,0.2)" stroke="#3a2a20" stroke-width="1.5"/>
        <circle cx="7" cy="3" r="6" fill="rgba(255,255,255,0.2)" stroke="#3a2a20" stroke-width="1.5"/>
        <path d="M-1 2.4 Q0 1.2 1 2.4" fill="none" stroke="#3a2a20" stroke-width="1.5"/>
        <path d="M-13 2.2 L-18.5 0.8 M13 2.2 L18.5 0.8" fill="none" stroke="#3a2a20" stroke-width="1.4" stroke-linecap="round"/>
      </g>

      <g class="m-a-estrela"><g class="m-ac-pos">
        <path d="M0 -5 L1.5 -1.5 L5 0 L1.5 1.5 L0 5 L-1.5 1.5 L-5 0 L-1.5 -1.5 Z" transform="translate(10.5 -17)" fill="#f7d96a" stroke="#c9a53a" stroke-width="0.8"/>
      </g></g>

    </g></g>

    <!-- ioiô -->
    <g class="m-ioio" style="display:none">
      <line class="m-ioio-fio" x1="0" y1="0" x2="0" y2="10"/>
      <g class="m-ioio-disco">
        <circle r="6.6" fill="#e8574b" stroke="#fff6e0" stroke-width="1.6"/>
        <line x1="-5.6" y1="0" x2="5.6" y2="0" stroke="#fff6e0" stroke-width="1.3"/>
      </g>
    </g>

  </g>

  <!-- balõezinhos e símbolos -->
  <g class="m-fx"><g class="m-fx-pos" transform="translate(20 -112)">

    <g class="m-fx-zzz" style="display:none">
      <text x="2" y="0">z</text>
      <text x="10" y="-11">z</text>
      <text x="19" y="-23">Z</text>
    </g>

    <g class="m-fx-int" style="display:none"><g class="m-fx-bal">
      <circle r="9.5" fill="#fffaf0" stroke="#7fa36f" stroke-width="1.5"/>
      <text y="5.4" text-anchor="middle" fill="#4f7249">?</text>
    </g></g>

    <g class="m-fx-exc" style="display:none"><g class="m-fx-bal">
      <circle r="9.5" fill="#fffaf0" stroke="#e0a43a" stroke-width="1.5"/>
      <text y="5.4" text-anchor="middle" fill="#b07a1c">!</text>
    </g></g>

    <g class="m-fx-raiva" style="display:none">
      <path d="M-7 -3 Q-3 -3 -3 -7 M7 -3 Q3 -3 3 -7 M-7 3 Q-3 3 -3 7 M7 3 Q3 3 3 7"
            fill="none" stroke="#d9443f" stroke-width="2.6" stroke-linecap="round"/>
    </g>

    <g class="m-fx-notas" style="display:none">
      <text x="-16" y="0">♪</text>
      <text x="8" y="-9">♫</text>
    </g>

    <g class="m-fx-coracao" style="display:none">
      <path d="M0 7 C-10 -1 -6 -10 0 -4.5 C6 -10 10 -1 0 7 Z" fill="#e9707f"/>
    </g>

    <g class="m-fx-ret" style="display:none">
      <text x="0" y="0" text-anchor="middle">...</text>
    </g>

  </g></g>

</svg>`;
    }

    // Cria um garotinho (usado no mundo e na prévia do painel)
    function criarInstancia() {

        const molde = document.createElement("div");

        molde.innerHTML = marcacaoSVG().trim();

        const svg = molde.firstElementChild;

        function q(seletor) {
            return svg.querySelector(seletor);
        }

        return {

            el: svg,

            expr: null,

            fxChave: null,

            topo: 0,

            partes: {
                pose: q(".m-pose"),
                sombra: q(".m-sombra"),
                hit: q(".m-hit"),
                pernaE: q(".m-perna-e"),
                pernaD: q(".m-perna-d"),
                bracoE: q(".m-braco-e"),
                bracoD: q(".m-braco-d"),
                cabeca: q(".m-cabeca"),
                feicoes: q(".m-feicoes"),
                olhosAbertos: q(".m-olhos-abertos"),
                olhosFechados: q(".m-olhos-fechados"),
                olhosFelizes: q(".m-olhos-felizes"),
                olhoE: q(".m-olho-e"),
                olhoD: q(".m-olho-d"),
                sobrE: q(".m-sobr-e"),
                sobrD: q(".m-sobr-d"),
                boca: q(".m-boca"),
                rubores: svg.querySelectorAll(".m-rubor"),
                ioio: q(".m-ioio"),
                ioioFio: q(".m-ioio-fio"),
                ioioDisco: q(".m-ioio-disco"),
                fxPos: q(".m-fx-pos"),
                fx: {
                    zzz: q(".m-fx-zzz"),
                    int: q(".m-fx-int"),
                    exc: q(".m-fx-exc"),
                    raiva: q(".m-fx-raiva"),
                    notas: q(".m-fx-notas"),
                    coracao: q(".m-fx-coracao"),
                    ret: q(".m-fx-ret")
                },
                posAcessorios: svg.querySelectorAll(".m-ac-pos")
            }
        };
    }

    // Pinta o garotinho com a configuração escolhida
    function aplicarConfig(inst, c) {

        const s = inst.el.style;

        const roupa = ROUPAS[c.roupa];

        s.setProperty("--m-pele", c.pele);
        s.setProperty("--m-pele-s", escurecer(c.pele, 0.82));
        s.setProperty("--m-cabelo", c.corCabelo);
        s.setProperty("--m-sobr", escurecer(c.corCabelo, 0.8));
        s.setProperty("--m-camisa", roupa.camisa);
        s.setProperty("--m-calca", roupa.calca);

        inst.el.setAttribute("data-cabelo", c.cabelo);
        inst.el.setAttribute("data-acessorio", c.acessorio);

        // Acessórios sobem um pouco quando o cabelo é volumoso
        const subida = { curto: 0, topete: 0, cacheado: -3, afro: -9 }[c.cabelo] || 0;

        inst.partes.posAcessorios.forEach(function (g) {
            g.setAttribute("transform", "translate(0 " + subida + ")");
        });

        // Altura extra no topo (para balões e símbolos)
        const extraCabelo = { curto: 0, topete: -8, cacheado: -5, afro: -10 }[c.cabelo] || 0;

        inst.topo = extraCabelo + (c.acessorio === "chapeu" ? -12 : 0);
    }


    // =================================================
    // 3. POSE E EXPRESSÕES
    // =================================================

    // o: olhos ('a' abertos, 'c' fechados, 'f' felizes)
    // e / d: sobrancelhas  |  b: boca
    const EXPRESSOES = {

        smile: {
            o: "a",
            e: "M-11 -6.4 Q-7.5 -8.4 -4 -6.8",
            d: "M4 -6.8 Q7.5 -8.4 11 -6.4",
            b: "M-4.6 11 Q0 15.6 4.6 11",
            cheia: false, rubor: 0.38, vermelho: false
        },

        happy: {
            o: "f",
            e: "M-11 -7.6 Q-7.5 -9.6 -4 -8",
            d: "M4 -8 Q7.5 -9.6 11 -7.6",
            b: "M-5.2 10.2 Q0 19.5 5.2 10.2 Z",
            cheia: true, rubor: 0.55, vermelho: false
        },

        bravo: {
            o: "a",
            e: "M-11.5 -9.4 L-3.5 -5.4",
            d: "M3.5 -5.4 L11.5 -9.4",
            b: "M-4.4 14.4 Q0 10 4.4 14.4",
            cheia: false, rubor: 0.75, vermelho: true
        },

        curious: {
            o: "a",
            e: "M-11 -6.4 Q-7.5 -8.4 -4 -6.8",
            d: "M4 -11 Q7.5 -13 11 -10.6",
            b: "M-1.8 12.6 a2.1 2.4 0 1 0 4.2 0 a2.1 2.4 0 1 0 -4.2 0",
            cheia: false, rubor: 0.38, vermelho: false
        },

        sleep: {
            o: "c",
            e: "M-10.5 -5.6 Q-7 -7 -3.8 -5.8",
            d: "M3.8 -5.8 Q7 -7 10.5 -5.6",
            b: "M-1.7 12.6 a1.7 2.1 0 1 0 3.4 0 a1.7 2.1 0 1 0 -3.4 0",
            cheia: true, rubor: 0.45, vermelho: false
        },

        surprised: {
            o: "a",
            e: "M-11 -10 Q-7.5 -12.6 -4 -10",
            d: "M4 -10 Q7.5 -12.6 11 -10",
            b: "M-2.7 12 a2.7 3.3 0 1 0 5.4 0 a2.7 3.3 0 1 0 -5.4 0",
            cheia: true, rubor: 0.4, vermelho: false
        },

        effort: {
            o: "a",
            e: "M-11 -8 L-3.8 -6",
            d: "M3.8 -6 L11 -8",
            b: "M-3.6 12.6 L3.6 12.6",
            cheia: false, rubor: 0.5, vermelho: false
        }
    };

    function definirExpressao(inst, nome) {

        if (inst.expr === nome) {
            return;
        }

        inst.expr = nome;

        const e = EXPRESSOES[nome] || EXPRESSOES.smile;

        const p = inst.partes;

        p.olhosAbertos.style.display = e.o === "a" ? "" : "none";
        p.olhosFechados.style.display = e.o === "c" ? "" : "none";
        p.olhosFelizes.style.display = e.o === "f" ? "" : "none";

        p.sobrE.setAttribute("d", e.e);
        p.sobrD.setAttribute("d", e.d);

        p.boca.setAttribute("d", e.b);
        p.boca.setAttribute("fill", e.cheia ? "#8a3b34" : "none");

        p.rubores.forEach(function (r) {
            r.setAttribute("opacity", e.rubor);
            r.setAttribute("fill", e.vermelho ? "#e5484d" : "#f08a7a");
        });
    }

    // Aplica uma pose (números) nas partes do desenho
    function aplicarPose(inst, p) {

        const P = inst.partes;

        // Corpo todo: deitar, inclinar, pular, amassar
        const angulo = p.lie * 90 * p.lieDir + p.lean * (1 - p.lie);

        P.pose.setAttribute("transform",
            "translate(" + f(p.jx) + " " + f(p.bob - p.lie * 17) + ") " +
            "rotate(" + f(angulo) + ") " +
            "scale(" + f(p.sx) + " " + f(p.sq) + ")");

        // Sombra no chão
        const altura = Math.min(1, Math.max(0, -p.bob) / 40);

        P.sombra.setAttribute("transform",
            "translate(" + f(p.lie * p.lieDir * 38) + " 0) " +
            "scale(" + f((1 + p.lie * 1.9) * (1 - altura * 0.45)) + " 1)");

        // Membros
        P.pernaE.setAttribute("transform",
            "translate(0 " + f(-p.liftL) + ") rotate(" + f(p.lL) + ")");

        P.pernaD.setAttribute("transform",
            "translate(0 " + f(-p.liftR) + ") rotate(" + f(-p.lR) + ")");

        P.bracoE.setAttribute("transform", "rotate(" + f(p.aL) + ")");

        P.bracoD.setAttribute("transform", "rotate(" + f(-p.aR) + ")");

        // Cabeça e rosto
        P.cabeca.setAttribute("transform",
            "translate(" + f(p.look * 0.9) + " 0) rotate(" + f(p.tilt) + " 0 16)");

        P.feicoes.setAttribute("transform",
            "translate(" + f(p.look * 3.3) + " " + f(p.lookY * 1.6) + ")");

        P.olhosAbertos.setAttribute("transform",
            "translate(" + f(p.look * 1.2) + " " + f(p.lookY * 1)  + ")");

        const piscar = f(1 - 0.92 * p.blink);

        P.olhoE.setAttribute("transform", "translate(-7 3) scale(1 " + piscar + ")");
        P.olhoD.setAttribute("transform", "translate(7 3) scale(1 " + piscar + ")");

        definirExpressao(inst, p.expr);

        // Ioiô
        if (p.yoyo) {

            const a = p.aR * Math.PI / 180;

            const hx = 16 + 21.5 * Math.sin(a);
            const hy = -50 + 21.5 * Math.cos(a);

            P.ioio.style.display = "";

            P.ioioFio.setAttribute("x1", f(hx));
            P.ioioFio.setAttribute("y1", f(hy));
            P.ioioFio.setAttribute("x2", f(hx));
            P.ioioFio.setAttribute("y2", f(hy + p.yoyoLen));

            P.ioioDisco.setAttribute("transform",
                "translate(" + f(hx) + " " + f(hy + p.yoyoLen) + ") rotate(" + f(p.yoyoRot) + ")");

        } else {

            P.ioio.style.display = "none";
        }

        // Símbolos (zzz, ?, !, raiva, notas, coração)
        const chave = p.fx.join(",");

        if (inst.fxChave !== chave) {

            inst.fxChave = chave;

            Object.keys(P.fx).forEach(function (nome) {
                P.fx[nome].style.display = p.fx.indexOf(nome) >= 0 ? "" : "none";
            });
        }

        P.fxPos.setAttribute("transform",
            p.lie > 0.5
                ? "translate(" + f(p.lieDir * 72) + " -50)"
                : "translate(20 " + f(-112 + inst.topo) + ")");
    }

    const REPOUSO = {
        aL: 8, aR: 8, lL: 0, lR: 0, liftL: 0, liftR: 0,
        lean: 0, tilt: 0, lie: 0, lieDir: 1,
        bob: 0, sq: 1, sx: 1, jx: 0,
        look: 0, lookY: 0, blink: 0,
        expr: "smile", fx: [], yoyo: false, yoyoLen: 0, yoyoRot: 0
    };


    // =================================================
    // ESTADO DO MASCOTE
    // =================================================

    let cfg = sanear(ler(CHAVES.config, null));

    let S = 1;                              // escala (tamanho)
    let A = AGITO_VALORES.normal;           // agitação

    let ativo = false;
    let rafId = 0;
    let ultimoTs = 0;

    let gen = 0;                            // cada "interrupção" aumenta
    let idVida = 0;
    let esperando = [];
    let fila = [];

    let raiz = null;
    let inst = null;
    let balao = null;
    let timerBalao = 0;

    const M = {
        x: 0, y: 0,
        dir: 1,
        modo: "parado", modoAnt: "", tModo: 0, tG: 0,
        sup: null,                          // card em que ele está em cima
        solo: true,                         // está no chão?
        lieDir: 1,
        fase: 0, xAnt: 0,
        humor: "calmo", bravoAte: 0,
        ultima: null,
        piscaEm: 2, piscaT: -1
    };

    // pose atual (suavizada) e pose-alvo
    const cur = Object.assign({}, REPOUSO);

    const BASE = {
        aL: 8, aR: 8, lL: 0, lR: 0, liftL: 0, liftR: 0,
        lean: 0, tilt: 0, lie: 0, bob: 0, sq: 1, sx: 1, jx: 0,
        look: 0, lookY: 0,
        expr: "smile", yoyo: false, yoyoLen: 0, yoyoRot: 0
    };

    const T = Object.assign({ fx: [] }, BASE);

    const VELOCIDADE_SUAVE = {
        aL: 18, aR: 18, lL: 20, lR: 20, liftL: 30, liftR: 30,
        lean: 12, tilt: 12, lie: 7, bob: 35, sq: 30, sx: 40, jx: 90,
        look: 10, lookY: 10
    };

    const ult = { x: 0, y: 0, tem: false };      // último ponto do mouse

    let arrastando = false;
    let arr = null;
    let ultimoClique = 0;

    let trocas = ler(CHAVES.navs, []);

    if (!Array.isArray(trocas)) {
        trocas = [];
    }


    // =================================================
    // 4. COMPORTAMENTO
    // =================================================
    //
    // Cada "ação" é uma função assíncrona (aAndar, aDormir,
    // aDancar...). Elas esperam o próximo quadro com
    // proximoFrame() e mudam M.modo, que decide a pose.

    const CANCELA = { cancelado: true };

    function proximoFrame(meu) {

        return new Promise(function (resolve, reject) {
            esperando.push({ resolve: resolve, reject: reject, meu: meu });
        });
    }

    // Interrompe o que ele está fazendo e começa outra ação
    function interromper(acao) {

        fila.unshift(acao);

        gen++;
    }

    async function esperar(meu, segundos) {

        let t = 0;

        while (t < segundos) {
            t += await proximoFrame(meu);
        }
    }

    function chaoY() {
        return window.innerHeight - 6;
    }

    function alturaCabecalho() {

        const h = document.querySelector("header");

        return h ? h.getBoundingClientRect().bottom : 0;
    }

    function topoVisivel() {
        return alturaCabecalho() + 24;
    }

    // Lugares onde ele pode subir (visíveis agora)
    function plataformas() {

        const topo = alturaCabecalho() + 40;
        const base = window.innerHeight - 70;

        const lista = [];

        document.querySelectorAll(SELETOR_PLATAFORMAS).forEach(function (el) {

            const r = el.getBoundingClientRect();

            if (r.width < 120 || r.height < 30) {
                return;
            }

            if (r.top < topo || r.top > base) {
                return;
            }

            lista.push({ el: el, l: r.left, r: r.right, top: r.top });
        });

        return lista;
    }

    // Os que dá para alcançar escalando a partir do chão
    function plataformasAlcancaveis() {

        return plataformas().filter(function (p) {

            const alcance = chaoY() - p.top <= 560;

            const ladoLivre = p.l - 16 > 26 || p.r + 16 < window.innerWidth - 26;

            return alcance && ladoLivre;
        });
    }

    // Limites onde ele pode andar (chão ou em cima de um card)
    function limites() {

        if (M.sup) {

            const r = M.sup.getBoundingClientRect();

            const a = r.left + 18;
            const b = r.right - 18;

            return b > a ? { a: a, b: b } : { a: r.left + r.width / 2, b: r.left + r.width / 2 };
        }

        return { a: 24, b: window.innerWidth - 24 };
    }

    // Fala dentro de um balãozinho
    function say(texto, ms) {

        if (!balao) {
            return;
        }

        balao.textContent = texto;

        balao.classList.add("visivel");

        clearTimeout(timerBalao);

        timerBalao = setTimeout(function () {

            if (balao) {
                balao.classList.remove("visivel");
            }

        }, ms || 2800);
    }

    async function andarAte(meu, alvoX, velocidade, modo) {

        M.modo = modo || "andar";

        if (REDUZIR) {

            M.x = alvoX;

            await proximoFrame(meu);

            return;
        }

        for (;;) {

            const dt = await proximoFrame(meu);

            const lim = limites();

            // quem está chegando de fora da tela não é limitado
            const alvo = (M.x < lim.a - 5 || M.x > lim.b + 5) && !M.sup
                ? alvoX
                : clamp(alvoX, lim.a, lim.b);

            const d = alvo - M.x;

            if (Math.abs(d) <= velocidade * dt) {

                M.x = alvo;

                break;
            }

            M.dir = d > 0 ? 1 : -1;

            M.x += M.dir * velocidade * dt;
        }
    }

    // Queda com gravidade (pode pousar em outro card)
    async function aCair(meu, vx, vy) {

        M.sup = null;
        M.solo = false;
        M.modo = "cair";

        if (REDUZIR) {

            M.solo = true;
            M.y = chaoY();

            return;
        }

        vx = vx || 0;
        vy = vy || 0;

        for (;;) {

            const dt = await proximoFrame(meu);

            vy += 1700 * dt;

            const ny = M.y + vy * dt;

            const nx = clamp(M.x + vx * dt, 24, window.innerWidth - 24);

            if (vy > 0) {

                const lista = plataformas();

                let pousou = null;

                for (let i = 0; i < lista.length; i++) {

                    const p = lista[i];

                    if (nx > p.l + 8 && nx < p.r - 8 && M.y <= p.top + 3 && ny >= p.top) {

                        pousou = p;

                        break;
                    }
                }

                if (pousou) {

                    M.x = nx;
                    M.y = pousou.top;
                    M.sup = pousou.el;

                    break;
                }
            }

            if (ny >= chaoY()) {

                M.x = nx;
                M.y = chaoY();
                M.solo = true;

                break;
            }

            M.x = nx;
            M.y = ny;
        }

        M.modo = "aterrissar";

        await esperar(meu, 0.24);
    }

    async function aParado(meu) {

        M.modo = "parado";

        await esperar(meu, rnd(1.8, 4.2) * A.espera);
    }

    async function aAndar(meu) {

        const lim = limites();

        let alvo = rnd(lim.a, lim.b);

        if (Math.abs(alvo - M.x) < 70) {
            alvo = clamp(M.x + (Math.random() < 0.5 ? -1 : 1) * rnd(90, 220), lim.a, lim.b);
        }

        const correndo = !M.sup && Math.random() < 0.18;

        await andarAte(meu, alvo, (correndo ? 140 : 62) * S * A.vel, correndo ? "correr" : "andar");
    }

    async function aEscalar(meu, pressa) {

        if (REDUZIR || M.sup) {
            return aAndar(meu);
        }

        const candidatos = plataformasAlcancaveis();

        if (!candidatos.length) {
            return aAndar(meu);
        }

        const p = pick(candidatos);

        const lados = [];

        if (p.l - 16 > 26) {
            lados.push(-1);
        }

        if (p.r + 16 < window.innerWidth - 26) {
            lados.push(1);
        }

        const lado = pick(lados);

        function baseX() {

            const r = p.el.getBoundingClientRect();

            return lado < 0 ? r.left - 16 : r.right + 16;
        }

        // 1) anda até a lateral do card
        await andarAte(meu, baseX(), (pressa ? 130 : 62) * S * A.vel, pressa ? "bravo-andar" : "andar");

        // 2) sobe pela lateral
        M.solo = false;
        M.sup = null;
        M.dir = -lado;
        M.modo = "escalar";

        for (;;) {

            const dt = await proximoFrame(meu);

            const r = p.el.getBoundingClientRect();

            if (!p.el.isConnected || r.top < topoVisivel() || r.top > window.innerHeight - 30) {
                return aCair(meu, 0, 0);
            }

            M.x = baseX();

            M.y -= 85 * S * A.vel * (pressa ? 1.5 : 1) * dt;

            if (M.y <= r.top) {
                break;
            }
        }

        // 3) pula para cima do card
        M.modo = "subir";

        const x0 = M.x;

        const r0 = p.el.getBoundingClientRect();

        const x1 = clamp(lado < 0 ? r0.left + 28 : r0.right - 28, r0.left + 14, r0.right - 14);

        let t = 0;

        while (t < 0.35) {

            const dt = await proximoFrame(meu);

            t += dt;

            const r = p.el.getBoundingClientRect();

            const k = clamp(t / 0.35, 0, 1);

            M.x = lerp(x0, x1, k);

            M.y = r.top - Math.sin(Math.PI * k) * 16;
        }

        M.sup = p.el;
    }

    async function aDescer(meu) {

        if (!M.sup) {
            return aAndar(meu);
        }

        const r = M.sup.getBoundingClientRect();

        const lado = (M.x - r.left < r.right - M.x) ? -1 : 1;

        await andarAte(meu, lado < 0 ? r.left : r.right, 60 * S * A.vel, "andar");

        M.dir = lado;

        return aCair(meu, lado * 70, -170);
    }

    async function aDormir(meu) {

        M.lieDir = Math.random() < 0.5 ? -1 : 1;

        M.modo = "dormir";

        await esperar(meu, rnd(14, 24));

        M.modo = "acordar";

        say(pick(FALAS.acordar));

        await esperar(meu, 1.4);
    }

    async function aDancar(meu) {

        const tipo = pick(["sway", "hop", "spin", "disco"]);

        M.modo = "danca-" + tipo;

        if (Math.random() < 0.5) {
            say(pick(FALAS.danca));
        }

        await esperar(meu, rnd(3.5, 6));
    }

    async function aIoio(meu) {

        M.modo = "ioio";

        if (Math.random() < 0.4) {
            say(pick(FALAS.ioio));
        }

        await esperar(meu, rnd(6, 10));
    }

    // Clique no mascote
    async function aReagir(meu) {

        if (M.modo === "dormir" || M.modo === "emburrar") {

            M.modo = "susto";

            await esperar(meu, 0.7);
        }

        M.modo = "feliz";

        say(pick(FALAS.clique(cfg.nome)));

        await esperar(meu, 1.6);
    }

    // Duplo clique
    async function aDancarAgora(meu) {

        M.modo = "danca-hop";

        say(pick(FALAS.danca));

        await esperar(meu, 3);
    }

    // Segurado pelo mouse
    async function aArrastar(meu) {

        M.sup = null;
        M.solo = false;
        M.modo = "arrastar";

        while (arrastando) {

            const dt = await proximoFrame(meu);

            const k = Math.min(1, dt * 18);

            M.x += (clamp(ult.x, 20, window.innerWidth - 20) - M.x) * k;

            M.y += (clamp(ult.y + 78 * S, 90, window.innerHeight) - M.y) * k;
        }

        say(pick(FALAS.largado), 1400);

        return aCair(meu, 0, 0);
    }

    // Chegando ao site (ou à página nova)
    async function aEntrada(meu, tipo, cx) {

        const vw = window.innerWidth;

        const daEsquerda = cx === null ? Math.random() < 0.5 : cx < vw / 2;

        M.sup = null;
        M.solo = true;
        M.x = daEsquerda ? -70 : vw + 70;
        M.y = chaoY();
        M.dir = daEsquerda ? 1 : -1;

        // volta a posição para o chão e já começa a correr
        if (tipo === "bravo") {

            M.humor = "bravo";
            M.bravoAte = Date.now() + 6000;

            await andarAte(meu, vw * rnd(0.3, 0.7), 120 * S, "bravo-andar");

            return aBravo(meu);
        }

        if (tipo === "viagem") {

            const alvo = clamp(cx + (daEsquerda ? -1 : 1) * (70 * S + 10), 40, vw - 40);

            await andarAte(meu, alvo, 170 * S * A.vel, "correr");

            M.dir = daEsquerda ? 1 : -1;

            return aCuriosoParado(meu);
        }

        await andarAte(meu, vw * rnd(0.2, 0.8), 90 * S * A.vel, "andar");

        M.modo = "acenar";

        say(tipo === "novo" ? FALAS.novo(cfg.nome) : pick(FALAS.volta), tipo === "novo" ? 5200 : 2600);

        await esperar(meu, tipo === "novo" ? 2.2 : 1.6);
    }

    async function aCuriosoParado(meu) {

        M.modo = "curioso";

        say(pick(FALAS.curioso));

        await esperar(meu, 2.8);
    }

    // Percebeu uma troca de página: corre até onde você clicou
    async function aCurioso(meu, cx) {

        M.modo = "surpreso";

        await esperar(meu, 0.35);

        if (M.sup) {

            M.dir = Math.sign(cx - M.x) || 1;

            await aCair(meu, M.dir * 60, -140);
        }

        const lado = Math.sign(M.x - cx) || 1;

        const alvo = clamp(cx + lado * (70 * S + 10), 30, window.innerWidth - 30);

        if (Math.abs(alvo - M.x) > 8) {
            await andarAte(meu, alvo, 150 * S * A.vel, "correr");
        }

        M.dir = -lado;

        return aCuriosoParado(meu);
    }

    // Trocou de página demais: fica zangado
    async function aBravo(meu) {

        M.humor = "bravo";

        M.bravoAte = Math.max(M.bravoAte, Date.now() + 8000);

        if (M.sup) {
            await aCair(meu, 0, -60);
        }

        M.modo = "bravo";

        say(pick(FALAS.bravo), 2800);

        await esperar(meu, 3.4);

        if (Math.random() < 0.45) {

            // brinca de ioiô, ainda bravo
            M.modo = "ioio-bravo";

            const fim = Date.now() + rnd(8000, 12000);

            M.bravoAte = Math.max(M.bravoAte, fim);

            while (Date.now() < M.bravoAte) {
                await proximoFrame(meu);
            }

        } else {

            await aEmburrar(meu);
        }

        M.humor = "calmo";

        say(pick(FALAS.passou));
    }

    // Vai deitar em algum lugar, emburrado
    async function aEmburrar(meu) {

        M.humor = "bravo";

        const atual = Date.now();

        if (M.bravoAte < atual) {
            M.bravoAte = atual + 9000;
        }

        if (!REDUZIR && !M.sup && plataformasAlcancaveis().length && Math.random() < 0.55) {

            await aEscalar(meu, true);

        } else if (!M.sup) {

            const alvo = clamp(M.x + (Math.random() < 0.5 ? -1 : 1) * rnd(180, 420), 40, window.innerWidth - 40);

            await andarAte(meu, alvo, 120 * S, "bravo-andar");
        }

        M.lieDir = Math.random() < 0.5 ? -1 : 1;

        M.modo = "emburrar";

        say(pick(FALAS.emburrado));

        const fim = Date.now() + rnd(14000, 20000);

        M.bravoAte = Math.max(M.bravoAte, fim);

        while (Date.now() < M.bravoAte) {
            await proximoFrame(meu);
        }

        M.modo = "acordar";

        await esperar(meu, 0.8);
    }

    // Escolhe, com sorteio, o que fazer em seguida
    function escolherAcao() {

        if (REDUZIR) {
            return aParado;
        }

        if (M.humor === "bravo") {

            if (Date.now() < M.bravoAte) {
                return aEmburrar;
            }

            M.humor = "calmo";
        }

        const em = !!M.sup;

        const opcoes = [];

        function add(acao, peso) {

            if (peso > 0 && acao !== M.ultima) {
                opcoes.push({ acao: acao, peso: peso });
            }
        }

        if (!em) {

            add(aAndar, 30);
            add(aParado, 14);
            add(aDancar, 12 * A.danca);
            add(aIoio, 10);
            add(aEscalar, plataformasAlcancaveis().length ? 24 : 0);
            add(aDormir, 4);

        } else {

            add(aAndar, 26);
            add(aParado, 12);
            add(aDancar, 16 * A.danca);
            add(aDormir, 26);
            add(aIoio, 12);
            add(aDescer, 18);
        }

        let total = 0;

        opcoes.forEach(function (o) { total += o.peso; });

        let sorteio = Math.random() * total;

        for (let i = 0; i < opcoes.length; i++) {

            sorteio -= opcoes[i].peso;

            if (sorteio <= 0) {

                M.ultima = opcoes[i].acao;

                return opcoes[i].acao;
            }
        }

        return aParado;
    }

    // Laço principal da "vida" do mascote
    async function vida() {

        const meuId = ++idVida;

        while (ativo && meuId === idVida) {

            const meu = gen;

            try {

                // garante pelo menos um quadro entre uma ação e outra
                await proximoFrame(meu);

                const acao = fila.shift() || escolherAcao();

                await acao(meu);

            } catch (erro) {

                if (erro !== CANCELA) {

                    console.error("Mascote:", erro);

                    await new Promise(function (r) { setTimeout(r, 300); });
                }
            }
        }
    }


    // =================================================
    // POSE-ALVO DE CADA MODO
    // =================================================

    function olharCursor() {

        if (!ult.tem) {
            return { x: 0, y: 0 };
        }

        const cabecaY = M.y - 74 * S;

        return {
            x: clamp((ult.x - M.x) / 260, -1, 1),
            y: clamp((ult.y - cabecaY) / 260, -1, 1)
        };
    }

    function calcularAlvo() {

        Object.assign(T, BASE);

        T.fx = [];

        const m = M.modo;
        const t = M.tModo;
        const tg = M.tG;

        T.bob = Math.sin(tg * 2.3) * 0.7;

        const olhar = olharCursor();

        // ----- parado -----
        if (m === "parado") {

            T.look = olhar.x;
            T.lookY = olhar.y;

            T.aL = 8 + Math.sin(tg * 1.6) * 3;
            T.aR = 8 + Math.sin(tg * 1.6 + 1.2) * 3;

            T.tilt = Math.sin(tg * 0.8) * 3;

            return;
        }

        // ----- andando / correndo -----
        if (m === "andar" || m === "correr" || m === "bravo-andar") {

            const corre = m !== "andar";

            const fase = M.fase;

            const amp = corre ? 30 : 20;

            const fL = Math.sin(fase);
            const fR = -fL;

            T.lL = -M.dir * fL * amp;
            T.lR = M.dir * fR * amp;

            T.liftL = Math.max(0, fL) * (corre ? 6 : 3.5);
            T.liftR = Math.max(0, fR) * (corre ? 6 : 3.5);

            T.bob = -Math.abs(Math.sin(fase)) * (corre ? 3.5 : 2);

            T.lean = M.dir * (corre ? 9 : 3.5);

            T.aL = 14 + fR * 12;
            T.aR = 14 + fL * 12;

            T.look = M.dir * 0.9;

            T.expr = m === "bravo-andar" ? "bravo" : (corre ? "happy" : "smile");

            return;
        }

        // ----- escalando -----
        if (m === "escalar") {

            const ph = t * 8;

            T.aL = 140 + Math.sin(ph) * 30;
            T.aR = 140 - Math.sin(ph) * 30;

            T.lL = 10 + Math.sin(ph + Math.PI) * 16;
            T.lR = 10 + Math.sin(ph) * 16;

            T.liftL = Math.max(0, Math.sin(ph + Math.PI)) * 4;
            T.liftR = Math.max(0, Math.sin(ph)) * 4;

            T.lean = M.dir * 7;

            T.look = M.dir * 0.6;
            T.lookY = -1;

            T.bob = 0;

            T.expr = "effort";

            return;
        }

        if (m === "subir") {

            T.aL = 150;
            T.aR = 150;

            T.lL = 20;
            T.lR = 20;

            T.lean = M.dir * 4;

            T.expr = "happy";

            return;
        }

        // ----- caindo / pousando / segurado -----
        if (m === "cair") {

            T.aL = 150 + Math.sin(tg * 20) * 8;
            T.aR = 150 + Math.cos(tg * 20) * 8;

            T.lL = 22;
            T.lR = 22;

            T.expr = "surprised";

            return;
        }

        if (m === "aterrissar") {

            T.aL = 20;
            T.aR = 20;

            T.expr = "smile";

            return;
        }

        if (m === "arrastar") {

            T.aL = 150 + Math.sin(tg * 9) * 10;
            T.aR = 150 + Math.cos(tg * 9) * 10;

            T.lL = 12 + Math.sin(tg * 5) * 10;
            T.lR = 12 - Math.sin(tg * 5) * 10;

            T.tilt = Math.sin(tg * 4) * 5;

            T.bob = 0;

            T.expr = "surprised";

            return;
        }

        // ----- dormindo / emburrado -----
        if (m === "dormir") {

            T.lie = 1;

            T.aL = 16;
            T.aR = 16;

            T.lL = 6;
            T.lR = 6;

            T.sq = 1 + Math.sin(tg * 1.5) * 0.02;

            T.bob = 0;

            T.expr = "sleep";

            T.fx = ["zzz"];

            return;
        }

        if (m === "emburrar") {

            T.lie = 1;

            T.aL = 12;
            T.aR = 12;

            T.lL = 6;
            T.lR = 6;

            T.sq = 1 + Math.sin(tg * 1.2) * 0.015;

            T.bob = 0;

            T.expr = "bravo";

            T.fx = Math.floor(t / 3) % 2 === 0 ? ["ret"] : [];

            return;
        }

        if (m === "acordar") {

            T.aL = 150;
            T.aR = 150;

            T.tilt = Math.sin(t * 5) * 3;

            T.expr = "happy";

            return;
        }

        // ----- surpresa -----
        if (m === "susto" || m === "surpreso") {

            T.aL = 120;
            T.aR = 120;

            T.expr = "surprised";

            T.fx = ["exc"];

            return;
        }

        // ----- feliz (clique) e aceno -----
        if (m === "feliz") {

            T.bob = -Math.abs(Math.sin(t * 9)) * 12 * Math.max(0, 1 - t / 1.3);

            T.aL = 150;
            T.aR = 150;

            T.look = olhar.x;

            T.expr = "happy";

            T.fx = ["coracao"];

            return;
        }

        if (m === "acenar") {

            T.aR = 140 + Math.sin(t * 13) * 22;
            T.aL = 8;

            T.tilt = 6;

            T.expr = "happy";

            return;
        }

        // ----- curioso -----
        if (m === "curioso") {

            T.tilt = M.dir * (10 + Math.sin(t * 2.6) * 3);

            T.look = t < 0.5 ? M.dir : Math.sin(t * 1.6) * 0.9;

            T.lookY = -0.2;

            T.liftL = 1.5;
            T.liftR = 1.5;

            T.bob = -1.5 + Math.sin(tg * 5) * 0.6;

            T.expr = "curious";

            T.fx = ["int"];

            return;
        }

        // ----- zangado -----
        if (m === "bravo") {

            const ph = t * 15;

            T.liftL = Math.max(0, Math.sin(ph)) * 7;
            T.liftR = Math.max(0, -Math.sin(ph)) * 7;

            T.bob = -Math.abs(Math.sin(ph)) * 2;

            T.aL = 18 + Math.sin(ph * 2) * 6;
            T.aR = 18 + Math.cos(ph * 2) * 6;

            T.jx = Math.sin(t * 40) * 1.2;

            T.expr = "bravo";

            T.fx = ["raiva"];

            return;
        }

        // ----- ioiô -----
        if (m === "ioio" || m === "ioio-bravo") {

            const brava = m === "ioio-bravo";

            const u = t * (brava ? 10 : 5.2);

            const ext = 0.5 - 0.5 * Math.cos(u);

            T.yoyo = true;
            T.yoyoLen = 9 + 19 * ext;
            T.yoyoRot = u * 60;

            T.aR = 26 + 16 * ext;
            T.aL = 8 + Math.sin(tg * 3) * 2;

            T.lookY = 0.9;
            T.look = Math.sin(tg * 0.9) * 0.3;

            T.bob = Math.sin(u * 2) * 0.8;

            T.expr = brava ? "bravo" : "happy";

            T.fx = brava && Math.floor(t * 2) % 3 === 0 ? ["raiva"] : [];

            return;
        }

        // ----- danças -----
        if (m.indexOf("danca-") === 0) {

            const tipo = m.slice(6);

            T.expr = "happy";

            T.fx = ["notas"];

            if (tipo === "sway") {

                const u = t * 6.5;

                T.bob = -Math.abs(Math.sin(u)) * 3;

                T.lean = Math.sin(u) * 9;
                T.tilt = Math.sin(u) * 8;

                T.aL = 100 + Math.sin(u) * 45;
                T.aR = 100 - Math.sin(u) * 45;

                T.lL = Math.max(0, Math.sin(u)) * 22;
                T.lR = Math.max(0, -Math.sin(u)) * 22;

                T.liftL = Math.max(0, Math.sin(u)) * 3;
                T.liftR = Math.max(0, -Math.sin(u)) * 3;

            } else if (tipo === "hop") {

                const u = t * 9;

                T.bob = -Math.abs(Math.sin(u)) * 16;

                T.aL = 150 + Math.sin(u * 2) * 15;
                T.aR = 150 - Math.sin(u * 2) * 15;

                T.lL = 12 + Math.abs(Math.sin(u)) * 12;
                T.lR = 12 + Math.abs(Math.sin(u)) * 12;

                T.sq = 0.92 + 0.12 * Math.abs(Math.sin(u));

            } else if (tipo === "spin") {

                const u = t * 7;

                T.sx = Math.cos(u);

                T.bob = -Math.abs(Math.sin(u * 2)) * 4;

                T.aL = 85;
                T.aR = 85;

                T.lL = Math.sin(u * 2) * 12;
                T.lR = -Math.sin(u * 2) * 12;

            } else {

                const u = t * 8;

                T.aL = 100 + Math.sin(u) * 70;
                T.aR = 100 - Math.sin(u) * 70;

                T.lean = Math.sin(u) * 8;
                T.tilt = -Math.sin(u) * 8;

                T.bob = Math.sin(u * 2) * 2;

                T.lL = 10 + Math.sin(u * 2) * 10;
                T.lR = 10 - Math.sin(u * 2) * 10;
            }

            return;
        }
    }

    function suavizar(dt) {

        Object.keys(VELOCIDADE_SUAVE).forEach(function (k) {
            cur[k] += (T[k] - cur[k]) * (1 - Math.exp(-dt * VELOCIDADE_SUAVE[k]));
        });

        cur.expr = T.expr;
        cur.fx = T.fx;
        cur.yoyo = T.yoyo;
        cur.yoyoLen = T.yoyoLen;
        cur.yoyoRot = T.yoyoRot;
        cur.lieDir = M.lieDir;
    }

    function aoMudarModo(modo) {

        if (modo === "aterrissar") {

            cur.sq = 0.78;
            cur.bob = 0;
        }

        if (modo === "susto" || modo === "surpreso") {
            cur.bob = -10;
        }
    }


    // =================================================
    // QUADRO A QUADRO
    // =================================================

    // Se estiver em cima de um card, acompanha o card (rolagem)
    function seguirSuperficie() {

        if (M.sup) {

            if (!M.sup.isConnected) {
                return largarSuperficie();
            }

            const r = M.sup.getBoundingClientRect();

            if (r.width === 0 || r.top < topoVisivel() || r.top > window.innerHeight - 30) {
                return largarSuperficie();
            }

            M.y = r.top;

            M.x = clamp(M.x, r.left + 8, r.right - 8);

        } else if (M.solo) {

            M.y = chaoY();
        }
    }

    function largarSuperficie() {

        M.sup = null;
        M.solo = false;

        interromper(function (meu) { return aCair(meu, 0, 0); });
    }

    function quadro(ts) {

        if (!ativo) {
            return;
        }

        rafId = requestAnimationFrame(quadro);

        let dt = (ts - ultimoTs) / 1000;

        ultimoTs = ts;

        if (!(dt > 0)) {
            dt = 0.016;
        }

        dt = Math.min(dt, 0.05);

        M.tG += dt;

        seguirSuperficie();

        // mudança de modo
        if (M.modo !== M.modoAnt) {

            M.modoAnt = M.modo;

            M.tModo = 0;

            aoMudarModo(M.modo);

        } else {

            M.tModo += dt;
        }

        // passos acompanham a distância andada
        M.fase += Math.abs(M.x - M.xAnt) / (S * 7);

        M.xAnt = M.x;

        calcularAlvo();

        suavizar(dt);

        // piscar
        M.piscaEm -= dt;

        if (M.piscaEm <= 0 && M.piscaT < 0) {
            M.piscaT = 0;
        }

        if (M.piscaT >= 0) {

            M.piscaT += dt;

            cur.blink = Math.sin(Math.PI * clamp(M.piscaT / 0.16, 0, 1));

            if (M.piscaT > 0.16) {

                M.piscaT = -1;

                M.piscaEm = rnd(2, 5.5);

                cur.blink = 0;
            }

        } else {

            cur.blink = 0;
        }

        aplicarPose(inst, cur);

        posicionar();

        // acorda as ações que esperavam o quadro
        const lista = esperando;

        esperando = [];

        lista.forEach(function (w) {

            if (w.meu !== gen) {
                w.reject(CANCELA);
            } else {
                w.resolve(dt);
            }
        });
    }

    function posicionar() {

        raiz.style.transform = "translate3d(" + f(M.x) + "px," + f(M.y) + "px,0)";

        // posição do balão de fala
        const deitado = cur.lie > 0.5;

        const ax = deitado ? M.lieDir * 72 * S : 0;

        const ay = deitado ? -62 * S : (-122 + inst.topo) * S;

        const naTela = M.x + ax;

        const dx = clamp(naTela, 110, window.innerWidth - 110) - naTela;

        balao.style.transform =
            "translate(" + f(ax + dx) + "px," + f(ay) + "px) translate(-50%,-100%)";

        balao.style.setProperty("--cauda", f(-dx) + "px");
    }


    // =================================================
    // LIGAR / DESLIGAR
    // =================================================

    function recalcularEscala() {

        const base = TAMANHOS.filter(function (t) { return t[0] === cfg.tamanho; })[0][2];

        S = base * (window.innerWidth < 650 ? 0.82 : 1);

        A = AGITO_VALORES[cfg.agito];

        if (raiz) {
            raiz.style.setProperty("--m-escala", S);
        }
    }

    function ligar(entrada) {

        if (ativo) {
            return;
        }

        ativo = true;

        raiz = document.createElement("div");

        raiz.id = "mascote";

        raiz.setAttribute("aria-hidden", "true");

        inst = criarInstancia();

        balao = document.createElement("div");

        balao.className = "m-balao";

        raiz.appendChild(inst.el);
        raiz.appendChild(balao);

        document.body.appendChild(raiz);

        aplicarConfig(inst, cfg);

        recalcularEscala();

        ligarHit();

        // estado inicial
        M.sup = null;
        M.solo = true;
        M.humor = "calmo";
        M.bravoAte = 0;
        M.modo = "parado";
        M.modoAnt = "";
        M.x = -80;
        M.xAnt = -80;
        M.y = chaoY();
        M.ultima = null;

        Object.assign(cur, REPOUSO);

        fila = [];
        esperando = [];

        gen++;

        fila.push(function (meu) {
            return aEntrada(meu, entrada.tipo, entrada.cx);
        });

        ultimoTs = performance.now();

        rafId = requestAnimationFrame(quadro);

        vida();
    }

    function desligar() {

        if (!ativo) {
            return;
        }

        ativo = false;

        cancelAnimationFrame(rafId);

        gen++;

        const lista = esperando;

        esperando = [];

        lista.forEach(function (w) { w.reject(CANCELA); });

        clearTimeout(timerBalao);

        if (raiz && raiz.parentNode) {
            raiz.parentNode.removeChild(raiz);
        }

        raiz = null;
        inst = null;
        balao = null;

        arrastando = false;
        arr = null;
    }


    // =================================================
    // 5. PERCEPÇÃO DE PÁGINAS
    // =================================================

    // Anota uma troca de página. Devolve true se já foram
    // trocas demais (hora de ficar zangado).
    function registrarTroca() {

        const agora = Date.now();

        trocas.push(agora);

        trocas = trocas.filter(function (t) {
            return typeof t === "number" && agora - t < 120000;
        });

        gravar(CHAVES.navs, trocas);

        const recentes = trocas.filter(function (t) {
            return agora - t < JANELA_MS;
        }).length;

        if (recentes >= LIMITE_TROCAS) {

            trocas = [];

            gravar(CHAVES.navs, trocas);

            return true;
        }

        return false;
    }

    function guardarSaida(cx, cy) {

        gravar(CHAVES.saida, {
            t: Date.now(),
            mx: clamp(cx / window.innerWidth, 0, 1),
            my: clamp(cy / window.innerHeight, 0, 1)
        });
    }

    // Link que só rola a página (#): ele percebe na hora
    function aoTrocarNaPagina(cx) {

        if (!ativo || arrastando) {
            return;
        }

        const bravo = registrarTroca();

        if (M.humor === "bravo") {

            M.bravoAte = Math.max(M.bravoAte, Date.now() + 7000);

            say(pick(FALAS.emburrado));

            return;
        }

        if (bravo) {

            interromper(aBravo);

            return;
        }

        interromper(function (meu) { return aCurioso(meu, cx); });
    }

    function aoClicarLink(e) {

        const alvo = e.target;

        const a = alvo && alvo.closest ? alvo.closest("a[href]") : null;

        if (!a) {
            return;
        }

        const href = a.getAttribute("href") || "";

        // links externos não contam
        if (a.target === "_blank" || /^([a-z][a-z0-9+.-]*:|\/\/)/i.test(href)) {
            return;
        }

        if (href.charAt(0) === "#") {

            aoTrocarNaPagina(e.clientX);

        } else {

            // vai abrir outra página: a "chegada" será percebida lá
            guardarSaida(e.clientX, e.clientY);
        }
    }

    // O que fazer ao carregar a página
    function decidirEntrada() {

        const saida = ler(CHAVES.saida, null);

        try {
            localStorage.removeItem(CHAVES.saida);
        } catch (erro) { /* ok */ }

        const visto = ler(CHAVES.visto, false);

        gravar(CHAVES.visto, true);

        if (saida && typeof saida.t === "number" && Date.now() - saida.t < SAIDA_MS) {

            const bravo = registrarTroca();

            const cx = (typeof saida.mx === "number" ? saida.mx : 0.5) * window.innerWidth;

            return { tipo: bravo ? "bravo" : "viagem", cx: cx };
        }

        return { tipo: visto ? "volta" : "novo", cx: null };
    }


    // =================================================
    // 6. INTERAÇÃO (clicar e arrastar)
    // =================================================

    function aoClicarNele() {

        const agora = Date.now();

        const duplo = agora - ultimoClique < 400;

        ultimoClique = agora;

        // zangado: só resmunga
        if (M.humor === "bravo") {

            say(pick(FALAS.emburrado));

            return;
        }

        if (duplo) {

            interromper(aDancarAgora);

            return;
        }

        interromper(aReagir);
    }

    function ligarHit() {

        const hit = inst.partes.hit;

        hit.addEventListener("pointerdown", function (e) {

            if (e.button > 0) {
                return;
            }

            e.preventDefault();

            arr = { id: e.pointerId, x0: e.clientX, y0: e.clientY, mexeu: false };

            try {
                hit.setPointerCapture(e.pointerId);
            } catch (erro) { /* ok */ }
        });
    }

    function aoMoverPonteiro(e) {

        ult.x = e.clientX;
        ult.y = e.clientY;
        ult.tem = true;

        if (!arr || e.pointerId !== arr.id || arr.mexeu) {
            return;
        }

        if (Math.hypot(e.clientX - arr.x0, e.clientY - arr.y0) > 6) {

            arr.mexeu = true;

            arrastando = true;

            if (raiz) {
                raiz.classList.add("m-agarrado");
            }

            interromper(aArrastar);
        }
    }

    function aoSoltarPonteiro(e) {

        if (!arr || e.pointerId !== arr.id) {
            return;
        }

        const a = arr;

        arr = null;

        if (raiz) {
            raiz.classList.remove("m-agarrado");
        }

        if (a.mexeu) {
            arrastando = false;
        } else if (ativo) {
            aoClicarNele();
        }
    }


    // =================================================
    // 7. PAINEL DE PERSONALIZAÇÃO
    // =================================================

    let painel = null;
    let fab = null;
    let previa = null;

    function chips(campo, lista) {

        return lista.map(function (item) {

            return '<button type="button" class="m-chip" role="radio" aria-checked="false" ' +
                'data-campo="' + campo + '" data-valor="' + item[0] + '">' + item[1] + "</button>";

        }).join("");
    }

    function cores(campo, lista) {

        return lista.map(function (item) {

            return '<button type="button" class="m-cor" role="radio" aria-checked="false" ' +
                'data-campo="' + campo + '" data-valor="' + item[0] + '" ' +
                'title="' + item[1] + '" aria-label="' + item[1] + '" ' +
                'style="--cor:' + item[0] + '"></button>';

        }).join("");
    }

    function coresRoupa() {

        return ROUPAS.map(function (r, i) {

            return '<button type="button" class="m-cor" role="radio" aria-checked="false" ' +
                'data-campo="roupa" data-valor="' + i + '" ' +
                'title="' + r.nome + '" aria-label="' + r.nome + '" ' +
                'style="--cor:' + r.camisa + '"></button>';

        }).join("");
    }

    function construirPainel() {

        fab = document.createElement("button");

        fab.type = "button";
        fab.className = "m-fab";
        fab.id = "m-fab";

        fab.setAttribute("aria-label", "Personalizar mascote");
        fab.setAttribute("aria-expanded", "false");
        fab.setAttribute("aria-controls", "m-painel");
        fab.setAttribute("title", "Personalizar mascote");

        fab.innerHTML =
            '<svg viewBox="0 0 24 24" aria-hidden="true">' +
            '<circle cx="12" cy="13" r="6.5"/>' +
            '<path d="M5.8 11.2C6 6.8 9 4.4 12 4.4s6 2.4 6.2 6.8"/>' +
            '<circle cx="9.7" cy="13" r="0.6" fill="currentColor"/>' +
            '<circle cx="14.3" cy="13" r="0.6" fill="currentColor"/>' +
            '<path d="M10.3 15.6Q12 17 13.7 15.6"/>' +
            "</svg>";

        painel = document.createElement("section");

        painel.className = "m-painel";
        painel.id = "m-painel";
        painel.hidden = true;

        painel.setAttribute("role", "dialog");
        painel.setAttribute("aria-labelledby", "m-painel-titulo");

        painel.innerHTML =
            '<div class="m-painel-topo">' +
                '<div class="m-previa" id="m-previa"></div>' +
                '<div class="m-painel-titulos">' +
                    '<h2 id="m-painel-titulo" tabindex="-1">Meu companheiro</h2>' +
                    '<p id="m-painel-sub"></p>' +
                "</div>" +
                '<button type="button" class="m-fechar" aria-label="Fechar">×</button>' +
            "</div>" +

            '<div class="m-campos">' +

                '<label class="m-campo"><span>Nome</span>' +
                    '<input type="text" id="m-nome" maxlength="14" autocomplete="off" spellcheck="false">' +
                "</label>" +

                '<div class="m-campo"><span>Tom de pele</span>' +
                    '<div class="m-grupo" role="radiogroup" aria-label="Tom de pele">' + cores("pele", PELES) + "</div></div>" +

                '<div class="m-campo"><span>Cabelo</span>' +
                    '<div class="m-grupo" role="radiogroup" aria-label="Estilo de cabelo">' + chips("cabelo", ESTILOS_CABELO) + "</div></div>" +

                '<div class="m-campo"><span>Cor do cabelo</span>' +
                    '<div class="m-grupo" role="radiogroup" aria-label="Cor do cabelo">' + cores("corCabelo", CORES_CABELO) + "</div></div>" +

                '<div class="m-campo"><span>Roupa</span>' +
                    '<div class="m-grupo" role="radiogroup" aria-label="Cor da roupa">' + coresRoupa() + "</div></div>" +

                '<div class="m-campo"><span>Acessório</span>' +
                    '<div class="m-grupo" role="radiogroup" aria-label="Acessório">' + chips("acessorio", ACESSORIOS) + "</div></div>" +

                '<div class="m-campo"><span>Tamanho</span>' +
                    '<div class="m-grupo" role="radiogroup" aria-label="Tamanho">' + chips("tamanho", TAMANHOS) + "</div></div>" +

                '<div class="m-campo"><span>Jeito</span>' +
                    '<div class="m-grupo" role="radiogroup" aria-label="Jeito do mascote">' + chips("agito", AGITOS) + "</div></div>" +

                '<label class="m-interruptor">' +
                    '<input type="checkbox" id="m-ativo">' +
                    "<span>Mascote passeando pela tela</span>" +
                "</label>" +

            "</div>" +

            '<div class="m-painel-rodape">' +
                '<button type="button" class="m-restaurar">Restaurar padrão</button>' +
            "</div>";

        document.body.appendChild(painel);
        document.body.appendChild(fab);

        // Prévia
        previa = criarInstancia();

        painel.querySelector("#m-previa").appendChild(previa.el);

        // Eventos
        fab.addEventListener("click", function () {
            alternarPainel(painel.hidden);
        });

        painel.querySelector(".m-fechar").addEventListener("click", function () {
            alternarPainel(false);
        });

        document.addEventListener("keydown", function (e) {

            if (e.key === "Escape" && !painel.hidden) {
                alternarPainel(false);
            }
        });

        painel.addEventListener("click", function (e) {

            const botao = e.target.closest ? e.target.closest("[data-campo]") : null;

            if (!botao) {
                return;
            }

            const campo = botao.getAttribute("data-campo");

            let valor = botao.getAttribute("data-valor");

            if (campo === "roupa") {
                valor = Number(valor);
            }

            mudar(campo, valor);
        });

        const nome = painel.querySelector("#m-nome");

        nome.addEventListener("input", function () {
            mudar("nome", nome.value);
        });

        nome.addEventListener("blur", function () {
            nome.value = cfg.nome;
        });

        painel.querySelector("#m-ativo").addEventListener("change", function (e) {
            mudar("ativo", e.target.checked);
        });

        painel.querySelector(".m-restaurar").addEventListener("click", function () {

            const ativoAntes = cfg.ativo;

            cfg = sanear(PADRAO);

            gravar(CHAVES.config, cfg);

            sincronizar(ativoAntes !== cfg.ativo);
        });

        atualizarPainel();
    }

    function alternarPainel(abrir) {

        painel.hidden = !abrir;

        fab.setAttribute("aria-expanded", String(abrir));

        if (abrir) {

            atualizarPainel();

            painel.querySelector("#m-painel-titulo").focus();

        } else {

            fab.focus();
        }
    }

    function mudar(campo, valor) {

        const antes = cfg.ativo;

        const novo = Object.assign({}, cfg);

        novo[campo] = valor;

        cfg = sanear(novo);

        gravar(CHAVES.config, cfg);

        sincronizar(antes !== cfg.ativo, campo === "nome");
    }

    // Aplica a configuração no mascote, na prévia e no painel
    function sincronizar(mudouAtivo, soNome) {

        aplicarConfig(previa, cfg);

        aplicarPose(previa, REPOUSO);

        if (inst) {
            aplicarConfig(inst, cfg);
        }

        recalcularEscala();

        if (mudouAtivo) {

            if (cfg.ativo) {
                ligar({ tipo: "volta", cx: null });
            } else {
                desligar();
            }
        }

        atualizarPainel(soNome);
    }

    function atualizarPainel(soNome) {

        painel.querySelector("#m-painel-sub").textContent =
            "Deixe o" + (cfg.nome === "Stellifer" ? "o " : "") + cfg.nome + " com a sua cara.";

        if (soNome) {
            return;
        }

        const nome = painel.querySelector("#m-nome");

        if (document.activeElement !== nome) {
            nome.value = cfg.nome;
        }

        painel.querySelector("#m-ativo").checked = cfg.ativo;

        painel.querySelectorAll("[data-campo]").forEach(function (b) {

            const campo = b.getAttribute("data-campo");

            const valor = b.getAttribute("data-valor");

            const marcado = String(cfg[campo]) === valor;

            b.setAttribute("aria-checked", String(marcado));

            b.classList.toggle("marcado", marcado);
        });

        aplicarConfig(previa, cfg);

        aplicarPose(previa, REPOUSO);
    }


    // =================================================
    // 8. INÍCIO
    // =================================================

    function iniciar() {

        construirPainel();

        aplicarConfig(previa, cfg);

        aplicarPose(previa, REPOUSO);

        window.addEventListener("pointermove", aoMoverPonteiro, { passive: true });
        window.addEventListener("pointerup", aoSoltarPonteiro);
        window.addEventListener("pointercancel", aoSoltarPonteiro);

        document.addEventListener("click", aoClicarLink, true);

        window.addEventListener("pagehide", function () {

            guardarSaida(
                ult.tem ? ult.x : window.innerWidth / 2,
                ult.tem ? ult.y : window.innerHeight / 2
            );
        });

        // voltar pelo botão "voltar" do navegador
        window.addEventListener("pageshow", function (e) {

            if (e.persisted && cfg.ativo) {

                desligar();

                ligar(decidirEntrada());
            }
        });

        window.addEventListener("resize", function () {

            recalcularEscala();

            if (ativo && M.solo) {
                M.x = clamp(M.x, 24, window.innerWidth - 24);
            }
        });

        if (cfg.ativo) {
            ligar(decidirEntrada());
        } else {

            // mesmo desligado, limpa o registro de saída
            decidirEntrada();
        }
    }

    iniciar();

})();