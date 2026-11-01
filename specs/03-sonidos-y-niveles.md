# SPEC 03 — Sonidos y niveles

> **Estado:** Implementado
> **Depende de:** SPEC 01, SPEC 02
> **Fecha:** 2026-11-01
> **Objetivo:** El juego reproduce `ball-bounce.mp3` y `break-sound.mp3` en rebotes y roturas (con tecla M para silenciar) y avanza por 3 niveles de patrón distinto, con la bola un 10% más rápida en cada uno.

---

## Alcance

**Dentro:**

- Cambios solo en `game.js`; `assets/sounds/ball-bounce.mp3` y `assets/sounds/break-sound.mp3` se usan tal cual.
- `ball-bounce.mp3` suena en cada rebote contra pared lateral, techo o paleta.
- `break-sound.mp3` suena al romper un bloque (solo ese; el golpe a un bloque no dispara `ball-bounce`).
- Tecla `M` alterna silenciar/activar el sonido; el estado vive solo en memoria y se reinicia al recargar.
- Cuando el sonido está silenciado, el HUD muestra el texto `Silenciado`.
- 3 niveles definidos como array de strings `LEVELS` en `game.js`, una letra por color y `.` para celda vacía.
- Nivel 1 idéntico a la cuadrícula actual (7 filas x 12 columnas completas).
- Al limpiar un nivel (tras terminar sus explosiones) se pasa directo a la fase `ready` del siguiente, con bloques nuevos, bola pegada a la paleta y vidas y puntos conservados.
- Velocidad de la bola por nivel: `CFG.ball.speed * (1 + 0.1 * (level - 1))` → 360, 396, 432 px/s.
- HUD con `Nivel N`.
- `Victoria` solo al limpiar el último nivel; `Game Over` y los reinicios vuelven al nivel 1.

**Fuera de alcance (specs futuras):**

- Sonidos de lanzamiento, pérdida de vida, victoria o Game Over (no hay assets para ellos).
- Música de fondo y control de volumen.
- Persistir el estado de silenciado (`localStorage`).
- Pantalla intermedia "Nivel completado" y animaciones de transición.
- Bloques con varios golpes, power-ups, récord y menú.
- Archivo `levels.js` separado, editor de niveles y más de 3 niveles.
- Cambios en colisión, ángulo de rebote en la paleta o canvas.

---

## Modelo de datos

Todo vive en `game.js`; nada se persiste. Se reemplaza `ROWS` por una leyenda de colores y los patrones de nivel.

```js
// Leyenda: letra de los patrones -> color y puntos (mismos valores que el antiguo ROWS)
const LEGEND = {
  g: { color: 'gray',    points: 70 },
  h: { color: 'hotpink', points: 60 },
  r: { color: 'red',     points: 50 },
  m: { color: 'magenta', points: 40 },
  y: { color: 'yellow',  points: 30 },
  v: { color: 'green',   points: 20 },
  c: { color: 'cyan',    points: 10 },
};

// 12 caracteres por fila; '.' = sin bloque. La fila 0 es la de arriba.
const LEVELS = [
  [ // Nivel 1: cuadrícula completa (84 bloques)
    'gggggggggggg',
    'hhhhhhhhhhhh',
    'rrrrrrrrrrrr',
    'mmmmmmmmmmmm',
    'yyyyyyyyyyyy',
    'vvvvvvvvvvvv',
    'cccccccccccc',
  ],
  [ // Nivel 2: pirámide (54 bloques)
    '.....gg.....',
    '....hhhh....',
    '...rrrrrr...',
    '..mmmmmmmm..',
    '.yyyyyyyyyy.',
    'vvvvvvvvvvvv',
    'cccccccccccc',
  ],
  [ // Nivel 3: dos columnas vacías (70 bloques)
    'ggg.gggg.ggg',
    'hhh.hhhh.hhh',
    'rrr.rrrr.rrr',
    'mmm.mmmm.mmm',
    'yyy.yyyy.yyy',
    'vvv.vvvv.vvv',
    'ccc.cccc.ccc',
  ],
];

const CFG = {
  // ...campos existentes...
  ball: { /* ...existentes... */ speedPerLevel: 0.1 }, // +10% de CFG.ball.speed por nivel
};

const state = {
  // ...campos existentes de SPEC 01 y 02...
  level: 1,        // 1..LEVELS.length
  muted: false,    // solo en memoria
};

const sounds = {
  bounce: new Audio('assets/sounds/ball-bounce.mp3'),
  break:  new Audio('assets/sounds/break-sound.mp3'),
};
```

