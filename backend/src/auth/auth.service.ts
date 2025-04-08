import { Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginDto } from './dto/auth.dto';
import { UserService } from 'src/user/user.service';
import { compare } from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TokenResponse, UserPayload } from 'src/backendTypes';
import { GoogleLoginDto } from './dto/google-login.dto';
import { PrismaService } from 'src/prisma.service';
import { Account } from '@prisma/client';

@Injectable()
export class AuthService {
  private readonly ACCESS_TOKEN_EXPIRES = '4h';
  private readonly REFRESH_TOKEN_EXPIRES = '7d';
  private readonly EXPIRE_TIME = 60 * 1000; // 60 seconds

  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private readonly prisma: PrismaService,
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

  async googleLogin(dto: GoogleLoginDto) {
    const { email, name, image, providerAccountId, accessToken, expiresAt } =
      dto;

    try {
      // First check if a user with this email exists

      const userResult = await this.prisma.safeQuery(() =>
        this.prisma.user.findUnique({
          where: { email },
          include: { accounts: true },
        }),
      );

      if (userResult) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { passwordHash: _, ...existingUser } = userResult;

        // User exists - now we need to check if they already have a Google account linked
        const hasGoogleAccount = (
          existingUser.accounts as
            | { provider: string; providerAccountId: string }[]
            | undefined
        )?.some(
          (acc) =>
            acc.provider === 'google' &&
            acc.providerAccountId === providerAccountId,
        );

        if (hasGoogleAccount) {
          console.log('has google account', hasGoogleAccount);
          // User already has this Google account linked - just log them in
          const payload: UserPayload = {
            email: existingUser.email,
            sub: { name: existingUser.name },
          };

          return {
            user: existingUser,
            backendTokens: await this.generateTokens(payload),
          };
        } else {
          console.log('has no google account', hasGoogleAccount);
          // User exists but doesn't have any Google account linked yet

          await this.prisma.safeQuery(
            (): Promise<Account> =>
              this.prisma.account.create({
                data: {
                  userId: existingUser.userId,
                  provider: 'google',
                  providerAccountId,
                  accessToken,
                  expiresAt,
                },
              }),
          );

          // Update user profile if needed and authProvider
          await this.prisma.safeQuery(() =>
            this.prisma.user.update({
              where: { userId: existingUser.userId },
              data: {
                authProvider: 'GOOGLE',
                profilePicture: existingUser.profilePicture || image || null,
              },
            }),
          );

          const payload: UserPayload = {
            email: existingUser.email,
            sub: { name: existingUser.name },
          };

          return {
            user: {
              ...existingUser,
              profilePicture: existingUser.profilePicture || image,
              authProvider: 'GOOGLE',
            },
            backendTokens: await this.generateTokens(payload),
          };
        }
      } else {
        console.log('user does not exist');
        // User doesn't exist yet - create a new user with Google
        const isAdmin = this.configService
          .get<string>('ADMIN_LIST')
          ?.split(',')
          .includes(email);

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { passwordHash: _, ...user } =
          await this.userService.createUserWithGoogle({
            email,
            name,
            profilePicture: image || null,
            role: isAdmin ? 'ADMIN' : 'CUSTOMER',
            account: {
              provider: 'google',
              providerAccountId,
              accessToken,
              expiresAt,
            },
          });

        const payload: UserPayload = {
          email: user.email,
          sub: { name: user.name },
        };

        return {
          user,
          backendTokens: await this.generateTokens(payload),
        };
      }
    } catch (error) {
      if ((error as { code?: string }).code === 'P2002') {
        // Handle unique constraint violation
        throw new UnauthorizedException(
          'Account linking failed - please try again',
        );
      }
      throw error;
    }
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
