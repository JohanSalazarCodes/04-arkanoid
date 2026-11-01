# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Estado del proyecto

Juego de Arkanoid en HTML, CSS y JavaScript puro, **cero dependencias** (README.md). Aún no está implementado: solo existen los assets. No hay build, lint ni tests; el juego se abre directo en el navegador (`index.html`, por crear).

El código y la documentación del proyecto están en español.

## Assets (`assets/`)

- `spritesheet-breakout.png`: spritesheet único con paleta, bola, bloques y frames de explosión.
- `spritesheet.js`: script clásico (sin módulos, todo global) que debe cargarse con `<script>` antes del código del juego. Define:
  - `SPRITES` (paddle, ball, `blocks[color]`) y `EXPLOSION_FRAMES[color]` (4 frames cada uno, `EXPLOSION_DURATION = 150` ms), con coordenadas `{sx, sy, sw, sh}` en el PNG.
  - `loadSpritesheet(cb)`: carga la imagen una sola vez (callbacks encolados) y la copia a un canvas offscreen. `drawSprite`/`drawFrame` no hacen nada hasta que cargó, así que arrancar el juego dentro del callback.
  - `drawSprite(ctx, name, x, y, w, h)`: `name` es `'paddle'`, `'ball'` o `'block_<color>'`. `drawFrame(ctx, frame, ...)` dibuja un frame de explosión.
  - Colores: red, cyan, green, magenta, yellow, hotpink, gray. Nota: `EXPLOSION_FRAMES.gray` reutiliza los frames de red.
  - La ruta del PNG es relativa (`assets/spritesheet-breakout.png`), por lo que `index.html` debe estar en la raíz del proyecto. Con `file://` el canvas puede quedar "tainted" al leer píxeles; servir por HTTP si hace falta.
- `sounds/ball-bounce.mp3` (rebote) y `sounds/break-sound.mp3` (bloque roto).
