// Define las coordenadas de los patrones personalizados.
// Las coordenadas son [fila, columna] (0-indexado).
// Recuerda que 'FREE' está en [2, 2].

export enum BingoCustomPatternType {
  // Puedes nombrar tus figuras como quieras
  ARCO = 'ARCO',
  L_INVERTIDA = 'L_INVERTIDA',
  // Añade más si quieres
}

type PatternCoordinates = {
  [key in BingoCustomPatternType]: [number, number][];
};

export const BINGO_CUSTOM_PATTERNS: PatternCoordinates = {
  [BingoCustomPatternType.ARCO]: [
    [0, 0],
    [0, 1],
    [0, 2],
    [0, 3],
    [0, 4], // Fila superior
    [1, 0],
    [1, 4], // Bordes de la segunda fila
  ],
  [BingoCustomPatternType.L_INVERTIDA]: [
    [0, 4], // Esquina superior derecha
    [1, 4],
    [2, 4],
    [3, 4],
    [4, 4], // Columna O completa
    [4, 0],
    [4, 1],
    [4, 2],
    [4, 3], // Fila inferior (excluyendo la esquina ya definida)
  ],
  // Ejemplo: Cuadrado 3x3 (excluyendo FREE si no es parte del patrón)
  // [BingoCustomPatternType.CUADRADO_3X3]: [
  //   [0,1], [0,2], [0,3],
  //   [1,1], [1,2], [1,3],
  //   [2,1], [2,3], // Excluir [2,2] si FREE no es parte, o incluir si sí
  //   [3,1], [3,2], [3,3],
  // ],
};
