import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BingoCardsService } from '../bingo-cards/bingo-cards.service';
import { BingoCard } from '../bingo-cards/entities/bingo-card.entity';
import {
  BINGO_CUSTOM_PATTERNS,
  BingoCustomPatternType,
} from './bingo-custom-patterns';
import { BingoGame } from './entities/bingo-game.entity'; // Asegúrate de que esta sea tu entidad BingoGame
import { BingoPatternType } from './entities/bingo-pattern.enum'; // <--- ¡Ruta actualizada!

@Injectable()
export class BingoGameService {
  constructor(
    @InjectRepository(BingoGame) // Inyecta el repositorio de tu entidad BingoGame
    private bingoGameRepository: Repository<BingoGame>,
    private bingoCardsService: BingoCardsService, // Inyecta el servicio de cartones
  ) {}

  // Obtiene el juego actual o crea uno si no existe
  async getCurrentGame(): Promise<BingoGame> {
    let game = await this.bingoGameRepository.findOne({ where: {} });
    if (!game) {
      // Si no hay juego, crea uno con valores por defecto
      game = this.bingoGameRepository.create({
        calledNumbers: [],
        currentRoundPattern: BingoPatternType.ANY, // Valor por defecto
      });
      await this.bingoGameRepository.save(game);
    }
    return game;
  }

  // Llama un número y lo guarda en el juego actual
  async callNumber(
    number: number,
  ): Promise<{ message: string; calledNumbers: number[] }> {
    const game = await this.getCurrentGame();

    if (number < 1 || number > 75) {
      throw new BadRequestException('El número debe estar entre 1 y 75.');
    }
    if (game.calledNumbers.includes(number)) {
      throw new ConflictException(`El número ${number} ya ha sido llamado.`);
    }
    if (game.calledNumbers.length >= 75) {
      throw new BadRequestException(
        'Todos los números han sido llamados. Reinicia el juego.',
      );
    }

    game.calledNumbers.push(number);
    game.calledNumbers.sort((a, b) => a - b); // Mantenerlos ordenados
    await this.bingoGameRepository.save(game); // Guardar cambios

    return {
      message: `Número ${number} llamado!`,
      calledNumbers: game.calledNumbers, // Devolver los números actualizados
    };
  }

  // Reinicia el juego actual
  async resetGame(): Promise<{ message: string }> {
    const game = await this.getCurrentGame();
    game.calledNumbers = []; // Limpia los números cantados
    game.currentRoundPattern = BingoPatternType.ANY; // Reinicia el patrón de la ronda
    await this.bingoGameRepository.save(game); // Guarda el estado reseteado
    return { message: 'Juego de Bingo reiniciado exitosamente.' };
  }

  // Obtiene los números cantados del juego actual
  async getCalledNumbers(): Promise<number[]> {
    const game = await this.getCurrentGame();
    return game.calledNumbers;
  }

  // **** NUEVO MÉTODO: Establecer el patrón de la ronda actual ****
  async setCurrentPattern(
    pattern: BingoPatternType,
  ): Promise<{ message: string; currentPattern: BingoPatternType }> {
    // Verificar si el patrón es válido (existe en el enum)
    if (!Object.values(BingoPatternType).includes(pattern)) {
      throw new BadRequestException(`Tipo de patrón inválido: ${pattern}`);
    }

    const game = await this.getCurrentGame();
    game.currentRoundPattern = pattern; // Actualiza el patrón en la entidad
    await this.bingoGameRepository.save(game); // Guarda el cambio en la BD

    return {
      message: `Ronda configurada para el patrón: ${pattern}`,
      currentPattern: game.currentRoundPattern,
    };
  }

  // **** NUEVO MÉTODO: Obtener el patrón de la ronda actual ****
  async getCurrentPattern(): Promise<{ currentPattern: BingoPatternType }> {
    const game = await this.getCurrentGame();
    return { currentPattern: game.currentRoundPattern };
  }

