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
        <p-table [value]="invoices() || []" responsiveLayout="scroll">
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
                <select
                  class="w-full min-w-[130px] rounded-md border border-gray-300 bg-white px-2 py-1 text-sm"
                  [value]="inv.status"
                  [disabled]="saving()"
                  (change)="onStatusChange(inv, $any($event.target).value)"
                >
                  <option [value]="InvoiceStatus.Aberta">ABERTA</option>
                  <option [value]="InvoiceStatus.Fechada">FECHADA</option>
                </select>
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
                <div class="md:col-span-3">
                  <label class="block text-xs font-medium text-gray-600 mb-1">Valor Unitario</label>
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
                <div class="md:col-span-1 text-right text-xs text-gray-500 pb-1">
                  {{ getStock(item.value.productId) }}
                </div>
              </div>

              <div class="mt-2 flex items-center justify-between text-xs">
                <span class="text-gray-500">Saldo disponivel</span>
                @if (item.hasError('stockExceeded')) {
                  <span class="text-red-600 font-medium"
                    >Quantidade acima do estoque ({{ item.getError('stockExceeded')?.available }})</span
                  >
                }
              </div>
            </div>
          }
        </div>
        <div class="flex justify-between items-center pt-1">
          <p-button label="Adicionar Item" icon="pi pi-plus" text (onClick)="addItem()" />
          <span class="text-sm text-gray-600">Total de itens: {{ items.length }}</span>
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
            <p-button label="Baixar PDF" icon="pi pi-file-pdf" (onClick)="confirmPrint()" />
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

  // ✅ Expondo o enum para o template HTML
  readonly InvoiceStatus = InvoiceStatus;

  readonly invoices = this.invState.data;
  readonly products = this.prodState.data;
  readonly isInvoiceLoading = this.invState.isLoading;
  readonly isProductLoading = this.prodState.isLoading;

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
    const unitPriceControl = this.fb.control(1, [Validators.required, Validators.min(0.01)]);

    prodControl.valueChanges.pipe(debounceTime(200)).subscribe((prodId: string | null) => {
      if (!prodId) return;
      const stock = this.getStock(prodId);
      qtyControl.clearValidators();
      qtyControl.setValidators([Validators.required, Validators.min(1), stockValidator(stock)]);
      qtyControl.updateValueAndValidity();
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

  onStatusChange(inv: Invoice, status: string) {
    const nextStatus =
      status === InvoiceStatus.Fechada ? InvoiceStatus.Fechada : InvoiceStatus.Aberta;

    if (nextStatus === inv.status) return;
    this.invState.updateStatus(inv.id, nextStatus);
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
