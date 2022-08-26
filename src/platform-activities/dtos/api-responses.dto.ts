import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

import { FindOnePlatformResponseDto } from 'src/platforms/dto/api-responses.dto';

class FullPlatformActivitySubscriptionDto {
  @ApiProperty({ name: 'id', example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ name: 'from_platform', type: FindOnePlatformResponseDto })
  @Expose({ name: 'from_platform' })
  @Type(() => FindOnePlatformResponseDto)
  fromPlatform: FindOnePlatformResponseDto;

  @ApiProperty({ name: 'to_platform', type: FindOnePlatformResponseDto })
  @Expose({ name: 'to_platform' })
  @Type(() => FindOnePlatformResponseDto)
  toPlatform: FindOnePlatformResponseDto;

  @ApiProperty({ name: 'is_active', example: false })
  @Expose({ name: 'is_active' })
  isActive: boolean;

  constructor(args: FullPlatformActivitySubscriptionDto) {
    Object.assign(this, args);
  }
}

export class GetPlatformActivitySubscriptionDto extends FullPlatformActivitySubscriptionDto {
  constructor(args: GetPlatformActivitySubscriptionDto) {
    super(args);
    Object.assign(this, args);
  }
}
