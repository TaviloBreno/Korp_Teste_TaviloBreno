import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'products', pathMatch: 'full' },
  {
    path: 'products',
    loadComponent: () =>
      import('./presentation/pages/products/products-page.component').then(
        (m) => m.ProductsPageComponent,
      ),
  },
  {
    path: 'invoices',
    loadComponent: () =>
      import('./presentation/pages/invoices/invoices-page.component').then(
        (m) => m.InvoicesPageComponent,
      ),
  },
  { path: '**', redirectTo: 'products' }, // Rota curinga
];
