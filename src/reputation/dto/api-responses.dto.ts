import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ReputationResponseDto {
  @ApiProperty({ name: 'reputation', example: 12 })
  @Expose()
  reputation: number;

  @ApiProperty({ name: 'userId', example: 1234 })
  @Expose()
  userId: number;

  constructor(args: ReputationResponseDto) {
    Object.assign(this, args);
  }
}
