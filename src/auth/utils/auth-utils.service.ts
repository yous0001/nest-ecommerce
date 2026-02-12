import { Injectable } from '@nestjs/common';
import { MailService } from 'src/common/mail/mail.service';
import { EmailTemplateService } from 'src/common/mail/utils/template.service';

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
}
