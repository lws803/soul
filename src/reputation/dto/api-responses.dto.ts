import { Expose } from 'class-transformer';

export class ReputationResponseDto {
  @Expose() reputation: number;
  @Expose() userId: number;

  constructor(args: ReputationResponseDto) {
    Object.assign(this, args);
  }
}
