# Korp - Teste Tecnico (Inventory + Billing + Frontend)

Sistema completo de emissao de notas fiscais com arquitetura de microsservicos em .NET 8 no backend e Angular 20 no frontend, dividido em dois dominios principais.

## Visao Geral 📌

Este repositorio contem uma aplicacao full stack com:

- InventoryService: API para produtos e estoque
- BillingService: API para emissao e fechamento de notas fiscais
- Frontend Angular: interface para operacao do fluxo completo

Fluxo de negocio principal:

1. Usuario acessa o frontend em http://localhost:4200.
2. Consulta ou cadastra produtos no InventoryService.
3. Cria uma nota fiscal no BillingService com itens de produto.
4. Ao imprimir/fechar a nota, o BillingService chama o InventoryService para baixar estoque.
5. Se alguma validacao falhar, a operacao retorna erro e o fechamento nao e concluido.

Observacao: os bancos sao populados automaticamente com dados seed na inicializacao quando estao vazios.

## Arquitetura 🏗️

```text
Korp_Teste_TaviloBreno/
├── docker-compose.yml
├── README.md
├── frontend/
│   ├── angular.json
│   ├── package.json
│   └── src/
│       ├── app/
│       │   ├── core/
│       │   ├── data/
│       │   ├── domain/
│       │   ├── presentation/
│       │   └── shared/
│       └── environments/
└── InventoryService/
    ├── InventoryService.Api.sln
    ├── InventoryService/
    │   ├── Controllers/
    │   ├── Program.cs
    │   └── appsettings.Development.json
    ├── InventoryService.Application/
    ├── InventoryService.Domain/
    ├── InventoryService.Infrastructure/
    │   ├── Data/
    │   └── Migrations/
    ├── BillingService/
    │   ├── Controllers/
    │   ├── Program.cs
    │   └── appsettings.Development.json
    ├── BillingService.Application/
    ├── BillingService.Domain/
    ├── BillingService.Infrastructure/
    │   ├── Data/
    │   └── Migrations/
    └── Shared.Models/
```

## Tecnologias 🧰

- Backend: .NET 8, ASP.NET Core Web API, EF Core 8, Polly, Swagger
- Frontend: Angular 20, TypeScript 5.9, PrimeNG, Tailwind CSS
- Banco: SQL Server 2022 em Docker
- Ferramentas: Node.js 20+, npm

## Endpoints Principais 🔌

### InventoryService

Base URLs:

- HTTP: http://localhost:5100/api
- HTTPS: https://localhost:7126/api
- Swagger: https://localhost:7126/swagger

| Metodo | Endpoint | Descricao |
|---|---|---|
| POST | /Products | Criar produto |
| GET | /Products | Listar produtos |
| GET | /Products/{id} | Buscar produto por ID |
| PATCH | /Products/{id}/deduct-stock | Baixar estoque |

### BillingService

Base URLs:

- HTTP: http://localhost:5286/api
- HTTPS: https://localhost:7128/api
- Swagger: https://localhost:7128/swagger

| Metodo | Endpoint | Descricao |
|---|---|---|
| POST | /Invoices | Criar nota fiscal |
| GET | /Invoices | Listar notas fiscais |
| GET | /Invoices/{id} | Buscar nota por ID |
| POST | /Invoices/{id}/print | Imprimir e fechar nota |

## Como Executar Localmente 🚀

Pre-requisitos:

- Docker Desktop ativo
- .NET SDK 8 instalado
- Node.js 20+ instalado

### 1) Subir banco SQL Server

Na raiz do projeto:

```bash
docker-compose up -d
```

Banco configurado:

- Host: localhost
- Porta: 1433
- Usuario: sa
- Senha: Korp@2026!

### 2) Restaurar dependencias do backend

```bash
cd InventoryService
dotnet restore InventoryService.Api.sln
```

### 3) Iniciar InventoryService (Terminal 1)

```bash
cd InventoryService
dotnet run
```

Esperado:

- http://localhost:5100
- https://localhost:7126

### 4) Iniciar BillingService (Terminal 2)

```bash
cd BillingService
dotnet run
```

Esperado:

- http://localhost:5286
- https://localhost:7128

### 5) Iniciar frontend Angular (Terminal 3)

```bash
cd frontend
npm install
npm start
```

Esperado:

- Frontend em http://localhost:4200

### 6) Validar ambiente

- Swagger Inventory: https://localhost:7126/swagger
- Swagger Billing: https://localhost:7128/swagger

## Dados de Teste 🧪

### Produtos seed (10 itens)

| Codigo | Descricao | Estoque | Preco |
|---|---|---:|---:|
| SKU-001 | Notebook Dell Inspiron 15 | 50 | 3499.99 |
| SKU-002 | Mouse Logitech MX Master 3 | 200 | 349.90 |
| SKU-003 | Teclado Mecanico RGB | 75 | 449.90 |
| SKU-004 | Monitor LG 27'' 144Hz | 30 | 1299.90 |
| SKU-005 | Webcam HD 1080p | 120 | 249.90 |
| SKU-006 | Headset Gamer HyperX Cloud | 45 | 599.90 |
| SKU-007 | SSD NVMe 1TB | 85 | 399.90 |
| SKU-008 | Memoria RAM 16GB DDR4 | 60 | 289.90 |
| SKU-009 | Mousepad Grande | 150 | 79.90 |
| SKU-010 | Hub USB 3.0 7 Portas | 40 | 129.90 |

### Notas seed (2 itens)

| Nota | Itens | Status | Total |
|---|---|---|---:|
| Nota 1 | SKU-001 (2 x 1299.99), SKU-002 (1 x 129.99) | Open | 2729.97 |
| Nota 2 | SKU-003 (3 x 249.99) | Open | 749.97 |

## Configuracoes ⚙️

Arquivos principais:

- InventoryService/InventoryService/appsettings.Development.json
- InventoryService/BillingService/appsettings.Development.json
- frontend/src/environments/environment.development.ts
- frontend/src/environments/environment.ts

### Backend (InventoryService)

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost,1433;Database=InventoryDB;User Id=sa;Password=Korp@2026!;TrustServerCertificate=True;MultipleActiveResultSets=true"
  },
  "Services": {
    "BillingService": "https://localhost:7128"
  }
}
```

### Backend (BillingService)

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost,1433;Database=BillingDB;User Id=sa;Password=Korp@2026!;TrustServerCertificate=True;MultipleActiveResultSets=true"
  },
  "Services": {
    "InventoryService": "https://localhost:7126"
  }
}
```

### Frontend (development)

```typescript
export const environment = {
  production: false,
  inventoryApiUrl: 'http://localhost:5100/api',
  billingApiUrl: 'http://localhost:5286/api',
  retryAttempts: 3,
  retryDelayMs: 1000,
};
```

## Dicas de Uso 💡

- Para emitir nota com sucesso, garanta que os produtos ja existem no InventoryService.
- O endpoint de impressao/fechamento de nota e POST /Invoices/{id}/print.
- Ao fechar nota, o BillingService baixa estoque no InventoryService automaticamente.

## Licenca 📄

Este projeto esta licenciado sob a MIT License. Consulte o arquivo LICENSE para mais detalhes.
