import { Injectable } from '@angular/core';

export interface UmmAlQuraFormatOptions extends Intl.DateTimeFormatOptions {
  locale?: string;
}

@Injectable({ providedIn: 'root' })
export class UmmAlQuraDateService {
  private readonly defaultLocale = 'ar-SA-u-ca-islamic-umalqura-nu-latn';

  toUmmAlQura(
    input: Date | string | number,
    options: UmmAlQuraFormatOptions = {}
  ): string {
    const date = this.toDate(input);
    const { locale, ...formatOptions } = options;
    const mergedOptions: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      ...formatOptions,
    };

    return new Intl.DateTimeFormat(
      locale ?? this.defaultLocale,
      mergedOptions
    ).format(date);
  }

  private toDate(input: Date | string | number): Date {
    const date = input instanceof Date ? new Date(input.getTime()) : new Date(input);
    if (Number.isNaN(date.getTime())) {
      throw new Error('Invalid date input.');
    }
    return date;
  }
}
