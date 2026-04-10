import { Injectable, inject, signal } from '@angular/core';
import { MessageService } from 'primeng/api';

export interface ErrorState {
  message: string;
  service: 'inventory' | 'billing' | null;
  timestamp: Date;
}

@Injectable({ providedIn: 'root' })
export class ErrorService {
  private messageService = inject(MessageService);
  private errorSignal = signal<ErrorState | null>(null);
  readonly error = this.errorSignal.asReadonly();

  showError(message: string, service?: 'inventory' | 'billing') {
    const errorState: ErrorState = {
      message,
      service: service || null,
      timestamp: new Date(),
    };
    this.errorSignal.set(errorState);

    this.messageService.add({
      severity: 'error',
      summary: 'Erro',
      detail: message,
      life: 5000,
    });
  }

  clearError() {
    this.errorSignal.set(null);
  }

  retryLastAction() {
    const errorState = this.errorSignal();
    if (errorState?.service === 'inventory') {
      // Implementar retry de inventory
    } else if (errorState?.service === 'billing') {
      // Implementar retry de billing
    }
  }
}
