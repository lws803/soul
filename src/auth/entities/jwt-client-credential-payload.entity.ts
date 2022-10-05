import { Type } from 'class-transformer';

import { TokenType } from '../enums/token-type.enum';

export class JWTClientCredentialPayload {
  tokenType = TokenType.ClientAccess;

  @Type(() => Number)
  platformId?: number;
}
