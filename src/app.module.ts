import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config'; 
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BingoCardsModule } from './bingo-cards/bingo-cards.module';
import { BingoCard } from './bingo-cards/entities/bingo-card.entity';
import { BingoGameModule } from './bingo-game/bingo-game.module';
import { BingoGame } from './bingo-game/entities/bingo-game.entity'; 

@Module({
  imports: [
      ThrottlerModule.forRoot([{
      ttl: 60000, // Tiempo de vida: 60 segundos
      limit: 5,  // Límite de 10 peticiones por 60 segundos
    }]),
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
     // type: 'sqlite', // Usamos SQLite para desarrollo
     // database: 'db.sqlite', // El nombre del archivo de la base de datos
      type: 'postgres', 
      url: process.env.DATABASE_URL, 
      entities: [BingoCard, BingoGame], // Importa aquí todas tus entidades
      synchronize: true, // Esto es genial para desarrollo: sincroniza automáticamente tu esquema de DB con tus entidades.
      // ¡CUIDADO! En producción, querrás usar migraciones.
       ssl: {
        rejectUnauthorized: false,
      },
    }),
    BingoCardsModule,
    BingoGameModule,
    // BingoGameModule, // Lo crearemos en el siguiente paso
  ],
  controllers: [AppController],
  providers: [AppService],
})


export class AppModule {}
