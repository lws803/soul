import { Controller, Get, Param } from '@nestjs/common';

import { ReputationResponseDto } from './dto/api-responses.dto';
import { ReputationParamDto } from './dto/api.dto';
import { ReputationService } from './reputation.service';

@Controller({ version: '1', path: 'reputation' })
export class ReputationController {
  constructor(private readonly reputationService: ReputationService) {}

  @Get(':userId')
  async findOneUserReputation(
    @Param() params: ReputationParamDto,
  ): Promise<ReputationResponseDto> {
    return new ReputationResponseDto(
      await this.reputationService.findOneUserReputation(params.userId),
    );
  }
}
