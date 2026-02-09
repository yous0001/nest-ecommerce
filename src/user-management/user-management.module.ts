import { Module } from '@nestjs/common';
import { UserService } from './user-management.service';
import { UserManagementController } from './user-management.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../user/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [UserManagementController],
  providers: [UserService],
})
export class UserManagementModule {}
