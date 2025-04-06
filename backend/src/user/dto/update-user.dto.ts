import { Role } from '@prisma/client';
import { IsEmail, IsString, IsEnum, IsOptional } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  password?: string;

  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  @IsString()
  @IsOptional()
  profilePicture?: string | null;

  @IsEnum({
    GOOGLE: 'GOOGLE',
    CREDENTIALS: 'CREDENTIALS',
  })
  @IsOptional()
  authProvider?: 'GOOGLE' | 'CREDENTIALS';
}
