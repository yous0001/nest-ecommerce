import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class PasswordReset extends Document {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  })
  userId: Types.ObjectId;

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
    default: 0,
  })
  passwordResetOtpAttempts: number;

  @Prop({
    type: String,
  })
  resetPasswordToken: string;

  @Prop({
    type: Date,
  })
  resetPasswordTokenExpiresAt: Date;
}

export const PasswordResetSchema = SchemaFactory.createForClass(PasswordReset);

// Create index for faster lookups
PasswordResetSchema.index({ userId: 1 });
PasswordResetSchema.index({ resetPasswordToken: 1 });
