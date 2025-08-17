// src/bingo-game/entities/bingo-game.entity.ts
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BingoPatternType } from './bingo-pattern.enum';

@Entity('bingo_game') // Nombre de la tabla en la base de datos
export class BingoGame {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('simple-array', { default: '' }) // Almacena un array de números como una cadena separada por comas
  calledNumbers: number[];

  // **** NUEVA COLUMNA ****
  @Column({
    type: 'text', // O 'varchar' si lo prefieres, pero 'text' es más genérico para strings
    enum: BingoPatternType, // ¡Aún necesitamos el 'enum' aquí para validación y tipos en TypeScript!
    default: BingoPatternType.ANY,
  })
  currentRoundPattern: BingoPatternType;
  // **********************

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
