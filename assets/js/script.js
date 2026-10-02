const canvas = document.getElementById('tabuleiro');
const ctx = canvas.getContext('2d');

const LINHAS = 17;
const COLUNAS = 45;
const TAM_CELULA = 20;

// ============================================================================
// BIBLIOTECA DE MAPAS 100% ABERTOS (NENHUM PONTO PRESO)
// ============================================================================
const mapa1 = [
    "#############################################",
    "#P..........................................#",
    "#.#########.##########.##########.#########.#",
    "#.#########.##########.##########.#########.#",
    "#...........................................#",
    "#.#########.###.##############.###.########.#",
    "#.#########.###.##############.###.########.#",
    "#...........###.......G........###..........#",
    "#.#########.##########.##########.#########.#",
    "#.#########.##########.##########.#########.#",
    "#.....................G.....................#",
    "#.#########.###.##############.###.########.#",
    "#.#########.###.##############.###.########.#",
    "#...........###.......G........###..........#",
    "#.#########################################.#",
    "#.....................G.....................#",
    "#############################################"
];

const mapa2 = [
    "#############################################",
    "#P..........................................#",
    "#.#########################################.#",
    "#.....................G.....................#",
    "#.#########################################.#",
    "#...........................................#",
    "#.#########################################.#",
    "#.....................G.....................#",
    "#.#########################################.#",
    "#...........................................#",
    "#.#########################################.#",
    "#.....................G.....................#",
    "#.#########################################.#",
    "#...........................................#",
    "#.#########################################.#",
    "#.....................G.....................#",
    "#############################################"
];

const mapa3 = [
    "#############################################",
    "#P..........................................#",
    "#.#####.#####.#####.######.#####.#####.####.#",
    "#.#####.#####.#####.######.#####.#####.####.#",
    "#...........................................#",
    "#.#####.#####.#####.######.#####.#####.####.#",
    "#.#####.#####.#####.######.#####.#####.####.#",
    "#.............G.............................#",
    "#.#####.#####.#####.######.#####.#####.####.#",
    "#.#####.#####.#####.######.#####.#####.####.#",
    "#..........................G................#",
    "#.#####.#####.#####.######.#####.#####.####.#",
    "#.#####.#####.#####.######.#####.#####.####.#",
    "#......G....................................#",
    "#.#####.#####.#####.######.#####.#####.####.#",
    "#..........................G................#",
    "#############################################"
];

const mapa4 = [
    "#############################################",
    "#P..........................................#",
    "#.####################.####################.#",
    "#...........................................#",
    "#.########.######################.#########.#",
    "#....................G......................#",
    "#.#############.############.##############.#",
    "#...........................................#",
    "#.########.######################.#########.#",
    "#....................G......................#",
    "#.####################.####################.#",
    "#...........................................#",
    "#.#############.############.##############.#",
    "#.......G...........................G.......#",
    "#.#########################################.#",
    "#...........................................#",
    "#############################################"
];

const mapa5 = [
    "#############################################",
    "#P..........................................#",
    "#.###.###.###.###.###.###.###.###.###.###.#.#",
    "#.###.###.###.###.###.###.###.###.###.###.#.#",
    "#....................G......................#",
    "#.###.###.###.###.###.###.###.###.###.###.#.#",
    "#.###.###.###.###.###.###.###.###.###.###.#.#",
    "#...........................................#",
    "#.###.###.###.###.###.###.###.###.###.###.#.#",
    "#.###.###.###.###.###.###.###.###.###.###.#.#",
    "#....................G......................#",
    "#.###.###.###.###.###.###.###.###.###.###.#.#",
    "#.###.###.###.###.###.###.###.###.###.###.#.#",
    "#...G...................................G...#",
    "#.#########################################.#",
    "#...........................................#",
    "#############################################"
];

const todosOsMapas = [mapa1, mapa2, mapa3, mapa4, mapa5];

