# Arkanoid

Juego de Arkanoid hecho con HTML, CSS y JavaScript puro, **cero dependencias**. Se juega en el navegador, sin build ni servidor.

## Cómo jugar

Abre `index.html` en el navegador (funciona con `file://`).

- Desde el menú de inicio elige el nivel y empieza.
- Mueve la paleta, lanza la bola y rompe todos los bloques.
- Tienes 3 vidas; los puntos y las vidas se conservan entre niveles.
- Al limpiar el último nivel ganas.

### Controles

| Entrada | Efecto |
| --- | --- |
| Ratón | Mueve la paleta |
| `←` `→` o `A` `D` | Mueve la paleta |
| Clic o `Espacio` | Empezar, lanzar la bola, volver al menú al terminar |
| `1`–`9` o `↑` `↓` | Elegir nivel en el menú (`1`–`9` empieza directo) |
| `P` o `Esc` | Pausa |
| `M` | Silenciar / activar sonido |

## Características

- 3 niveles (cuadrícula, pirámide, columnas vacías); la bola es un 10 % más rápida en cada uno.
- Menú de inicio con selección de nivel.
- Pausa a media partida.
- Ángulo de rebote según el punto de impacto en la paleta.
- Animación de explosión al romper bloques.
- Sonido de rebote y de bloque roto (superpuestos si se rompen varios a la vez).

## Estructura

```
index.html            Página y canvas (800x600)
style.css             Estilos
levels.js             Datos de niveles (LEGEND y LEVELS)
game.js               Estado, entrada, lógica y dibujo
assets/
  spritesheet.js      Sprites y funciones de dibujo
  spritesheet-breakout.png
  sounds/             ball-bounce.mp3, break-sound.mp3
specs/                Especificaciones de cada funcionalidad
CLAUDE.md             Guía técnica del proyecto
```

## Agregar un nivel

En `levels.js`, añade otro array a `LEVELS`: 12 caracteres por fila, una letra por color (`LEGEND`) y `.` para celda vacía. El menú y la progresión lo detectan solos.

## Especificaciones

El historial de decisiones está en `specs/` (MVP, animación de bloques, sonidos y niveles). Los detalles técnicos y las diferencias entre las specs y el código están en `CLAUDE.md`.
