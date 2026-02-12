import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { mailConfig } from '../configs/mail.config';

@Injectable()
export class EmailTemplateService {
  private logoBase64 = '';
  private logoUrl = '';
  private templateCache: Map<string, string> = new Map();
  private readonly logger = new Logger(EmailTemplateService.name);

  constructor() {
    this.loadLogo();
  }

  private loadLogo(): void {
    const configured = mailConfig.logo?.trim();

    if (!configured) {
      this.logoBase64 = '';
      this.logoUrl = '';
      return;
    }

    if (configured.startsWith('http://') || configured.startsWith('https://')) {
      this.logoUrl = configured;
      this.logoBase64 = '';
      return;
    }

    const logoPath = path.isAbsolute(configured)
      ? configured
      : path.join(process.cwd(), configured);

    if (!fs.existsSync(logoPath)) {
      this.logoBase64 = '';
      this.logoUrl = '';
      this.logger.warn(
        `Email logo not found at: ${logoPath}. Using fallback text.`,
      );
      return;
    }

    const logoBuffer = fs.readFileSync(logoPath);

    const ext = path.extname(logoPath).toLowerCase();
    const mime =
      ext === '.jpg' || ext === '.jpeg'
        ? 'image/jpeg'
        : ext === '.gif'
          ? 'image/gif'
          : ext === '.webp'
            ? 'image/webp'
            : 'image/png';

    this.logoBase64 = `data:${mime};base64,${logoBuffer.toString('base64')}`;
    this.logoUrl = '';
    this.logger.log(`Loaded local email logo from: ${logoPath}`);
  }

  private getLogoHtml(): string {
    const src = this.logoUrl || this.logoBase64;
    return src
      ? `<img src="${src}" alt="Sohag Store Logo" class="logo-img" />`
      : '<div class="logo-text">SOHAG STORE</div>';
  }

  private loadTemplate(templatePath: string): string {
    if (this.templateCache.has(templatePath)) {
      return this.templateCache.get(templatePath)!;
    }

    const resolvedPath = path.isAbsolute(templatePath)
      ? templatePath
      : path.join(process.cwd(), templatePath);

    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`Template not found: ${resolvedPath}`);
    }

    const template = fs.readFileSync(resolvedPath, 'utf-8');
    this.templateCache.set(templatePath, template);
    return template;
  }

  render(
    templatePath: string,
    variables: Record<string, string | number>,
  ): string {
    let template = this.loadTemplate(templatePath);
    const currentYear = new Date().getFullYear();

    const allVariables = {
      LOGO_IMG: this.getLogoHtml(),
      CURRENT_YEAR: currentYear.toString(),
      ...variables,
    };

    Object.entries(allVariables).forEach(([key, value]) => {
      template = template.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    });

    return template;
  }
}
