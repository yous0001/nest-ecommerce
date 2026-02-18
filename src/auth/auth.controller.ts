import { Body, Controller, Param, Post, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Public } from './decorators/public.decorator';
import { ForgetPasswordDto } from './dto/forget-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { User } from 'src/user/schemas/user.schema';
import { Request } from 'express';
import { VerifyVerificationCodeDto } from './dto/verify-verification-code.dto';

@Controller('v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('forget-password')
  forgetPassword(@Body() forgetPasswordDto: ForgetPasswordDto) {
    return this.authService.forgetPassword(forgetPasswordDto);
  }

  @Public()
  @Post('verify-verification-code')
  verifyVerificationCode(
    @Body() verifyVerificationCodeDto: VerifyVerificationCodeDto,
  ) {
    return this.authService.verifyVerificationCode(verifyVerificationCodeDto);
  }

  @Public()
  @Post('reset-password/:token')
  resetPassword(
    @Param('token') token: string,
    @Body('newPassword') newPassword: string,
  ) {
    return this.authService.resetPassword(token, newPassword);
  }

  @Post('change-password')
  changePassword(
    @Req() req: Request & { user: User },
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    const user = req.user;
    return this.authService.changePassword(
      user._id.toString(),
      changePasswordDto,
    );
  }
}
