import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { UserService } from '../user/user.service';
import { LoginDto } from './dto/auth.dto';
import { AuthService } from './auth.service';
import { RefreshJwtGuard } from './guards/refresh.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RequestWithUser } from 'src/backendTypes';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
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
  async login(@Body(new ValidationPipe()) dto: LoginDto) {
    return await this.authService.login(dto);
  }

  @UseGuards(RefreshJwtGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({ status: 200, description: 'Token successfully refreshed' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid refresh token',
  })
  async refreshToken(@Request() req: RequestWithUser) {
    const user = req.user;
    return await this.authService.refreshToken(user);
  }
}
