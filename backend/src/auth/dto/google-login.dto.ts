import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GoogleLoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsString()
  providerAccountId: string;

  @IsString()
  accessToken: string;

  @IsOptional()
  expiresAt?: number;
}
