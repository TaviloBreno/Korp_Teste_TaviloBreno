import { Injectable, inject } from '@angular/core';
import { BaseStateService } from '../../shared/state/base-state.service';
import { ProductApiService } from '../../data/services/product-api.service';
import { Product } from '../../domain/models/product.model';
import { Observable, Subject, switchMap, finalize, tap, catchError, of, map } from 'rxjs';
import { LoadingService } from '../../core/services/loading.service';
import { MessageService } from 'primeng/api';

@Injectable({ providedIn: 'root' })
export class ProductStateService extends BaseStateService<Product[]> {
  private api = inject(ProductApiService);
  private loadingService = inject(LoadingService);
  private messageService = inject(MessageService);

  // Subjects para ações com RxJS
  private createSubject = new Subject<Omit<Product, 'id'>>();
  private updateSubject = new Subject<{ id: string; product: Partial<Product> }>();
  private deleteSubject = new Subject<string>();

  protected fetchData(): Observable<Product[]> {
    return this.api.getAll().pipe(
      map((products) =>
        [...products].sort((left, right) => {
          const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
          const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
          return rightTime - leftTime;
        }),
      ),
    );
  }

  private resolveError(error: any, fallbackMessage: string): string {
    const status = error?.status;
    if (status === 409 || status === 422) {
      return 'Conflito de concorrencia detectado. O saldo foi recarregado; revise os dados e tente novamente.';
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
        switchMap((product) =>
          this.api.create(product).pipe(
            tap(() => {
              this.messageService.add({
                severity: 'success',
                summary: 'Sucesso',
                detail: 'Produto criado com sucesso',
                life: 3000,
              });
              this.load();
            }),
            catchError((error: any) => {
              const errorMessage = this.resolveError(error, 'Erro ao criar produto');
              this._state.update((s) => ({
                ...s,
                loading: false,
                error: errorMessage,
              }));
              if (error?.status === 409 || error?.status === 422) {
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

    // switchMap para evitar duplicação de requisições de atualização
    this.updateSubject
      .pipe(
        tap(() => {
          this.loadingService.show();
          this._state.update((s) => ({ ...s, loading: true, error: null }));
        }),
        switchMap(({ id, product }) =>
          this.api.update(id, product).pipe(
            tap(() => {
              this.messageService.add({
                severity: 'success',
                summary: 'Sucesso',
                detail: 'Produto atualizado com sucesso',
                life: 3000,
              });
              this.load();
            }),
            catchError((error: any) => {
              const errorMessage = this.resolveError(error, 'Erro ao atualizar produto');
              this._state.update((s) => ({
                ...s,
                loading: false,
                error: errorMessage,
              }));
              if (error?.status === 409 || error?.status === 422) {
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

    this.deleteSubject
      .pipe(
        tap(() => {
          this.loadingService.show();
          this._state.update((s) => ({ ...s, loading: true, error: null }));
        }),
        switchMap((id) =>
          this.api.delete(id).pipe(
            tap(() => {
              this.messageService.add({
                severity: 'success',
                summary: 'Sucesso',
                detail: 'Produto excluído com sucesso',
                life: 3000,
              });
              this.load();
            }),
            catchError((error: any) => {
              const errorMessage = this.resolveError(error, 'Erro ao excluir produto');
              this._state.update((s) => ({
                ...s,
                loading: false,
                error: errorMessage,
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

  create(product: Omit<Product, 'id'>): void {
    this.createSubject.next(product);
  }

  update(id: string, product: Partial<Product>): void {
    this.updateSubject.next({ id, product });
  }

  delete(id: string): void {
    this.deleteSubject.next(id);
  }

  retry(): void {
    this.load();
  }
}
