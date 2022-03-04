import { validate } from 'class-validator';
import { IsPasswordValid } from './password.validator';

class MockClass {
  @IsPasswordValid()
  password: string;
}

describe(IsPasswordValid, () => {
  it('validates safe password', async () => {
    const mockClass = new MockClass();
    mockClass.password = 'vo$yw0g96R1I0vzO';
    await expect(validate(mockClass)).resolves.toEqual([]);
  });

  it('validates unsafe password', async () => {
    const mockClass = new MockClass();
    mockClass.password = 'password';
    await expect(validate(mockClass)).resolves.toEqual([
      {
        children: [],
        constraints: {
          customValidation: 'password is too weak',
        },
        property: 'password',
        target: {
          password: 'password',
        },
        value: 'password',
      },
    ]);
  });
});
