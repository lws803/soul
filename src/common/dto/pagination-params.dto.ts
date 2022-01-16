import { IsInt, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

import { DEFAULT_NUM_ITEMS_PER_PAGE } from '../constants';

export class PaginationParamsDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @Type(() => Number)
  @IsInt()
  @Max(100)
  @Min(1)
  numItemsPerPage = DEFAULT_NUM_ITEMS_PER_PAGE;
}
