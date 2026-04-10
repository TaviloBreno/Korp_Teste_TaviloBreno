import {
  Component,
  OnInit,
  inject,
  signal,
  WritableSignal,
  computed,
  DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService } from 'primeng/api';
import { debounceTime } from 'rxjs';
import { InvoiceStateService } from '../../state/invoice-state.service';
import { ProductStateService } from '../../state/product-state.service';
import { InvoicePdfService } from '../../services/invoice-pdf.service';
import { Product } from '../../../domain/models/product.model';
import { Invoice } from '../../../domain/models/invoice.model';
import { InvoiceStatus } from '../../../domain/models/invoice-status.enum';
import { stockValidator } from '../../../shared/validators/stock.validator';
import { ErrorBoundaryComponent } from '../../components/error-boundary.component';

@Component({
  selector: 'app-invoices-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TableModule,
    DialogModule,
    ButtonModule,
    InputNumberModule,
    InputTextModule,
    SelectModule,
    ToastModule,
    ProgressSpinnerModule,
    ErrorBoundaryComponent,
  ],
  providers: [MessageService],
  template: `
    <app-error-boundary
      [error]="invoiceErrorState()"
      (retry)="onInvoiceRetry()"
      (close)="clearInvoiceError()"
    ></app-error-boundary>

    <app-error-boundary
      [error]="productErrorState()"
      (retry)="onProductRetry()"
      (close)="clearProductError()"
    ></app-error-boundary>

    <div class="card p-4">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold">Notas Fiscais</h2>
        <p-button label="Nova Nota" icon="pi pi-plus" (onClick)="openNew()" />
      </div>

      <div class="mb-4 rounded-xl border border-gray-200 bg-gray-50/60 p-3">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-3">
          <div class="lg:col-span-6">
            <label class="block text-xs font-semibold text-gray-600 mb-1">Busca</label>
            <div class="relative">
              <i class="pi pi-search pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm z-10"></i>
              <input
                pInputText
                class="w-full h-10 rounded-lg border border-gray-300 bg-white pl-3 pr-11 text-sm"
                placeholder="Procurar por número da nota"
                [value]="invoiceSearch()"
                (input)="invoiceSearch.set($any($event.target).value)"
              />
            </div>
          </div>

          <div class="lg:col-span-3">
            <label class="block text-xs font-semibold text-gray-600 mb-1">Status</label>
            <select
              class="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm"
              [value]="invoiceStatusFilter()"
              (change)="invoiceStatusFilter.set($any($event.target).value)"
            >
              <option value="ALL">Todos os status</option>
              <option [value]="InvoiceStatus.Aberta">Abertas</option>
              <option [value]="InvoiceStatus.Fechada">Fechadas</option>
            </select>
          </div>

          <div class="lg:col-span-3">
            <label class="block text-xs font-semibold text-gray-600 mb-1">Organizar por</label>
            <select
              class="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm"
              [value]="invoiceSort()"
              (change)="invoiceSort.set($any($event.target).value)"
            >
              <option value="created_desc">Mais recentes</option>
              <option value="created_asc">Mais antigas</option>
              <option value="number_desc">Maior número</option>
              <option value="number_asc">Menor número</option>
            </select>
          </div>
        </div>
      </div>

      @if (isInvoiceLoading()) {
        <div class="text-center p-8">
          <p-progressSpinner></p-progressSpinner>
          <p class="mt-3">Carregando notas fiscais...</p>
        </div>
      } @else if ((invoices() || []).length === 0) {
        <div class="text-center p-8 text-gray-500">
          <p class="text-lg">Nenhuma nota fiscal criada</p>
          <p-button
            label="Criar Primeira Nota"
            icon="pi pi-plus"
            (onClick)="openNew()"
            styleClass="mt-3"
          />
        </div>
      } @else {
        <p-table [value]="filteredInvoices() || []" responsiveLayout="scroll">
          <ng-template pTemplate="header">
            <tr>
              <th>Nº</th>
              <th>Status</th>
              <th>Itens</th>
              <th>Criado em</th>
              <th>Ações</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-inv>
            <tr>
              <td>{{ inv.sequentialNumber }}</td>
              <td>
                <span
                  class="inline-flex min-w-[100px] justify-center rounded-full px-2 py-1 text-xs font-semibold"
                  [class.bg-emerald-100]="inv.status === InvoiceStatus.Aberta"
                  [class.text-emerald-700]="inv.status === InvoiceStatus.Aberta"
                  [class.bg-gray-200]="inv.status === InvoiceStatus.Fechada"
                  [class.text-gray-700]="inv.status === InvoiceStatus.Fechada"
                >
                  {{ inv.status === InvoiceStatus.Aberta ? 'ABERTA' : 'FECHADA' }}
                </span>
              </td>
              <td>{{ inv.items.length }} produto(s)</td>
              <td>{{ inv.createdAt | date: 'dd/MM/yyyy HH:mm' }}</td>
              <td>
                <div class="flex items-center gap-2">
                  <p-button
                    icon="pi pi-file-pdf"
                    severity="contrast"
                    [disabled]="inv.status === InvoiceStatus.Fechada"
                    (onClick)="openPdfConfirmation(inv)"
                  />
                </div>
              </td>
            </tr>
          </ng-template>

          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="5" class="text-center py-6 text-gray-500">
                Nenhuma nota fiscal encontrada para os filtros selecionados.
              </td>
            </tr>
          </ng-template>
        </p-table>
      }

    <p-dialog
      [(visible)]="dialogVisible"
      header="Nova Nota Fiscal"
      [modal]="true"
      [style]="{ width: '860px', maxWidth: '96vw' }"
    >
      <form [formGroup]="invoiceForm" class="flex flex-col gap-6 pt-4 px-1 pb-2">
        <div class="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
          Selecione os produtos e quantidades para montar a nota. Na emissão (PDF), a nota será fechada automaticamente.
        </div>

        <div formArrayName="items" class="flex flex-col gap-5">
          @for (item of items.controls; track item; let i = $index) {
            <div [formGroupName]="i" class="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
              <div class="flex items-center justify-between mb-3">
                <span class="text-sm font-semibold text-gray-700">Item {{ i + 1 }}</span>
                <p-button icon="pi pi-trash" severity="danger" text (onClick)="removeItem(i)" />
              </div>

              <div class="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                <div class="md:col-span-6">
                  <label class="block text-xs font-medium text-gray-600 mb-1">Produto</label>
                  <p-select
                    formControlName="productId"
                    [options]="products() || []"
                    optionLabel="description"
                    optionValue="id"
                    placeholder="Selecione um produto"
                    styleClass="w-full"
                  />
                </div>
                <div class="md:col-span-2">
                  <label class="block text-xs font-medium text-gray-600 mb-1">Quantidade</label>
                  <p-inputNumber
                    formControlName="quantity"
                    placeholder="Qtd"
                    [showButtons]="true"
                    styleClass="w-full"
                  />
                </div>
                <div class="md:col-span-2">
                  <label class="block text-xs font-medium text-gray-600 mb-1">Valor Unitário</label>
                  <p-inputNumber
                    formControlName="unitPrice"
                    placeholder="0,00"
                    mode="decimal"
                    [min]="0.01"
                    [minFractionDigits]="2"
                    [maxFractionDigits]="2"
                    styleClass="w-full"
                  />
                </div>
                <div class="md:col-span-1 rounded-lg bg-blue-50 border border-blue-200 p-2">
                  <label class="block text-xs font-medium text-gray-600 mb-1">Subtotal</label>
                  <div class="text-sm font-semibold text-blue-700">
                    {{ ((item.value.quantity || 0) * (item.value.unitPrice || 0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }}
                  </div>
                </div>
                <div class="md:col-span-1 flex justify-end">
                  <p-button icon="pi pi-trash" severity="danger" text (onClick)="removeItem(i)" />
                </div>
              </div>

              <div class="mt-2 flex items-center justify-between text-xs">
                <span class="text-gray-500">Saldo disponivel: {{ getStock(item.value.productId) }}</span>
                @if (item.hasError('stockExceeded')) {
                  <span class="text-red-600 font-medium"
                    >Quantidade acima do estoque ({{ item.getError('stockExceeded')?.available }})</span
                  >
                }
              </div>
            </div>
          }
        </div>
        <div class="flex justify-between items-center pt-4 border-t border-gray-200">
          <p-button label="Adicionar Item" icon="pi pi-plus" text (onClick)="addItem()" />
          <div class="text-right">
            <div class="text-xs text-gray-600 mb-1">Total de itens: {{ items.length }}</div>
            <div class="text-lg font-bold text-green-600">
              {{ getInvoiceTotal().toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }}
            </div>
          </div>
        </div>
      </form>
      <ng-template pTemplate="footer">
        <p-button label="Cancelar" icon="pi pi-times" text (onClick)="dialogVisible.set(false)" />
        <p-button
          label="Criar Nota"
          icon="pi pi-check"
          [disabled]="invoiceForm.invalid || saving()"
          (onClick)="saveInvoice()"
        />
      </ng-template>
    </p-dialog>

    <p-dialog
      [(visible)]="printModalVisible"
      header="Gerar PDF da Nota"
      [modal]="true"
      [closable]="false"
    >
      <div class="flex flex-col items-center gap-4 py-4">
        @if (printing()) {
          <p-progressSpinner />
          <p>Gerando PDF em nova aba...</p>
        } @else {
          <p>Nota #{{ selectedInvoice()?.sequentialNumber }} sera emitida e fechada automaticamente.</p>
          <div class="flex gap-2">
            <p-button
              label="Cancelar"
              severity="secondary"
              (onClick)="printModalVisible.set(false)"
            />
            <p-button label="Emitir Nota" icon="pi pi-file-pdf" (onClick)="confirmPrint()" />
          </div>
        }
      </div>
    </p-dialog>
    <p-toast />
  `,
})
export class InvoicesPageComponent implements OnInit {
  private invState = inject(InvoiceStateService);
  private prodState = inject(ProductStateService);
  private fb = inject(FormBuilder);
  private msg = inject(MessageService);
  private destroyRef = inject(DestroyRef);
  private pdfService = inject(InvoicePdfService);

