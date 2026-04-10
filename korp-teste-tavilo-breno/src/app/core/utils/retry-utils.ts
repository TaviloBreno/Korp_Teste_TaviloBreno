import { Observable, throwError, timer } from 'rxjs';
import { catchError, retry, retryWhen, scan, take } from 'rxjs/operators';

export function retryWithBackoff(
  count: number = 3,
  delayMs: number = 1000,
  backoffMultiplier: number = 2,
) {
  return retryWhen((errors) =>
    errors.pipe(
      scan((acc, error) => {
        acc.count++;
        return acc;
      }, { count: 0 }),
      take(count),
      mergeMap((state) =>
        timer(delayMs * Math.pow(backoffMultiplier, state.count - 1)),
      ),
    ),
  );
}

import { mergeMap } from 'rxjs/operators';

export function handleHttpError(
  error: any,
  serviceName: 'inventory' | 'billing' = 'inventory',
) {
  const errorMessage =
    error?.error?.message ||
    error?.message ||
    `Erro ao conect ar com ${serviceName}`;
  return throwError(() => ({
    message: errorMessage,
    service: serviceName,
    status: error?.status,
    originalError: error,
  }));
}
