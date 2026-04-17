# Korp - Teste Tecnico (Inventory + Billing + Frontend)

Sistema completo de emissao de notas fiscais com arquitetura de microsservicos em .NET 8 no backend e Angular 20 no frontend, dividido em dois dominios principais:

- InventoryService: API REST para cadastro de produtos e controle de estoque (.NET 8)
- BillingService: API REST para emissao e fechamento de notas fiscais (.NET 8)
- Frontend: Interface Angular para gerenciar produtos e notas fiscais

## Visao Geral

Repositorio com solucao completa em C# (backend) com separacao em camadas (Api, Application, Domain, Infrastructure) e frontend Angular em componentes standalone com estado reativo.

Fluxo principal de negocio:

1. Usuario acessa interface Angular.
2. Cadastra ou consulta produtos no InventoryService.
3. Cria novas notas fiscais no BillingService (referenciando produtos).
4. Ao imprimir/fechar a nota, o BillingService comunica com InventoryService para baixar estoque.
5. Se alguma baixa falhar, o fechamento e interrompido com erro de validacao.

Os seeds sao executados automaticamente na inicializacao das APIs quando os bancos estao vazios.

## Arquitetura

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

## Tecnologias

- .NET 8 (ASP.NET Core Web API)
- Entity Framework Core 8
- Angular 20
- TypeScript 5.9
- SQL Server 2022 (Docker)
- Swagger / OpenAPI (Swashbuckle)
- Polly (resiliencia entre microsservicos)
- PrimeNG e Tailwind CSS
- Node.js 20+

## Endpoints Principais

### InventoryService

Base URL:

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

Base URL:

- HTTP: http://localhost:5286/api
- HTTPS: https://localhost:7128/api
- Swagger: https://localhost:7128/swagger

| Metodo | Endpoint | Descricao |
|---|---|---|
| POST | /Invoices | Criar nota fiscal |
| GET | /Invoices | Listar notas fiscais |
| GET | /Invoices/{id} | Buscar nota por ID |
| POST | /Invoices/{id}/print | Imprimir e fechar nota |

## Como Executar Localmente

Pre-requisitos:

- Docker Desktop em execucao
- .NET SDK 8
- Node.js 20+

1. No diretorio raiz do projeto, suba o SQL Server:

```bash
docker-compose up -d
```

2. Restaure as dependencias do backend:

```bash
cd InventoryService
dotnet restore InventoryService.Api.sln
```

3. Execute o InventoryService (Terminal 1):

```bash
cd InventoryService
dotnet run
```

4. Execute o BillingService (Terminal 2):

```bash
cd BillingService
dotnet run
```

5. Execute o frontend Angular (Terminal 3):

```bash
cd frontend
npm install
npm start
```

6. Acesse as aplicacoes:

- Frontend: http://localhost:4200
- Inventory Swagger: https://localhost:7126/swagger
- Billing Swagger: https://localhost:7128/swagger

Banco SQL Server (Docker):

- Host: localhost
- Porta: 1433
- Usuario: sa
- Senha: Korp@2026!

## Dados de Teste

### Produtos seed (InventoryService)

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

### Notas seed (BillingService)

| Nota | Itens | Status inicial | Total |
|---|---|---|---:|
| Nota 1 | SKU-001 (2 x 1299.99), SKU-002 (1 x 129.99) | Open | 2729.97 |
| Nota 2 | SKU-003 (3 x 249.99) | Open | 749.97 |

## Configuracoes

Arquivos principais:

- InventoryService/InventoryService/appsettings.Development.json
- InventoryService/BillingService/appsettings.Development.json
- frontend/src/environments/environment.development.ts
- frontend/src/environments/environment.ts

Exemplo real de configuracao de desenvolvimento:

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

```typescript
export const environment = {
  production: false,
  inventoryApiUrl: 'http://localhost:5100/api',
  billingApiUrl: 'http://localhost:5286/api',
  retryAttempts: 3,
  retryDelayMs: 1000,
};
```

## Licenca

Este projeto esta licenciado sob a MIT License. Consulte o arquivo LICENSE para mais detalhes.
