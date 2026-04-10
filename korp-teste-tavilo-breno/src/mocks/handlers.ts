import { http, HttpResponse } from 'msw';
import { environment } from '../environments/environment.development';

let products = [
  { id: '1', codigo: 'PROD001', descricao: 'Teclado Mecânico', saldo: 15 },
  { id: '2', codigo: 'PROD002', descricao: 'Mouse Ergonômico', saldo: 8 },
];

let invoices: any[] = [];
let nextInvoiceNumber = 1000;

export const handlers = [
  // Inventory Service
  http.get(`${environment.inventoryApiUrl}/products`, () => {
    if (environment.mockDownService === 'inventory') {
      return new HttpResponse(null, { status: 503, statusText: 'Service Unavailable' });
    }
    return HttpResponse.json(products);
  }),

  http.post(`${environment.inventoryApiUrl}/products`, async ({ request }) => {
    if (environment.mockDownService === 'inventory') {
      return new HttpResponse(null, { status: 503 });
    }
    const body: any = await request.json();
    const newProduct = { ...body, id: crypto.randomUUID() };
    products.push(newProduct);
    return HttpResponse.json(newProduct, { status: 201 });
  }),

  // Billing Service
  http.get(`${environment.billingApiUrl}/invoices`, () => {
    if (environment.mockDownService === 'billing') {
      return new HttpResponse(null, { status: 503 });
    }
    return HttpResponse.json(invoices);
  }),

  http.post(`${environment.billingApiUrl}/invoices`, async ({ request }) => {
    if (environment.mockDownService === 'billing') {
      return new HttpResponse(null, { status: 503 });
    }
    const body: any = await request.json();
    const newInvoice = {
      id: crypto.randomUUID(),
      numeracao_sequencial: nextInvoiceNumber++,
      status: 'ABERTA',
      itens: body.itens,
      criado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString(),
    };
    invoices.push(newInvoice);
    return HttpResponse.json(newInvoice, { status: 201 });
  }),

  http.post(`${environment.billingApiUrl}/invoices/:id/print`, ({ params }) => {
    const invoice = invoices.find((i) => i['id'] === params['id']);
    if (!invoice) return new HttpResponse(null, { status: 404 });
    if (invoice.status === 'FECHADA') {
      // Correção TS2353: usar json() para body + status
      return HttpResponse.json({ message: 'Nota já fechada' }, { status: 400 });
    }

    invoice.status = 'FECHADA';
    invoice.atualizado_em = new Date().toISOString();

    invoice.itens.forEach((item: any) => {
      const prod = products.find((p) => p['id'] === item['produto_id']);
      if (prod) prod.saldo -= item.quantidade;
    });

    return HttpResponse.json(invoice);
  }),
];
