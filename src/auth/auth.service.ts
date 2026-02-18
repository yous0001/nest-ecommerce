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
import { PasswordReset } from './schemas/password-reset.schema';
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
    @InjectModel(PasswordReset.name)
    private passwordResetModel: Model<PasswordReset>,
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

    await this.passwordResetModel.findOneAndUpdate(
      { userId: user._id },
      {
        userId: user._id,
        verificationCode: hashedVerificationCode,
        verificationCodeExpiresAt,
        passwordResetOtpAttempts: 0,
        resetPasswordToken: null,
        resetPasswordTokenExpiresAt: null,
      },
      { upsert: true, new: true },
    );

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

    const passwordReset = await this.passwordResetModel.findOne({
      userId: user._id,
    });

    if (!passwordReset) {
      throw new BadRequestException('Verification code not found');
    }

    if (passwordReset.verificationCodeExpiresAt < new Date()) {
      throw new BadRequestException('Verification code expired');
    }

    if (passwordReset.passwordResetOtpAttempts >= 5) {
      throw new BadRequestException(
        'You have reached the maximum number of attempts. Please try again later.',
      );
    }

    const isVerificationCodeValid = await bcrypt.compare(
      verificationCode,
      passwordReset.verificationCode,
    );

    if (!isVerificationCodeValid) {
      await this.passwordResetModel.findByIdAndUpdate(passwordReset._id, {
        $inc: { passwordResetOtpAttempts: 1 },
      });
      throw new BadRequestException('Invalid verification code');
    }

    const token = this.authUtilsService.generateResetPasswordToken();
    await this.passwordResetModel.findByIdAndUpdate(passwordReset._id, {
      resetPasswordToken: token.hashedToken,
      resetPasswordTokenExpiresAt: token.expiresAt,
    });
    return {
      message: 'Verification code verified successfully',
      token: token.rawToken,
    };
  }

  async resetPassword(token: string, newPassword: string) {
    // Hash the incoming token to compare with stored hash
    const crypto = await import('crypto');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find password reset record by hashed token
    const passwordReset = await this.passwordResetModel.findOne({
      resetPasswordToken: hashedToken,
    });

    if (!passwordReset) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (
      !passwordReset.resetPasswordTokenExpiresAt ||
      passwordReset.resetPasswordTokenExpiresAt < new Date()
    ) {
      throw new BadRequestException('Reset token expired');
    }

    const user = await this.userModel.findById(passwordReset.userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const hashedPassword = await bcrypt.hash(
      newPassword,
      Number(process.env.BCRYPT_SALT_ROUNDS),
    );

    await this.userModel.findByIdAndUpdate(user._id, {
      password: hashedPassword,
    });

    await this.passwordResetModel.findByIdAndDelete(passwordReset._id);

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
