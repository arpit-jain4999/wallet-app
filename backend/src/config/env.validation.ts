import { plainToInstance } from 'class-transformer';
import { IsEnum, IsNumber, IsString, validateSync, IsOptional } from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV?: Environment = Environment.Development;

  @IsNumber()
  @IsOptional()
  PORT?: number = 3001;

  @IsString()
  MONGODB_URI: string;

  @IsString()
  @IsOptional()
  FRONTEND_URL?: string = 'http://localhost:3000';

  @IsString()
  @IsOptional()
  LOG_LEVEL?: string = 'info';
}

/**
 * Validate environment variables on application startup
 */
export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validatedConfig;
}
