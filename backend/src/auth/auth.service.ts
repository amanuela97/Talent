import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { LoginDto } from './dto/auth.dto';
import { UserService } from 'src/user/user.service';
import { compare, hash } from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TokenResponse, UserPayload } from 'src/backendTypes';
import { GoogleLoginDto } from './dto/google-login.dto';
import { PrismaService } from 'src/prisma.service';
import { Account } from '@prisma/client';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  private readonly ACCESS_TOKEN_EXPIRES = '4h';
  private readonly REFRESH_TOKEN_EXPIRES = '7d';
  private readonly EXPIRE_TIME = 60 * 1000; // 60 seconds
  private readonly RESET_TOKEN_EXPIRES = 15 * 60 * 1000; // 15 minutes in milliseconds
  private readonly SALT_ROUNDS = 10;
  private transporter: Transporter;

  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    // Initialize nodemailer transporter
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.get<string>('MAIL_USER'),
        pass: this.configService.get<string>('MAIL_PASS'),
      },
    });
  }

  async login(dto: LoginDto) {
    const user = await this.validateUser(dto);
    const payload: UserPayload = {
      userId: user.userId,
      username: user.name,
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
            userId: existingUser.userId,
            username: existingUser.name,
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
            userId: existingUser.userId,
            username: existingUser.name,
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
          userId: user.userId,
          username: user.name,
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

  async forgotPassword(email: string): Promise<{ message: string }> {
    try {
      // Find the user by email
      const user = await this.userService.findByEmail(email);
      if (!user) {
        // For security, use the same response even when user doesn't exist
        return {
          message:
            'If an account exists with that email, a password reset link has been sent.',
        };
      }

      const now = new Date();

      let resetToken = user.resetToken;

      let resetTokenExpiry = user.resetTokenExpiry;
      let needsNewToken = false;

      // Check if a token already exists and is still valid
      if (!resetToken || !resetTokenExpiry || resetTokenExpiry <= now) {
        // Token doesn't exist or has expired, generate a new one
        needsNewToken = true;
        resetToken = crypto.randomBytes(32).toString('hex');
        resetTokenExpiry = new Date(Date.now() + this.RESET_TOKEN_EXPIRES);

        // Update the user with the new reset token and expiry
        await this.prisma.safeQuery(() =>
          this.prisma.user.update({
            where: { userId: user.userId },
            data: {
              resetToken,
              resetTokenExpiry,
            },
          }),
        );
      } else {
        // A valid token already exists
        const minutesRemaining = Math.floor(
          (resetTokenExpiry.getTime() - now.getTime()) / 60000,
        );

        // Optionally log or track repeated requests
        console.log(
          `Password reset requested again for ${email}. Previous reset url still valid for ${minutesRemaining} minutes.`,
        );
      }

      // Only send email if we generated a new token or for security testing
      if (
        needsNewToken ||
        this.configService.get<string>('NODE_ENV') === 'development'
      ) {
        // Create the reset URL
        const resetUrl = `${this.configService.get<string>(
          'FRONTEND_URL',
          'http://localhost:3000',
        )}/reset-password/${resetToken}`;

        // Send the email
        await this.sendPasswordResetEmail(user.email, user.name, resetUrl);
      }

      // Return success message (don't reveal if user exists for security)
      return {
        message:
          'If an account exists with that email, a password reset link has been sent.',
        // Additional information for development environments
        ...(this.configService.get<string>('NODE_ENV') === 'development' && {
          debug: {
            tokenSent: needsNewToken,
            expiresIn: resetTokenExpiry
              ? `${Math.floor((resetTokenExpiry.getTime() - now.getTime()) / 60000)} minutes`
              : 'N/A',
          },
        }),
      };
    } catch (error) {
      console.error('Password reset error:', error);
      // Still use generic message for security
      return {
        message:
          'If an account exists with that email, a password reset link has been sent.',
      };
    }
  }

  // New method for reset password
  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    // Find user with this reset token and valid expiry
    const user = await this.prisma.safeQuery(() =>
      this.prisma.user.findFirst({
        where: {
          resetToken: token,
          resetTokenExpiry: {
            gt: new Date(), // Token must not be expired
          },
        },
      }),
    );

    if (!user) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    // Hash the new password
    const passwordHash = await hash(newPassword, this.SALT_ROUNDS);

    // Update user with new password and clear reset token
    await this.prisma.safeQuery(() =>
      this.prisma.user.update({
        where: { userId: user.userId },
        data: {
          passwordHash,
          resetToken: null,
          resetTokenExpiry: null,
        },
      }),
    );

    return { message: 'Password has been successfully reset' };
  }

  // Helper method to send password reset email
  private async sendPasswordResetEmail(
    email: string,
    name: string,
    resetUrl: string,
  ): Promise<void> {
    const mailOptions = {
      from: this.configService.get<string>('MAIL_USER'),
      to: email,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset</h2>
          <p>Hello ${name},</p>
          <p>You requested a password reset. Click the button below to set a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #4CAF50; color: white; padding: 14px 20px; 
                      text-align: center; text-decoration: none; display: inline-block; 
                      border-radius: 4px; font-weight: bold;">
              Reset Password
            </a>
          </div>
          <p>If you didn't request this, please ignore this email and your password will remain unchanged.</p>
          <p>Note: This link will expire in 15 minutes.</p>
          <p>Best regards,<br/>The Talent Team</p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Failed to send reset email:', error);
      throw new Error('Failed to send password reset email');
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
