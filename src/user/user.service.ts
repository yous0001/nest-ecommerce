import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UpdateUserDto } from 'src/user-management/dto/update-user.dto';
import { User } from './schemas/user.schema';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}
  me(user: User) {
    return { message: 'user fetched successfully', user };
  }

  async updateMe(user: User, updateUserDto: UpdateUserDto) {
    const updatedUser = await this.userModel
      .findByIdAndUpdate(user._id, updateUserDto, { new: true })
      .select('-__v');
    return { message: 'user updated successfully', user: updatedUser };
  }

  async deleteMe(user: User): Promise<void> {
    await this.userModel.findByIdAndUpdate(user._id, { active: false });
  }
}
