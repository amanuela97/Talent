import { IsEmail, IsString } from 'class-validator';
/* eslint-disable @typescript-eslint/no-unsafe-call */

export class LoginDto {
  @IsString()
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
