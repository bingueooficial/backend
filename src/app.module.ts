import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config'; 
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BingoCardsModule } from './bingo-cards/bingo-cards.module';
import { BingoCard } from './bingo-cards/entities/bingo-card.entity';
import { BingoGameModule } from './bingo-game/bingo-game.module';
import { BingoGame } from './bingo-game/entities/bingo-game.entity'; // La crearemos en el siguiente paso

@Module({
  imports: [
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
