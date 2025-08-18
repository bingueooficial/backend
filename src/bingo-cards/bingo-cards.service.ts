// src/bingo-cards/bingo-cards.service.ts
import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BingoCard } from './entities/bingo-card.entity';

@Injectable()
export class BingoCardsService {
  constructor(
    @InjectRepository(BingoCard)
    private bingoCardRepository: Repository<BingoCard>,
  ) {}

  private getRandomUniqueNumbers(
    min: number,
    max: number,
    count: number,
  ): number[] {
    const numbers = new Set<number>();
    while (numbers.size < count) {
      numbers.add(Math.floor(Math.random() * (max - min + 1)) + min);
    }
    return Array.from(numbers).sort((a, b) => a - b);
  }

  private generateCardDataStructure(): {
    b: number[];
    i: number[];
    n: number[];
    g: number[];
    o: number[];
  } {
    return {
      b: this.getRandomUniqueNumbers(1, 15, 5),
      i: this.getRandomUniqueNumbers(16, 30, 5),
      n: this.getRandomUniqueNumbers(31, 45, 4), // 4 números para N
      g: this.getRandomUniqueNumbers(46, 60, 5),
      o: this.getRandomUniqueNumbers(61, 75, 5),
    };
  }

  private async getLastSerialValue(): Promise<number> {
    // ESTA ES LA SECCIÓN A MODIFICAR
    // Antes:
    // const lastCard = await this.bingoCardRepository.findOne({
    //   order: { serial: 'DESC' },
    // });
    // if (lastCard && lastCard.serial) {
    //   const numPart = parseInt(lastCard.serial.split('-')[1], 10);
    //   return isNaN(numPart) ? 0 : numPart;
    // }

    // DESPUÉS (el ajuste que propongo):
    const lastCard = await this.bingoCardRepository.find({
      // Cambia findOne a find
      order: { serial: 'DESC' },
      take: 1, // Limita el resultado a un solo elemento
    });

    if (lastCard.length > 0 && lastCard[0].serial) {
      // Accede al primer elemento del array
      const numPart = parseInt(lastCard[0].serial.split('-')[1], 10);
      return isNaN(numPart) ? 0 : numPart;
    }
    return 0;
  }

  /*private formatSerial(num: number): string {
    return `BNG-${String(num).padStart(4, '0')}`;
  }*/

  private formatSerial(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let serial = '';
  for (let i = 0; i < 4; i++) {
    serial += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return serial;
}

  async generateAndSaveUniqueCard(): Promise<BingoCard> {
    // CAMBIO CLAVE: Inicializar generatedData aquí
    let generatedData: {
      b: number[];
      i: number[];
      n: number[];
      g: number[];
      o: number[];
    } = {
      b: [],
      i: [],
      n: [],
      g: [],
      o: [], // Inicialización con arrays vacíos
    };

    let isUniqueContent = false;
    let attempts = 0;
    const MAX_CONTENT_ATTEMPTS = 100;

    while (!isUniqueContent && attempts < MAX_CONTENT_ATTEMPTS) {
      generatedData = this.generateCardDataStructure(); // Se asigna un valor real aquí

      const existingCard = await this.bingoCardRepository.findOne({
        where: {
          b_numbers: generatedData.b.join(','),
          i_numbers: generatedData.i.join(','),
          n_numbers: generatedData.n.join(','),
          g_numbers: generatedData.g.join(','),
          o_numbers: generatedData.o.join(','),
        },
      });

      if (!existingCard) {
        isUniqueContent = true;
      }
      attempts++;
    }

    if (!isUniqueContent) {
      throw new InternalServerErrorException(
        'No se pudo generar un contenido de cartón único después de varios intentos.',
      );
    }

    try {
      const lastSerialNum = await this.getLastSerialValue();
     // const newSerial = this.formatSerial(lastSerialNum + 1);
const newSerial = this.formatSerial();


      const newBingoCard = this.bingoCardRepository.create({
        serial: newSerial,
        b_numbers: generatedData.b.join(','), // Ahora TypeScript está contento
        i_numbers: generatedData.i.join(','),
        n_numbers: generatedData.n.join(','),
        g_numbers: generatedData.g.join(','),
        o_numbers: generatedData.o.join(','),
      });

      return await this.bingoCardRepository.save(newBingoCard);
    } catch (error) {
      if (
        error.code === 'SQLITE_CONSTRAINT_UNIQUE' ||
        error.message.includes('UNIQUE constraint failed')
      ) {
        throw new ConflictException(
          'Error al asignar serial: Ya existe un cartón con este serial. Intenta de nuevo.',
        );
      }
      throw new InternalServerErrorException(
        'Error al guardar el cartón en la base de datos.',
        error.message,
      );
    }
  }

  async getCardBySerial(serial: string): Promise<BingoCard> {
    const card = await this.bingoCardRepository.findOne({ where: { serial } });
    if (!card) {
      throw new NotFoundException(
        `Cartón con serial "${serial}" no encontrado.`,
      );
    }
    return card;
  }

  async getAllCards(): Promise<BingoCard[]> {
    return this.bingoCardRepository.find();
  }
}
