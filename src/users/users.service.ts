import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import {
  verify,
  sign,
  TokenExpiredError,
  JsonWebTokenError,
} from 'jsonwebtoken';

import { MailService } from 'src/mail/mail.service';
import { RefreshToken } from 'src/auth/entities/refresh-token.entity';

import {
  UpdateUserDto,
  CreateUserDto,
  FindAllUsersQueryParamDto,
} from './dto/api.dto';
import { User } from './entities/user.entity';
import {
  DuplicateUserExistException,
  UserNotFoundException,
  InvalidTokenException,
} from './exceptions';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private refreshTokensRepository: Repository<RefreshToken>,
    private configService: ConfigService,
    private mailService: MailService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = new User();

    const hashedPassword = await bcrypt.hash(
      createUserDto.password,
      await bcrypt.genSalt(),
    );

    user.hashedPassword = hashedPassword;
    user.email = createUserDto.email;
    user.username = createUserDto.username;
    user.isActive = false;

    try {
      const savedUser = await this.usersRepository.save(user);
      await this.usersRepository.update(
        { id: savedUser.id },
        {
          userHandle: this.getUserHandle(createUserDto.username, savedUser.id),
        },
      );

      this.generateCodeAndSendEmail(savedUser, 'confirmation');

      return this.usersRepository.findOne(savedUser.id);
    } catch (exception) {
      if (
        exception instanceof QueryFailedError &&
        exception.driverError.code === 'ER_DUP_ENTRY'
      ) {
        throw new DuplicateUserExistException(createUserDto.email);
      }
      throw exception;
    }
  }

  async findAll(queryParams: FindAllUsersQueryParamDto) {
    let baseQuery = this.usersRepository.createQueryBuilder('user').select();
    const query = queryParams.q;
    if (query) {
      baseQuery = baseQuery.where('user.username like :query', {
        query: `${query}%`,
      });
    }
    baseQuery = baseQuery
      .orderBy({ 'user.createdAt': 'DESC', 'user.id': 'DESC' })
      .take(queryParams.numItemsPerPage)
      .skip((queryParams.page - 1) * queryParams.numItemsPerPage);

    const [users, totalCount] = await baseQuery.getManyAndCount();
    return { users, totalCount };
  }

  async findOne(id: number) {
    return await this.findUserOrThrow({ id });
  }

  async findOneByEmail(email: string) {
    return await this.findUserOrThrow({ email });
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.findUserOrThrow({ id });
    const updatedUser: Partial<User> = {};

    if (updateUserDto.username) {
      updatedUser.userHandle = this.getUserHandle(
        updateUserDto.username,
        user.id,
      );
    }
    updatedUser.username = updateUserDto.username ?? user.username;
    updatedUser.email = updateUserDto.email ?? user.email;

    await this.usersRepository.update({ id: user.id }, updatedUser);
    return await this.usersRepository.findOne(id);
  }

  async remove(id: number) {
    const user = await this.findUserOrThrow({ id });

    await this.usersRepository.delete({ id: user.id });
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
      user.isActive = true;
      await this.usersRepository.save(user);
      return user;
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
      user.hashedPassword = await bcrypt.hash(
        newPassword,
        await bcrypt.genSalt(),
      );

      await this.usersRepository.save(user);
      await this.refreshTokensRepository.delete({ user: user });

      return user;
    } catch (exception) {
      if (
        exception instanceof TokenExpiredError ||
        exception instanceof JsonWebTokenError
      ) {
        throw new InvalidTokenException();
      }
    }
  }

  private async findUserOrThrow({
    id,
    email,
  }: {
    id?: number;
    email?: string;
  }): Promise<User> {
    let user;
    if (id) {
      user = await this.usersRepository.findOne({ id });
      if (!user) throw new UserNotFoundException({ id });
    } else if (email) {
      user = await this.usersRepository.findOne({ email });
      if (!user) throw new UserNotFoundException({ email });
    }

    return user;
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
    return `${username.toLowerCase().replace(/\s+/g, '-')}#${userId}`;
  }
}

type PayloadType = 'confirmation' | 'passwordReset';

type EmailPayload = {
  id: number;
  tokenType: PayloadType;
};
