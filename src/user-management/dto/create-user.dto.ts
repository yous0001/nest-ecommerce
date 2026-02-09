import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsEmail,
  IsEnum,
  Min,
  IsNumber,
  Max,
  IsUrl,
  IsPhoneNumber,
  IsOptional,
} from 'class-validator';
import { UserRole } from '../enums/user-role.enum';

export class CreateUserDto {
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

  @IsOptional()
  @IsString({ message: 'Role must be a string' })
  @IsEnum(UserRole, { message: 'Invalid role' })
  role?: UserRole;

  @IsOptional()
  @IsNumber({}, { message: 'Age must be a number' })
  @Min(12, { message: 'Age must be at least 12' })
  @Max(200, { message: 'Age must be less than 200' })
  age?: number;

  @IsOptional()
  @IsString({ message: 'Gender must be a string' })
  @IsEnum(['male', 'female'], { message: 'Invalid gender' })
  gender?: string;

  @IsOptional()
  @IsString({ message: 'Avatar must be a string' })
  @IsUrl({}, { message: 'Invalid avatar' })
  avatar?: string;

  @IsNotEmpty()
  @IsString({ message: 'Phone number must be a string' })
  @IsPhoneNumber('EG', { message: 'Invalid phone number' })
  phoneNumber: string;

  @IsOptional()
  @IsString({ message: 'Address must be a string' })
  address?: string;
}
