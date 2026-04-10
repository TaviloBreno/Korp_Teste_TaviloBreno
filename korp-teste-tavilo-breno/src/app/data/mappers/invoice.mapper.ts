import { Invoice, InvoiceItem } from '../../domain/models/invoice.model';
import { InvoiceDto, InvoiceItemDto } from '../dto/invoice.dto';
import { InvoiceStatus } from '../../domain/models/invoice-status.enum';

export class InvoiceMapper {
  static toDomain(dto: InvoiceDto): Invoice {
    return {
      id: dto.id,
      sequentialNumber: dto.numeracao_sequencial,
      status: dto.status === 'ABERTA' ? InvoiceStatus.Aberta : InvoiceStatus.Fechada,
      items: dto.itens.map((i) => ({ productId: i.produto_id, quantity: i.quantidade })),
      createdAt: dto.criado_em,
      updatedAt: dto.atualizado_em,
    };
  }

  static toDto(items: { productId: string; quantity: number }[]): { itens: InvoiceItemDto[] } {
    return {
      itens: items.map((i) => ({ produto_id: i.productId, quantidade: i.quantity })),
    };
  }
}
