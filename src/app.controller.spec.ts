import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

describe('AppController', () => {
  let appController: AppController;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: PrismaService,
          useValue: {
            $queryRaw: jest.fn(),
          },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
    prismaService = app.get<PrismaService>(PrismaService);
  });

  describe('health check', () => {
    it('should return "Everything OK" when database is reachable', async () => {
      jest.mocked(prismaService.$queryRaw).mockResolvedValue([{ '?column?': 1 }]);

      const result = await appController.getHealth();
      expect(result).toEqual({ status: 'Everything OK' });
    });

    it('should throw SERVICE_UNAVAILABLE when database fails', async () => {
      jest
        .mocked(prismaService.$queryRaw)
        .mockRejectedValue(new Error('connection refused'));

      await expect(appController.getHealth()).rejects.toThrow(
        expect.objectContaining({
          status: 503,
          response: { status: 'Service Unavailable' },
        }),
      );
    });
  });
});
