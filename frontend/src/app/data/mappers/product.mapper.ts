import { Product } from '../../domain/models/product.model';
import { ProductDto } from '../dto/product.dto';

export class ProductMapper {
  static toDomain(dto: ProductDto): Product {
    return {
      id: dto.id,
      code: dto.codigo,
      description: dto.descricao,
      stockBalance: dto.saldo,
    };
  }

  static toDto(entity: Omit<Product, 'id'>): Omit<ProductDto, 'id'> {
    return {
      codigo: entity.code,
      descricao: entity.description,
      saldo: entity.stockBalance,
    };
  }
}
