import { IsNumber, IsString, IsOptional, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TransactionDto {
  @ApiProperty({
    description:
      'Transaction amount. Positive for CREDIT, negative for DEBIT. Supports up to 4 decimal places',
    example: 10.5,
  })
  @ValidateIf((o) => o.amount !== undefined)
  @Type(() => Number)
  @IsNumber()
  amount: number;

  @ApiPropertyOptional({
    description: 'Optional transaction description',
    example: 'Recharge',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
