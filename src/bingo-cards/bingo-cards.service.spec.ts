import { Test, TestingModule } from '@nestjs/testing';
import { BingoCardsService } from './bingo-cards.service';

describe('BingoCardsService', () => {
  let service: BingoCardsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BingoCardsService],
    }).compile();

    service = module.get<BingoCardsService>(BingoCardsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
