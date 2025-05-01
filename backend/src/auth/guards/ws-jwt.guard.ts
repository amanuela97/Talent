import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
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
  constructor(private readonly jwtService: JwtService) {}

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

      const decoded = this.jwtService.verify<UserPayload>(token);

      client.data.user = {
        userId: decoded.userId,
        username: decoded.username,
      };

      return Promise.resolve(true);
    } catch {
      throw new WsException('Unauthorized');
    }
  }
}
