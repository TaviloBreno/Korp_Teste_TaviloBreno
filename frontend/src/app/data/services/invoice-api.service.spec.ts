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
import { InvoiceApiService } from './invoice-api.service';
import { idempotencyInterceptor } from '../../core/interceptors/idempotency.interceptor';
import { InvoiceStatus } from '../../domain/models/invoice-status.enum';
import { environment } from '../../../environments/environment';

describe('InvoiceApiService integration', () => {
  let service: InvoiceApiService;
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

    service = TestBed.inject(InvoiceApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    sessionStorage.clear();
  });

  it('create should call billing endpoint with dto and map response', (done) => {
    service.create({ items: [{ productId: 'p-1', quantity: 3 }] }).subscribe((invoice) => {
      expect(invoice.sequentialNumber).toBe(101);
      expect(invoice.status).toBe(InvoiceStatus.Aberta);
      expect(invoice.items[0]).toEqual({ productId: 'p-1', quantity: 3 });
      done();
    });

    const req = httpMock.expectOne(`${environment.billingApiUrl}/invoices`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      itens: [{ produto_id: 'p-1', quantidade: 3 }],
    });
    expect(req.request.headers.has('Idempotency-Key')).toBeTrue();

    req.flush({
      id: 'inv-1',
      numeracao_sequencial: 101,
      status: 'ABERTA',
      itens: [{ produto_id: 'p-1', quantidade: 3 }],
      criado_em: '2026-01-01T10:00:00.000Z',
      atualizado_em: '2026-01-01T10:00:00.000Z',
    });
  });

  it('print should call print endpoint and map response', (done) => {
    service.print('inv-1').subscribe((invoice) => {
      expect(invoice.id).toBe('inv-1');
      expect(invoice.status).toBe(InvoiceStatus.Fechada);
      done();
    });

    const req = httpMock.expectOne(`${environment.billingApiUrl}/invoices/inv-1/print`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    expect(req.request.headers.has('Idempotency-Key')).toBeTrue();

    req.flush({
      id: 'inv-1',
      numeracao_sequencial: 101,
      status: 'FECHADA',
      itens: [{ produto_id: 'p-1', quantidade: 3 }],
      criado_em: '2026-01-01T10:00:00.000Z',
      atualizado_em: '2026-01-01T11:00:00.000Z',
    });
  });
});
