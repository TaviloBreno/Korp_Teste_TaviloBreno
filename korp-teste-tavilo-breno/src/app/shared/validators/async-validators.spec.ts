import { FormControl } from '@angular/forms';
import { of, throwError, firstValueFrom } from 'rxjs';
import { ProductApiService } from '../../data/services/product-api.service';
import { sufficientStockValidator, uniqueProductCodeValidator } from './async-validators';

async function resolveValidatorResult(validatorResult: any) {
  if (validatorResult && typeof validatorResult.then === 'function') {
    return validatorResult;
  }

  return firstValueFrom(validatorResult);
}

describe('async validators', () => {
  it('uniqueProductCodeValidator returns duplicateCode when code already exists', async () => {
    const apiService = {
      getAll: () =>
        of([
          { id: '1', code: 'P-001', description: 'Produto 1', stockBalance: 10 },
          { id: '2', code: 'P-002', description: 'Produto 2', stockBalance: 5 },
        ]),
    } as unknown as ProductApiService;

    const validator = uniqueProductCodeValidator(apiService);
    const control = new FormControl('P-001');

    const result = await resolveValidatorResult(validator(control));
    expect(result).toEqual({ duplicateCode: { value: 'P-001' } });
  });

  it('sufficientStockValidator returns insufficientStock when quantity is higher than stock', async () => {
    const apiService = {
      getById: () => of({ id: '1', code: 'P-001', description: 'Produto 1', stockBalance: 2 }),
    } as unknown as ProductApiService;

    const validator = sufficientStockValidator(apiService, 5);
    const control = new FormControl('1');

    const result = await resolveValidatorResult(validator(control));
    expect(result).toEqual({ insufficientStock: { available: 2, required: 5 } });
  });

  it('uniqueProductCodeValidator ignores backend errors and allows submit', async () => {
    const apiService = {
      getAll: () => throwError(() => new Error('backend down')),
    } as unknown as ProductApiService;

    const validator = uniqueProductCodeValidator(apiService);
    const control = new FormControl('P-999');

    const result = await resolveValidatorResult(validator(control));
    expect(result).toBeNull();
  });
});
