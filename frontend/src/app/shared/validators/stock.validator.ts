import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function stockValidator(availableStock: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const qty = control.value;
    if (qty === null || qty === undefined) return null;
    return qty > availableStock ? { stockExceeded: true, available: availableStock } : null;
  };
}
