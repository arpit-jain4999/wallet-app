/**
 * Tests for Health Controller
 */
import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  let controller: HealthController;
  let service: HealthService;

  const mockHealthService = {
    check: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthService,
          useValue: mockHealthService,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    service = module.get<HealthService>(HealthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('check', () => {
    it('should return health status', async () => {
      const mockHealth = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: 12345,
      };

      mockHealthService.check.mockReturnValue(mockHealth);

      const result = await controller.check();

      expect(result).toEqual(mockHealth);
      expect(mockHealthService.check).toHaveBeenCalled();
    });
  });
});
