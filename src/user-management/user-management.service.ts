import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './schemas/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { UserRole } from './enums/user-role.enum';
import { QueryUserDto } from './dto/query-user.dto';
import { PaginationService } from 'src/common/pagination/pagination.service';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private paginationService: PaginationService,
  ) {}
  async create(createUserDto: CreateUserDto) {
    const { email, password } = createUserDto;
    const isUserExists = await this.userModel.findOne({ email });
    if (isUserExists) {
      throw new BadRequestException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(
      password,
      Number(process.env.BCRYPT_SALT_ROUNDS),
    );

    const userObject = {
      ...createUserDto,
      password: hashedPassword,
      role: createUserDto.role ?? UserRole.USER,
      active: true,
    };

    const user = await this.userModel.create(userObject);
    return {
      message: 'User created successfully',
      user,
    };
  }

  async findAll(query: QueryUserDto) {
    const filter = this.paginationService.buildFilter(
      query as Record<string, unknown>,
    );
    if (query.name) {
      filter.name = { $regex: query.name, $options: 'i' };
    }
    if (query.email) {
      filter.email = { $regex: query.email, $options: 'i' };
    }

    const paginationOptions =
      this.paginationService.getPaginationOptions(query);
    return this.paginationService.paginate(
      this.userModel as any,
      filter,
      paginationOptions,
      '-password -__v -verificationCode -verificationCodeExpiresAt',
    );
  }

  async findOne(id: string) {
    const user = await this.userModel.findById(id).select('-__v');
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const isUserExists = await this.userModel.findById(id);
    if (!isUserExists) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(
        updateUserDto.password,
        Number(process.env.BCRYPT_SALT_ROUNDS),
      );
    }

    if (updateUserDto.email) {
      const isEmailExists = await this.userModel.findOne({
        email: updateUserDto.email,
      });
      if (isEmailExists) {
        throw new BadRequestException('Email already exists');
      }
    }

    const updatedUser = await this.userModel.findByIdAndUpdate(
      id,
      updateUserDto,
      { new: true },
    );
    return {
      message: 'User updated successfully',
      user: updatedUser,
    };
  }

  async remove(id: string) {
    const isUserExists = await this.userModel.findById(id);
    if (!isUserExists) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    await isUserExists.deleteOne();
    return {
      message: 'User deleted successfully',
    };
  }

  async inactive(id: string) {
    const isUserExists = await this.userModel.findById(id);
    if (!isUserExists) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    isUserExists.active = false;
    await isUserExists.save();
    return { message: 'User inactive successfully' };
  }
}
