import { HttpInterceptorFn } from '@angular/common/http';
import { finalize, throwError } from 'rxjs';

const IDEMPOTENCY_STORAGE_KEY = 'korp:idempotency:pending';

function requestFingerprint(method: string, url: string, body: unknown): string {
  return `${method.toUpperCase()}:${url}:${JSON.stringify(body ?? null)}`;
}

function readPendingMap(): Record<string, string> {
  try {
    const raw = sessionStorage.getItem(IDEMPOTENCY_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function writePendingMap(map: Record<string, string>): void {
  try {
    sessionStorage.setItem(IDEMPOTENCY_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Ignore storage errors to avoid blocking request flow.
  }
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
  const pendingMap = readPendingMap();

  if (pendingMap[fingerprint]) {
    return throwError(() => ({
      status: 409,
      message: 'Requisicao duplicada em andamento. Aguarde a resposta.',
      code: 'IDEMPOTENT_REQUEST_IN_FLIGHT',
    }));
  }

  const idempotencyKey = generateRequestId();
  pendingMap[fingerprint] = idempotencyKey;
  writePendingMap(pendingMap);

  const cloned = req.clone({ setHeaders: { 'Idempotency-Key': idempotencyKey } });

  return next(cloned).pipe(
    finalize(() => {
      const refreshedMap = readPendingMap();
      delete refreshedMap[fingerprint];
      writePendingMap(refreshedMap);
    }),
  );
};
