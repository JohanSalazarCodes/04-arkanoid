# SPEC 01 — MVP jugable de Arkanoid

> **Estado:** Aprobado
> **Depende de:** ninguna (usa los assets existentes en `assets/`)
> **Fecha:** 2026-11-01
> **Objetivo:** Un Arkanoid de un nivel con 3 vidas, controlable con ratón y teclado, que se abre desde `index.html` y se juega de principio a fin.

---

## Alcance

**Dentro:**

- `index.html`, `style.css` y `game.js` en la raíz del proyecto (el PNG se carga con ruta relativa, ver `CLAUDE.md`).
- Canvas fijo de 800x600.
- Un nivel: 7 filas de bloques (una por color) x 12 columnas.
- Paleta controlada con ratón o con teclado (flechas / A-D).
- Bola con rebote en paredes, techo, paleta y bloques; velocidad constante.
- Ángulo de rebote en la paleta según el punto de impacto.
- 3 vidas, puntuación en pantalla, estados `ready`, `playing`, `gameover`, `won`.
- Sin sonido; el bloque roto desaparece al instante.
- Reinicio de partida desde las pantallas de fin.

**Fuera de alcance (specs futuras):**

- Varios niveles o patrones de bloques distintos.
- Persistencia (récord, `localStorage`).
- Power-ups, bloques con varios golpes, pausa, menú inicial.
- Canvas responsive y soporte táctil.
- Velocidad creciente de la bola.
- Sonido (`ball-bounce.mp3`, `break-sound.mp3`) y su opción de silenciar.
- Animación de explosión de bloques (`EXPLOSION_FRAMES`).
- Tests automatizados o tooling de build.

---

## Modelo de datos

Todo vive en `game.js`; nada se persiste. Coordenadas con origen arriba a la izquierda, tiempos en segundos (`dt` entre frames de `requestAnimationFrame`), velocidades en px/s.

```js
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
  lives: 3,
  paddle: { x: 0 },        // x del borde izquierdo; y fija en CFG
  ball:   { x: 0, y: 0, vx: 0, vy: 0 },
  blocks: [/* { x, y, color, points, alive } */],
};
```

Convenciones:

- En `ready` la bola va pegada al centro de la paleta; al lanzarla sale hacia arriba con un ángulo ligeramente aleatorio.
- Un bloque roto pasa a `alive: false`: deja de colisionar y de dibujarse de inmediato.
- Se gana cuando no queda ningún bloque con `alive: true`.

---

## Plan de implementación

1. Crear `index.html` (canvas 800x600, carga `assets/spritesheet.js`, `game.js`, `style.css`), `style.css` (canvas centrado, fondo oscuro) y `game.js` que, dentro de `loadSpritesheet`, dibuje paleta y bola en reposo. Prueba: abrir `index.html` y ver ambos sprites sin errores en consola.
2. Añadir el bucle `requestAnimationFrame` con `dt` y el movimiento de la paleta por ratón y teclado, limitada a los bordes del canvas. Prueba: la paleta sigue al ratón y a las flechas / A-D.
3. Añadir estado `ready`/`playing`: bola pegada a la paleta, lanzamiento con clic o espacio, rebote en paredes y techo. Prueba: la bola rebota en los tres bordes.
4. Añadir rebote en la paleta (ángulo según punto de impacto, módulo de velocidad constante), pérdida de vida al caer por abajo, HUD de vidas y puntos, y estado `gameover` con reinicio. Prueba: perder 3 vidas muestra Game Over y se puede reiniciar.
5. Generar la cuadrícula de 7x12 bloques, colisión bola-bloque (rebote por el eje de menor penetración), puntos por fila y estado `won`. Prueba: romper todos los bloques muestra Victoria.

---

## Criterios de aceptación

