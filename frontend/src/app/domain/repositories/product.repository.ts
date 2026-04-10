import { Observable } from 'rxjs';
import { Product } from '../models/product.model';

export interface ProductRepository {
  getAll(): Observable<Product[]>;
  getById(id: string): Observable<Product>;
  create(product: Omit<Product, 'id'>): Observable<Product>;
  update(id: string, product: Partial<Product>): Observable<Product>;
}