Convenciones:

- `createBlocks()` lee `LEVELS[state.level - 1]`; el bloque en fila `r`, columna `c` se coloca en la misma posición que hoy (`offsetX + c * w`, `offsetY + r * h`).
- Los puntos dependen del color (`LEGEND`), no de la fila.
- Un nivel termina cuando no quedan bloques vivos ni explosiones activas (misma condición que SPEC 02).
- `playSound(name)` no hace nada si `state.muted`; si no, reinicia (`currentTime = 0`) y reproduce, ignorando el rechazo de `play()`.
- La velocidad actual de la bola se obtiene de una función `ballSpeed()` basada en `state.level`; la usan el lanzamiento y el rebote en la paleta.

---

## Plan de implementación

**Control de versiones:** rama `spec-03-sonidos-y-niveles` creada desde `main`, con el árbol de trabajo limpio (hoy `game.js` tiene cambios sin commitear: confirmarlos o guardarlos antes de ramificar). Un commit por paso (`spec-03 paso N: <resumen>`), igual que en SPEC 01 y 02.

1. Añadir `sounds` y `playSound()`; llamar `playSound('bounce')` en los rebotes de pared, techo y paleta, y `playSound('break')` al romper un bloque. Prueba: se oye el rebote en paredes y paleta, y el crujido al romper bloques, sin que suenen los dos a la vez en un golpe a bloque.
2. Añadir `state.muted`, la tecla `M` que lo alterna y el texto `Silenciado` en el HUD. Prueba: con `M` desaparecen todos los sonidos y aparece el texto; otra `M` los devuelve.
3. Sustituir `ROWS` por `LEGEND` y `LEVELS` (solo con el patrón del nivel 1), añadir `state.level = 1` y hacer que `createBlocks()` lea el patrón; mostrar `Nivel N` en el HUD. Prueba: el juego se ve y puntúa igual que antes, con `Nivel 1`.
4. Añadir `CFG.ball.speedPerLevel` y `ballSpeed()`, y usarla en `launch()` y en el rebote en paleta. Prueba: en la consola, `state.level = 2` antes de lanzar da `Math.hypot(state.ball.vx, state.ball.vy)` ≈ 396.
5. Añadir los patrones de los niveles 2 y 3 y la progresión: al cumplirse la condición de nivel limpio, si `state.level < LEVELS.length` se incrementa `level`, se llama `createBlocks()` y la fase pasa a `ready`; solo en el último nivel pasa a `won`. `resetGame()` vuelve a `level = 1`. Prueba: limpiar el nivel 1 lleva al nivel 2 con la bola pegada y, tras el nivel 3, aparece "Victoria".

---

## Criterios de aceptación

- [ ] Abrir `index.html` con `file://` carga el juego sin errores en la consola.
- [ ] La bola al rebotar en pared lateral, techo o paleta reproduce `ball-bounce.mp3`.
- [ ] Romper un bloque reproduce `break-sound.mp3` y no `ball-bounce.mp3`.
- [ ] Pulsar `M` silencia todos los sonidos y el HUD muestra `Silenciado`; pulsar `M` otra vez los reactiva y el texto desaparece.
- [ ] Recargar la página deja el sonido activado (el silenciado no persiste).
- [ ] Perder una vida, lanzar la bola, ganar o perder no reproducen ningún sonido propio.
- [ ] El HUD muestra `Nivel 1` al empezar.
- [ ] El nivel 1 muestra 84 bloques con la misma disposición y los mismos puntos por color que antes (cian 10 … gris 70).
- [ ] El nivel 2 muestra 54 bloques en forma de pirámide y el nivel 3 muestra 70 bloques con las columnas 4 y 9 vacías.
- [ ] Al romper el último bloque de un nivel y terminar su explosión, el juego pasa al siguiente nivel en fase `ready`, con bloques nuevos y la bola pegada a la paleta.
- [ ] Las vidas y los puntos se conservan al pasar de nivel.
- [ ] El módulo de la velocidad de la bola es 360 px/s en el nivel 1, 396 en el nivel 2 y 432 en el nivel 3, y constante dentro de cada nivel.
- [ ] Perder una vida mantiene el nivel y su velocidad.
- [ ] "Victoria" aparece solo al limpiar el nivel 3, no al limpiar el 1 o el 2.
- [ ] Tras `Game Over` o `Victoria`, clic o espacio inicia partida en el nivel 1 con 3 vidas, 0 puntos y velocidad 360.
- [ ] Existe la rama `spec-03-sonidos-y-niveles` con un commit por cada paso del plan (5 commits).
- [ ] No se añaden dependencias ni archivos fuera de `game.js` (y esta spec).

