import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { UserRole } from '../../user-management/enums/user-role.enum';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({
    type: String,
    required: true,
    min: [3, 'Name must be at least 3 characters long'],
    max: [30, 'Name must be less than 30 characters long'],
  })
  name: string;

  @Prop({ type: String, required: true, unique: true })
  email: string;

  @Prop({
    type: String,
    required: true,
    min: [3, 'Password must be at least 3 characters long'],
    max: [30, 'Password must be less than 30 characters long'],
    select: false,
  })
  password: string;

  @Prop({ type: String, enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Prop({
    type: Boolean,
    default: true,
  })
  active: boolean;

  @Prop({
    type: String,
  })
  verificationCode: string;

  @Prop({
    type: Date,
  })
  verificationCodeExpiresAt: Date;

  @Prop({
    type: Number,
    min: [12, 'Age must be at least 12'],
    max: [200, 'Age must be less than 200'],
  })
  age: number;

  @Prop({
    type: String,
    enum: ['male', 'female'],
  })
  gender: string;

  @Prop({ type: String })
  avatar: string;

  @Prop({
    type: String,
  })
  phoneNumber: string;

  @Prop({
    type: String,
  })
  address: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