- [ ] Abrir `index.html` en el navegador carga el juego sin errores en la consola.
- [ ] Se ven 84 bloques (7 filas x 12 columnas), una fila por color, en el orden de `ROWS`.
- [ ] La paleta sigue al ratón y también se mueve con las flechas y con A/D, sin salirse del canvas.
- [ ] Al inicio y tras perder una vida la bola está pegada a la paleta y solo se lanza con clic o espacio.
- [ ] La bola rebota en paredes laterales y techo.
- [ ] Un golpe en el borde izquierdo de la paleta envía la bola hacia la izquierda y en el borde derecho hacia la derecha; en el centro, casi vertical.
- [ ] El módulo de la velocidad de la bola es el mismo en todo momento (`CFG.ball.speed`).
- [ ] Romper un bloque suma los puntos de su fila (cian 10 … gris 70) y el HUD se actualiza.
- [ ] Un bloque roto desaparece al instante.
- [ ] El juego no reproduce ningún sonido ni carga archivos de `assets/sounds/`.
- [ ] Si la bola cae por debajo de la paleta se pierde una vida y el HUD muestra las vidas restantes.
- [ ] Con 0 vidas aparece "Game Over" con la puntuación final, y clic o espacio inicia una partida nueva con 3 vidas y 0 puntos.
- [ ] Al romper todos los bloques aparece "Victoria" con la puntuación final, y clic o espacio inicia una partida nueva.
- [ ] El juego no usa dependencias externas ni requiere servidor (abre con `file://`).

---

## Decisiones tomadas y descartadas

- **Sí:** ratón y teclado a la vez. Cubre ambos estilos sin coste relevante.
- **No:** solo ratón o solo teclado. Excluye a jugadores sin motivo.
- **Sí:** 1 nivel y 3 vidas. Es el mínimo para tener partida completa con victoria y derrota.
- **No:** varios niveles. Necesita formato de niveles y progresión; merece su propia spec.
- **Sí:** puntos solo en pantalla, sin persistir. Evita decidir clave, versionado y fallos de `localStorage`.
- **No:** sonido en el MVP. Decisión del usuario por la hora; los mp3 de `assets/sounds/` quedan sin usar hasta otra spec.
- **No:** animación de explosión. Basta con que el bloque desaparezca; `drawFrame`/`EXPLOSION_FRAMES` quedan sin usar hasta otra spec.
- **Sí:** `index.html` + `style.css` + `game.js`. `spritesheet.js` es un script clásico global, así que no se usan módulos ES.
- **Sí:** canvas fijo 800x600. 12 columnas de 64 px caben con 16 px de margen por lado.
- **No:** canvas responsive. Complica el cálculo de coordenadas del ratón sin aportar al MVP.
- **Sí:** ángulo de rebote según el punto de impacto con velocidad constante. Da control al jugador sin parámetros extra.
- **No:** velocidad creciente. Añade ajuste de dificultad que probar.
- **Sí:** verificación manual con checklist. El proyecto no tiene build ni tests.
- **No:** Playwright. Introduciría tooling que el proyecto no usa.
- **Sí:** movimiento con `dt` en lugar de px/frame. La velocidad no depende de los Hz del monitor.
- **Sí:** puntos por fila crecientes hacia arriba (10 a 70). Valores ajustables en `ROWS`.

---

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| Bola que atraviesa bloques o paleta a `dt` grande | Limitar `dt` a 1/30 s por frame. |
| Bola atrapada rebotando horizontalmente | Garantizar una componente vertical mínima tras el rebote en paleta (`maxAngle` = 60° respecto a la vertical). |
| `loadSpritesheet` falla (ruta o PNG ausente) | Falla con `console.error`; `index.html` debe estar en la raíz. |
---

## Qué **no** está en esta spec

- Niveles múltiples y editor de niveles.
- Récord o cualquier persistencia.
- Power-ups, bloques resistentes, pausa y menú inicial.
- Animación de explosión de bloques.
- Canvas responsive y controles táctiles.
- Sonido y velocidad creciente.
- Tests automatizados.

Cada uno, si se aborda, va en su propia spec.
