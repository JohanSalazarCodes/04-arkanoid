# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Estado:** Implementado (SPEC 01–03 + cambios posteriores sin spec, ver "Divergencias")
> **Objetivo:** Arkanoid en HTML, CSS y JavaScript puro, **cero dependencias**, que se abre directo en el navegador (`index.html`) y se juega de principio a fin.

El código y la documentación del proyecto están en español. No hay build, lint ni tests; la verificación es manual con los checklists de `specs/`.

---

## Flujo de trabajo con specs

- Cada cambio relevante nace como spec en `specs/NN-slug.md` (`01-mvp-jugable`, `02-animacion-destruccion-bloques`, `03-sonidos-y-niveles`), con la estructura: encabezado (Estado, Depende de, Fecha, Objetivo) → Alcance (dentro / fuera) → Modelo de datos → Plan de implementación → Criterios de aceptación → Decisiones tomadas y descartadas → Riesgos identificados → Qué no está en esta spec.
- Convención de versionado de las specs: rama `spec-NN-slug` desde `main` y un commit por paso (`spec-NN paso N: <resumen>`). `specs/.spec-config.yml` define `AutoCreateBranch: true`.
- Las specs son fotografías del momento en que se implementaron: **el código manda**. Si una spec contradice a `game.js`/`levels.js`, vale el código (ver "Divergencias"). Al abordar un cambio nuevo, crear una spec nueva en vez de reescribir las anteriores, salvo que se pida actualizarlas.

---

## Estructura de archivos

Todo en la raíz (el PNG se carga con ruta relativa, así que `index.html` debe estar en la raíz). Todos los scripts son clásicos, sin módulos ES (todo es global) y se cargan en este orden en `index.html`:

1. `assets/spritesheet.js` — sprites y dibujo (ver "Assets").
2. `levels.js` — **datos de niveles** (`LEGEND`, `LEVELS`). Archivo separado a propósito para poder añadir niveles o, más adelante, un editor, sin tocar la lógica.
3. `game.js` — estado, entrada, lógica y dibujo.

`style.css`: fondo oscuro y canvas centrado. Canvas fijo de 800x600 (`W`, `H`).

---

## Modelo de datos (`game.js`)

Nada se persiste. Coordenadas con origen arriba a la izquierda; `dt` en segundos (limitado a 1/30 s), velocidades en px/s, tiempos de explosión en ms.

```js
const CFG = {
  paddle: { w: 130, h: 14, y: 560, keySpeed: 600 },
  ball:   { size: 16, speed: 360, maxAngle: 60, speedPerLevel: 0.1 }, // maxAngle respecto a la vertical
  blocks: { cols: 12, w: 48, h: 24, offsetX: 112, offsetY: 90 },      // sprite 32x16 a escala 1.5x
  lives: 3,
};

const state = {
  phase: 'menu',        // 'menu' | 'ready' | 'playing' | 'gameover' | 'won'
  paused: false,        // solo tiene sentido en 'playing'
  score: 0, lives: 3,
  paddle: { x },        // borde izquierdo; y fija en CFG
  ball: { x, y, vx, vy },
  blocks: [/* { x, y, color, points, alive } */],
  explosions: [/* { x, y, color, t } */],
  level: 1,             // 1..LEVELS.length; en 'menu' es el nivel resaltado
  muted: false,         // solo en memoria
};
```

`levels.js`:

- `LEGEND`: letra → `{ color, points }` (g gray 70, h hotpink 60, r red 50, m magenta 40, y yellow 30, v green 20, c cyan 10).
- `LEVELS`: array de niveles; cada nivel es un array de strings de 12 caracteres (`.` = sin bloque, fila 0 arriba). Hoy: 1 cuadrícula completa (84 bloques), 2 pirámide (54), 3 dos columnas vacías (70). Una letra desconocida o fila de más de 12 caracteres se ignora sin error.
- Para añadir un nivel basta con añadir otro array a `LEVELS`: el menú, la progresión y `Victoria` usan `LEVELS.length`.

### Fases y flujo

