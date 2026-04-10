import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, map, throwError, timer, MonoTypeOperatorFunction } from 'rxjs';
import { catchError, retryWhen, take, scan, mergeMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { InvoiceRepository } from '../../domain/repositories/invoice.repository';
import { Invoice } from '../../domain/models/invoice.model';
import { InvoiceDto } from '../dto/invoice.dto';
import { InvoiceMapper } from '../mappers/invoice.mapper';
import { InvoiceStatus } from '../../domain/models/invoice-status.enum';

@Injectable({ providedIn: 'root' })
export class InvoiceApiService implements InvoiceRepository {
  private http = inject(HttpClient);
  private baseUrl = environment.billingApiUrl;

  private retryWithBackoff<T>(): MonoTypeOperatorFunction<T> {
    return retryWhen((errors) =>
      errors.pipe(
        scan((acc, error) => {
          acc.count++;
          acc.error = error;
          return acc;
        }, { count: 0, error: null as unknown }),
        take(environment.retryAttempts),
        mergeMap((state: { count: number; error: unknown }) => {
          const httpError = state.error as HttpErrorResponse | undefined;
          const status = httpError?.status;
          const isRetryable = status === 0 || (status !== undefined && status >= 500);

          if (!isRetryable) {
            return throwError(() => state.error);
          }

          return timer(environment.retryDelayMs * Math.pow(2, state.count - 1));
        }),
      ),
    ) as MonoTypeOperatorFunction<T>;
  }

  getAll(): Observable<Invoice[]> {
    return this.http
      .get<InvoiceDto[]>(`${this.baseUrl}/Invoices`)
      .pipe(
        this.retryWithBackoff<InvoiceDto[]>(),
        map((dtos) => dtos.map(InvoiceMapper.toDomain)),
        catchError((error) =>
          throwError(() => ({
            message: error?.message || 'Erro ao buscar notas fiscais',
            service: 'billing' as const,
            status: error?.status,
            originalError: error,
          })),
        ),
      );
  }

  getById(id: string): Observable<Invoice> {
    return this.http
      .get<InvoiceDto>(`${this.baseUrl}/Invoices/${id}`)
      .pipe(
        this.retryWithBackoff<InvoiceDto>(),
        map(InvoiceMapper.toDomain),
        catchError((error) =>
          throwError(() => ({
            message: error?.message || 'Erro ao buscar nota fiscal',
            service: 'billing' as const,
            status: error?.status,
            originalError: error,
          })),
        ),
      );
  }

  create(invoiceData: { items: { productId: string; quantity: number; unitPrice: number }[] }): Observable<Invoice> {
    const dto = InvoiceMapper.toDto(invoiceData.items);
    return this.http
      .post<InvoiceDto>(`${this.baseUrl}/Invoices`, dto)
      .pipe(
        this.retryWithBackoff<InvoiceDto>(),
        map(InvoiceMapper.toDomain),
        catchError((error) =>
          throwError(() => ({
            message: error?.message || 'Erro ao criar nota fiscal',
            service: 'billing' as const,
            status: error?.status,
            originalError: error,
          })),
        ),
      );
  }

  print(id: string): Observable<Invoice> {
    return this.http
      .post<InvoiceDto>(`${this.baseUrl}/Invoices/${id}/print`, {})
      .pipe(
        this.retryWithBackoff<InvoiceDto>(),
        map(InvoiceMapper.toDomain),
        catchError((error) =>
          throwError(() => ({
            message: error?.message || 'Erro ao imprimir nota fiscal',
            service: 'billing' as const,
            status: error?.status,
            originalError: error,
          })),
        ),
      );
  }

  updateStatus(id: string, status: InvoiceStatus): Observable<Invoice> {
    const statusValue = status === InvoiceStatus.Aberta ? 0 : 1;

    return this.http
      .patch<InvoiceDto>(`${this.baseUrl}/Invoices/${id}/status`, { status: statusValue })
      .pipe(
        this.retryWithBackoff<InvoiceDto>(),
        map(InvoiceMapper.toDomain),
        catchError((error) =>
          throwError(() => ({
            message: error?.message || 'Erro ao atualizar status da nota fiscal',
            service: 'billing' as const,
            status: error?.status,
            originalError: error,
          })),
        ),
      );
  }
}
