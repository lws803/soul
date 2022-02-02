import { LocalIpWhitelistInterceptor } from './local-ip-whitelist.interceptor';
import { CallHandler, ExecutionContext } from '@nestjs/common';

describe(LocalIpWhitelistInterceptor, () => {
  const localIpWhitelistInterceptor = new LocalIpWhitelistInterceptor();

  it('allows access to whitelisted ips', () => {
    const handle = jest.fn();
    localIpWhitelistInterceptor.intercept(
      {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            headers: {
              'x-forwarded-for': '127.0.0.1',
            },
          }),
        }),
      } as unknown as ExecutionContext,
      { handle } as unknown as CallHandler,
    );

    expect(handle).toHaveBeenCalled();
  });

  it('blocks access to non-whitelisted ips', () => {
    const handle = jest.fn();

    expect(() =>
      localIpWhitelistInterceptor.intercept(
        {
          switchToHttp: jest.fn().mockReturnValue({
            getRequest: jest.fn().mockReturnValue({
              headers: {
                'x-forwarded-for': 'UNKNOWN_IP',
              },
              route: {
                path: 'UNKNOWN_PATH',
              },
            }),
          }),
        } as unknown as ExecutionContext,
        { handle } as unknown as CallHandler,
      ),
    ).toThrow('Cannot get UNKNOWN_PATH');

    expect(handle).not.toHaveBeenCalled();
  });
});
