import { Invoice, InvoiceItem } from '../../domain/models/invoice.model';
import { InvoiceDto, InvoiceItemDto } from '../dto/invoice.dto';
import { InvoiceStatus } from '../../domain/models/invoice-status.enum';

export class InvoiceMapper {
  static toDomain(dto: InvoiceDto): Invoice {
    const status =
      dto.status === 'ABERTA' || dto.status === 0
        ? InvoiceStatus.Aberta
        : InvoiceStatus.Fechada;

    return {
      id: dto.id,
      sequentialNumber: dto.sequentialNumber,
      status,
      items: dto.items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
      createdAt: dto.createdAt,
      closedAt: dto.closedAt ?? null,
      updatedAt: dto.updatedAt ?? dto.createdAt,
      totalAmount: dto.totalAmount,
    };
  }

  static toDto(items: { productId: string; quantity: number; unitPrice: number }[]): { items: InvoiceItemDto[] } {
    return {
      items: items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
    };
  }
}
