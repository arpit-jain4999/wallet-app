import { Injectable } from '@nestjs/common';
import { HealthStatus } from '../../common/enums';

@Injectable()
export class HealthService {
  private readonly startTime = Date.now();

  check() {
    return {
      status: HealthStatus.OK,
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
    };
  }
}
