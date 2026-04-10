import { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { Observable, of, timer } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { ProductApiService } from '../../data/services/product-api.service';
import { inject } from '@angular/core';

/**
 * Validador assíncrono para verificar se um código de produto é único
 */
export function uniqueProductCodeValidator(
  apiService: ProductApiService,
): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    if (!control.value) {
      return of(null);
    }

    // Aguarda 300ms antes de fazer a requisição (debounce)
    return timer(300).pipe(
      switchMap(() =>
        apiService.getAll().pipe(
          map((products) => {
            const codeExists = products.some(
              (p) => p.code === control.value,
            );
            return codeExists ? { duplicateCode: { value: control.value } } : null;
          }),
          catchError(() => of(null)), // Se houver erro, permite o envio
        ),
      ),
    );
  };
}

/**
 * Validador assíncrono para verificar estoque suficiente
 */
export function sufficientStockValidator(
  apiService: ProductApiService,
  quantity: number,
): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    if (!control.value) {
      return of(null);
    }

    return apiService.getById(control.value).pipe(
      map((product) => {
        return product.stockBalance >= quantity
          ? null
          : { insufficientStock: { available: product.stockBalance, required: quantity } };
      }),
      catchError(() => of(null)),
    );
  };
}
