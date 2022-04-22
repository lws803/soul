import { Controller, Get, HttpStatus, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

import { ReputationResponseDto } from './dto/api-responses.dto';
import { ReputationParamDto } from './dto/api.dto';
import { ReputationService } from './reputation.service';

@Controller({ version: '1', path: 'reputation' })
export class ReputationController {
  constructor(private readonly reputationService: ReputationService) {}

  @ApiOperation({
    description: "Find one user's reputation from a given user id",
  })
  @ApiResponse({ status: HttpStatus.OK, type: ReputationResponseDto })
  @Get(':userId')
  async findOneUserReputation(
    @Param() params: ReputationParamDto,
  ): Promise<ReputationResponseDto> {
    return new ReputationResponseDto(
      await this.reputationService.findOneUserReputation(params.userId),
    );
  }
}
