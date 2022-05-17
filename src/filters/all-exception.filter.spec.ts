import { ArgumentsHost, HttpStatus, HttpException } from '@nestjs/common';

import { GenericException } from 'src/common/exceptions/generic.exception';

import { AllExceptionFilter } from './all-exception.filter';

jest.mock('@nestjs/common', () => ({
  ...(jest.requireActual('@nestjs/common') as object),
  Logger: jest.fn().mockReturnValue({ error: jest.fn() }),
}));

describe(AllExceptionFilter, () => {
  const filter = new AllExceptionFilter();

  it('catches unknown errors and returns internal server error', () => {
    const json = jest.fn();
    const status = jest.fn().mockImplementation(() => ({
      json,
    }));

    filter.catch(new Error('UNKNOWN_ERROR'), {
      switchToHttp: jest.fn().mockImplementation(() => ({
        getResponse: jest.fn().mockReturnValue({
          status,
        }),
      })),
    } as unknown as ArgumentsHost);

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(json).toHaveBeenCalledWith({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  });

  it('catches known errors and returns specific error status and message', () => {
    const json = jest.fn();
    const status = jest.fn().mockImplementation(() => ({
      json,
    }));

    filter.catch(
      new GenericException(
        { message: 'TEST_ERROR', error: 'ERROR_SHORTHAND' },
        HttpStatus.BAD_REQUEST,
      ),
      {
        switchToHttp: jest.fn().mockImplementation(() => ({
          getResponse: jest.fn().mockReturnValue({
            status,
          }),
        })),
      } as unknown as ArgumentsHost,
    );

    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(json).toHaveBeenCalledWith({
      error: 'ERROR_SHORTHAND',
      message: 'TEST_ERROR',
    });
  });

  it('catches HttpException errors and returns specific error status and message', () => {
    const json = jest.fn();
    const status = jest.fn().mockImplementation(() => ({
      json,
    }));

    filter.catch(
      new HttpException(
        { message: 'TEST_ERROR', error: 'ERROR_SHORTHAND' },
        HttpStatus.BAD_REQUEST,
      ),
      {
        switchToHttp: jest.fn().mockImplementation(() => ({
          getResponse: jest.fn().mockReturnValue({
            status,
          }),
        })),
      } as unknown as ArgumentsHost,
    );

    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(json).toHaveBeenCalledWith({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'TEST_ERROR',
    });
  });
});
