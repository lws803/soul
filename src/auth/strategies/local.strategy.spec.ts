import { AuthService } from '../auth.service';

import { LocalStrategy } from './local.strategy';

describe(LocalStrategy, () => {
  it('validates email and password successfully', async () => {
    const mockAuthService = {
      validateUser: jest.fn().mockResolvedValue('USER'),
    } as unknown as AuthService;
    const localStrategy = new LocalStrategy(mockAuthService);

    expect(await localStrategy.validate('EMAIL', 'PASSWORD')).toEqual('USER');
  });

  it('throws when email and password and invalid', async () => {
    const mockAuthService = {
      validateUser: jest.fn().mockResolvedValue(null),
    } as unknown as AuthService;
    const localStrategy = new LocalStrategy(mockAuthService);

    await expect(localStrategy.validate('EMAIL', 'PASSWORD')).rejects.toThrow(
      'Incorrect username or password.',
    );
  });
});
