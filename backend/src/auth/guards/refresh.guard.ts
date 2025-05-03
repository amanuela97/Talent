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

    // Extract token from cookies instead of headers
    const token = this.extractTokenFromCookies(request);

    if (!token) {
      throw new UnauthorizedException('Refresh token not found in cookies');
    }

    const jwtRefreshTokenKey =
      this.configService.get<string>('jwtRefreshTokenKey');

    if (!jwtRefreshTokenKey) {
      throw new Error('JWT refresh token key is not defined');
    }

    try {
      const payload = await this.jwtService.verifyAsync<
        UserPayload & { exp?: number; iat?: number }
      >(token, {
        secret: jwtRefreshTokenKey,
      });

      // Attach user info to request
      request['user'] = {
        userId: payload.userId,
        username: payload.username,
      };
    } catch (error: unknown) {
      // Log the error for debugging (optional)
      if (error instanceof Error) {
        console.error('JWT verification failed:', error.message);
      } else {
        console.error('JWT verification failed with an unknown error');
      }
      throw new UnauthorizedException('Invalid refresh token');
    }

    return true;
  }

  private extractTokenFromCookies(request: Request): string | undefined {
    // Access the cookies from the request
    // Note: Make sure you have cookie-parser middleware configured
    const refreshToken: string | undefined = (
      request.cookies as Record<string, string>
    )?.refreshToken;

    if (!refreshToken)
      throw new UnauthorizedException('Refresh token not found');

    return refreshToken; // Adjust the cookie name as needed
  }
}
