# Korp - Teste Tecnico (Inventory + Billing)

Sistema de emissao de notas fiscais com arquitetura de microsservicos em .NET 8, dividido em dois dominios principais:

- InventoryService: cadastro de produtos e controle de estoque.
- BillingService: emissao e fechamento de notas fiscais com validacao de estoque no InventoryService.

## Visao Geral

Este repositorio contem uma solucao em C# com separacao por camadas (Api, Application, Domain e Infrastructure) para cada microsservico.

Fluxo principal de negocio:

1. Produto e cadastrado no InventoryService.
2. Nota fiscal e criada no BillingService com itens e precos.
3. Ao imprimir/fechar a nota, o BillingService chama o InventoryService para baixar o estoque de cada item.
4. Se alguma baixa falhar, o fechamento e interrompido com erro de validacao.

## Arquitetura

Estrutura da solucao (resumo):

- InventoryService.Api.sln
- InventoryService (API de estoque)
- InventoryService.Application
- InventoryService.Domain
- InventoryService.Infrastructure
- BillingService (API de faturamento)
- BillingService.Application
- BillingService.Domain
- BillingService.Infrastructure
- Shared.Models

Padroes e decisoes usadas:

- Separacao em camadas com responsabilidades claras.
- Entity Framework Core 8 com SQL Server.
- Injeccao de dependencia nativa do ASP.NET Core.
- Resiliencia em chamadas HTTP entre servicos com Polly:
	- Retry exponencial.
	- Circuit Breaker no BillingService para dependencia de estoque.
- Swagger/OpenAPI em ambiente Development.

## Tecnologias

- .NET SDK 8
- ASP.NET Core Web API
- Entity Framework Core 8
- SQL Server 2022 (via Docker)
- Polly
- Swagger (Swashbuckle)

## Endpoints Principais

### InventoryService

Base URL (Development):

- HTTPS: https://localhost:7126
- HTTP: http://localhost:5100

Rotas:

- POST /api/Products
	- Cria produto.
- GET /api/Products
	- Lista produtos.
- GET /api/Products/{id}
	- Busca produto por ID.
- PATCH /api/Products/{id}/deduct-stock
	- Baixa estoque do produto.
	- Body: numero decimal (ex.: 2 ou 2.5).

### BillingService

Base URL (Development):

- HTTPS: https://localhost:7128
- HTTP: http://localhost:5286

Rotas:

- POST /api/Invoices
	- Cria nota fiscal (status Open).
- GET /api/Invoices
	- Lista notas fiscais.
- GET /api/Invoices/{id}
	- Busca nota por ID.
- POST /api/Invoices/{id}/print
	- Imprime/fecha nota (status Closed) e tenta baixar estoque de todos os itens.

## Exemplo de Payloads

Criar produto:

```json
{
	"code": "SKU-001",
	"description": "Produto de teste",
	"stockBalance": 100
}
```

Criar nota fiscal:

```json
{
	"items": [
		{
			"productId": "00000000-0000-0000-0000-000000000000",
			"quantity": 2,
			"unitPrice": 49.9
		}
	]
}
```

## Como Executar Localmente

### 1. Pre-requisitos

- .NET SDK 8 instalado.
- Docker Desktop em execucao.
- (Opcional) Visual Studio 2022 ou VS Code.

### 2. Subir SQL Server via Docker

Na raiz do repositorio:

```bash
docker compose up -d
```

Container esperado:

- korp-sqlserver (porta 1433)

### 3. Restaurar dependencias

```bash
cd InventoryService
dotnet restore InventoryService.Api.sln
```

### 4. Aplicar migrations

Observacao: o projeto possui migrations para ambos os contextos.

```bash
cd InventoryService

dotnet ef database update --project InventoryService.Infrastructure --startup-project InventoryService --context InventoryDbContext

dotnet ef database update --project BillingService.Infrastructure --startup-project BillingService --context BillingDbContext
```

Se necessario, instale a ferramenta:

```bash
dotnet tool install --global dotnet-ef
```

### 5. Executar as APIs

Terminal 1:

```bash
cd InventoryService/InventoryService
dotnet run
```

Terminal 2:

```bash
cd InventoryService/BillingService
dotnet run
```

Swagger:

- Inventory: https://localhost:7126/swagger
- Billing: https://localhost:7128/swagger

## Configuracao

Arquivos relevantes:

- InventoryService/InventoryService/appsettings.json
- InventoryService/InventoryService/appsettings.Development.json
- InventoryService/BillingService/appsettings.json
- InventoryService/BillingService/appsettings.Development.json

Variaveis importantes:

- ConnectionStrings:DefaultConnection
- Services:InventoryService (usado pelo BillingService para comunicar com o InventoryService)

## Pontos de Atencao no Estado Atual

- O BillingService depende do InventoryService online para fechamento de nota.
- Em Development, revise as strings de conexao para garantir separacao de bancos por servico conforme sua estrategia de ambiente.
- O projeto ainda nao possui suite de testes automatizados (unitarios/integracao) versionada na solucao.

## Roadmap Sugerido

- Adicionar testes unitarios para regras de dominio (Product, Invoice).
- Adicionar testes de integracao para fluxo Create Invoice + Print.
- Padronizar versionamento de contratos e tratamento de erros entre servicos.
- Adicionar observabilidade (tracing, metricas e correlation id).

## Licenca

Consulte o arquivo LICENSE na raiz do repositorio.
