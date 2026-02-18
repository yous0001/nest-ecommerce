import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../user/schemas/user.schema';
import {
  PasswordReset,
  PasswordResetSchema,
} from './schemas/password-reset.schema';
import { AuthGuard } from './guards/auth.guard';
import { APP_GUARD } from '@nestjs/core';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { MailModule } from '../common/mail/mail.module';
import { AuthUtilsService } from './utils/auth-utils.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: PasswordReset.name, schema: PasswordResetSchema },
    ]),
    MailModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    AuthService,
    AuthUtilsService,
  ],
  controllers: [AuthController],
  exports: [AuthUtilsService],
})
export class AuthModule {}
