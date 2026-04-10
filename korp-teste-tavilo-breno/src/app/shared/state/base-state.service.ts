import { Injectable, signal, computed, inject, DestroyRef } from '@angular/core';
import { Observable } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export interface State<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

@Injectable({ providedIn: 'root' })
export abstract class BaseStateService<T> {
  protected destroyRef = inject(DestroyRef);

  protected state = signal<State<T>>({ data: null, loading: false, error: null });

  readonly data = computed(() => this.state().data);
  readonly isLoading = computed(() => this.state().loading);
  readonly error = computed(() => this.state().error);

  protected abstract fetchData(): Observable<T>;

  load(): void {
    this.state.update((s) => ({ ...s, loading: true, error: null }));

    this.fetchData()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (data: T) => {
          this.state.update((s) => ({ ...s, loading: false, data, error: null }));
        },
        error: (err: unknown) => {
          const msg = err instanceof Error ? err.message : 'Falha ao carregar dados';
          this.state.update((s) => ({ ...s, loading: false, error: msg }));
        },
      });
  }
}