- `menu` (inicio): lista de niveles sobre un fondo oscuro, con los bloques del nivel resaltado detrás. `1`–`9` empieza directo en ese nivel; `↑`/`↓` cambia el resaltado (cíclico); espacio o clic empieza en el resaltado. Empezar llama `resetGame(nivel)`: puntos 0, vidas 3, paleta centrada, fase `ready`.
- `ready`: bola pegada al centro de la paleta (`stickBall()`); clic o espacio lanza con ángulo aleatorio de ±15° (`launch()`).
- `playing`: física y colisiones en `update(dt)`. `P` o `Esc` alternan `paused` (solo aquí): `update` retorna de inmediato (congela bola, explosiones y paleta), el ratón no mueve la paleta y se dibuja la capa "Pausa".
- Nivel limpio (sin bloques vivos **y** sin explosiones activas): si `level < LEVELS.length` sube de nivel, `createBlocks()` y pasa a `ready` (vidas y puntos se conservan); si no, `won`.
- Bola fuera por abajo: `lives--`; a `ready` o, con 0 vidas, `gameover`.
- `gameover` / `won`: clic o espacio llama `showMenu()` (vuelve al menú con el nivel 1 resaltado; **no** reinicia directo).

### Física y puntuación

- Velocidad de la bola: `ballSpeed() = speed * (1 + speedPerLevel * (level - 1))` → 360, 396, 432 px/s; módulo constante dentro de un nivel (la usan `launch()` y el rebote en paleta).
- Rebote en paleta: el ángulo depende del punto de impacto (-1…1 × `maxAngle`).
- Colisión con bloques: rebota por el eje de menor penetración; **un bloque por frame**. El bloque pasa a `alive: false` (puntos y rebote inmediatos) y se crea una explosión en su posición; la explosión es solo visual (no colisiona).
- Explosión: frame `min(3, floor(t / EXPLOSION_DURATION * 4))`; se elimina cuando `t >= EXPLOSION_DURATION`. Se actualizan en todas las fases excepto en pausa.
- La bola no se dibuja en `menu` ni cuando no quedan bloques vivos.

### Sonido

- `sounds.bounce` (`ball-bounce.mp3`) en rebote de pared lateral, techo y paleta; `sounds.break` (`break-sound.mp3`) al romper un bloque (un golpe a bloque no dispara `bounce`).
- `playSound(name)` reproduce `cloneNode()` del `Audio` en cada llamada, de modo que los sonidos se **superponen** (un sonido por bloque roto, aunque sean varios en pocos frames). No usar `currentTime = 0` sobre el mismo `Audio`: corta el sonido anterior.
- Ignora el rechazo de `play()` (autoplay bloqueado). No hay sonido de lanzamiento, vida perdida, victoria ni Game Over.
- `M` silencia/activa; con sonido silenciado el HUD muestra `Silenciado`. No persiste al recargar.

### Controles

| Entrada | Efecto |
| --- | --- |
| Ratón (mover) | Paleta (posición absoluta); ignorado en pausa |
| `←`/`→` o `A`/`D` | Paleta (`keySpeed`) |
| Clic / `Espacio` | Empezar desde el menú, lanzar en `ready`, volver al menú tras `gameover`/`won` |
| `1`–`9`, `↑`/`↓` | Elegir nivel (solo en `menu`) |
| `P` / `Esc` | Pausa (solo en `playing`) |
| `M` | Silenciar |

---

## Assets (`assets/`)

- `spritesheet-breakout.png`: spritesheet único con paleta, bola, bloques y frames de explosión.
- `spritesheet.js`: script clásico (todo global) que debe cargarse con `<script>` antes del código del juego. Define:
  - `SPRITES` (paddle, ball, `blocks[color]`) y `EXPLOSION_FRAMES[color]` (4 frames cada uno, `EXPLOSION_DURATION = 150` ms), con coordenadas `{sx, sy, sw, sh}` en el PNG.
  - `loadSpritesheet(cb)`: carga la imagen una sola vez (callbacks encolados) y la copia a un canvas offscreen. `drawSprite`/`drawFrame` no hacen nada hasta que cargó, así que el juego arranca dentro del callback (ya lo hace `game.js`). Si falla, `console.error`.
  - `drawSprite(ctx, name, x, y, w, h)`: `name` es `'paddle'`, `'ball'` o `'block_<color>'`. `drawFrame(ctx, frame, ...)` dibuja un frame de explosión.
  - Colores: red, cyan, green, magenta, yellow, hotpink, gray. Nota: `EXPLOSION_FRAMES.gray` reutiliza los frames de red.
  - Con `file://` el canvas puede quedar "tainted" al leer píxeles; servir por HTTP si hace falta.
