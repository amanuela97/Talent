import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { UserPayload } from 'src/backendTypes';

@Injectable()
export class RefreshJwtGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) throw new UnauthorizedException();

    const jwtRefreshTokenKey =
      this.configService.get<string>('jwtRefreshTokenKey');

    if (!jwtRefreshTokenKey) {
      throw new Error('JWT refresh token key is not defined');
    }

    try {
      const payload = await this.jwtService.verifyAsync<UserPayload>(token, {
        secret: jwtRefreshTokenKey,
      });
      request['user'] = payload;
    } catch {
      throw new UnauthorizedException();
    }

    return true;
  }

  private extractTokenFromHeader(request: Request) {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Refresh' ? token : undefined;
  }
}
