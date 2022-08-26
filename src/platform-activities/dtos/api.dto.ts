import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsInt } from 'class-validator';

// TODO: Maybe we won't even need this
export class SubscribeRequestBodyDto {
  @ApiProperty({ name: 'platform_id', example: 12345 })
  @Expose({ name: 'platform_id' })
  @IsInt({ message: 'platform_id must be an integer' })
  platformId: number;
}
