import { HttpInterceptorFn } from '@angular/common/http';
import { finalize, throwError } from 'rxjs';

const inFlightRequests = new Map<string, string>();

function requestFingerprint(method: string, url: string, body: unknown): string {
  return `${method.toUpperCase()}:${url}:${JSON.stringify(body ?? null)}`;
}

function generateRequestId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `req-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export const idempotencyInterceptor: HttpInterceptorFn = (req, next) => {
  if (!['POST', 'PUT', 'PATCH'].includes(req.method.toUpperCase())) {
    return next(req);
  }

  const fingerprint = requestFingerprint(req.method, req.urlWithParams, req.body);

  if (inFlightRequests.has(fingerprint)) {
    return throwError(() => ({
      status: 409,
      message: 'Requisicao duplicada em andamento. Aguarde a resposta.',
      code: 'IDEMPOTENT_REQUEST_IN_FLIGHT',
    }));
  }

  const idempotencyKey = generateRequestId();
  inFlightRequests.set(fingerprint, idempotencyKey);

  const cloned = req.clone({ setHeaders: { 'Idempotency-Key': idempotencyKey } });

  return next(cloned).pipe(
    finalize(() => {
      inFlightRequests.delete(fingerprint);
    }),
  );
};
