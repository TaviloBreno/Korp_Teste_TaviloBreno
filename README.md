# Korp - Teste Tecnico (Inventory + Billing + Frontend)

Sistema completo de emissao de notas fiscais com arquitetura de microsservicos em .NET 8 no backend e Angular 20 no frontend, dividido em dois dominios principais:

- **InventoryService**: API REST para cadastro de produtos e controle de estoque (.NET 8)
- **BillingService**: API REST para emissao e fechamento de notas fiscais (.NET 8)
- **Frontend**: Interface Angular para gerenciar produtos e notas fiscais

## Visao Geral

Repositorio com solucao completa em C# (backend) com separacao em camadas (Api, Application, Domain, Infrastructure) e frontend Angular em componentes standalone com estado reativo.

Fluxo principal de negocio:

1. Usuario acessa interface Angular.
2. Cadastra ou consulta produtos no InventoryService.
3. Cria novas notas fiscais no BillingService (referenciando produtos).
4. Ao imprimir/fechar a nota, o BillingService comunica com InventoryService para baixar estoque.
5. Se alguma baixa falhar, o fechamento e interrompido com erro de validacao.

**Obs**: Seeds automaticos sao executados na inicializacao das APIs para popular dados de teste.

## Arquitetura

### Backend (.NET 8)

```
InventoryService.Api.sln
├── InventoryService (API)
│   ├── InventoryService.Api
│   ├── InventoryService.Application
│   ├── InventoryService.Domain
│   └── InventoryService.Infrastructure
├── BillingService (API)
│   ├── BillingService.Api
│   ├── BillingService.Application
│   ├── BillingService.Domain
│   └── BillingService.Infrastructure
└── Shared.Models
```

### Frontend (Angular 20)

```
frontend/
├── src/
│   ├── app/
│   │   ├── core/          // Servicos, interceptors
│   │   ├── data/          // DTOs, mappers, API clients
│   │   ├── domain/        // Modelos de negocio
│   │   ├── presentation/  // Componentes, paginas, layout
│   │   └── shared/        // Validators, base services
│   └── environments/      // Configuracoes por ambiente
├── angular.json
├── package.json
└── tailwind.config.js
```

## Padroes e Decisoes

### Backend
- Separacao em camadas com responsabilidades claras
- Entity Framework Core 8 com SqlServer 2022
- Injeccao de dependencia nativa do ASP.NET Core
- Polly para resiliencia: Retry exponencial + Circuit Breaker
- Seeds de dados na inicializacao das APIs
- Middleware de tratamento de excecoes de dominio
- Swagger/OpenAPI habilitado em Development

### Frontend
- Componentes standalone (sem modules)
- RxJS signals para reatividade
- HTTP interceptors para logging, loading, idempotency
- Repositorio pattern para isolamento de dados
- Validators customizados (stocks, async)
- PrimeNG para components de UI
- Tailwind CSS para estilos
- ESLint + Prettier para qualidade de codigo

## Tecnologias

### Backend
- .NET SDK 8
- ASP.NET Core 8 Web API
- Entity Framework Core 8
- SQL Server 2022 (Docker)
- Polly 8.x
- Swashbuckle (Swagger)
- FluentValidation

### Frontend
- Node.js 20+
- Angular 20
- TypeScript 5.9
- tailwindcss 3.4
- PrimeNG 20
- RxJS 7.8
- ESLint 9
- Prettier 3.8

## Endpoints Principais

### InventoryService

**Base**: `http://localhost:5100/api`

| Metodo | Rota | Descricao |
|--------|------|-----------|
| POST | `/Products` | Criar produto |
| GET | `/Products` | Listar produtos |
| GET | `/Products/{id}` | Buscar produto por ID |
| PATCH | `/Products/{id}/deduct-stock` | Baixar estoque (body: decimal) |

**Swagger**: https://localhost:7126/swagger

### BillingService

**Base**: `http://localhost:5286/api`

| Metodo | Rota | Descricao |
|--------|------|-----------|
| POST | `/Invoices` | Criar nota fiscal |
| GET | `/Invoices` | Listar notas fiscais |
| GET | `/Invoices/{id}` | Buscar nota por ID |
| POST | `/Invoices/{id}/print` | Imprimir e fechar nota |

**Swagger**: https://localhost:7128/swagger

