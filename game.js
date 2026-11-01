const W = 800, H = 600;

const CFG = {
  paddle: { w: 130, h: 14, y: 560, keySpeed: 600 },
  ball:   { size: 16, speed: 360, maxAngle: 60, speedPerLevel: 0.1 }, // maxAngle en grados respecto a la vertical; +10% de speed por nivel
  blocks: { cols: 12, w: 48, h: 24, offsetX: 112, offsetY: 90 }, // sprite 32x16 a escala 1.5x; centrado en W
  lives: 3,
};

const state = {
  phase: 'menu',           // 'menu' | 'ready' | 'playing' | 'gameover' | 'won'
  paused: false,           // solo válido en 'playing'
  score: 0,
  lives: CFG.lives,
  paddle: { x: (W - CFG.paddle.w) / 2 }, // x del borde izquierdo; y fija en CFG
  ball:   { x: 0, y: 0, vx: 0, vy: 0 },
  blocks: [/* { x, y, color, points, alive } */],
  explosions: [/* { x, y, color, t } */], // t = ms desde la rotura
  level: 1,                // 1..LEVELS.length
  muted: false,            // solo en memoria
};

const sounds = {
  bounce: new Audio('assets/sounds/ball-bounce.mp3'),
  break:  new Audio('assets/sounds/break-sound.mp3'),
};

// Reproduce una copia nueva por llamada para que los sonidos se superpongan
// (antes se reiniciaba el mismo Audio y cortaba el anterior). Ignora el rechazo
// de play() (p. ej. autoplay bloqueado). El clon usa la caché del navegador.
function playSound(name) {
  if (state.muted) return;
  sounds[name].cloneNode().play().catch(() => {});
}

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const clampPaddle = x => Math.max(0, Math.min(W - CFG.paddle.w, x));

