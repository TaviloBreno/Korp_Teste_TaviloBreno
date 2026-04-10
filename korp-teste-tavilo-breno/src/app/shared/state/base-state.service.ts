import { Injectable, signal, computed, Signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

export interface State<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

@Injectable({ providedIn: 'root' })
export abstract class BaseStateService<T> {
  protected _state = signal<State<T>>({ data: null, loading: false, error: null });

  readonly state: Signal<State<T>> = this._state.asReadonly();
  readonly data: Signal<T | null> = computed(() => this._state().data);
  readonly isLoading: Signal<boolean> = computed(() => this._state().loading);
  readonly error: Signal<string | null> = computed(() => this._state().error);

  protected abstract fetchData(): Observable<T>;

  load(): void {
    this._state.update((s) => ({ ...s, loading: true, error: null }));
    this.fetchData()
      .pipe(
        catchError((err) => {
          this._state.update((s) => ({
            ...s,
            loading: false,
            error: err.message || 'Erro de comunicação',
          }));
          return of(null as unknown as T);
        }),
        finalize(() => {
          this._state.update((s) => (s.loading ? { ...s, loading: false } : s));
        }),
      )
      .subscribe((result) => {
        if (result !== null) {
          this._state.update((s) => ({ ...s, loading: false, data: result, error: null }));
        }
      });
  }

  clearError(): void {
    this._state.update((s) => ({ ...s, error: null }));
  }
}
