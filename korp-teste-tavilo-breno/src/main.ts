import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app';
import { environment } from './environments/environment';

async function setupApp() {
  // Ativa mock apenas em desenvolvimento
  if (!environment.production) {
    const { worker } = await import('./mocks/browser');
    await worker.start({ onUnhandledRequest: 'bypass' });
  }

  bootstrapApplication(AppComponent, appConfig).catch((err) =>
    console.error('Erro ao inicializar aplicação:', err),
  );
}

setupApp();
