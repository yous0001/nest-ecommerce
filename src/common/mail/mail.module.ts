import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { EmailTemplateService } from './utils/template.service';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    MailerModule.forRootAsync({
      useFactory: () => ({
        transport: {
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        },
        defaults: {
          from: `"SOHAG STORE" <${process.env.EMAIL_USER}>`,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [MailService, EmailTemplateService],
  exports: [MailService, EmailTemplateService],
})
export class MailModule {}
