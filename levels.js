// Datos de niveles. Script clásico: debe cargarse con <script> antes de game.js.

// Leyenda: letra de los patrones -> color y puntos
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
