# Frontend - Korp (Angular 20)

Aplicacao frontend do projeto Korp para gerenciamento de produtos e emissao de notas fiscais. 💻

## Objetivo 🎯

Este frontend consome duas APIs:

- InventoryService (produtos e estoque)
- BillingService (notas fiscais)

Com isso, a interface permite:

- Cadastrar e consultar produtos
- Criar e listar notas fiscais
- Imprimir/fechar notas (com baixa de estoque no backend)

## Tecnologias 🧰

- Angular 20
- TypeScript 5.9
- RxJS 7.8
- PrimeNG 20
- Tailwind CSS 3.4

## Estrutura Principal 🗂️

```text
frontend/
├── src/
│   ├── app/
│   │   ├── core/
│   │   ├── data/
│   │   ├── domain/
│   │   ├── presentation/
│   │   └── shared/
│   └── environments/
├── angular.json
└── package.json
```

## Configuracao de Ambiente ⚙️

Arquivo de desenvolvimento:

- src/environments/environment.development.ts

Configuracao atual:

```typescript
export const environment = {
	production: false,
	inventoryApiUrl: 'http://localhost:5100/api',
	billingApiUrl: 'http://localhost:5286/api',
	retryAttempts: 3,
	retryDelayMs: 1000,
};
```

## Como Executar Localmente 🚀

Pre-requisitos:

- Node.js 20+
- npm

Passo a passo:

1. Entre na pasta do frontend:

```bash
cd frontend
```

2. Instale as dependencias:

```bash
npm install
```

3. Inicie o servidor de desenvolvimento:

```bash
npm start
```

4. Acesse no navegador:

- http://localhost:4200

Importante: antes de usar o frontend, suba as APIs e o banco Docker para que as chamadas HTTP funcionem corretamente.

## Scripts Uteis 📜

```bash
# Servidor local
npm start

# Build de producao
npm run build

# Lint
npm run lint

# Testes unitarios
npm test
```

## Integracao com Backend 🔗

Servicos esperados em desenvolvimento:

- InventoryService HTTP: http://localhost:5100/api
- BillingService HTTP: http://localhost:5286/api

Se as portas mudarem, ajuste no arquivo de environment para evitar erro de conexao.

## Dicas Rapidas 💡

- Se aparecer erro de CORS, confirme se o frontend esta em http://localhost:4200.
- Se aparecer erro de rede, confirme se as duas APIs estao rodando.
- Se nao aparecer dados, confira se o banco foi inicializado e seedado.
