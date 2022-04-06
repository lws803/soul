import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';

export class ReputationParamDto {
  @Type(() => Number)
  @IsInt()
  userId: number;
}
