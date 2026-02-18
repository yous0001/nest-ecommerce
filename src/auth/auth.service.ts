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
import { ResetPasswordDto } from './dto/reset-password.dto';
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

    await this.userModel.findByIdAndUpdate(user._id, {
      verificationCode,
      verificationCodeExpiresAt,
    });

    await this.authUtilsService.sendVerificationCodeToEmail(
      email,
      verificationCode,
    );
    return { message: 'Verification code sent to email' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { email, verificationCode, password } = resetPasswordDto;
    const user = await this.userModel.findOne({ email, verificationCode });
    if (!user) {
      throw new BadRequestException('Invalid verification code');
    }
    if (user.verificationCodeExpiresAt < new Date()) {
      throw new BadRequestException('Verification code expired');
    }
    const hashedPassword = await bcrypt.hash(
      password,
      Number(process.env.BCRYPT_SALT_ROUNDS),
    );
    await this.userModel.findByIdAndUpdate(user._id, {
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
