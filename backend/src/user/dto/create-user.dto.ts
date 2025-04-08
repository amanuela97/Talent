import { IsEmail, IsString } from 'class-validator';
/* eslint-disable @typescript-eslint/no-unsafe-call */

export class CreateUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
