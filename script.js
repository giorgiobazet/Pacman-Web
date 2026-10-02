const canvas = document.getElementById('tabuleiro');
const ctx = canvas.getContext('2d');

// Configurações da Grade (Baseado no mapa 17x45)
const LINHAS = 17;
const COLUNAS = 45;
const TAM_CELULA = 20; // 45 * 20 = 900px largura

// Mapa 1 estático (substitui a leitura do arquivo .txt)
const mapaInicial = [
    "#############################################",
    "#P..........................................#",
    "#.#######.##########..##########.##########.#",
    "#.#.....#.#........#..#........#.#........#.#",
    "#.#.###.#.#.######.#..#.######.#.#.######.#.#",
    "#.......#..........G........................#",
    "#.#######.######################.##########.#",
    "#...........................................#",
    "#.#######.######################.##########.#",
    "#.......#......................#.#........#.#",
    "#.#.###.#.####################.#.#.######.#.#",
    "#.#.....#.#..........G.........#.#........#.#",
    "#.#######.#.##################.#.##########.#",
    "#.........#..........G.........#..........G.#",
    "#.#########################################.#",
    "#...........................................#",
    "#############################################"
];

let grade = [];
let jogador = { x: 0, y: 0, dirX: 0, dirY: 0, proxDirX: 0, proxDirY: 0 };
let fantasmas = [];
let pontosTotais = 0;
let pontosColetados = 0;
let jogoRodando = true;

const coresFantasmas = ["#FF0000", "#FFB8FF", "#00FFFF", "#FFB852"]; // Blinky, Pinky, Inky, Clyde

function iniciarJogo() {
    grade = [];
    fantasmas = [];
    pontosTotais = 0;
    pontosColetados = 0;

    for (let i = 0; i < LINHAS; i++) {
        let linha = mapaInicial[i].split('');
        for (let j = 0; j < COLUNAS; j++) {
            if (linha[j] === 'P') {
                jogador.x = j;
                jogador.y = i;
                linha[j] = ' '; 
            } else if (linha[j] === 'G') {
                fantasmas.push({ x: j, y: i, bg: '.', cor: coresFantasmas[fantasmas.length % 4] });
                pontosTotais++;
                linha[j] = ' ';
            } else if (linha[j] === '.') {
                pontosTotais++;
            }
        }
        grade.push(linha);
    }
    atualizarHUD();
    loop();
}

function posicaoValida(x, y) {
    if (y < 0 || y >= LINHAS || x < 0 || x >= COLUNAS) return false;
    return grade[y][x] !== '#';
}

function processarMovimentoJogador() {
    // Tenta virar para a próxima direção desejada
    if (posicaoValida(jogador.x + jogador.proxDirX, jogador.y + jogador.proxDirY)) {
        jogador.dirX = jogador.proxDirX;
        jogador.dirY = jogador.proxDirY;
    }

    let nx = jogador.x + jogador.dirX;
    let ny = jogador.y + jogador.dirY;

    if (posicaoValida(nx, ny)) {
        jogador.x = nx;
        jogador.y = ny;

        if (grade[ny][nx] === '.') {
            grade[ny][nx] = ' ';
            pontosColetados++;
            atualizarHUD();
            if (pontosColetados === pontosTotais) finalizarJogo(true);
        }
    }
}

function processarMovimentoFantasmas() {
    fantasmas.forEach(f => {
        let opcoes = [
            { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
            { dx: -1, dy: 0 }, { dx: 1, dy: 0 }
        ];
        
        // IA Aleatória simples para a Web (Evita bater em paredes)
        let caminhosValidos = opcoes.filter(op => posicaoValida(f.x + op.dx, f.y + op.dy));
        
        if (caminhosValidos.length > 0) {
            let escolhido = caminhosValidos[Math.floor(Math.random() * caminhosValidos.length)];
            
            grade[f.y][f.x] = f.bg; // Restaura o chão
            f.x += escolhido.dx;
            f.y += escolhido.dy;
            
            // Salva o novo chão, exceto se for outro fantasma
            if (grade[f.y][f.x] !== 'G') f.bg = grade[f.y][f.x];
            grade[f.y][f.x] = 'G'; // Marca posição na matriz visual
        }

        if (f.x === jogador.x && f.y === jogador.y) finalizarJogo(false);
    });
}

function desenhar() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < LINHAS; i++) {
        for (let j = 0; j < COLUNAS; j++) {
            let posX = j * TAM_CELULA;
            let posY = i * TAM_CELULA;

            if (grade[i][j] === '#') {
                ctx.fillStyle = '#1919A6';
                ctx.fillRect(posX, posY, TAM_CELULA, TAM_CELULA);
            } else if (grade[i][j] === '.') {
                ctx.fillStyle = '#fff';
                ctx.fillRect(posX + 8, posY + 8, 4, 4);
            }
        }
    }

    // Desenha Fantasmas
    fantasmas.forEach(f => {
        ctx.fillStyle = f.cor;
        ctx.beginPath();
        ctx.arc(f.x * TAM_CELULA + 10, f.y * TAM_CELULA + 10, 8, 0, Math.PI * 2);
        ctx.fill();
    });

    // Desenha Pac-Man
    ctx.fillStyle = '#FFFF00';
    ctx.beginPath();
    ctx.arc(jogador.x * TAM_CELULA + 10, jogador.y * TAM_CELULA + 10, 8, 0.2 * Math.PI, 1.8 * Math.PI);
    ctx.lineTo(jogador.x * TAM_CELULA + 10, jogador.y * TAM_CELULA + 10);
    ctx.fill();
}

function atualizarHUD() {
    document.getElementById('pontos').innerText = pontosColetados;
    document.getElementById('restantes').innerText = pontosTotais - pontosColetados;
}

function finalizarJogo(vitoria) {
    jogoRodando = false;
    document.getElementById('game-over').classList.remove('hidden');
    document.getElementById('mensagem-fim').innerText = vitoria ? "VOCÊ VENCEU!" : "GAME OVER";
    document.getElementById('mensagem-fim').style.color = vitoria ? "#00FF00" : "#FF0000";
}

// Game Loop fixado em ~6 FPS para movimento em grade
function loop() {
    if (!jogoRodando) return;
    processarMovimentoJogador();
    processarMovimentoFantasmas();
    desenhar();
    setTimeout(loop, 150); 
}

// Captura Teclado (PC)
window.addEventListener('keydown', e => {
    if (e.key === 'ArrowUp' || e.key === 'w') { jogador.proxDirX = 0; jogador.proxDirY = -1; }
    if (e.key === 'ArrowDown' || e.key === 's') { jogador.proxDirX = 0; jogador.proxDirY = 1; }
    if (e.key === 'ArrowLeft' || e.key === 'a') { jogador.proxDirX = -1; jogador.proxDirY = 0; }
    if (e.key === 'ArrowRight' || e.key === 'd') { jogador.proxDirX = 1; jogador.proxDirY = 0; }
});

// Captura Toque (Mobile)
document.getElementById('btn-up').onclick = () => { jogador.proxDirX = 0; jogador.proxDirY = -1; };
document.getElementById('btn-down').onclick = () => { jogador.proxDirX = 0; jogador.proxDirY = 1; };
document.getElementById('btn-left').onclick = () => { jogador.proxDirX = -1; jogador.proxDirY = 0; };
document.getElementById('btn-right').onclick = () => { jogador.proxDirX = 1; jogador.proxDirY = 0; };

iniciarJogo();