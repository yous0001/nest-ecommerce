import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyVerificationCodeDto {
  @ApiProperty({
    description: 'The email of the user',
    example: 'test@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'The verification code of the user',
    example: '123456',
  })
  @IsString()
  @Length(6, 6, { message: 'Verification code must be 6 characters long' })
  verificationCode: string;
}
