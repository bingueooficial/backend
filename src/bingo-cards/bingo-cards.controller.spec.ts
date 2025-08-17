import { Test, TestingModule } from '@nestjs/testing';
import { BingoCardsController } from './bingo-cards.controller';

describe('BingoCardsController', () => {
  let controller: BingoCardsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BingoCardsController],
    }).compile();

    controller = module.get<BingoCardsController>(BingoCardsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
