import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';

export interface ErrorState {
  message: string;
  service?: 'inventory' | 'billing';
  status?: number;
  timestamp: Date;
}

@Component({
  selector: 'app-error-boundary',
  standalone: true,
  imports: [CommonModule, ButtonModule, ToastModule],
  template: `
    @if (error) {
      <div class="border-l-4 border-red-500 bg-red-50 p-4 rounded my-4">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <h3 class="text-lg font-semibold text-red-800 mb-2">
              Erro ao carregar dados
            </h3>
            <p class="text-red-700 mb-2">{{ error.message }}</p>
            @if (error.service) {
              <p class="text-sm text-red-600 mb-3">
                <strong>Serviço:</strong>
                {{ error.service === 'inventory' ? 'Inventário' : 'Faturamento' }}
              </p>
            }
            @if (error.status === 503) {
              <p class="text-sm text-orange-600 mb-3">
                ⚠️ O serviço está temporariamente indisponível. Tentando reconectar
                automaticamente...
              </p>
            }
          </div>
          <button
              (click)="close.emit()"
            class="ml-4 text-red-500 hover:text-red-700"
          >
            ✕
          </button>
        </div>

        <div class="flex gap-2 mt-4">
          <p-button
            label="Tentar Novamente"
            icon="pi pi-refresh"
            [loading]="isRetrying"
            (onClick)="onRetry()"
            styleClass="p-button-sm"
          />
          @if (canDismiss) {
            <p-button
              label="Descartar"
              icon="pi pi-times"
              severity="secondary"
                (onClick)="close.emit()"
              styleClass="p-button-sm"
              text
            />
          }
        </div>
      </div>
    }

    <ng-content></ng-content>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class ErrorBoundaryComponent implements OnInit {
  @Input() error: ErrorState | null = null;
  @Input() canDismiss = true;
  @Output() retry = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  isRetrying = false;

  ngOnInit() {
    // Auto-retry após 5 segundos se for erro de serviço indisponível
    if (this.error?.status === 503) {
      setTimeout(() => {
        if (!this.isRetrying) {
          this.onRetry();
        }
      }, 5000);
    }
  }

  onRetry() {
    this.isRetrying = true;
    this.retry.emit();
    setTimeout(() => {
      this.isRetrying = false;
    }, 2000);
  }

  onClose() {
    this.close.emit();
  }
}
