import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ReputationResponseDto {
  @ApiProperty({ name: 'reputation', example: 12 })
  @Expose()
  reputation: number;

  @ApiProperty({ name: 'user_id', example: 1234 })
  @Expose({ name: 'user_id' })
  userId: number;

  constructor(args: ReputationResponseDto) {
    Object.assign(this, args);
  }
}
