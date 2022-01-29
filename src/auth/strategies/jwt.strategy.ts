import { Injectable } from '@nestjs/common';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import * as Sentry from '@sentry/node';

import { JWTPayload } from '../entities/jwt-payload.entity';
import { UnauthorizedUserException } from '../exceptions/unauthorized-user.exception';
import { TokenType } from '../enums/token-type.enum';
import { InvalidTokenException } from '../exceptions/invalid-token.exception';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
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

  async validate(req: Request, payload: JWTPayload) {
    if (!payload) {
      throw new InvalidTokenException();
    }
    if (payload.tokenType !== TokenType.ACCESS) {
      throw new InvalidTokenException(
        'Refresh token used in place of access token, please try again.',
      );
    }

    if (req.headers.host !== payload.audienceUrl) {
      throw new UnauthorizedUserException('Invalid audience.');
    }

    Sentry.setUser({ username: payload.username });
    Sentry.setContext('additional user information', {
      userId: payload.userId,
      audienceUrl: payload.audienceUrl,
      platformId: payload.platformId,
      roles: payload.roles,
    });

    return payload;
  }
}