  // **** MODIFICADO: validateBingo ahora usa el patrón de la ronda actual ****
  async validateBingo(cardSerial: string): Promise<{
    hasBingo: boolean;
    message: string; // Añadir mensaje a la respuesta
    card: BingoCard;
    winningPattern?: BingoPatternType[]; // Ahora es un array de BingoPatternType
    calledNumbers: number[];
  }> {
    const card = await this.bingoCardsService.getCardBySerial(cardSerial);
    if (!card) {
      throw new NotFoundException(
        `Cartón con serial "${cardSerial}" no encontrado.`,
      );
    }

    const game = await this.getCurrentGame(); // Obtener el juego para el patrón y números
    const calledNumbersSet = new Set(game.calledNumbers.map(Number)); // <--- ¡Añade .map(Number)!
    const currentRoundPattern = game.currentRoundPattern; // Obtener el patrón de la ronda actual

    const { isWinner, winningPatterns: actualWinningPatterns } =
      this.checkBingo(card, calledNumbersSet);

    // Filtrar los patrones ganadores si se especificó un patternType de ronda
    let hasBingoForCurrentRound = false;
    let responseMessage: string;

    if (currentRoundPattern === BingoPatternType.ANY) {
      hasBingoForCurrentRound = isWinner; // Si es ANY, cualquier bingo cuenta
      if (hasBingoForCurrentRound) {
        responseMessage = `¡Bingo! El cartón ${cardSerial} ha hecho bingo con cualquier patrón.`;
      } else {
        responseMessage = `El cartón ${cardSerial} aún no ha hecho bingo.`;
      }
    } else {
      // Verificar si el patrón de la ronda actual está entre los patrones encontrados
      hasBingoForCurrentRound =
        actualWinningPatterns.includes(currentRoundPattern);
      if (hasBingoForCurrentRound) {
        responseMessage = `¡Bingo! El cartón ${cardSerial} ha hecho bingo con el patrón ${currentRoundPattern}.`;
      } else {
        responseMessage = `El cartón ${cardSerial} aún no ha hecho bingo para el patrón ${currentRoundPattern}.`;
      }
    }

    return {
      hasBingo: hasBingoForCurrentRound,
      message: responseMessage,
      card,
      //winningPattern: actualWinningPatterns, // Siempre devolver todos los patrones que tiene el cartón
      calledNumbers: game.calledNumbers, // Devolver los números cantados del juego
    };
  }

