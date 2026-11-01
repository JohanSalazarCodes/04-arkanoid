const W = 800, H = 600;

const CFG = {
  paddle: { w: 130, h: 14, y: 560, keySpeed: 600 },
  ball:   { size: 16, speed: 360, maxAngle: 60 }, // grados respecto a la vertical
  blocks: { cols: 12, w: 64, h: 32, offsetX: 16, offsetY: 60 }, // sprite 32x16 a escala 2x
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

function update(dt) {
  const dir = (keys.has('ArrowRight') || keys.has('KeyD')) -
              (keys.has('ArrowLeft') || keys.has('KeyA'));
  state.paddle.x = clampPaddle(state.paddle.x + dir * CFG.paddle.keySpeed * dt);
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
  drawSprite(ctx, 'paddle', state.paddle.x, paddle.y, paddle.w, paddle.h);
  // bola en reposo, centrada sobre la paleta
  drawSprite(ctx, 'ball', state.paddle.x + (paddle.w - ball.size) / 2,
    paddle.y - ball.size, ball.size, ball.size);
}

loadSpritesheet(() => requestAnimationFrame(t => { last = t; frame(t); }));