// ============================================================================
// VARIÁVEIS DE ESTADO
// ============================================================================
let grade = [];
let jogador = { x: 0, y: 0, dirX: 0, dirY: 0, proxDirX: 0, proxDirY: 0 };
let fantasmas = [];
let pontosTotais = 0;
let pontosColetados = 0;
let jogoRodando = true;

// Rastreamento exato para anular o Tunneling
let jogAntigoX = 0;
let jogAntigoY = 0;

const coresFantasmas = ["#FF0000", "#FFB8FF", "#00FFFF", "#FFB852"];

// ============================================================================
// LÓGICA DO MOTOR
// ============================================================================
function iniciarJogo() {
    grade = [];
    fantasmas = [];
    pontosTotais = 0;
    pontosColetados = 0;
    jogoRodando = true;

    const mapaEscolhido = todosOsMapas[Math.floor(Math.random() * todosOsMapas.length)];

    for (let i = 0; i < LINHAS; i++) {
        let linha = mapaEscolhido[i].split('');
        for (let j = 0; j < COLUNAS; j++) {
            if (linha[j] === 'P') {
                jogador.x = j;
                jogador.y = i;
                jogador.dirX = 1;
                jogador.dirY = 0;
                jogador.proxDirX = 1;
                jogador.proxDirY = 0;
                linha[j] = ' '; 
            } else if (linha[j] === 'G') {
                fantasmas.push({ 
                    id: fantasmas.length, 
                    x: j, 
                    y: i,
                    antigoX: j,
                    antigoY: i,
                    cor: coresFantasmas[fantasmas.length % 4],
                    dirX: 0,
                    dirY: 0
                });
                pontosTotais++;
                // Os fantasmas já não alteram o mapa. Colocamos o ponto no chão permanentemente.
                linha[j] = '.';
            } else if (linha[j] === '.') {
                pontosTotais++;
            }
        }
        grade.push(linha);
    }
    atualizarHUD();
    loop();
}

// A colisão agora só considera paredes físicas, desacoplando os fantasmas
function posicaoValida(x, y) {
    if (y < 0 || y >= LINHAS || x < 0 || x >= COLUNAS) return false;
    return grade[y][x] !== '#';
}

function calcularDistancia(x1, y1, x2, y2) {
    return Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2);
}

// Verifica a morte de forma independente
function verificarColisoes() {
    for (let f of fantasmas) {
        // Colisão Direta no mesmo bloco
        if (f.x === jogador.x && f.y === jogador.y) {
            finalizarJogo(false);
            return;
        }
        // Tunneling: Se ambos trocaram de posição matematicamente neste frame
        if (f.x === jogAntigoX && f.y === jogAntigoY && f.antigoX === jogador.x && f.antigoY === jogador.y) {
            finalizarJogo(false);
            return;
        }
    }
}