  readonly InvoiceStatus = InvoiceStatus;

  readonly invoices = this.invState.data;
  readonly products = this.prodState.data;
  readonly isInvoiceLoading = this.invState.isLoading;
  readonly isProductLoading = this.prodState.isLoading;

  readonly invoiceSearch = signal('');
  readonly invoiceStatusFilter = signal<'ALL' | InvoiceStatus>('ALL');
  readonly invoiceSort = signal<'created_desc' | 'created_asc' | 'number_desc' | 'number_asc'>('created_desc');

  readonly filteredInvoices = computed(() => {
    const term = this.invoiceSearch().trim().toLowerCase();
    const statusFilter = this.invoiceStatusFilter();
    const sort = this.invoiceSort();

    let result = [...(this.invoices() || [])];

    if (statusFilter !== 'ALL') {
      result = result.filter((invoice) => invoice.status === statusFilter);
    }

    if (term) {
      result = result.filter((invoice) =>
        String(invoice.sequentialNumber).includes(term),
      );
    }

    result.sort((a, b) => {
      const aCreated = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bCreated = b.createdAt ? new Date(b.createdAt).getTime() : 0;

      switch (sort) {
        case 'created_asc':
          return aCreated - bCreated;
        case 'number_asc':
          return a.sequentialNumber - b.sequentialNumber;
        case 'number_desc':
          return b.sequentialNumber - a.sequentialNumber;
        case 'created_desc':
        default:
          return bCreated - aCreated;
      }
    });

    return result;
  });

