# PromsSurveySystemVBC
Survey Management System for value Based Healthcare

## Umm al-Qura date formatting (Angular)

The following Angular service and pipe format a Gregorian `Date` into the
Umm al-Qura (Hijri) calendar using the built-in `Intl.DateTimeFormat` API.

Files:
- `src/app/umm-alqura-date.service.ts`
- `src/app/umm-alqura-date.pipe.ts`

Example usage in a standalone component:

```ts
import { Component } from '@angular/core';
import { UmmAlQuraDatePipe } from './umm-alqura-date.pipe';
import { UmmAlQuraDateService } from './umm-alqura-date.service';

@Component({
  selector: 'app-root',
  template: `
    <p>{{ today | ummAlQuraDate }}</p>
    <p>{{ today | ummAlQuraDate : { month: 'long' } }}</p>
  `,
  standalone: true,
  imports: [UmmAlQuraDatePipe],
})
export class AppComponent {
  today = new Date();

  constructor(private readonly ummAlQura: UmmAlQuraDateService) {
    const formatted = this.ummAlQura.toUmmAlQura(this.today);
    console.log(formatted);
  }
}
```

To customize the locale or digits:

```ts
const withArabicDigits = ummAlQura.toUmmAlQura(new Date(), {
  locale: 'ar-SA-u-ca-islamic-umalqura',
});
```
