import {
  ConflictException,
  Controller,
  Get,
  HttpStatus,
  // <--- ¡Asegúrate de que estas dos líneas estén aquí!
  InternalServerErrorException,
  Param,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { BingoCardsService } from './bingo-cards.service';
import { BingoCard } from './entities/bingo-card.entity';

@Controller('bingo-cards')
export class BingoCardsController {
  constructor(private readonly bingoCardsService: BingoCardsService) {}

  @Post('generate-unique')
  async generateUniqueCard(): Promise<BingoCard> {
    return this.bingoCardsService.generateAndSaveUniqueCard();
  }

  @Post('generate-multiple')
  async generateMultipleCards(
    @Query('count') count: string,
    @Res() res: Response,
  ): Promise<void> {
    const numCards = parseInt(count, 10);
    if (isNaN(numCards) || numCards <= 0) {
      res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: 'Cantidad de cartones inválida.' });
      return;
    }
    const cards: BingoCard[] = [];
    try {
      for (let i = 0; i < numCards; i++) {
        cards.push(await this.bingoCardsService.generateAndSaveUniqueCard());
      }
      res.status(HttpStatus.CREATED).json(cards);
    } catch (error) {
      if (
        error instanceof InternalServerErrorException ||
        error instanceof ConflictException
      ) {
        res.status(error.getStatus()).json({ message: error.message });
      } else {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          message: 'Error interno del servidor al generar cartones.',
          error: error.message,
        });
      }
    }
  }

  @Get(':serial')
  async getCardBySerial(
    @Param('serial') serial: string,
  ): Promise<BingoCard | null> {
    return this.bingoCardsService.getCardBySerial(serial);
  }

  @Get()
  async getAllCards(): Promise<BingoCard[]> {
    return this.bingoCardsService.getAllCards();
  }
}
