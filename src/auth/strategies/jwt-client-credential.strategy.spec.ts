import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { ExtractJwt } from 'passport-jwt';

import * as factories from 'factories';

import { JWTPayload } from '../entities/jwt-payload.entity';
import { NoPermissionException } from '../exceptions';

import { JwtClientCredentialsStrategy } from './jwt-client-credentials.strategy';

describe(JwtClientCredentialsStrategy, () => {
  const platform = factories.platformEntity.build();
  const request = {
    params: { platform_id: platform.id },
  } as unknown as Request;

  const jwtClientCredentialStrategy = new JwtClientCredentialsStrategy({
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
    const payload = factories.jwtClientCredentialPayload.build();
    expect(
      await jwtClientCredentialStrategy.validate(request, payload),
    ).toEqual(payload);
  });

  it('throws when using user access token instead of client credential token', async () => {
    const payload = factories.jwtPayload.build();

    await expect(
      jwtClientCredentialStrategy.validate(
        request,
        payload as unknown as JWTPayload,
      ),
    ).rejects.toThrow('Token used is a not a client credential access token.');
  });

  it('throws when accessing unauthorized platform id', async () => {
    const payload = factories.jwtClientCredentialPayload.build({
      platformId: 999,
    });

    await expect(
      jwtClientCredentialStrategy.validate(
        request,
        payload as unknown as JWTPayload,
      ),
    ).rejects.toThrow(new NoPermissionException());
  });

  it('throws when payload does not exist', async () => {
    await expect(
      jwtClientCredentialStrategy.validate(request, undefined),
    ).rejects.toThrow('Invalid token used.');
  });
});
