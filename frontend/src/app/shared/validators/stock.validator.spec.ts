import { FormControl } from '@angular/forms';
import { stockValidator } from './stock.validator';

describe('stockValidator', () => {
  it('returns null when quantity is within available stock', () => {
    const control = new FormControl(3);
    const result = stockValidator(5)(control);

    expect(result).toBeNull();
  });

  it('returns stockExceeded error when quantity exceeds available stock', () => {
    const control = new FormControl(10);
    const result = stockValidator(4)(control);

    expect(result).toEqual({ stockExceeded: true, available: 4 });
  });
});
