import { HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

export interface AppError {
  status: number;
  message: string;
  details?: unknown;
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const appError: AppError = {
        status: error.status,
        message: error.error?.message || error.message || 'Falha de comunicação com o servidor',
        details: error.error,
      };

      console.error('[ErrorInterceptor]', appError);
      return throwError(() => appError);
    }),
  );
};
