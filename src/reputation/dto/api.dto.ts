import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsInt } from 'class-validator';

export class ReputationParamDto {
  @ApiProperty({ name: 'user_id', example: 1234, type: Number })
  @Expose({ name: 'user_id' })
  @Type(() => Number)
  @IsInt()
  userId: number;
}
