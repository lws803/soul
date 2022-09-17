import { ApiResponseProperty } from './decorators';

export class CreatedAtUpdatedAtEntity {
  @ApiResponseProperty({
    name: 'created_at',
    type: Date,
    description: 'Date when this resource was created.',
  })
  createdAt: Date;

  @ApiResponseProperty({
    name: 'updated_at',
    type: Date,
    description: 'Date when this resource was last updated.',
  })
  updatedAt: Date;
}
