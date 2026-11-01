const W = 800, H = 600;

const CFG = {
  paddle: { w: 130, h: 14, y: 560, keySpeed: 600 },
  ball:   { size: 16, speed: 360, maxAngle: 60 }, // grados respecto a la vertical
  blocks: { cols: 12, w: 48, h: 24, offsetX: 112, offsetY: 90 }, // sprite 32x16 a escala 1.5x; centrado en W
  lives: 3,
};

// Orden de filas de arriba a abajo, con sus puntos
const ROWS = [
  { color: 'gray',    points: 70 },
  { color: 'hotpink', points: 60 },
  { color: 'red',     points: 50 },
  { color: 'magenta', points: 40 },
  { color: 'yellow',  points: 30 },
  { color: 'green',   points: 20 },
  { color: 'cyan',    points: 10 },
];

const state = {
  phase: 'ready',          // 'ready' | 'playing' | 'gameover' | 'won'
  score: 0,
  lives: CFG.lives,
  paddle: { x: (W - CFG.paddle.w) / 2 }, // x del borde izquierdo; y fija en CFG
  ball:   { x: 0, y: 0, vx: 0, vy: 0 },
  blocks: [/* { x, y, color, points, alive } */],
};

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const clampPaddle = x => Math.max(0, Math.min(W - CFG.paddle.w, x));

// Entrada: ratón (posición absoluta) y teclado (flechas / A-D)
const keys = new Set();
addEventListener('keydown', e => keys.add(e.code));
addEventListener('keyup', e => keys.delete(e.code));
canvas.addEventListener('mousemove', e => {
  const r = canvas.getBoundingClientRect();
  state.paddle.x = clampPaddle(e.clientX - r.left - CFG.paddle.w / 2);
});

// Bola pegada al centro de la paleta
function stickBall() {
  const { paddle, ball } = CFG;
  state.ball.x = state.paddle.x + (paddle.w - ball.size) / 2;
  state.ball.y = paddle.y - ball.size;
}

function createBlocks() {
  const { cols, w, h, offsetX, offsetY } = CFG.blocks;
  state.blocks = ROWS.flatMap((row, r) =>
    Array.from({ length: cols }, (_, c) => ({
      x: offsetX + c * w, y: offsetY + r * h,
      color: row.color, points: row.points, alive: true,
    })));
}

function resetGame() {
  createBlocks();
  state.score = 0;
  state.lives = CFG.lives;
  state.paddle.x = (W - CFG.paddle.w) / 2;
  state.phase = 'ready';
}

// Lanza hacia arriba con un ángulo aleatorio de ±15° respecto a la vertical.
// En las pantallas de fin, reinicia la partida.
function launch() {
  if (state.phase === 'gameover' || state.phase === 'won') return resetGame();
  if (state.phase !== 'ready') return;
  const a = (Math.random() * 30 - 15) * Math.PI / 180;
  state.ball.vx = CFG.ball.speed * Math.sin(a);
  state.ball.vy = -CFG.ball.speed * Math.cos(a);
  state.phase = 'playing';
}

canvas.addEventListener('mousedown', launch);
addEventListener('keydown', e => {
  if (e.code === 'Space') { e.preventDefault(); launch(); }
});

function update(dt) {
  const dir = (keys.has('ArrowRight') || keys.has('KeyD')) -
              (keys.has('ArrowLeft') || keys.has('KeyA'));
  state.paddle.x = clampPaddle(state.paddle.x + dir * CFG.paddle.keySpeed * dt);

  const b = state.ball, s = CFG.ball.size;
  if (state.phase === 'ready') return stickBall();
  if (state.phase !== 'playing') return;

  b.x += b.vx * dt;
  b.y += b.vy * dt;
  if (b.x < 0)     { b.x = 0;     b.vx = Math.abs(b.vx); }
  if (b.x > W - s) { b.x = W - s; b.vx = -Math.abs(b.vx); }
  if (b.y < 0)     { b.y = 0;     b.vy = Math.abs(b.vy); }

  // Rebote en la paleta: el ángulo depende del punto de impacto (-1 izq … 1 der)
  const p = CFG.paddle, px = state.paddle.x;
  if (b.vy > 0 && b.y + s >= p.y && b.y + s <= p.y + p.h + b.vy * dt &&
      b.x + s > px && b.x < px + p.w) {
    const hit = Math.max(-1, Math.min(1, (b.x + s / 2 - (px + p.w / 2)) / (p.w / 2)));
    const a = hit * CFG.ball.maxAngle * Math.PI / 180;
    b.vx = CFG.ball.speed * Math.sin(a);
    b.vy = -CFG.ball.speed * Math.cos(a);
    b.y = p.y - s;
  }

  // Colisión con bloques: rebota por el eje de menor penetración; un bloque por frame
  const { w: bw, h: bh } = CFG.blocks;
  const hitBlock = state.blocks.find(k => k.alive &&
    b.x + s > k.x && b.x < k.x + bw && b.y + s > k.y && b.y < k.y + bh);
  if (hitBlock) {
    const k = hitBlock;
    const penX = Math.min(b.x + s - k.x, k.x + bw - b.x);
    const penY = Math.min(b.y + s - k.y, k.y + bh - b.y);
    if (penX < penY) b.vx = (b.x + s / 2 < k.x + bw / 2 ? -1 : 1) * Math.abs(b.vx);
    else             b.vy = (b.y + s / 2 < k.y + bh / 2 ? -1 : 1) * Math.abs(b.vy);
    k.alive = false;
    state.score += k.points;
    if (!state.blocks.some(k => k.alive)) { state.phase = 'won'; return; }
  }

  // Cae por abajo: pierde una vida
  if (b.y > H) {
    state.lives--;
    state.phase = state.lives > 0 ? 'ready' : 'gameover';
  }
}

let last = 0;
function frame(t) {
  const dt = Math.min((t - last) / 1000, 1 / 30); // limitar dt a 1/30 s
  last = t;
  update(dt);
  draw();
  requestAnimationFrame(frame);
}

function draw() {
  const { paddle, ball } = CFG;
  ctx.clearRect(0, 0, W, H);
  for (const k of state.blocks)
    if (k.alive) drawSprite(ctx, 'block_' + k.color, k.x, k.y, CFG.blocks.w, CFG.blocks.h);
  drawSprite(ctx, 'paddle', state.paddle.x, paddle.y, paddle.w, paddle.h);
  drawSprite(ctx, 'ball', state.ball.x, state.ball.y, ball.size, ball.size);

  // HUD
  ctx.fillStyle = '#fff';
  ctx.font = '20px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('Puntos: ' + state.score, 16, 30);
  for (let i = 0; i < state.lives; i++)
    drawSprite(ctx, 'ball', W - 16 - (i + 1) * (ball.size + 6), 14, ball.size, ball.size);

  if (state.phase === 'gameover' || state.phase === 'won') {
    ctx.textAlign = 'center';
    ctx.font = '48px monospace';
    ctx.fillText(state.phase === 'won' ? 'Victoria' : 'Game Over', W / 2, H / 2 - 20);
    ctx.font = '24px monospace';
    ctx.fillText('Puntos: ' + state.score, W / 2, H / 2 + 20);
    ctx.fillText('Clic o espacio para reiniciar', W / 2, H / 2 + 60);
  }
}

createBlocks();
loadSpritesheet(() =>requestAnimationFrame(t => { last = t; frame(t); }));
