import { Injectable } from '@nestjs/common';
import { MailService } from 'src/common/mail/mail.service';
import { EmailTemplateService } from 'src/common/mail/utils/template.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class AuthUtilsService {
  constructor(
    private readonly mailService: MailService,
    private readonly templateService: EmailTemplateService,
  ) {}

  generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  generateVerificationCodeExpiresAt() {
    return new Date(Date.now() + 1000 * 60 * 60 * 24);
  }

  async sendVerificationCodeToEmail(email: string, verificationCode: string) {
    const htmlContent = this.templateService.render(
      'src/auth/templates/verification-code.template.html',
      {
        VERIFICATION_CODE: verificationCode,
      },
    );
    await this.mailService.sendEmail(
      email,
      'Verification Code - Sohag Store',
      htmlContent,
    );
  }

  async hashVerificationCode(verificationCode: string) {
    return await bcrypt.hash(
      verificationCode,
      Number(process.env.BCRYPT_SALT_ROUNDS),
    );
  }

  generateResetPasswordToken() {
    const rawToken = crypto.randomBytes(32).toString('hex');

    const hashedToken = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    return {
      rawToken,
      hashedToken,
      expiresAt,
    };
  }
}
