// src/bingo-game/bingo-game.controller.ts
import {
  BadRequestException,
  Body,
  Controller,
  Get, // Ya no es tan necesario si usas excepciones HTTP directamente
  Param,
  Post,
} from '@nestjs/common';
// import { Response } from 'express'; // No es necesario si no usas @Res()
import { BingoGameService } from './bingo-game.service'; // Importa BingoPatternType
import { BingoGame } from './entities/bingo-game.entity'; // Asegúrate de que esta sea tu entidad BingoGame
import { BingoPatternType } from './entities/bingo-pattern.enum';

@Controller('bingo-game')
export class BingoGameController {
  constructor(private readonly bingoGameService: BingoGameService) {}

  @Get('current')
  async getCurrentGame(): Promise<BingoGame> {
    return this.bingoGameService.getCurrentGame();
  }

  @Post('call-number')
  async callNumber(
    @Body('number') number: number,
  ): Promise<{ message: string; calledNumbers: number[] }> {
    // Cambiado el tipo de retorno
    // La validación de NestJS con DTOs sería mejor, pero por ahora se hace aquí
    if (typeof number !== 'number' || number < 1 || number > 75) {
      throw new BadRequestException(
        'El número a llamar debe ser un número entre 1 y 75.',
      );
    }
    // El servicio ya lanza excepciones si el número está duplicado, etc.
    // Solo devolvemos el resultado del servicio
    return this.bingoGameService.callNumber(number);
  }

  @Post('reset')
  async resetGame(): Promise<{ message: string }> {
    // Cambiado el tipo de retorno
    return this.bingoGameService.resetGame();
  }

  @Get('called-numbers')
  async getCalledNumbers(): Promise<number[]> {
    return this.bingoGameService.getCalledNumbers();
  }

  // **** CONTROLADOR PARA ESTABLECER EL PATRÓN ****
  @Post('set-pattern')
  async setCurrentPattern(@Body('pattern') pattern: BingoPatternType) {
    // El servicio ya tiene la lógica para validar y guardar.
    // Simplemente devolvemos el resultado del servicio.
    return this.bingoGameService.setCurrentPattern(pattern);
  }

  // **** CONTROLADOR PARA OBTENER EL PATRÓN ACTUAL ****
  @Get('current-pattern')
  async getCurrentPattern() {
    // El retorno es un objeto, no una Promesa de BingoPatternType directamente
    return this.bingoGameService.getCurrentPattern();
  }

  // **** CONTROLADOR PARA VALIDAR BINGO (REFRACTORIZADO) ****
  @Get('validate-bingo/:serial')
  async validateBingo(@Param('serial') serial: string): Promise<{
    // Especifica el tipo de retorno exacto que el servicio te dará
    hasBingo: boolean;
    message: string;
    card: any; // O BingoCard si lo importas/defines
    winningPattern?: BingoPatternType[];
    calledNumbers: number[];
  }> {
    if (!serial) {
      throw new BadRequestException('El serial del cartón es requerido.');
    }
    // El servicio maneja las NotFoundException y BadRequestException
    // Simplemente devolvemos lo que el servicio nos retorna.
    return this.bingoGameService.validateBingo(serial);
  }
}
