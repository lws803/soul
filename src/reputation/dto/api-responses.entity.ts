import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ReputationResponseEntity {
  @ApiProperty({ name: 'reputation', example: 12 })
  @Expose({ toPlainOnly: true })
  reputation: number;

  @ApiProperty({ name: 'user_id', example: 1234 })
  @Expose({ name: 'user_id', toPlainOnly: true })
  userId: number;
}
