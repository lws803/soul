import { ApiResponseProperty, ExposeApiResponseProperty } from './decorators';

export class CreatedAtUpdatedAtEntity {
  @ApiResponseProperty({ name: 'created_at', type: Date })
  @ExposeApiResponseProperty({ name: 'created_at' })
  createdAt: Date;

  @ApiResponseProperty({ name: 'updated_at', type: Date })
  @ExposeApiResponseProperty({ name: 'updated_at' })
  updatedAt: Date;
}
