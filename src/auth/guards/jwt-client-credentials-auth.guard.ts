import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtClientCredentialsAuthGuard extends AuthGuard(
  'jwt-client-credentials',
) {}