  readonly invoiceError = this.invState.error;
  readonly productError = this.prodState.error;

  readonly invoiceErrorState = computed(() => {
    const err = this.invoiceError();
    return err
      ? {
          message: err,
          service: 'billing' as const,
          timestamp: new Date(),
          status: 503,
        }
      : null;
  });

  readonly productErrorState = computed(() => {
    const err = this.productError();
    return err
      ? {
          message: err,
          service: 'inventory' as const,
          timestamp: new Date(),
          status: 503,
        }
      : null;
  });

  readonly dialogVisible: WritableSignal<boolean> = signal(false);
  readonly printModalVisible: WritableSignal<boolean> = signal(false);
  readonly selectedInvoice = signal<Invoice | null>(null);
  readonly saving = computed(() => this.isInvoiceLoading());
  readonly printing = computed(() => this.isInvoiceLoading());

  invoiceForm: FormGroup = this.fb.group({ items: this.fb.array([]) });
  get items(): FormArray {
    return this.invoiceForm.get('items') as FormArray;
  }

  ngOnInit() {
    this.invState.load();
    this.prodState.load();

    this.invState.inventoryRefreshRequested$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.prodState.load());
  }

  openNew() {
    this.invoiceForm.reset({ items: [] });
    this.dialogVisible.set(true);
    this.addItem();
  }

  addItem() {
    const prodControl = this.fb.control('', Validators.required);
    const qtyControl = this.fb.control(1, [Validators.required, Validators.min(1)]);
    const unitPriceControl = this.fb.control({ value: 0, disabled: false }, [Validators.required, Validators.min(0.01)]);

    prodControl.valueChanges.pipe(debounceTime(200)).subscribe((prodId: string | null) => {
      if (!prodId) {
        unitPriceControl.setValue(0);
        return;
      }
      const stock = this.getStock(prodId);
      const price = this.getProductPrice(prodId);

      qtyControl.clearValidators();
      qtyControl.setValidators([Validators.required, Validators.min(1), stockValidator(stock)]);
      qtyControl.updateValueAndValidity();

      unitPriceControl.setValue(price);
    });

    this.items.push(
      this.fb.group({
        productId: prodControl,
        quantity: qtyControl,
        unitPrice: unitPriceControl,
      }),
    );
  }

  removeItem(i: number) {
    this.items.removeAt(i);
  }

  getStock(productId: string | null): number {
    if (!productId) return 0;
    return (this.products() || []).find((p: Product) => p.id === productId)?.stockBalance ?? 0;
  }

  getProductPrice(productId: string | null): number {
    if (!productId) return 0;
    return (this.products() || []).find((p: Product) => p.id === productId)?.price ?? 0;
  }

  getInvoiceTotal = computed(() => {
    const items = this.items.value;
    if (!items || items.length === 0) return 0;
    return items.reduce((total: number, item: any) => {
      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unitPrice) || 0;
      return total + (quantity * unitPrice);
    }, 0);
  });

  saveInvoice() {
    if (this.invoiceForm.invalid || this.saving()) return;
    const items = this.items.value.map((i: any) => ({
      productId: i.productId,
      quantity: Number(i.quantity),
      unitPrice: Number(i.unitPrice),
    }));

    this.invState.create({ items });
    this.dialogVisible.set(false);
  }

  openPdfConfirmation(inv: Invoice) {
    this.selectedInvoice.set(inv);
    this.printModalVisible.set(true);
  }

  confirmPrint() {
    if (this.printing()) return;
    const inv = this.selectedInvoice();
    if (!inv) return;

    this.invState.print(inv.id, (updatedInvoice) => {
      this.pdfService.generate(updatedInvoice);
      this.printModalVisible.set(false);
    });
  }

  onInvoiceRetry() {
    this.invState.retry();
  }

  onProductRetry() {
    this.prodState.retry();
  }

  clearInvoiceError() {
    this.invState.clearError();
  }

  clearProductError() {
    this.prodState.clearError();
  }
}
