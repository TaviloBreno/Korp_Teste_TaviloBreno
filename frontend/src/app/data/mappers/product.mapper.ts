import { Product } from '../../domain/models/product.model';
import { ProductDto } from '../dto/product.dto';

export class ProductMapper {
  static toDomain(dto: ProductDto): Product {
    return {
      id: dto.id,
      code: dto.code ?? (dto as any).codigo,
      description: dto.description ?? (dto as any).descricao,
      price: dto.price ?? 0,
      stockBalance: dto.stockBalance ?? (dto as any).saldo,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt ?? null,
    };
  }

  static toDto(entity: Omit<Product, 'id'>): Omit<ProductDto, 'id'> {
    return {
      code: entity.code,
      description: entity.description,
      price: entity.price,
      stockBalance: entity.stockBalance,
    };
  }
}
