import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';

export class ReputationParamDto {
  @ApiProperty({ name: 'userId', required: true, example: 1234, type: Number })
  @Type(() => Number)
  @IsInt()
  userId: number;
}
