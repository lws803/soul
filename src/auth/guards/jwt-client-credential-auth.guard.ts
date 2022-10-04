import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtClientCredentialAuthGuard extends AuthGuard(
  'jwt-client-credential',
) {}