## Exemplo de Payloads

### Criar Produto

```json
{
  "code": "SKU-001",
  "description": "Notebook Dell Inspiron 15",
  "stockBalance": 50
}
```

### Criar Nota Fiscal

```json
{
  "items": [
    {
      "productId": "550e8400-e29b-41d4-a716-446655440000",
      "quantity": 2,
      "unitPrice": 1299.99
    },
    {
      "productId": "550e8400-e29b-41d4-a716-446655440001",
      "quantity": 1,
      "unitPrice": 129.99
    }
  ]
}
```

## Como Executar Localmente

### Pre-requisitos

- **.NET SDK 8** instalado
- **Node.js 20+** instalado
- **Docker Desktop** em execucao
- **Git** instalado

### 1. Clonar o Repositorio

```bash
git clone <url-repositorio>
cd teste_tecnico
```

### 2. Subir SQL Server via Docker

```bash
docker-compose up -d
```

Aguardar container `korp-sqlserver` ficar healthy (porta 1433).

### 3. Restaurar Dependencias do Backend

```bash
cd InventoryService
dotnet restore InventoryService.Api.sln
```

### 4. Aplicar Migrations e Seeds

As migrations sao aplicadas automaticamente na inicializacao. Os seeds sao executados se o banco estiver vazio.

**Opcional - Aplicar manualmente:**

```bash
cd InventoryService

dotnet ef database update \
  --project InventoryService.Infrastructure \
  --startup-project InventoryService \
  --context InventoryDbContext

dotnet ef database update \
  --project BillingService.Infrastructure \
  --startup-project BillingService \
  --context BillingDbContext
```

### 5. Executar Backend (Terminal 1)

```bash
cd InventoryService/InventoryService
dotnet run
```

**Esperado**:
```
Now listening on: http://localhost:5100
Now listening on: https://localhost:7126
```

### 6. Executar BillingService (Terminal 2)

```bash
cd InventoryService/BillingService
dotnet run
```

**Esperado**:
```
Now listening on: http://localhost:5286
Now listening on: https://localhost:7128
```

### 7. Instalar Dependencias do Frontend (Terminal 3)

```bash
cd frontend
npm install
```

### 8. Executar Frontend

```bash
npm start
```

**Esperado**:
```
Application bundle generated successfully. (123.45 seconds)

Initial Chunk Files | Names | Size
main.js             | main | 456 kB
```

Abrir browser em: `http://localhost:4200`

## Arquivos de Configuracao

### Backend

- `InventoryService/InventoryService/appsettings.Development.json`
- `InventoryService/BillingService/appsettings.Development.json`

**Variaveis Importantes:**

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost,1433;Database=InventoryDB;..."
  },
  "Services": {
    "InventoryService": "https://localhost:7126"
  }
}
```

### Frontend

- `frontend/src/environments/environment.ts` (produccao)
- `frontend/src/environments/environment.development.ts` (desenvolvimento)

**Configuracao:**

```typescript
export const environment = {
  production: false,
  inventoryApiUrl: 'http://localhost:5100/api',
  billingApiUrl: 'http://localhost:5286/api',
  retryAttempts: 3,
  retryDelayMs: 1000,
};
```

## Seeds de Dados

Os seeds sao autoexecutaveis na inicializacao se o banco estiver vazio.

### InventoryService Seed

10 produtos de TI com estoque positivo:
- Notebooks, monitors, perifericos, etc.

### BillingService Seed

2 notas fiscais de exemplo com multiplos itens (status: aberto).

Para resetar: Delete e recrie o banco de dados.

## Tratamento de Erros

### Frontend

- **Interceptor de Erros**: Exibe toasts com mensagens amigaveis
- **Retry automatico**: Politica de exponential backoff (3 tentativas)
- **Timeout**: Requisicoes expiram apos 30 segundos

### Backend

- **Middleware de Excecao**: Captura erros de dominio e HTTP
- **Validacao de Dominio**: Regras de negocio com messages claras
- **Circuit Breaker**: Protege chamadas entre servicos

## Checklist do Detalhamento Tecnico (para o video)

### 1) Ciclos de vida do Angular utilizados

- `OnInit` nas paginas principais:
  - `ProductsPageComponent` carrega produtos no `ngOnInit`.
  - `InvoicesPageComponent` carrega notas/produtos no `ngOnInit`.
- Gerenciamento de teardown reativo com `takeUntilDestroyed(...)` no fluxo de sincronizacao de estoque na tela de notas.

### 2) Uso de RxJS e como foi aplicado

- `Subject` + `switchMap` nos state services para serializar acoes de create/update/print e evitar concorrencia duplicada de requisicoes.
- `catchError`, `finalize`, `tap` para feedback de erro/sucesso e controle de loading.
- `retryWhen` com backoff exponencial nos API services do frontend para falhas transientes (rede/5xx).
- `debounceTime` na selecao de produto ao montar itens da nota para atualizar validacao de estoque com menor ruido.

### 3) Outras bibliotecas utilizadas e finalidade

- `Entity Framework Core` para persistencia e migrations SQL Server.
- `FluentValidation` para validacoes no backend.
- `Polly` para resiliencia entre microsservicos (retry + circuit breaker).
- `Swashbuckle` para Swagger/OpenAPI.
- `jsPDF` + `jspdf-autotable` para geracao de PDF de nota fiscal no frontend.

### 4) Bibliotecas de componentes visuais

- `PrimeNG` para tabela, dialog, botoes, spinner, toast e inputs.
- `PrimeIcons` para iconografia.
- `Tailwind CSS` para layout/utilitarios de estilo.

### 5) Gerenciamento de dependencias no Golang

- Nao se aplica, pois esta solucao foi implementada em `C# (.NET 8)` e `Angular`.

