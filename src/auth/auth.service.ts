import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { InjectModel } from '@nestjs/mongoose';
import { User } from 'src/user/schemas/user.schema';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from 'src/user-management/enums/user-role.enum';
import { ForgetPasswordDto } from './dto/forget-password.dto';
import { AuthUtilsService } from './utils/auth-utils.service';
import { VerifyVerificationCodeDto } from './dto/verify-verification-code.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
    private authUtilsService: AuthUtilsService,
  ) {}
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const user = await this.userModel.findOne({ email }).select('+password');
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = await this.jwtService.signAsync({ id: user._id });
    return { message: 'User logged in successfully', token };
  }

  async register(registerDto: RegisterDto) {
    const { email, password, name } = registerDto;
    const isUserExists = await this.userModel.findOne({ email });
    if (isUserExists) {
      throw new BadRequestException('email already exists');
    }
    const hashedPassword = await bcrypt.hash(
      password,
      Number(process.env.BCRYPT_SALT_ROUNDS),
    );
    const user = await this.userModel.create({
      email,
      password: hashedPassword,
      name,
      role: UserRole.USER,
    });
    return { message: 'User created successfully', user };
  }

  async forgetPassword(forgetPasswordDto: ForgetPasswordDto) {
    const { email } = forgetPasswordDto;
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    const verificationCode = this.authUtilsService.generateVerificationCode();
    const verificationCodeExpiresAt =
      this.authUtilsService.generateVerificationCodeExpiresAt();
    const hashedVerificationCode =
      await this.authUtilsService.hashVerificationCode(verificationCode);

    await this.userModel.findByIdAndUpdate(user._id, {
      verificationCode: hashedVerificationCode,
      verificationCodeExpiresAt,
      resetPasswordOtpAttempts: 0,
    });

    await this.authUtilsService.sendVerificationCodeToEmail(
      email,
      verificationCode,
    );
    return { message: 'Verification code sent to email' };
  }

  async verifyVerificationCode(
    verifyVerificationCodeDto: VerifyVerificationCodeDto,
  ) {
    const { email, verificationCode } = verifyVerificationCodeDto;
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new BadRequestException('Invalid verification code');
    }

    const isVerificationCodeValid = await bcrypt.compare(
      verificationCode,
      user.verificationCode,
    );

    if (!isVerificationCodeValid) {
      await this.userModel.findByIdAndUpdate(user._id, {
        passwordResetOtpAttempts: user.passwordResetOtpAttempts + 1,
      });
      throw new BadRequestException('Invalid verification code');
    }

    if (user.verificationCodeExpiresAt < new Date()) {
      await this.userModel.findByIdAndUpdate(user._id, {
        passwordResetOtpAttempts: user.passwordResetOtpAttempts + 1,
      });
      throw new BadRequestException('Verification code expired');
    }

    if (user.passwordResetOtpAttempts >= 5) {
      throw new BadRequestException(
        'You have reached the maximum number of attempts. Please try again later.',
      );
    }

    const token = await this.jwtService.signAsync(
      { id: user._id },
      { expiresIn: '1h', secret: process.env.JWT_RESET_PASSWORD_SECRET },
    );
    return { message: 'Verification code verified successfully', token };
  }

  async resetPassword(token: string, newPassword: string) {
    const payload = await this.jwtService.verifyAsync<{ id?: string }>(token, {
      secret: process.env.JWT_RESET_PASSWORD_SECRET,
    });
    if (!payload['id']) {
      throw new BadRequestException('Invalid token');
    }
    const user = await this.userModel.findById(payload.id);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    const hashedPassword = await bcrypt.hash(
      newPassword,
      Number(process.env.BCRYPT_SALT_ROUNDS),
    );

    await this.userModel.findByIdAndUpdate(payload.id, {
      password: hashedPassword,
      verificationCode: null,
      verificationCodeExpiresAt: null,
    });
    return { message: 'Password reset successfully' };
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const { oldPassword, newPassword } = changePasswordDto;
    const user = await this.userModel.findById(userId).select('+password');
    if (!user) {
      throw new BadRequestException('User not found');
    }
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Invalid old password');
    }
    const hashedPassword = await bcrypt.hash(
      newPassword,
      Number(process.env.BCRYPT_SALT_ROUNDS),
    );
    await this.userModel.findByIdAndUpdate(userId, {
      password: hashedPassword,
    });
    return { message: 'Password changed successfully' };
  }
}
