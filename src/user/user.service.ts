import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './schemas/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { UserRole } from './enums/user-role.enum';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}
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

  //TODO: Add pagination
  async findAll() {
    return await this.userModel.find().select('-__v');
  }

  async findOne(id: string) {
    const user = await this.userModel.findById(id).select('-__v');
    if (!user) {
      throw new BadRequestException('User not found');
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const isUserExists = await this.userModel.findById(id);
    if (!isUserExists) {
      throw new BadRequestException('User not found');
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
      throw new BadRequestException('User not found');
    }
    await isUserExists.deleteOne();
    return {
      message: 'User deleted successfully',
    };
  }

  async inactive(id: string) {
    const isUserExists = await this.userModel.findById(id);
    if (!isUserExists) {
      throw new BadRequestException('User not found');
    }
    isUserExists.active = false;
    await isUserExists.save();
    return { message: 'User inactive successfully' };
  }
}
