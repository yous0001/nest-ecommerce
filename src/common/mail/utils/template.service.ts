import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class EmailTemplateService {
  private logoBase64: string;
  private templateCache: Map<string, string> = new Map();

  constructor() {
    this.loadLogo();
  }

  private loadLogo(): void {
    const logoPath = path.join(process.cwd(), 'assets', 'logo.png');
    if (fs.existsSync(logoPath)) {
      const logoBuffer = fs.readFileSync(logoPath);
      this.logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
    } else {
      this.logoBase64 = '';
    }
  }

  private getLogoHtml(): string {
    return this.logoBase64
      ? `<img src="${this.logoBase64}" alt="Sohag Store Logo" class="logo-img" />`
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
