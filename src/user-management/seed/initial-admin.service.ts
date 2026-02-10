import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../../user/schemas/user.schema';
import { UserRole } from '../enums/user-role.enum';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

@Injectable()
export class InitialAdminService implements OnApplicationBootstrap {
  private readonly logger = new Logger(InitialAdminService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly configService: ConfigService,
  ) {}

  async onApplicationBootstrap() {
    const existingAdmin = await this.userModel
      .findOne({ role: UserRole.ADMIN })
      .select('_id email role');

    if (existingAdmin) {
      return;
    }

    const email =
      this.configService.get<string>('INITIAL_ADMIN_EMAIL')?.trim() ||
      'test@gmail.com';

    const password =
      this.configService.get<string>('INITIAL_ADMIN_PASSWORD') || 'test123456';

    const saltRoundsRaw = this.configService.get<string>('BCRYPT_SALT_ROUNDS');
    const saltRounds = Number(saltRoundsRaw || 10);

    const existingUserWithEmail = await this.userModel
      .findOne({ email })
      .select('_id email role active');

    if (existingUserWithEmail) {
      await this.userModel.updateOne(
        { _id: existingUserWithEmail._id },
        { $set: { role: UserRole.ADMIN, active: true } },
      );
      this.logger.warn(
        `No admin found. Promoted existing user (${email}) to admin.`,
      );
      return;
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);
    await this.userModel.create({
      name: 'Admin',
      email,
      password: hashedPassword,
      role: UserRole.ADMIN,
      active: true,
    });

    const usedDefaults =
      email === 'test@gmail.com' || password === 'test123456';

    this.logger.warn(
      `Created initial admin user (${email}).${
        usedDefaults
          ? ' Using default credentials; set INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD in .env.'
          : ''
      }`,
    );
  }
}
