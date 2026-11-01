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

const ctx = document.getElementById('game').getContext('2d');

function draw() {
  const { paddle, ball } = CFG;
  ctx.clearRect(0, 0, W, H);
  drawSprite(ctx, 'paddle', state.paddle.x, paddle.y, paddle.w, paddle.h);
  // bola en reposo, centrada sobre la paleta
  drawSprite(ctx, 'ball', state.paddle.x + (paddle.w - ball.size) / 2,
    paddle.y - ball.size, ball.size, ball.size);
}

loadSpritesheet(draw);
