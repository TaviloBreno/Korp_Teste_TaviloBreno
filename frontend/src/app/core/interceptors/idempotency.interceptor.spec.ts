import { HttpRequest, HttpResponse } from '@angular/common/http';
import { of, NEVER, firstValueFrom } from 'rxjs';
import { idempotencyInterceptor } from './idempotency.interceptor';

describe('idempotencyInterceptor', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('adds Idempotency-Key for mutating requests', async () => {
    const req = new HttpRequest('POST', '/api/products', { code: 'P1' });

    const response = await firstValueFrom(
      idempotencyInterceptor(req, (nextReq) => {
        expect(nextReq.headers.has('Idempotency-Key')).toBeTrue();
        expect(nextReq.headers.get('Idempotency-Key')).toBeTruthy();
        return of(new HttpResponse({ status: 200, body: {} }));
      }),
    );

    expect((response as HttpResponse<unknown>).status).toBe(200);
  });

  it('blocks duplicate in-flight request with same fingerprint', (done) => {
    const req = new HttpRequest('POST', '/api/invoices', { itens: [{ produto_id: 'p1', quantidade: 1 }] });

    idempotencyInterceptor(req, () => NEVER).subscribe();

    idempotencyInterceptor(req, () => of(new HttpResponse({ status: 200 }))).subscribe({
      next: () => fail('Expected duplicate request to fail'),
      error: (error) => {
        expect(error.status).toBe(409);
        expect(error.code).toBe('IDEMPOTENT_REQUEST_IN_FLIGHT');
        done();
      },
    });
  });

  it('does not add key for GET requests', async () => {
    const req = new HttpRequest('GET', '/api/products');

    await firstValueFrom(
      idempotencyInterceptor(req, (nextReq) => {
        expect(nextReq.headers.has('Idempotency-Key')).toBeFalse();
        return of(new HttpResponse({ status: 200, body: [] }));
      }),
    );
  });
});
