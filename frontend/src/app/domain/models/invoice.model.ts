import { InvoiceStatus } from './invoice-status.enum';

export interface InvoiceItem {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface Invoice {
  id: string;
  sequentialNumber: number;
  status: InvoiceStatus;
  items: InvoiceItem[];
  createdAt: string;
  closedAt?: string | null;
  updatedAt: string;
  totalAmount?: number;
}
