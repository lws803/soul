import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';

import { PaginationParamsDto } from 'src/common/dto/pagination-params.dto';

import { UpdateUserDto, CreateUserDto } from './dto/api.dto';
import { User } from './entities/user.entity';
import { DuplicateUserExistException } from './exceptions/duplicate-user-exists.exception';
import { UserNotFoundException } from './exceptions/user-not-found.exception';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private configService: ConfigService,
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

    try {
      const savedUser = await this.usersRepository.save(user);
      await this.usersRepository.update(
        { id: savedUser.id },
        {
          userHandle: `${createUserDto.username}#${savedUser.id}`,
        },
      );
      return this.usersRepository.findOne(savedUser.id);
    } catch (exception) {
      if (exception instanceof QueryFailedError) {
        if (exception.driverError.code === 'ER_DUP_ENTRY') {
          throw new DuplicateUserExistException(createUserDto.email);
        }
        throw exception;
      }
    }
  }

  async findAll(paginationParams: PaginationParamsDto) {
    const [users, totalCount] = await this.usersRepository.findAndCount({
      order: { id: 'ASC' },
      take: paginationParams.numItemsPerPage,
      skip: (paginationParams.page - 1) * paginationParams.numItemsPerPage,
    });
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
      updatedUser.userHandle = `${updateUserDto.username}#${user.id}`;
    }
    if (updateUserDto.password) {
      const hashedPassword = await bcrypt.hash(
        updateUserDto.password,
        await bcrypt.genSalt(),
      );
      updatedUser.hashedPassword = hashedPassword;
      delete updateUserDto.password;
    }
    await this.usersRepository.update(
      { id: user.id },
      { ...updatedUser, ...updateUserDto },
    );
    return await this.usersRepository.findOne(id);
  }

  async remove(id: number) {
    const user = await this.findUserOrThrow({ id });

    await this.usersRepository.delete({ id: user.id });
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
}