function processarMovimentoJogador() {
    jogAntigoX = jogador.x;
    jogAntigoY = jogador.y;

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
        f.antigoX = f.x;
        f.antigoY = f.y;
        
        let tx = jogador.x;
        let ty = jogador.y;
        
        if (f.id === 0) { 
            tx = jogador.x; ty = jogador.y; 
        } else if (f.id === 1) { 
            tx = jogador.x + (jogador.dirX * 4); 
            ty = jogador.y + (jogador.dirY * 4);
        } else if (f.id === 2) { 
            if (fantasmas.length > 0) { 
                tx = jogador.x + (jogador.x - fantasmas[0].x);
                ty = jogador.y + (jogador.y - fantasmas[0].y);
            }
        } else { 
            if (calcularDistancia(f.x, f.y, jogador.x, jogador.y) > 25) {
                tx = jogador.x; ty = jogador.y;
            } else {
                tx = 0; ty = LINHAS - 1; 
            }
        }

        let opcoes = [
            { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
            { dx: -1, dy: 0 }, { dx: 1, dy: 0 }
        ];
        
        let caminhosValidos = 0;
        opcoes.forEach(op => {
            if (posicaoValida(f.x + op.dx, f.y + op.dy)) caminhosValidos++;
        });

        let melhorOpcao = null;
        let menorDist = Infinity;
        let dxOposto = -f.dirX;
        let dyOposto = -f.dirY;

        opcoes.forEach(op => {
            let nx = f.x + op.dx;
            let ny = f.y + op.dy;
            
            if (posicaoValida(nx, ny)) {
                let ehMeiaVolta = (op.dx === dxOposto && op.dy === dyOposto);
                if (ehMeiaVolta && caminhosValidos > 1) return;

                let dist = calcularDistancia(nx, ny, tx, ty);
                if (dist < menorDist) {
                    menorDist = dist;
                    melhorOpcao = op;
                }
            }
        });

        if (melhorOpcao) {
            f.x += melhorOpcao.dx;
            f.y += melhorOpcao.dy;
            f.dirX = melhorOpcao.dx;
            f.dirY = melhorOpcao.dy;
        }
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

    fantasmas.forEach(f => {
        ctx.fillStyle = f.cor;
        ctx.beginPath();
        ctx.arc(f.x * TAM_CELULA + 10, f.y * TAM_CELULA + 10, 8, 0, Math.PI * 2);
        ctx.fill();
    });

    ctx.save(); 
    ctx.translate(jogador.x * TAM_CELULA + 10, jogador.y * TAM_CELULA + 10);
    
    let angulo = 0;
    if (jogador.dirX === -1) angulo = Math.PI;          
    else if (jogador.dirY === 1) angulo = Math.PI / 2;  
    else if (jogador.dirY === -1) angulo = -Math.PI / 2;

    ctx.rotate(angulo); 
    
    ctx.fillStyle = '#FFFF00';
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0.2 * Math.PI, 1.8 * Math.PI);
    ctx.lineTo(0, 0);
    ctx.fill();
    
    ctx.restore(); 
}

function atualizarHUD() {
    document.getElementById('pontos').innerText = pontosColetados;
    document.getElementById('restantes').innerText = pontosTotais - pontosColetados;
}

function finalizarJogo(vitoria) {
    jogoRodando = false;
    document.getElementById('game-over').classList.remove('hidden');
    document.getElementById('mensagem-fim').innerText = vitoria ? "VENCEU!" : "GAME OVER";
    document.getElementById('mensagem-fim').style.color = vitoria ? "#00FF00" : "#FF0000";
}

function loop() {
    if (!jogoRodando) return;
    
    processarMovimentoJogador();
    verificarColisoes();
    
    if (!jogoRodando) { desenhar(); return; } 
    
    processarMovimentoFantasmas();
    verificarColisoes();
    
    desenhar();
    if (jogoRodando) setTimeout(loop, 150); 
}

// ============================================================================
// EVENTOS DE ENTRADA
// ============================================================================
window.addEventListener('keydown', e => {
    if (e.key === 'ArrowUp' || e.key === 'w') { jogador.proxDirX = 0; jogador.proxDirY = -1; }
    if (e.key === 'ArrowDown' || e.key === 's') { jogador.proxDirX = 0; jogador.proxDirY = 1; }
    if (e.key === 'ArrowLeft' || e.key === 'a') { jogador.proxDirX = -1; jogador.proxDirY = 0; }
    if (e.key === 'ArrowRight' || e.key === 'd') { jogador.proxDirX = 1; jogador.proxDirY = 0; }
});

document.getElementById('btn-up').onclick = () => { jogador.proxDirX = 0; jogador.proxDirY = -1; };
document.getElementById('btn-down').onclick = () => { jogador.proxDirX = 0; jogador.proxDirY = 1; };
document.getElementById('btn-left').onclick = () => { jogador.proxDirX = -1; jogador.proxDirY = 0; };
document.getElementById('btn-right').onclick = () => { jogador.proxDirX = 1; jogador.proxDirY = 0; };

iniciarJogo();