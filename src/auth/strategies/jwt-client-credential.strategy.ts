import { Injectable } from '@nestjs/common';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';

import { TokenType } from '../enums/token-type.enum';
import { InvalidTokenException } from '../exceptions/invalid-token.exception';
import { JWTClientCredentialPayload } from '../entities/jwt-client-credential-payload.entity';

// TODO: Add test for this
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
    if (!payload) {
      throw new InvalidTokenException();
    }
    if (payload.tokenType !== TokenType.ClientAccess) {
      throw new InvalidTokenException(
        'Token used is a not a client credential access token.',
      );
    }

    return payload;
  }
}