---

## Decisiones tomadas y descartadas

- **Sí:** una sola spec para sonidos y niveles. Ambos cambios son pequeños, tocan solo `game.js` y no se solapan en el plan.
- **No:** dos specs separadas. Más papeleo que valor para dos cambios de pocas líneas.
- **Sí:** `ball-bounce` en pared, techo y paleta; `break-sound` en bloque. Cada archivo cubre un evento claro y no suenan dos a la vez.
- **No:** `ball-bounce` también en bloques. Dos sonidos simultáneos por golpe saturan.
- **Sí:** tecla `M` para silenciar, solo en memoria. Da control al jugador sin decidir clave ni versionado de `localStorage`.
- **No:** persistir el silenciado. Se difiere junto con cualquier persistencia futura.
- **Sí:** texto `Silenciado` en el HUD. Sin indicador, el jugador no sabe por qué no suena nada.
- **Sí:** reiniciar `currentTime` en vez de clonar el `Audio`. Es lo más corto; si dos rebotes caen en el mismo instante, el segundo corta al primero, aceptable para efectos de ~100 ms.
- **No:** sonidos de lanzamiento, vida perdida, victoria o Game Over. No hay assets y fuera de alcance crear más.
- **Sí:** 3 niveles como array de strings en `game.js`. Fácil de editar a mano y sin archivos nuevos.
- **No:** `levels.js` aparte ni 5 niveles. Overengineering para 3 patrones.
- **Sí:** `LEGEND` con puntos por color. Con filas variables, los puntos por fila (`ROWS`) ya no tienen sentido; el valor por color es el mismo que hoy.
- **Sí:** velocidad lineal `+10%` del valor base por nivel (360, 396, 432). Predecible y suave; 432 px/s a `dt` máx. 1/30 s son 14,4 px por frame, menos que los 14 px de alto de la paleta más el margen de la comprobación actual.
- **No:** +20% por nivel. Más riesgo de atravesar la paleta y más ajuste de dificultad.
- **Sí:** pasar directo a `ready` del siguiente nivel, sin pantalla intermedia. Evita una fase nueva que probar.
- **No:** fase `levelclear`. Decisión del usuario; se puede añadir en otra spec.
- **Sí:** vidas y puntos se conservan entre niveles; `Game Over` y los reinicios vuelven al nivel 1.
- **No:** reponer vidas por nivel. Cambia el equilibrio de dificultad sin que se haya pedido.
- **Sí:** patrones de nivel definidos en esta spec, ajustables al revisar. Los diseños son simples (cuadrícula, pirámide, columnas vacías) y verificables por conteo de bloques.
- **Sí:** verificación manual con checklist y rama con un commit por paso, como en SPEC 01 y 02.

---

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| El navegador bloquea `play()` antes de una interacción del usuario | El primer sonido llega tras clic o espacio (lanzamiento); aun así se ignora el rechazo de `play()` con `.catch(() => {})`. |
| Los mp3 no cargan (ruta o archivo ausente) | El juego sigue sin sonido; falla solo `play()`, ya capturado, sin afectar a la jugabilidad. |
| Sonido de rebote saturado por muchos rebotes seguidos | `currentTime = 0` evita la acumulación de instancias a costa de cortar el sonido anterior. |
| Nivel con patrón mal formado (fila ≠ 12 caracteres) | `createBlocks()` ignora celdas fuera de rango o desconocidas; se verifica por conteo de bloques en los criterios de aceptación. |
| `game.js` tiene cambios sin commitear al ramificar | Confirmarlos o guardarlos antes de crear `spec-03-sonidos-y-niveles` (ver plan de implementación). |

---

## Qué **no** está en esta spec

- Sonidos de lanzamiento, vida perdida, victoria o Game Over; música de fondo y volumen.
- Persistencia del silenciado o de cualquier otro dato.
- Pantalla "Nivel completado" y transiciones animadas.
- Más de 3 niveles, `levels.js` separado y editor de niveles.
- Bloques resistentes, power-ups, récord, pausa y menú.
- Cambios de colisión, ángulo de rebote o canvas.

Cada uno, si se aborda, va en su propia spec.
