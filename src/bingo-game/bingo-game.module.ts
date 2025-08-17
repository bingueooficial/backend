// src/bingo-game/bingo-game.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BingoCardsModule } from '../bingo-cards/bingo-cards.module'; // Importa BingoCardsModule
import { BingoGameController } from './bingo-game.controller';
import { BingoGameService } from './bingo-game.service';
import { BingoGame } from './entities/bingo-game.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([BingoGame]),
    BingoCardsModule, // Importa BingoCardsModule para que BingoGameService pueda usar BingoCardsService
  ],
  controllers: [BingoGameController],
  providers: [BingoGameService],
  exports: [BingoGameService], // Exporta el servicio si otros módulos lo van a usar
})
export class BingoGameModule {}
