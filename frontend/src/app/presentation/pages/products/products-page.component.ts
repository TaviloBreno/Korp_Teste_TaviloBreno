import { Component, OnInit, inject, signal, WritableSignal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService } from 'primeng/api';
import { ProductStateService } from '../../state/product-state.service';
import { Product } from '../../../domain/models/product.model';
import { ErrorBoundaryComponent } from '../../components/error-boundary.component';

@Component({
  selector: 'app-products-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TableModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    ToastModule,
    ProgressSpinnerModule,
    ErrorBoundaryComponent,
  ],
  providers: [MessageService],
  template: `
    <app-error-boundary
      [error]="errorState()"
      (retry)="onRetry()"
      (close)="clearError()"
    ></app-error-boundary>

    <div class="card p-4">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold">Cadastro de Produtos</h2>
        <p-button label="Novo Produto" icon="pi pi-plus" (onClick)="openNew()" />
      </div>

      @if (isLoading()) {
        <div class="text-center p-8">
          <p-progressSpinner></p-progressSpinner>
          <p class="mt-3">Carregando produtos...</p>
        </div>
      } @else if ((products() || []).length === 0) {
        <div class="text-center p-8 text-gray-500">
          <p class="text-lg">Nenhum produto cadastrado</p>
          <p-button
            label="Criar Primeiro Produto"
            icon="pi pi-plus"
            (onClick)="openNew()"
            styleClass="mt-3"
          />
        </div>
      } @else {
        <p-table
          [value]="products() || []"
          [paginator]="true"
          [rows]="10"
          [globalFilterFields]="['code', 'description']"
          responsiveLayout="scroll"
        >
          <ng-template pTemplate="header">
            <tr>
              <th>Código</th>
              <th>Descrição</th>
              <th>Saldo</th>
              <th>Ações</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-product>
            <tr>
              <td>{{ product.code }}</td>
              <td>{{ product.description }}</td>
              <td>{{ product.stockBalance | number: '1.2-2' }}</td>
              <td>
                <div class="flex items-center gap-2">
                  <p-button icon="pi pi-pencil" (onClick)="editProduct(product)" text />
                  <p-button icon="pi pi-trash" severity="danger" text (onClick)="confirmDelete(product)" />
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
      }
    </div>

    <p-dialog
      [(visible)]="dialogVisible"
      [header]="isEdit() ? 'Editar Produto' : 'Novo Produto'"
      [modal]="true"
      [style]="{ width: '470px' }"
    >
      <form [formGroup]="productForm" class="flex flex-col gap-4 py-2 mt-4">
        <input pInputText formControlName="code" placeholder="Código" />
        <input
          pInputText
          formControlName="description"
          placeholder="Descrição"
        />
        <p-inputNumber
          formControlName="stockBalance"
          placeholder="Saldo Inicial"
          mode="decimal"
          [min]="0"
          [minFractionDigits]="2"
          [maxFractionDigits]="2"
          inputStyleClass="w-full"
          styleClass="w-full"
        />
        @if (productForm.get('stockBalance')?.hasError('min')) {
          <small class="text-red-500">Saldo deve ser >= 0</small>
        }
      </form>
      <ng-template pTemplate="footer">
        <p-button
          label="Cancelar"
          icon="pi pi-times"
          text
          (onClick)="hideDialog()"
        />
        <p-button
          label="Salvar"
          icon="pi pi-check"
          [disabled]="productForm.invalid || saving()"
          (onClick)="save()"
        />
      </ng-template>
    </p-dialog>
    <p-toast />
  `,
})
export class ProductsPageComponent implements OnInit {
  private state = inject(ProductStateService);
  private fb = inject(FormBuilder);
  private msg = inject(MessageService);

  readonly products = this.state.data;
  readonly isLoading = this.state.isLoading;
  readonly error = this.state.error;

  readonly saving = computed(() => this.isLoading());
  readonly dialogVisible: WritableSignal<boolean> = signal(false);
  readonly isEdit: WritableSignal<boolean> = signal(false);
  readonly editingId: WritableSignal<string | null> = signal(null);

  readonly errorState = computed(() => {
    const err = this.error();
    return err
      ? {
          message: err,
          service: 'inventory' as const,
          timestamp: new Date(),
          status: 503,
        }
      : null;
  });

  productForm: FormGroup = this.fb.group({
    code: ['', Validators.required],
    description: ['', Validators.required],
    stockBalance: [0, [Validators.required, Validators.min(0)]],
  });

  ngOnInit() {
    this.state.load();
  }

  openNew() {
    this.productForm.reset({ stockBalance: 0 });
    this.isEdit.set(false);
    this.editingId.set(null);
    this.dialogVisible.set(true);
  }

  editProduct(p: Product) {
    this.productForm.patchValue(p);
    this.isEdit.set(true);
    this.editingId.set(p.id);
    this.dialogVisible.set(true);
  }

  save() {
    if (this.productForm.invalid || this.saving()) return;
    const val = this.productForm.getRawValue();
    if (this.isEdit()) {
      this.state.update(this.editingId()!, {
        code: val.code,
        description: val.description,
        stockBalance: val.stockBalance,
      });
    } else {
      this.state.create(val);
    }
    this.dialogVisible.set(false);
  }

  hideDialog() {
    this.editingId.set(null);
    this.isEdit.set(false);
    this.dialogVisible.set(false);
  }

  onRetry() {
    this.state.retry();
  }

  clearError() {
    this.state.clearError();
  }

  confirmDelete(product: Product) {
    const confirmed = window.confirm(`Excluir o produto ${product.code}?`);
    if (!confirmed) return;

    this.state.delete(product.id);
  }
}
