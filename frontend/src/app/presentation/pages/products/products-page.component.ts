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

      <div class="mb-4 rounded-xl border border-gray-200 bg-gray-50/60 p-3">
        <div class="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div class="md:col-span-8">
            <label class="block text-xs font-semibold text-gray-600 mb-1">Busca</label>
            <div class="relative">
              <i class="pi pi-search pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm z-10"></i>
              <input
                pInputText
                class="w-full h-10 rounded-lg border border-gray-300 bg-white pl-3 pr-11 text-sm"
                placeholder="Procurar por código ou descrição"
                [value]="productSearch()"
                (input)="productSearch.set($any($event.target).value)"
              />
            </div>
          </div>

          <div class="md:col-span-4">
            <label class="block text-xs font-semibold text-gray-600 mb-1">Organizar por</label>
            <select
              class="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm"
              [value]="productSort()"
              (change)="productSort.set($any($event.target).value)"
            >
              <option value="created_desc">Mais recentes</option>
              <option value="created_asc">Mais antigos</option>
              <option value="code_asc">Código (A-Z)</option>
              <option value="code_desc">Código (Z-A)</option>
              <option value="stock_desc">Maior saldo</option>
              <option value="stock_asc">Menor saldo</option>
            </select>
          </div>
        </div>
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
          [value]="filteredProducts() || []"
          [paginator]="true"
          [rows]="10"
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

          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="4" class="text-center py-6 text-gray-500">
                Nenhum produto encontrado para os filtros selecionados.
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

  readonly productSearch = signal('');
  readonly productSort = signal<'created_desc' | 'created_asc' | 'code_asc' | 'code_desc' | 'stock_desc' | 'stock_asc'>('created_desc');

  readonly filteredProducts = computed(() => {
    const term = this.productSearch().trim().toLowerCase();
    const sort = this.productSort();
    let result = [...(this.products() || [])];

    if (term) {
      result = result.filter((product) =>
        product.code.toLowerCase().includes(term) ||
        product.description.toLowerCase().includes(term),
      );
    }

    result.sort((a, b) => {
      const aCreated = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bCreated = b.createdAt ? new Date(b.createdAt).getTime() : 0;

      switch (sort) {
        case 'created_asc':
          return aCreated - bCreated;
        case 'code_asc':
          return a.code.localeCompare(b.code);
        case 'code_desc':
          return b.code.localeCompare(a.code);
        case 'stock_asc':
          return a.stockBalance - b.stockBalance;
        case 'stock_desc':
          return b.stockBalance - a.stockBalance;
        case 'created_desc':
        default:
          return bCreated - aCreated;
      }
    });

    return result;
  });

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
