import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class CreatedAtUpdatedAtDto {
  @ApiProperty({ name: 'created_at', type: Date })
  @Expose({ name: 'created_at', toPlainOnly: true })
  createdAt: Date;

  @ApiProperty({ name: 'updated_at', type: Date })
  @Expose({ name: 'updated_at', toPlainOnly: true })
  updatedAt: Date;

  constructor(args: CreatedAtUpdatedAtDto) {
    Object.assign(this, args);
  }
}
