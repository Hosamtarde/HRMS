import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { launch } from 'puppeteer';
import type { Browser } from 'puppeteer';
import * as Handlebars from 'handlebars';
import { readFileSync } from 'fs';
import { join } from 'path';
import { ReportResult } from '../interfaces/report-result.interface';
import { formatCell } from './format.helper';

@Injectable()
export class PdfService implements OnModuleDestroy {
  private readonly logger = new Logger(PdfService.name);

  private browser: Browser | null = null;
  private template: HandlebarsTemplateDelegate | null = null;
  private logo: string | null = null;

  async build(report: ReportResult): Promise<Buffer> {
    const html = this.render(report);
    const browser = await this.getBrowser();
    const page = await browser.newPage();

    try {
      await page.setContent(html, { waitUntil: 'load' });

      const pdf = await page.pdf({
        format: 'A4',
        landscape: report.columns.length > 5,
        printBackground: true,
        margin: { top: '14mm', bottom: '16mm', left: '10mm', right: '10mm' },
        displayHeaderFooter: true,
        headerTemplate: '<div></div>',
        footerTemplate: `
          <div style="width:100%;font-size:8px;color:#6B7A91;padding:0 12mm;
                      font-family:Tahoma,Arial,sans-serif;display:flex;
                      justify-content:space-between;">
            <span>NexusHR</span>
            <span><span class="pageNumber"></span> / <span class="totalPages"></span></span>
          </div>`,
      });

      return Buffer.from(pdf);
    } finally {
      await page.close();
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  private async getBrowser(): Promise<Browser> {
    if (this.browser?.connected) {
      return this.browser;
    }

    this.logger.log('Launching the PDF rendering browser');

    this.browser = await launch({
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
    });

    return this.browser;
  }

  private render(report: ReportResult): string {
    if (!this.template) {
      const source = readFileSync(
        join(__dirname, 'templates', 'report.hbs'),
        'utf8',
      );
      this.template = Handlebars.compile(source);
    }

    if (!this.logo) {
      this.logo = readFileSync(
        join(__dirname, 'assets', 'nexushr-logo.svg'),
        'utf8',
      );
    }

    return this.template({
      logoSvg: this.logo,
      title: report.title,
      period: `${report.period.from} — ${report.period.to}`,
      generatedAt: report.generatedAt.slice(0, 16).replace('T', ' '),
      headers: report.columns.map((column) => ({
        label: column.label,
        align: column.type === 'text' ? 'right' : 'center',
      })),
      rows: report.rows.map((row) =>
        report.columns.map((column) => ({
          value: formatCell(row[column.key], column.type),
          align: column.type === 'text' ? 'right' : 'center',
        })),
      ),
      summary: report.summary,
      isEmpty: report.rows.length === 0,
    });
  }
}