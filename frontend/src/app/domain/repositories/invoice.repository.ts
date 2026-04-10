import { Observable } from 'rxjs';
import { Invoice } from '../models/invoice.model';

export interface InvoiceRepository {
  getAll(): Observable<Invoice[]>;
  getById(id: string): Observable<Invoice>;
  create(invoice: { items: { productId: string; quantity: number }[] }): Observable<Invoice>;
  print(id: string): Observable<Invoice>;
}
