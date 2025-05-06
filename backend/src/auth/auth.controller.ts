import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  Req,
  UnauthorizedException,
  ValidationPipe,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { UserService } from '../user/user.service';
import { LoginDto } from './dto/auth.dto';
import { AuthService } from './auth.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { GoogleLoginDto } from './dto/google-login.dto';
import { ConfigService } from '@nestjs/config';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset.password.dto';
import { MailService } from '../mail/mail.service';
import { JwtGuard } from '../auth/guards/jwt.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully registered' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  async registerUser(@Body(new ValidationPipe()) dto: CreateUserDto) {
    return await this.userService.create(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid credentials',
  })
  async login(@Body(new ValidationPipe()) dto: LoginDto, @Res() res: Response) {
    const { user, backendTokens } = await this.authService.login(dto);

    res.cookie('refreshToken', backendTokens.refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      domain: undefined,
    });

    res.json({
      user,
      accessToken: backendTokens.accessToken,
      refreshToken: backendTokens.refreshToken,
    });
  }

  @ApiOperation({ summary: 'Login with Google OAuth token' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Post('google-login')
  async googleLogin(@Body() dto: GoogleLoginDto, @Res() res: Response) {
    const { user, backendTokens } = await this.authService.googleLogin(dto);

    res.cookie('refreshToken', backendTokens.refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      domain: undefined,
    });

    res.json({
      user,
      accessToken: backendTokens.accessToken,
      refreshToken: backendTokens.refreshToken,
    });
  }

  @Post('refreshToken')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({ status: 200, description: 'Token successfully refreshed' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid refresh token',
  })
  async refreshToken(
    @Body() body: { refreshToken?: string },
    @Req() req: Request & { cookies: Record<string, string> },
    @Res({ passthrough: true }) res: Response,
  ) {
    let refreshToken: string | undefined = (
      req.cookies as Record<string, string>
    )?.refreshToken;

    if (!refreshToken && body?.refreshToken) {
      refreshToken = body.refreshToken;
    }

    if (!refreshToken)
      throw new UnauthorizedException('Refresh token not found');

    try {
      const newTokens = await this.authService.refreshToken(refreshToken);

      res.cookie('refreshToken', newTokens.refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        domain: undefined,
      });

      res.json({
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset link' })
  @ApiResponse({ status: 200, description: 'Password reset email sent' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async forgotPassword(@Body(new ValidationPipe()) dto: ForgotPasswordDto) {
    return await this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({ status: 200, description: 'Password successfully reset' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async resetPassword(@Body(new ValidationPipe()) dto: ResetPasswordDto) {
    return await this.authService.resetPassword(dto.token, dto.newPassword);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout user and clear refresh token cookie' })
  @ApiResponse({ status: 200, description: 'Successfully logged out' })
  logout(@Res() res: Response) {
    // Clear the refresh token cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
    });

    return res.json({
      message: 'Successfully logged out',
    });
  }

  @Post('send-verification-email')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send a verification email to talent user' })
  @ApiResponse({
    status: 200,
    description: 'Verification email sent successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async sendVerificationEmail(
    @Body()
    emailData: {
      email: string;
      verificationToken: string;
      name: string;
    },
  ) {
    try {
      const { email, verificationToken, name } = emailData;
      const frontendUrl: string =
        this.configService.get<string>('FRONTEND_URL') ||
        'http://localhost:3000';
      const verificationLink = `${frontendUrl}/verify-email?token=${verificationToken}`;

      // Send the email
      await this.mailService.sendVerificationEmail(
        email,
        name,
        verificationLink,
      );

      return { success: true, message: 'Verification email sent successfully' };
    } catch {
      throw new BadRequestException('Failed to send verification email');
    }
  }

  @Post('resend-verification-email')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resend a verification email to talent user' })
  @ApiResponse({
    status: 200,
    description: 'Verification email resent successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async resendVerificationEmail(
    @Body()
    emailData: {
      email: string;
      verificationToken: string;
      name: string;
    },
  ) {
    try {
      const { email, verificationToken, name } = emailData;

      // Generate verification link
      const frontendUrl =
        this.configService.get<string>('FRONTEND_URL') ||
        'http://localhost:3000';
      const verificationLink = `${frontendUrl}/verify-email?token=${verificationToken}`;

      // Send the email
      await this.mailService.sendVerificationEmail(
        email,
        name,
        verificationLink,
      );

      return {
        success: true,
        message: 'Verification email resent successfully',
      };
    } catch {
      throw new BadRequestException('Failed to resend verification email');
    }
  }
}
