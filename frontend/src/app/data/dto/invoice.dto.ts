export interface InvoiceItemDto {
  id?: string;
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface InvoiceDto {
  id: string;
  sequentialNumber: number;
  status: 0 | 1 | 'ABERTA' | 'FECHADA';
  items: InvoiceItemDto[];
  createdAt: string;
  closedAt?: string | null;
  updatedAt?: string;
  totalAmount?: number;
}