- `sounds/ball-bounce.mp3` (rebote) y `sounds/break-sound.mp3` (bloque roto).

---

## Divergencias entre las specs y el código

Lo que el código hace distinto de lo que dicen las specs (las specs no se han actualizado):

| Tema | Spec | Código actual |
| --- | --- | --- |
| Bloques | SPEC 01: 64x32, `offsetX: 16`, `offsetY: 60` | 48x24, `offsetX: 112`, `offsetY: 90` (12 columnas centradas) |
| Niveles en archivo aparte | SPEC 03: fuera de alcance, todo en `game.js` | `LEGEND` y `LEVELS` viven en `levels.js` |
| Menú de inicio y selección de nivel | SPEC 01/03: fuera de alcance; el juego arranca en `ready` | Fase `menu` con selección de nivel; `state.phase` inicial es `'menu'` |
| Pausa | SPEC 01/03: fuera de alcance | `P`/`Esc` y `state.paused` |
| Reinicio | SPEC 01/03: clic/espacio inicia partida nueva en el nivel 1 | Tras `gameover`/`won` se vuelve al `menu`; `resetGame(level)` acepta nivel inicial |
| Sonido superpuesto | SPEC 03: reiniciar `currentTime`, "aceptable que el segundo corte al primero" | `cloneNode().play()` por llamada |
| Texto de fin de partida | — | "Clic o espacio para reiniciar" aunque ahora lleva al menú |
| SPEC 02, criterio de victoria | Sin marcar (`[ ]`) | Implementado: `won` espera a que terminen las explosiones |

---

## Decisiones tomadas y descartadas

- **Sí:** scripts clásicos globales, sin módulos ES. `spritesheet.js` ya es global y así funciona con `file://` sin servidor.
- **Sí:** `levels.js` separado. Permite añadir niveles y un futuro editor sin tocar `game.js`. (Cambia lo decidido en SPEC 03.)
- **No:** cargar niveles con `fetch`/JSON por ahora. Exige servir por HTTP; se evalúa cuando haya editor.
- **Sí:** `cloneNode()` por reproducción. Un sonido por bloque roto sin cortarse. Coste: más instancias de `Audio` de vida corta; la caché evita descargar otra vez.
- **Sí:** pausa solo en `playing`. En `ready` no hay nada corriendo que detener.
- **Sí:** tras terminar la partida se vuelve al menú para poder elegir nivel otra vez.
- **Sí:** verificación manual y commits pequeños; sin tooling de build ni tests (Playwright descartado en SPEC 01).

---

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| Bola atraviesa bloques o paleta a `dt` grande (432 px/s en nivel 3) | `dt` limitado a 1/30 s; comprobación de paleta con margen `b.vy * dt`. |
| El navegador bloquea `play()` antes de una interacción | Todo sonido llega tras clic/tecla; el rechazo se ignora con `.catch(() => {})`. |
| Nivel mal formado (fila ≠ 12 caracteres o letra desconocida) | `createBlocks()` ignora celdas desconocidas y trunca a `cols`; verificar por conteo de bloques. |
| `LEVELS` vacío o `levels.js` sin cargar | `game.js` falla al arrancar (`LEVELS` indefinido); `levels.js` debe ir antes en `index.html`. |
| Más de 9 niveles | Las teclas `1`–`9` no alcanzan; usar `↑`/`↓` o ampliar el menú. |

---

## Qué **no** está implementado

- Persistencia (récord, silenciado) y `localStorage`.
- Power-ups, bloques con varios golpes, sonidos de lanzamiento/vida/victoria, música y volumen.
- Pantalla "Nivel completado" y transiciones.
- Editor de niveles y carga de niveles externos.
- Canvas responsive y controles táctiles.
- Tests automatizados.

Cada uno, si se aborda, va en su propia spec.
