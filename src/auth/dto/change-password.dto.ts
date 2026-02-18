import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'The old password of the user',
    example: 'password123',
  })
  @IsString()
  @IsNotEmpty()
  oldPassword: string;

  @ApiProperty({
    description: 'The new password of the user',
    example: 'password123',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'Password must be at least 3 characters long' })
  @MaxLength(30, { message: 'Password must be less than 30 characters long' })
  newPassword: string;
}
