import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { UserPayload } from 'src/backendTypes';

interface CustomSocket extends Socket {
  data: {
    user?: {
      userId: string;
      username: string;
    };
  };
}

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client: CustomSocket = context.switchToWs().getClient();
      const token =
        typeof client.handshake.auth.token === 'string'
          ? client.handshake.auth.token.split(' ')[1]
          : undefined;

      if (!token) {
        throw new WsException('Unauthorized');
      }

      const jwtSecretKey = this.configService.get<string>('JWT_SECRET');

      if (!jwtSecretKey) {
        throw new Error('JWT secret key is not defined');
      }

      const decoded = this.jwtService.verify<UserPayload>(token, {
        secret: jwtSecretKey,
      });

      client.data.user = {
        userId: decoded.userId,
        username: decoded.username,
      };

      console.log('ws-jwt guard', decoded.userId);

      return Promise.resolve(true);
    } catch {
      throw new WsException('Unauthorized');
    }
  }
}
