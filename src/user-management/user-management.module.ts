import { Module } from '@nestjs/common';
import { UserService } from './user-management.service';
import { UserManagementController } from './user-management.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../user/schemas/user.schema';
import { InitialAdminService } from './seed/initial-admin.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [UserManagementController],
  providers: [UserService, InitialAdminService],
})
export class UserManagementModule {}
