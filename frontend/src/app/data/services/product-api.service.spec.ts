import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import {
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { ProductApiService } from './product-api.service';
import { idempotencyInterceptor } from '../../core/interceptors/idempotency.interceptor';
import { environment } from '../../../environments/environment';

describe('ProductApiService integration', () => {
  let service: ProductApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    sessionStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(withInterceptors([idempotencyInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(ProductApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    sessionStorage.clear();
  });

  it('getAll should map inventory dto to domain model', (done) => {
    service.getAll().subscribe((products) => {
      expect(products.length).toBe(1);
      expect(products[0]).toEqual({
        id: 'p-1',
        code: 'PROD-1',
        description: 'Produto 1',
        stockBalance: 12,
      });
      done();
    });

    const req = httpMock.expectOne(`${environment.inventoryApiUrl}/products`);
    expect(req.request.method).toBe('GET');

    req.flush([
      {
        id: 'p-1',
        codigo: 'PROD-1',
        descricao: 'Produto 1',
        saldo: 12,
      },
    ]);
  });

  it('create should send idempotency key for mutating request', () => {
    service.create({ code: 'PROD-NEW', description: 'Novo', stockBalance: 3 }).subscribe();

    const req = httpMock.expectOne(`${environment.inventoryApiUrl}/products`);
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.has('Idempotency-Key')).toBeTrue();

    req.flush({
      id: 'p-2',
      codigo: 'PROD-NEW',
      descricao: 'Novo',
      saldo: 3,
    });
  });
});
