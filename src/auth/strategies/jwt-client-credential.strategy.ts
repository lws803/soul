import { Injectable } from '@nestjs/common';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';

import { TokenType } from '../enums/token-type.enum';
import { InvalidTokenException } from '../exceptions/invalid-token.exception';
import { JWTClientCredentialPayload } from '../entities/jwt-client-credential-payload.entity';
import { NoPermissionException } from '../exceptions';

@Injectable()
export class JwtClientCredentialStrategy extends PassportStrategy(
  Strategy,
  'jwt-client-credential',
) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET_KEY'),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JWTClientCredentialPayload) {
    const { params } = req;
    const { platform_id } = params;
    if (!payload) {
      throw new InvalidTokenException();
    }
    if (payload.tokenType !== TokenType.ClientAccess)
      throw new InvalidTokenException(
        'Token used is a not a client credential access token.',
      );

    if (Number(platform_id) !== payload.platformId)
      throw new NoPermissionException();

    return payload;
  }
}
