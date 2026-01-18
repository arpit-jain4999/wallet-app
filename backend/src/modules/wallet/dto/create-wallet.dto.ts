import { IsString, IsOptional, IsNumber } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWalletDto {
  @ApiProperty({
    description: 'Name of the wallet owner',
    example: 'John Doe',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description:
      'Initial balance (optional, defaults to 0). Supports up to 4 decimal places',
    example: 20.5612,
    minimum: 0,
  })
  @IsOptional()
  @Transform(({ value }) => {
    // Handle empty string, null, or undefined
    if (value === '' || value === null || value === undefined) {
      return undefined;
    }
    return Number(value);
  })
  @IsNumber({}, { message: 'Balance must be a valid number' })
  balance?: number;
}
