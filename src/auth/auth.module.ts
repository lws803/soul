import { CacheModule, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisOptions } from 'ioredis';
import * as redisStore from 'cache-manager-redis-store';

import { PlatformsModule } from 'src/platforms/platforms.module';
import { UsersModule } from 'src/users/users.module';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RefreshToken } from './entities/refresh-token.entity';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtUserStrategy } from './strategies/jwt-user.strategy';
import { JwtClientCredentialsStrategy } from './strategies/jwt-client-credentials.strategy';

@Module({
  imports: [
    UsersModule,
    PlatformsModule,
    PassportModule,
    JwtModule.registerAsync({
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET_KEY'),
        signOptions: { expiresIn: configService.get('JWT_ACCESS_TOKEN_TTL') },
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([RefreshToken]),
    CacheModule.registerAsync<RedisOptions>({
      useFactory: (configService: ConfigService) => ({
        store: redisStore,
        host: configService.get('REDIS_DB_HOST'),
        port: configService.get('REDIS_DB_PORT'),
        database: configService.get('REDIS_DB_INDEX'),
        password: configService.get('REDIS_DB_PASSWORD'),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalStrategy,
    JwtUserStrategy,
    JwtClientCredentialsStrategy,
  ],
})
export class AuthModule {}