  // **** checkBingo: Modificado para devolver todos los patrones encontrados ****
  // El filtrado por el patrón de la ronda se hace en validateBingo
  private checkBingo(
    card: BingoCard,
    calledSet: Set<number>,
  ): { isWinner: boolean; winningPatterns: BingoPatternType[] } {
    const winningPatterns: BingoPatternType[] = [];

    // Reconstruye el cartón 5x5 con el FREE central
    const b = card.b_numbers.split(',').map(Number);
    const i = card.i_numbers.split(',').map(Number);
    const n = card.n_numbers.split(',').map(Number);
    const g = card.g_numbers.split(',').map(Number);
    const o = card.o_numbers.split(',').map(Number);

    const isCellMarked = (row: number, col: number): boolean => {
      const cellValue = cardMatrix[row][col];
      return (
        cellValue === 'FREE' ||
        (typeof cellValue === 'number' && calledSet.has(cellValue))
      );
    };

    const cardMatrix: (number | 'FREE')[][] = [
      [b[0], i[0], n[0], g[0], o[0]],
      [b[1], i[1], n[1], g[1], o[1]],
      [b[2], i[2], 'FREE', g[2], o[2]], // Espacio FREE
      [b[3], i[3], n[2], g[3], o[3]],
      [b[4], i[4], n[3], g[4], o[4]],
    ];

    console.log('--- Depurando checkBingo ---');
    console.log('Cartón BNG-0004 Matrix:', cardMatrix); // See the actual matrix values
    console.log(
      'Called Numbers Set (Type and Values):',
      typeof Array.from(calledSet)[0],
      Array.from(calledSet).sort((a, b) => a - b),
    ); // Check type

    const isLineComplete = (line: (number | 'FREE')[]): boolean => {
      return line.every(
        num =>
          num === 'FREE' || (typeof num === 'number' && calledSet.has(num)),
      );
    };

    // --- Verificar TODOS los Patrones Posibles ---

    // 1. Filas (ROW)
    for (let r = 0; r < 5; r++) {
      if (isLineComplete(cardMatrix[r])) {
        winningPatterns.push(BingoPatternType.ROW);
      }
    }

    // 2. Columnas (COLUMN)
    for (let c = 0; c < 5; c++) {
      const column = cardMatrix.map(row => row[c]);
      if (isLineComplete(column)) {
        winningPatterns.push(BingoPatternType.COLUMN);
      }
    }

    // 3. Diagonales
    // Top-Left to Bottom-Right (DIAGONAL_TL_BR)
    const diagTLBR = [
      cardMatrix[0][0],
      cardMatrix[1][1],
      cardMatrix[2][2],
      cardMatrix[3][3],
      cardMatrix[4][4],
    ];
    if (isLineComplete(diagTLBR)) {
      winningPatterns.push(BingoPatternType.DIAGONAL_TL_BR);
    }

    // Top-Right to Bottom-Left (DIAGONAL_TR_BL)
    const diagTRBL = [
      cardMatrix[0][4],
      cardMatrix[1][3],
      cardMatrix[2][2],
      cardMatrix[3][1],
      cardMatrix[4][0],
    ];
    if (isLineComplete(diagTRBL)) {
      winningPatterns.push(BingoPatternType.DIAGONAL_TR_BL);
    }

    // 4. Cartón Lleno (FULL_CARD)
    const allNumbersOnCard = cardMatrix
      .flat()
      .filter(val => val !== 'FREE') as number[];
    if (allNumbersOnCard.every(num => calledSet.has(num))) {
      winningPatterns.push(BingoPatternType.FULL_CARD);
    }

    // 5. Patrón de Cruz (CROSS) - Fila central + Columna central
    const centerRow = cardMatrix[2];
    const centerColumn = cardMatrix.map(row => row[2]);
    const crossPatternSet = new Set(
      [...centerRow, ...centerColumn].filter(val => val !== 'FREE') as number[],
    );
    if (Array.from(crossPatternSet).every(num => calledSet.has(num))) {
      winningPatterns.push(BingoPatternType.CROSS);
    }

    // 6. Cuatro Esquinas (FOUR_CORNERS)
    const fourCorners = [
      cardMatrix[0][0],
      cardMatrix[0][4],
      cardMatrix[4][0],
      cardMatrix[4][4],
    ] as number[];
    if (fourCorners.every(num => calledSet.has(num))) {
      winningPatterns.push(BingoPatternType.FOUR_CORNERS);
    }

    // **** Lógica para Patrones Personalizados (como ARCO) ****
    for (const patternName of Object.values(BingoCustomPatternType)) {
      const patternCoordinates = BINGO_CUSTOM_PATTERNS[patternName];
      if (!patternCoordinates) {
        console.warn(
          `[checkBingo] No se encontraron coordenadas para el patrón personalizado: ${patternName}`,
        );
        continue;
      }

      const isCustomPatternComplete = patternCoordinates.every(([r, c]) =>
        isCellMarked(r, c),
      );

      if (isCustomPatternComplete) {
        // Si el patrón personalizado está completo, añádelo a los patrones ganadores.
        // 'patternName' será 'ARCO', y lo mapeamos al valor del enum BingoPatternType.ARCO
        winningPatterns.push(
          BingoPatternType[patternName as keyof typeof BingoPatternType],
        );
        console.log(
          `[checkBingo] Patrón personalizado ${patternName} detectado.`,
        );
      }
    }
    // **********************************************************

    // Devolvemos si tiene al menos un patrón y todos los patrones encontrados
    return {
      isWinner: winningPatterns.length > 0,
      winningPatterns: [...new Set(winningPatterns)], // Eliminar duplicados si un patrón se cumple por varias razones (ej. ROW y COLUMN se superponen)
    };
  }
}