### 6) Frameworks utilizados no Golang ou C\#

- `ASP.NET Core 8` para APIs REST.
- `Entity Framework Core 8` para acesso a dados.

### 7) Tratamento de erros e excecoes no backend

- Excecoes de regra de negocio com `InvalidOperationException` no dominio/aplicacao.
- Respostas HTTP com mensagens amigaveis nos controllers.
- `DomainExceptionMiddleware` registrado no pipeline do Billing para padronizacao de falhas nao tratadas.
- `UseExceptionHandler("/error")` para fallback de erro 500 em producao.

### 8) Uso de LINQ e de que forma

- Projecoes com `Select(...)` para mapear entidades em DTOs.
- Consultas com `Where(...)`, `FirstOrDefaultAsync(...)`, `MaxAsync(...)`, `OrderByDescending(...)` nos repositorios.
- Agregacao com `Sum(...)` para total da nota.

### 9) Requisito opcional - Idempotencia

- Implementado no frontend com `idempotencyInterceptor`:
  - Gera e envia header `Idempotency-Key` para `POST/PUT/PATCH`.
  - Bloqueia requisicoes mutantes duplicadas em voo para evitar efeitos colaterais.

## Comandos Uteis

### Build Frontend para Producao

```bash
cd frontend
npm run build
```

Output em `frontend/dist/`

### Lint e Format

```bash
cd frontend

# ESLint
npm run lint

# Prettier (format)
npx prettier --write src/
```

### Testes Frontend

```bash
cd frontend
npm test
```

## Roadmap Funcional

- [ ] Testes automatizados (unit + integration)
- [ ] Autenticacao OAuth2 com Entra ID
- [ ] Paginacao e filtros avancados
- [ ] Relatorios de estoque e faturamento
- [ ] Observabilidade (App Insights, Seq)
- [ ] CI/CD com GitHub Actions
- [ ] Deploy em Azure (App Service + SQL Database)

## Troubleshooting

### "Connection refused" ao conectar no SQL Server

**Solucao**: Verificar se container Docker esta em execucao

```bash
docker ps | grep sqlserver
```

### "Cannot GET /" no frontend

**Solucao**: Verificar se o servidor Angular esta rodando em localhost:4200

```bash
npm start
```

### Erros de CORS

**Solucao**: Verificar `appsettings.json` - CORS esta configurado para `http://localhost:4200`

```csharp
policy.WithOrigins("http://localhost:4200")
```

## Contribuicao

1. Criar branch: `git checkout -b feature/sua-feature`
2. Commit com mensagem clara: `git commit -m "feat: descricao"`
3. Push: `git push origin feature/sua-feature`
4. Abrir PR para `main`

## Licenca

Consulte o arquivo [LICENSE](LICENSE) na raiz do repositorio.
