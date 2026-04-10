import { Component, signal, WritableSignal } from '@angular/core';
import { MainLayoutComponent } from './presentation/layout/main-layout/main-layout.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [MainLayoutComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class AppComponent {
  readonly title: WritableSignal<string> = signal('Korp Teste - Tavilo');
}
