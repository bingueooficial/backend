// src/bingo-cards/entities/bingo-card.entity.ts
import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity()
@Unique(['serial'])
export class BingoCard {
  @PrimaryGeneratedColumn('uuid') // Genera UUIDs para el ID principal
  id: string;

  @Column({ unique: true }) // También puedes poner unique aquí, pero el decorador @Unique en la clase es más explícito
  serial: string; // El serial del cartón (ej: BNG-0001)

  // Usamos un tipo 'text' o 'varchar' para almacenar los números como una cadena separada por comas.
  // Esto simplifica el almacenamiento, aunque puedes usar JSON o relacionar con otra tabla para mayor normalización.
  @Column('text')
  b_numbers: string; // "1,5,10,12,15"

  @Column('text')
  i_numbers: string; // "16,20,25,28,30"

  @Column('text')
  n_numbers: string; // "31,35,40,43" (4 números, ya que el centro es FREE)

  @Column('text')
  g_numbers: string; // "46,50,55,58,60"

  @Column('text')
  o_numbers: string; // "61,65,70,72,75"

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
