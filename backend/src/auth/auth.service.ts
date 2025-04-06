import { Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginDto } from './dto/auth.dto';
import { UserService } from 'src/user/user.service';
import { compare } from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TokenResponse, UserPayload } from 'src/backendTypes';

@Injectable()
export class AuthService {
  private readonly ACCESS_TOKEN_EXPIRES = '60s';
  private readonly REFRESH_TOKEN_EXPIRES = '7d';
  private readonly EXPIRE_TIME = 60 * 1000; // 60 seconds

  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.validateUser(dto);
    const payload: UserPayload = {
      email: user.email,
      sub: {
        name: user.name,
      },
    };

    return {
      user,
      backendTokens: await this.generateTokens(payload),
    };
  }

  async validateUser(dto: LoginDto) {
    const user = await this.userService.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...result } = user;
    return result;
  }

  async refreshToken(user: UserPayload): Promise<TokenResponse> {
    return this.generateTokens(user);
  }

  private async generateTokens(payload: UserPayload): Promise<TokenResponse> {
    const jwtSecretKey = this.configService.get<string>('jwtSecretKey');
    const jwtRefreshTokenKey =
      this.configService.get<string>('jwtRefreshTokenKey');

    if (!jwtSecretKey || !jwtRefreshTokenKey) {
      throw new Error('JWT secret keys are not defined');
    }

    const now = Date.now();

    return {
      accessToken: await this.jwtService.signAsync(payload, {
        expiresIn: this.ACCESS_TOKEN_EXPIRES,
        secret: jwtSecretKey,
      }),
      refreshToken: await this.jwtService.signAsync(payload, {
        expiresIn: this.REFRESH_TOKEN_EXPIRES,
        secret: jwtRefreshTokenKey,
      }),
      expiresIn: now + this.EXPIRE_TIME,
    };
  }
}
