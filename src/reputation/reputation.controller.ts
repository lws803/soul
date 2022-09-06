import { Controller, Get, HttpStatus, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { plainToClass } from 'class-transformer';

import { ReputationResponseEntity } from './dto/api-responses.entity';
import { ReputationParamDto } from './dto/api.dto';
import { ReputationService } from './reputation.service';

@Controller({ version: '1', path: 'reputation' })
export class ReputationController {
  constructor(private readonly reputationService: ReputationService) {}

  @ApiOperation({
    description: "Find one user's reputation from a given user id",
  })
  @ApiResponse({ status: HttpStatus.OK, type: ReputationResponseEntity })
  @Get(':user_id')
  async findOneUserReputation(
    @Param() params: ReputationParamDto,
  ): Promise<ReputationResponseEntity> {
    return plainToClass(
      ReputationResponseEntity,
      await this.reputationService.findOneUserReputation(params.userId),
    );
  }
}
