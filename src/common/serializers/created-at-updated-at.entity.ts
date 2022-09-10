import { ApiResponseProperty } from './decorators';

export class CreatedAtUpdatedAtEntity {
  @ApiResponseProperty({ name: 'created_at', type: Date })
  createdAt: Date;

  @ApiResponseProperty({ name: 'updated_at', type: Date })
  updatedAt: Date;
}
