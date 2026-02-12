import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';
import { mailConfig } from './configs/mail.config';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly mailerService: MailerService) {}

  async sendEmail(to: string, subject: string, message: string) {
    if (!mailConfig.isEnabled) {
      return;
    }

    await this.mailerService.sendMail({
      to,
      subject,
      html: message,
    });
    return { message: 'Email sent successfully' };
  }
}
