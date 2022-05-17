import { validate } from 'class-validator';

import { IsValidRedirectUri } from './is-valid-redirect-uri.validator';

class MockClass {
  @IsValidRedirectUri()
  redirectUri: string;
}

describe(IsValidRedirectUri, () => {
  it('validates correct url', async () => {
    const mockClass = new MockClass();
    mockClass.redirectUri = 'https://www.example.com/redirect';
    await expect(validate(mockClass)).resolves.toEqual([]);
  });

  it('validates correct localhost url', async () => {
    const mockClass = new MockClass();
    mockClass.redirectUri = 'http://localhost:3000';
    await expect(validate(mockClass)).resolves.toEqual([]);
  });

  it('returns invalid for urls with search params', async () => {
    const mockClass = new MockClass();
    mockClass.redirectUri = 'https://www.example.com?foo=bar';
    await expect(validate(mockClass)).resolves.toEqual([
      {
        children: [],
        constraints: {
          IsValidRedirectUri:
            'Redirect URI must adhere to the following restrictions ' +
            'https://docs.microsoft.com/en-us/azure/active-directory/develop/reply-url',
        },
        property: 'redirectUri',
        target: {
          redirectUri: 'https://www.example.com?foo=bar',
        },
        value: 'https://www.example.com?foo=bar',
      },
    ]);
  });

  it('returns invalid for non localhost uris without https scheme', async () => {
    const mockClass = new MockClass();
    mockClass.redirectUri = 'http://www.example.com';
    await expect(validate(mockClass)).resolves.toEqual([
      {
        children: [],
        constraints: {
          IsValidRedirectUri:
            'Redirect URI must adhere to the following restrictions ' +
            'https://docs.microsoft.com/en-us/azure/active-directory/develop/reply-url',
        },
        property: 'redirectUri',
        target: {
          redirectUri: 'http://www.example.com',
        },
        value: 'http://www.example.com',
      },
    ]);
  });

  it('returns invalid for urls containing wildcard paths', async () => {
    const mockClass = new MockClass();
    mockClass.redirectUri = 'https://*.example.com';
    await expect(validate(mockClass)).resolves.toEqual([
      {
        children: [],
        constraints: {
          IsValidRedirectUri:
            'Redirect URI must adhere to the following restrictions ' +
            'https://docs.microsoft.com/en-us/azure/active-directory/develop/reply-url',
        },
        property: 'redirectUri',
        target: {
          redirectUri: 'https://*.example.com',
        },
        value: 'https://*.example.com',
      },
    ]);
  });

  it('returns invalid for invalid url', async () => {
    const mockClass = new MockClass();
    mockClass.redirectUri = 'INVALID_URL';
    await expect(validate(mockClass)).resolves.toEqual([
      {
        children: [],
        constraints: {
          IsValidRedirectUri:
            'Redirect URI must adhere to the following restrictions ' +
            'https://docs.microsoft.com/en-us/azure/active-directory/develop/reply-url',
        },
        property: 'redirectUri',
        target: {
          redirectUri: 'INVALID_URL',
        },
        value: 'INVALID_URL',
      },
    ]);
  });
});
