import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import {
  verify,
  sign,
  TokenExpiredError,
  JsonWebTokenError,
} from 'jsonwebtoken';
import { User } from '@prisma/client';

import { MailService } from 'src/mail/mail.service';
import { PrismaService } from 'src/prisma/prisma.service';

import {
  UpdateUserDto,
  CreateUserDto,
  FindAllUsersQueryParamDto,
} from './serializers/api.dto';
import {
  UserNotFoundException,
  InvalidTokenException,
  DuplicateUsernameException,
  DuplicateUserEmailException,
} from './exceptions';

@Injectable()
export class UsersService {
  constructor(
    private configService: ConfigService,
    private mailService: MailService,
    private prismaService: PrismaService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const hashedPassword = await bcrypt.hash(
      createUserDto.password,
      await bcrypt.genSalt(),
    );

    await this.throwOnDuplicate({
      email: createUserDto.email,
      username: createUserDto.username,
    });

    // TODO: Should be wrapped in a transaction
    const savedUser = await this.prismaService.user.create({
      data: {
        hashedPassword,
        email: createUserDto.email,
        username: createUserDto.username,
        isActive: false,
        bio: createUserDto.bio,
        displayName: createUserDto.displayName,
      },
    });

    const updatedUser = await this.prismaService.user.update({
      where: { id: savedUser.id },
      data: {
        userHandle: this.getUserHandle(savedUser.username, savedUser.id),
      },
    });

    await this.generateCodeAndSendEmail(savedUser, 'confirmation');

    return updatedUser;
  }

  async findAll(queryParams: FindAllUsersQueryParamDto) {
    const query = queryParams.q;
    const users = await this.prismaService.user.findMany({
      skip: (queryParams.page - 1) * queryParams.numItemsPerPage,
      take: queryParams.numItemsPerPage,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      where: {
        ...(query && { username: { startsWith: query } }),
      },
    });
    const totalCount = await this.prismaService.user.count({
      where: {
        ...(query && { username: { startsWith: query } }),
      },
    });

    return { users, totalCount };
  }

  async findOne(id: number) {
    return this.findUserOrThrow({ id });
  }

  async findOneByEmail(email: string) {
    return this.findUserOrThrow({ email });
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.findOne(id);

    await this.throwOnDuplicate({
      email: updateUserDto.email,
      username: updateUserDto.username,
      id,
    });

    return await this.prismaService.user.update({
      where: { id: user.id },
      data: {
        bio: updateUserDto.bio !== undefined ? updateUserDto.bio : user.bio,
        displayName:
          updateUserDto.displayName !== undefined
            ? updateUserDto.displayName
            : user.displayName,
        username: updateUserDto.username ?? user.username,
        email: updateUserDto.email ?? user.email,
        ...(updateUserDto.username && {
          userHandle: this.getUserHandle(updateUserDto.username, user.id),
        }),
      },
    });
  }

  async remove(id: number) {
    const user = await this.findOne(id);
    await this.prismaService.user.delete({ where: { id: user.id } });
  }

  async verifyConfirmationToken(token: string) {
    try {
      const { id, tokenType } = verify(
        token,
        this.configService.get('MAIL_TOKEN_SECRET'),
      ) as EmailPayload;
      if (tokenType !== 'confirmation') {
        throw new InvalidTokenException();
      }

      const user = await this.findOne(id);
      return await this.prismaService.user.update({
        where: { id: user.id },
        data: { isActive: true },
      });
    } catch (exception) {
      if (
        exception instanceof TokenExpiredError ||
        exception instanceof JsonWebTokenError
      ) {
        throw new InvalidTokenException();
      }
    }
  }

  async resendConfirmationToken(email: string) {
    try {
      const user = await this.findOneByEmail(email);
      if (!user.isActive) {
        this.generateCodeAndSendEmail(user, 'confirmation');
      }
    } catch (error) {
      // We do not wish to throw a 404 user not found for this specific case
      if (error instanceof UserNotFoundException) {
        return;
      }
      throw error;
    }
  }

  async requestPasswordReset(email: string) {
    try {
      const user = await this.findOneByEmail(email);
      this.generateCodeAndSendEmail(user, 'passwordReset');
    } catch (error) {
      // We do not wish to throw a 404 user not found for this specific case
      if (error instanceof UserNotFoundException) {
        return;
      }
      throw error;
    }
  }

  async passwordReset(token: string, newPassword: string) {
    try {
      const { id, tokenType } = verify(
        token,
        this.configService.get('MAIL_TOKEN_SECRET'),
      ) as EmailPayload;
      if (tokenType !== 'passwordReset') {
        throw new InvalidTokenException();
      }

      const user = await this.findOne(id);
      const updatedUser = await this.prismaService.user.update({
        where: { id: user.id },
        data: {
          hashedPassword: await bcrypt.hash(
            newPassword,
            await bcrypt.genSalt(),
          ),
        },
      });

      await this.prismaService.refreshToken.deleteMany({
        where: { userId: user.id },
      });
      await this.mailService.sendPasswordResetConfirmationEmail(user);

      return updatedUser;
    } catch (exception) {
      if (
        exception instanceof TokenExpiredError ||
        exception instanceof JsonWebTokenError
      ) {
        throw new InvalidTokenException();
      }
      throw exception;
    }
  }

  private async findUserOrThrow({
    id,
    email,
  }: {
    id?: number;
    email?: string;
  }): Promise<User> {
    if (id) {
      const user = await this.prismaService.user.findUnique({ where: { id } });
      if (!user) throw new UserNotFoundException({ id });
      return user;
    } else if (email) {
      const user = await this.prismaService.user.findUnique({
        where: { email },
      });
      if (!user) throw new UserNotFoundException({ email });
      return user;
    }

    return null;
  }

  private async generateCodeAndSendEmail(user: User, payloadType: PayloadType) {
    const token = sign(
      { id: user.id, tokenType: payloadType } as EmailPayload,
      this.configService.get('MAIL_TOKEN_SECRET'),
      { expiresIn: this.configService.get('MAIL_TOKEN_EXPIRATION_TIME') },
    );
    if (payloadType === 'confirmation') {
      this.mailService.sendConfirmationEmail(user, token);
    } else {
      this.mailService.sendPasswordResetEmail(user, token);
    }
  }

  private getUserHandle(username: string, userId: number) {
    return `${username}#${userId}`;
  }

  /**
   * Throws if a user's constrained resource already exists
   */
  private async throwOnDuplicate({
    email,
    username,
    id,
  }: {
    email?: string;
    username?: string;
    id?: number;
  }) {
    if (
      email &&
      (await this.prismaService.user.findFirst({
        where: { email, ...(id && { id: { not: id } }) },
      }))
    ) {
      throw new DuplicateUserEmailException(email);
    }
    if (
      username &&
      (await this.prismaService.user.findFirst({
        where: { username, ...(id && { id: { not: id } }) },
      }))
    ) {
      throw new DuplicateUsernameException(username);
    }
  }
}

type PayloadType = 'confirmation' | 'passwordReset';

type EmailPayload = {
  id: number;
  tokenType: PayloadType;
};
