import * as factories from 'factories';

import { LocalAuthGuard } from './local-auth.guard';

describe(LocalAuthGuard, () => {
  const authGuard = new LocalAuthGuard();
  it('throws error if there is an existing error', () => {
    expect(() =>
      authGuard.handleRequest(new Error('KNOWN_ERROR'), factories.user.build()),
    ).toThrow('KNOWN_ERROR');
  });

  it('throws generic error if no error is provided but no user is present', () => {
    expect(() => authGuard.handleRequest(undefined, undefined)).toThrow(
      'Unauthorized user.',
    );
  });
});
