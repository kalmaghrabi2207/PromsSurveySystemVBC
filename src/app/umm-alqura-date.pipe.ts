import { Pipe, PipeTransform } from '@angular/core';

import {
  UmmAlQuraDateService,
  UmmAlQuraFormatOptions,
} from './umm-alqura-date.service';

@Pipe({
  name: 'ummAlQuraDate',
  standalone: true,
})
export class UmmAlQuraDatePipe implements PipeTransform {
  constructor(private readonly ummAlQura: UmmAlQuraDateService) {}

  transform(
    value: Date | string | number | null | undefined,
    options?: UmmAlQuraFormatOptions
  ): string {
    if (value === null || value === undefined || value === '') {
      return '';
    }

    return this.ummAlQura.toUmmAlQura(value, options);
  }
}
