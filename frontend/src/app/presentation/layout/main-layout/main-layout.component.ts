import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { MenubarModule } from 'primeng/menubar';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, MenubarModule],
  template: `
    <div class="min-h-screen bg-gray-50">
      <p-menubar [model]="items" class="mb-4 shadow-md">
        <ng-template pTemplate="start">
          <span class="text-xl font-bold ml-2">Korp Teste - Tavilo</span>
        </ng-template>
      </p-menubar>
      <div class="container mx-auto p-4">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
})
export class MainLayoutComponent {
  items: MenuItem[] = [
    { label: 'Produtos', icon: 'pi pi-box', routerLink: '/products' },
    { label: 'Notas Fiscais', icon: 'pi pi-file-invoice', routerLink: '/invoices' },
  ];
}
