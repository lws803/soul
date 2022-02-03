import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { ExtractJwt } from 'passport-jwt';

import * as factories from 'factories';

import { JwtStrategy } from './jwt.strategy';
import { JWTPayload } from '../entities/jwt-payload.entity';

describe(JwtStrategy, () => {
  const request = {
    headers: {
      'x-forwarded-host': 'localhost:3000',
    },
  } as unknown as Request;

  const jwtStrategy = new JwtStrategy({
    get: jest.fn().mockImplementation((key) => {
      return key;
    }),
  } as unknown as ConfigService);

  beforeAll(() => {
    jest
      .spyOn(ExtractJwt, 'fromAuthHeaderAsBearerToken')
      .mockReturnValue(() => 'JWT');
  });

  it('validates token successfully', async () => {
    const payload = factories.jwtPayload.build();
    expect(await jwtStrategy.validate(request, payload)).toEqual(payload);
  });

  it('throws when invalid audience', async () => {
    const payload = factories.jwtPayload.build({
      audienceUrl: 'INVALID_HOST_URL',
    });

    await expect(jwtStrategy.validate(request, payload)).rejects.toThrow(
      'Invalid audience.',
    );
  });

  it('throws when using refresh token instead of access token', async () => {
    const payload = factories.jwtRefreshPayload.build();

    await expect(
      jwtStrategy.validate(request, payload as unknown as JWTPayload),
    ).rejects.toThrow(
      'Refresh token used in place of access token, please try again.',
    );
  });

  it('throws when payload does not exist', async () => {
    await expect(jwtStrategy.validate(request, undefined)).rejects.toThrow(
      'Invalid token used.',
    );
  });
});
