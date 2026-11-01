# SPEC 02 — Animación de destrucción de bloques

> **Estado:** Implementado
> **Depende de:** SPEC 01
> **Fecha:** 2026-11-01
> **Objetivo:** Al romperse, cada bloque reproduce la animación de explosión de 4 frames (`EXPLOSION_FRAMES`, 150 ms) en lugar de desaparecer al instante.

---

## Alcance

**Dentro:**

- Cambios solo en `game.js`; `assets/spritesheet.js` se usa tal cual (`EXPLOSION_FRAMES`, `EXPLOSION_DURATION`, `drawFrame`).
- Al romperse un bloque se crea una explosión en su misma posición y tamaño (`CFG.blocks.w` x `CFG.blocks.h`), con los frames de su color.
- La explosión dura `EXPLOSION_DURATION` (150 ms) en total, repartida a partes iguales entre los 4 frames.
- Una explosión terminada se elimina de la lista.
- El estado `won` se activa cuando ya no quedan bloques vivos **y** ya no quedan explosiones activas.
- Las explosiones se actualizan y dibujan en todas las fases (`ready`, `playing`, `gameover`, `won`).
- `resetGame()` vacía la lista de explosiones.

**Fuera de alcance (specs futuras):**

- Sonido (`break-sound.mp3`, `ball-bounce.mp3`) y opción de silenciar.
- Partículas, temblor de pantalla u otros efectos visuales.
- Animación en otros eventos (rebote en paleta, pérdida de vida, victoria).
- Frames de explosión propios para `gray` (sigue reutilizando los de `red`, ver `CLAUDE.md`).
- Cambios en colisión, puntuación o velocidad de la bola.

---

## Modelo de datos

Se añade una lista de explosiones al estado de `game.js`; nada se persiste. Tiempos en milisegundos, como `EXPLOSION_DURATION`.

```js
const state = {
  // ...campos existentes de SPEC 01...
  explosions: [/* { x, y, color, t } */], // t = ms transcurridos desde la rotura
};
```

Convenciones:

- Al romper un bloque: `state.blocks[i].alive = false` (igual que en SPEC 01, con puntos y rebote inmediatos) y `state.explosions.push({ x: k.x, y: k.y, color: k.color, t: 0 })`.
- El frame mostrado es `Math.floor(t / EXPLOSION_DURATION * 4)`; cuando `t >= EXPLOSION_DURATION` la explosión se elimina.
- `t` avanza con el `dt` del bucle (`dt * 1000`), ya limitado a 1/30 s.
- La explosión es solo visual: no colisiona con la bola ni afecta la puntuación.

---

## Plan de implementación

**Control de versiones:** rama `spec-02-animacion-destruccion-bloques` creada desde `main`; un commit por paso (`spec-02 paso N: <resumen>`), igual que en SPEC 01.

1. Añadir `explosions: []` a `state`, crearlas al romper un bloque y vaciarlas en `resetGame()`. Prueba: en la consola, `state.explosions.length` aumenta al romper un bloque (aún sin dibujarse).
2. Avanzar `t` con `dt` en `update()` (en todas las fases) y eliminar las terminadas; dibujarlas en `draw()` con `drawFrame(ctx, EXPLOSION_FRAMES[color][frame], x, y, CFG.blocks.w, CFG.blocks.h)`. Prueba: cada bloque roto muestra su explosión de 4 frames y luego desaparece.
3. Retrasar la victoria: pasar a `won` solo cuando no hay bloques vivos ni explosiones activas. Prueba: al romper el último bloque se ve su explosión completa y después aparece "Victoria".

---

## Criterios de aceptación

- [x] Al romper un bloque se ve la animación de 4 frames en su posición, con el color de ese bloque.
- [x] La animación dura 150 ms en total (`EXPLOSION_DURATION`) y el bloque no queda dibujado después.
- [x] Los puntos se suman y la bola rebota en el instante del golpe, no al terminar la animación.
- [x] La bola atraviesa la celda de una explosión en curso sin rebotar.
- [x] Romper varios bloques seguidos muestra varias explosiones simultáneas sin cortarse entre sí.
- [x] Los bloques grises explotan con los frames rojos, sin errores en consola.
- [ ] Al romper el último bloque, "Victoria" aparece solo después de que termina su explosión.
- [x] Si se pierde la última vida con una explosión en curso, esta termina y "Game Over" se mantiene visible.
- [x] Al reiniciar tras `gameover` o `won` no queda ninguna explosión en pantalla.
- [x] La velocidad de la bola, la puntuación por fila y el resto del comportamiento de SPEC 01 no cambian.
- [x] No se reproduce ningún sonido ni se añaden dependencias; el juego sigue abriendo con `file://`.
- [x] Existe la rama `spec-02-animacion-destruccion-bloques` con un commit por cada paso del plan (3 commits).

---

## Decisiones tomadas y descartadas

- **Sí:** 150 ms en total (`EXPLOSION_DURATION`). Es el valor definido por el spritesheet y mantiene el ritmo del juego.
- **No:** 150 ms por frame. 600 ms por explosión se siente lento con varios bloques seguidos.
- **Sí:** explosión como entrada separada en `state.explosions`. Desacopla el efecto visual de la colisión; `alive` conserva el significado de SPEC 01.
- **No:** mantener el bloque "vivo" durante la animación. Complicaría colisión, puntuación y la condición de victoria sin beneficio.
- **Sí:** puntos y rebote inmediatos en el golpe. El feedback de juego no debe esperar a la animación.
- **Sí:** `won` solo tras terminar las explosiones. El último bloque se ve explotar completo.
- **No:** victoria inmediata cortando la animación. Se perdería el efecto del golpe final.
- **Sí:** actualizar y dibujar explosiones en todas las fases. Evita animaciones congeladas en `gameover`/`won`.
- **No:** sonido en esta spec. Decisión del usuario; `break-sound.mp3` queda para otra spec.
- **Sí:** reutilizar `drawFrame` y `EXPLOSION_FRAMES` existentes. Ya resuelven coordenadas y carga del PNG.
- **Sí:** verificación manual con checklist y rama con un commit por paso, como en SPEC 01.

---

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| Con `dt` limitado a 1/30 s (33 ms), un frame de explosión (~37 ms) puede saltarse al ir lento | Calcular el frame con `Math.floor` y limitarlo a 3; aceptable perder un frame visual. |
| Índice de frame fuera de rango (`t` justo en 150 ms) | Eliminar la explosión antes de dibujar cuando `t >= EXPLOSION_DURATION`. |

---

## Qué **no** está en esta spec

- Sonido y opción de silenciar.
- Partículas, temblor de pantalla y otros efectos.
- Animaciones de paleta, bola o pantallas de fin.
- Frames de explosión propios para `gray`.
- Cambios de colisión, puntuación o dificultad.

Cada uno, si se aborda, va en su propia spec.
