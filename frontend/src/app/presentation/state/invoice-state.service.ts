import { Injectable, inject } from '@angular/core';
import { BaseStateService } from '../../shared/state/base-state.service';
import { InvoiceApiService } from '../../data/services/invoice-api.service';
import { Invoice } from '../../domain/models/invoice.model';
import { Observable, Subject, switchMap, finalize, tap, catchError, of } from 'rxjs';
import { LoadingService } from '../../core/services/loading.service';
import { MessageService } from 'primeng/api';
import { InvoiceStatus } from '../../domain/models/invoice-status.enum';

@Injectable({ providedIn: 'root' })
export class InvoiceStateService extends BaseStateService<Invoice[]> {
  private api = inject(InvoiceApiService);
  private loadingService = inject(LoadingService);
  private messageService = inject(MessageService);

  // Subjects para ações com RxJS
  private createSubject = new Subject<{
    items: { productId: string; quantity: number; unitPrice: number }[];
  }>();
  private printSubject = new Subject<{
    id: string;
    onSuccess?: (invoice: Invoice) => void;
    onFinalize?: () => void;
  }>();
  private updateStatusSubject = new Subject<{ id: string; status: InvoiceStatus }>();
  private inventoryRefreshSubject = new Subject<void>();

  readonly inventoryRefreshRequested$ = this.inventoryRefreshSubject.asObservable();

  protected fetchData(): Observable<Invoice[]> {
    return this.api.getAll();
  }

  private isServiceUnavailable(error: any): boolean {
    const status = error?.status;
    return status === 0 || status >= 500;
  }

  private resolveError(error: any, fallbackMessage: string): string {
    const status = error?.status;

    const backendMessage = error?.details?.error;
    if (backendMessage) {
      return backendMessage;
    }

    if (status === 409 || status === 422) {
      return 'Conflito de concorrencia detectado no saldo. Estoque recarregado; revise os itens e tente novamente.';
    }

    return error?.message || fallbackMessage;
  }

  constructor() {
    super();

    // switchMap para evitar duplicação de requisições de criação
    this.createSubject
      .pipe(
        tap(() => {
          this.loadingService.show();
          this._state.update((s) => ({ ...s, loading: true, error: null }));
        }),
        switchMap((invoiceData) =>
          this.api.create(invoiceData).pipe(
            tap(() => {
              this.messageService.add({
                severity: 'success',
                summary: 'Sucesso',
                detail: 'Nota fiscal criada com sucesso',
                life: 3000,
              });
              this.inventoryRefreshSubject.next();
              this.load();
            }),
            catchError((error: any) => {
              const errorMessage = this.resolveError(error, 'Erro ao criar nota fiscal');
              const serviceUnavailable = this.isServiceUnavailable(error);

              this._state.update((s) => ({
                ...s,
                loading: false,
                error: serviceUnavailable ? errorMessage : null,
              }));
              if (error?.status === 409 || error?.status === 422) {
                this.inventoryRefreshSubject.next();
                this.load();
              }
              this.messageService.add({
                severity: 'error',
                summary: 'Erro',
                detail: errorMessage,
                sticky: true,
              });
              return of(null);
            }),
            finalize(() => {
              this.loadingService.hide();
              this._state.update((s) => ({
                ...s,
                loading: false,
              }));
            }),
          ),
        ),
      )
      .subscribe();

    // switchMap para evitar duplicação de requisições de impressão
    this.printSubject
      .pipe(
        tap(() => {
          this.loadingService.show();
          this._state.update((s) => ({ ...s, loading: true, error: null }));
        }),
        switchMap(({ id, onSuccess, onFinalize }) =>
          this.api.print(id).pipe(
            tap((updatedInvoice) => {
              this.messageService.add({
                severity: 'success',
                summary: 'Sucesso',
                detail: 'Nota fiscal impressa com sucesso',
                life: 3000,
              });
              onSuccess?.(updatedInvoice);
              this.inventoryRefreshSubject.next();
              this.load();
            }),
            catchError((error: any) => {
              const errorMessage = this.resolveError(error, 'Erro ao imprimir nota fiscal');
              const serviceUnavailable = this.isServiceUnavailable(error);

              this._state.update((s) => ({
                ...s,
                loading: false,
                error: serviceUnavailable ? errorMessage : null,
              }));
              if (error?.status === 409 || error?.status === 422) {
                this.inventoryRefreshSubject.next();
                this.load();
              }
              this.messageService.add({
                severity: 'error',
                summary: 'Erro',
                detail: errorMessage,
                sticky: true,
              });
              return of(null);
            }),
            finalize(() => {
              this.loadingService.hide();
              this._state.update((s) => ({
                ...s,
                loading: false,
              }));
              onFinalize?.();
            }),
          ),
        ),
      )
      .subscribe();

    this.updateStatusSubject
      .pipe(
        tap(() => {
          this.loadingService.show();
          this._state.update((s) => ({ ...s, loading: true, error: null }));
        }),
        switchMap(({ id, status }) =>
          this.api.updateStatus(id, status).pipe(
            tap(() => {
              this.messageService.add({
                severity: 'success',
                summary: 'Sucesso',
                detail: 'Status da nota atualizado com sucesso',
                life: 2500,
              });
              this.load();
            }),
            catchError((error: any) => {
              const errorMessage = this.resolveError(error, 'Erro ao atualizar status da nota fiscal');
              const serviceUnavailable = this.isServiceUnavailable(error);

              this._state.update((s) => ({
                ...s,
                loading: false,
                error: serviceUnavailable ? errorMessage : null,
              }));
              this.messageService.add({
                severity: 'error',
                summary: 'Erro',
                detail: errorMessage,
                sticky: true,
              });
              return of(null);
            }),
            finalize(() => {
              this.loadingService.hide();
              this._state.update((s) => ({
                ...s,
                loading: false,
              }));
            }),
          ),
        ),
      )
      .subscribe();
  }

  create(invoiceData: { items: { productId: string; quantity: number; unitPrice: number }[] }): void {
    this.createSubject.next(invoiceData);
  }

  print(id: string, onSuccess?: (invoice: Invoice) => void, onFinalize?: () => void): void {
    this.printSubject.next({ id, onSuccess, onFinalize });
  }

  updateStatus(id: string, status: InvoiceStatus): void {
    this.updateStatusSubject.next({ id, status });
  }

  retry(): void {
    this.load();
  }
}
