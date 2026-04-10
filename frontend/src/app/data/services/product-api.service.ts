import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, throwError, timer, MonoTypeOperatorFunction } from 'rxjs';
import { catchError, retryWhen, take, scan, mergeMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ProductRepository } from '../../domain/repositories/product.repository';
import { Product } from '../../domain/models/product.model';
import { ProductDto } from '../dto/product.dto';
import { ProductMapper } from '../mappers/product.mapper';

@Injectable({ providedIn: 'root' })
export class ProductApiService implements ProductRepository {
  private http = inject(HttpClient);
  private baseUrl = environment.inventoryApiUrl;

  private retryWithBackoff<T>(): MonoTypeOperatorFunction<T> {
    return retryWhen((errors) =>
      errors.pipe(
        scan((acc, error) => {
          acc.count++;
          return acc;
        }, { count: 0 }),
        take(environment.retryAttempts),
        mergeMap((state) =>
          timer(environment.retryDelayMs * Math.pow(2, state.count - 1)),
        ),
      ),
    ) as MonoTypeOperatorFunction<T>;
  }

  getAll(): Observable<Product[]> {
    return this.http
      .get<ProductDto[]>(`${this.baseUrl}/Products`)
      .pipe(
        this.retryWithBackoff<ProductDto[]>(),
        map((dtos) => dtos.map(ProductMapper.toDomain)),
        catchError((error) =>
          throwError(() => ({
            message: error?.message || 'Erro ao buscar produtos',
            service: 'inventory' as const,
            status: error?.status,
            originalError: error,
          })),
        ),
      );
  }

  getById(id: string): Observable<Product> {
    return this.http
      .get<ProductDto>(`${this.baseUrl}/Products/${id}`)
      .pipe(
        this.retryWithBackoff<ProductDto>(),
        map(ProductMapper.toDomain),
        catchError((error) =>
          throwError(() => ({
            message: error?.message || 'Erro ao buscar produto',
            service: 'inventory' as const,
            status: error?.status,
            originalError: error,
          })),
        ),
      );
  }

  create(product: Omit<Product, 'id'>): Observable<Product> {
    return this.http
      .post<ProductDto>(`${this.baseUrl}/Products`, ProductMapper.toDto(product))
      .pipe(
        this.retryWithBackoff<ProductDto>(),
        map(ProductMapper.toDomain),
        catchError((error) =>
          throwError(() => ({
            message: error?.message || 'Erro ao criar produto',
            service: 'inventory' as const,
            status: error?.status,
            originalError: error,
          })),
        ),
      );
  }

  update(id: string, product: Partial<Product>): Observable<Product> {
    return this.http
      .patch<ProductDto>(`${this.baseUrl}/Products/${id}`, {
        codigo: product.code,
        descricao: product.description,
        saldo: product.stockBalance,
      })
      .pipe(
        this.retryWithBackoff<ProductDto>(),
        map(ProductMapper.toDomain),
        catchError((error) =>
          throwError(() => ({
            message: error?.message || 'Erro ao atualizar produto',
            service: 'inventory' as const,
            status: error?.status,
            originalError: error,
          })),
        ),
      );
  }
}
