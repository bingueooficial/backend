// src/bingo-cards/bingo-cards.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BingoCardsController } from './bingo-cards.controller';
import { BingoCardsService } from './bingo-cards.service';
import { BingoCard } from './entities/bingo-card.entity'; // Importa la entidad

@Module({
  imports: [TypeOrmModule.forFeature([BingoCard])], // Importa el repositorio de BingoCard
  controllers: [BingoCardsController],
  providers: [BingoCardsService],
  exports: [BingoCardsService], // Exporta el servicio si otros módulos lo van a usar
})
export class BingoCardsModule {}
