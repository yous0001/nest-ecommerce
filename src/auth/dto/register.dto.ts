import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty()
  @MinLength(3, { message: 'Name must be at least 3 characters long' })
  @MaxLength(30, { message: 'Name must be less than 30 characters long' })
  name: string;

  @IsEmail({}, { message: 'Invalid email' })
  @IsNotEmpty()
  email: string;

  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty()
  @MinLength(3, { message: 'Password must be at least 3 characters long' })
  @MaxLength(30, { message: 'Password must be less than 30 characters long' })
  password: string;
}
