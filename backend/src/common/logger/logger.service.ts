import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { Logger as WinstonLogger } from 'winston';

/**
 * Custom logger service wrapping Winston
 */
@Injectable()
export class LoggerService implements NestLoggerService {
  constructor(private readonly logger: WinstonLogger) {}

  /**
   * Log informational messages
   */
  log(message: string, context?: string) {
    this.logger.info(message, { context });
  }

  /**
   * Log error messages
   */
  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { trace, context });
  }

  /**
   * Log warning messages
   */
  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }

  /**
   * Log debug messages
   */
  debug(message: string, context?: string) {
    this.logger.debug(message, { context });
  }

  /**
   * Log verbose messages
   */
  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context });
  }

  /**
   * Log with custom level and metadata
   */
  logWithMeta(level: string, message: string, meta?: Record<string, any>) {
    this.logger.log(level, message, meta);
  }
}