// Entrada: ratón (posición absoluta) y teclado (flechas / A-D)
const keys = new Set();
addEventListener('keydown', e => keys.add(e.code));
addEventListener('keyup', e => keys.delete(e.code));
canvas.addEventListener('mousemove', e => {
  if (state.paused) return;
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
  state.blocks = LEVELS[state.level - 1].flatMap((row, r) =>
    [...row.slice(0, cols)].flatMap((ch, c) => LEGEND[ch] ? [{
      x: offsetX + c * w, y: offsetY + r * h,
      color: LEGEND[ch].color, points: LEGEND[ch].points, alive: true,
    }] : [])); // '.' o letra desconocida = sin bloque
}

// Pantalla de inicio: elegir nivel con 1-3, flechas ↑/↓ y espacio/clic
function showMenu() {
  state.phase = 'menu';
  state.paused = false;
  state.level = 1;
  createBlocks();
  state.explosions = [];
}

function resetGame(level = 1) {
  state.level = level;
  createBlocks();
  state.explosions = [];
  state.score = 0;
  state.lives = CFG.lives;
  state.paddle.x = (W - CFG.paddle.w) / 2;
  state.phase = 'ready';
}

const ballSpeed = () => CFG.ball.speed * (1 + CFG.ball.speedPerLevel * (state.level - 1));

// Lanza hacia arriba con un ángulo aleatorio de ±15° respecto a la vertical.
// En las pantallas de fin, reinicia la partida.
function launch() {
  if (state.phase === 'gameover' || state.phase === 'won') return showMenu();
  if (state.phase === 'menu') return resetGame(state.level);
  if (state.phase !== 'ready' || state.paused) return;
  const a = (Math.random() * 30 - 15) * Math.PI / 180;
  state.ball.vx = ballSpeed() * Math.sin(a);
  state.ball.vy = -ballSpeed() * Math.cos(a);
  state.phase = 'playing';
}

canvas.addEventListener('mousedown', launch);
addEventListener('keydown', e => {
  if (e.code === 'Space') { e.preventDefault(); launch(); }
  if (e.code === 'KeyM' && !e.repeat) state.muted = !state.muted;
  if ((e.code === 'KeyP' || e.code === 'Escape') && !e.repeat && state.phase === 'playing')
    state.paused = !state.paused;
  if (state.phase === 'menu') {
    const n = +e.key;
    if (n >= 1 && n <= LEVELS.length) resetGame(n);
    if (e.code === 'ArrowUp' || e.code === 'ArrowDown') {
      state.level = (state.level - 1 + (e.code === 'ArrowDown' ? 1 : LEVELS.length - 1)) % LEVELS.length + 1;
      createBlocks();
    }
  }
});

const cleared = () => !state.blocks.some(k => k.alive);

function update(dt) {
  if (state.paused) return;
  for (const e of state.explosions) e.t += dt * 1000;
  state.explosions = state.explosions.filter(e => e.t < EXPLOSION_DURATION);
  if (state.phase === 'playing' && !state.explosions.length && cleared()) {
    if (state.level < LEVELS.length) { state.level++; createBlocks(); state.phase = 'ready'; }
    else state.phase = 'won';
  }

  const dir = (keys.has('ArrowRight') || keys.has('KeyD')) -
              (keys.has('ArrowLeft') || keys.has('KeyA'));
  state.paddle.x = clampPaddle(state.paddle.x + dir * CFG.paddle.keySpeed * dt);

  const b = state.ball, s = CFG.ball.size;
  if (state.phase === 'ready') return stickBall();
  if (state.phase !== 'playing' || cleared()) return; // sin bloques: la bola ya no se mueve

  b.x += b.vx * dt;
  b.y += b.vy * dt;
  if (b.x < 0)     { b.x = 0;     b.vx = Math.abs(b.vx);  playSound('bounce'); }
  if (b.x > W - s) { b.x = W - s; b.vx = -Math.abs(b.vx); playSound('bounce'); }
  if (b.y < 0)     { b.y = 0;     b.vy = Math.abs(b.vy);  playSound('bounce'); }

  // Rebote en la paleta: el ángulo depende del punto de impacto (-1 izq … 1 der)
  const p = CFG.paddle, px = state.paddle.x;
  if (b.vy > 0 && b.y + s >= p.y && b.y + s <= p.y + p.h + b.vy * dt &&
      b.x + s > px && b.x < px + p.w) {
    const hit = Math.max(-1, Math.min(1, (b.x + s / 2 - (px + p.w / 2)) / (p.w / 2)));
    const a = hit * CFG.ball.maxAngle * Math.PI / 180;
    b.vx = ballSpeed() * Math.sin(a);
    b.vy = -ballSpeed() * Math.cos(a);
    b.y = p.y - s;
    playSound('bounce');
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
    state.explosions.push({ x: k.x, y: k.y, color: k.color, t: 0 });
    state.score += k.points;
    playSound('break');
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
  for (const e of state.explosions) {
    const f = Math.min(3, Math.floor(e.t / EXPLOSION_DURATION * 4));
    drawFrame(ctx, EXPLOSION_FRAMES[e.color][f], e.x, e.y, CFG.blocks.w, CFG.blocks.h);
  }
  drawSprite(ctx, 'paddle', state.paddle.x, paddle.y, paddle.w, paddle.h);
  if (!cleared() && state.phase !== 'menu') drawSprite(ctx, 'ball', state.ball.x, state.ball.y, ball.size, ball.size);

  // HUD
  ctx.fillStyle = '#fff';
  ctx.font = '20px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('Puntos: ' + state.score, 16, 30);
  ctx.fillText('Nivel ' + state.level, 16, 54);
  if (state.muted) {
    ctx.textAlign = 'center';
    ctx.fillText('Silenciado', W / 2, 30);
    ctx.textAlign = 'left';
  }
  for (let i = 0; i < state.lives; i++)
    drawSprite(ctx, 'ball', W - 16 - (i + 1) * (ball.size + 6), 14, ball.size, ball.size);

  if (state.paused || state.phase === 'menu') {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = '48px monospace';
    ctx.fillText(state.paused ? 'Pausa' : 'Arkanoid', W / 2, H / 2 - 60);
    ctx.font = '24px monospace';
    if (state.paused) ctx.fillText('P o Esc para continuar', W / 2, H / 2 - 10);
    else {
      LEVELS.forEach((_, i) => ctx.fillText((state.level === i + 1 ? '> ' : '  ') + 'Nivel ' + (i + 1),
        W / 2, H / 2 - 10 + i * 34));
      ctx.fillText('1-' + LEVELS.length + ' o ↑/↓ y espacio/clic', W / 2, H / 2 + 20 + LEVELS.length * 34);
    }
  }

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
