/**
 * Tests for Health Service
 */
import { Test, TestingModule } from '@nestjs/testing';
import { HealthService } from './health.service';

describe('HealthService', () => {
  let service: HealthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HealthService],
    }).compile();

    service = module.get<HealthService>(HealthService);
  });

  describe('check', () => {
    it('should return health status', () => {
      const result = service.check();

      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('uptime');
      expect(result.status).toBe('ok');
      expect(typeof result.uptime).toBe('number');
      expect(result.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should return valid timestamp', () => {
      const result = service.check();
      const timestamp = new Date(result.timestamp);

      expect(timestamp.getTime()).toBeLessThanOrEqual(Date.now());
      expect(timestamp.getTime()).toBeGreaterThan(Date.now() - 1000); // Within last second
    });

    it('should return increasing uptime', async () => {
      const result1 = service.check();
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      const result2 = service.check();

      expect(result2.uptime).toBeGreaterThan(result1.uptime);
    });
  });
});
