import * as factories from 'factories';

// TODO: Clean up and remove this file
const platformsList = factories.platformEntity.buildList(2);

export const platformCreateQueryBuilderObject = {
  select: jest.fn().mockImplementation(() => platformCreateQueryBuilderObject),
  where: jest.fn().mockImplementation(() => platformCreateQueryBuilderObject),
  andWhere: jest
    .fn()
    .mockImplementation(() => platformCreateQueryBuilderObject),
  orderBy: jest.fn().mockImplementation(() => platformCreateQueryBuilderObject),
  skip: jest.fn().mockImplementation(() => platformCreateQueryBuilderObject),
  take: jest.fn().mockImplementation(() => platformCreateQueryBuilderObject),
  leftJoinAndSelect: jest
    .fn()
    .mockImplementation(() => platformCreateQueryBuilderObject),
  getManyAndCount: jest
    .fn()
    .mockResolvedValue([platformsList, platformsList.length]),
};
