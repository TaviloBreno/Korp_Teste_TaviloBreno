using InventoryService.Application.DTOs;
using InventoryService.Application.Interfaces;
using InventoryService.Domain.Repositories;
using Microsoft.Extensions.Logging;

namespace InventoryService.Application.Services
{
    public class ProductService : IProductService
    {
        private readonly IProductRepository _repository;
        private readonly ILogger<ProductService> _logger;

        public ProductService(IProductRepository repository, ILogger<ProductService> logger)
        {
            _repository = repository;
            _logger = logger;
        }

        public async Task<ProductDto> CreateAsync(CreateProductDto dto, CancellationToken cancellationToken = default)
        {
            _logger.LogInformation("Creating product with code: {Code}", dto.Code);

            if (await _repository.ExistsByCodeAsync(dto.Code, cancellationToken))
                throw new InvalidOperationException($"Product with code '{dto.Code}' already exists.");

            var product = new Domain.Entities.Product(dto.Code, dto.Description, dto.StockBalance);
            await _repository.AddAsync(product, cancellationToken);

            _logger.LogInformation("Product created with id: {ProductId}", product.Id);
            return MapToDto(product);
        }

        public async Task<ProductDto> UpdateAsync(Guid id, UpdateProductDto dto, CancellationToken cancellationToken = default)
        {
            _logger.LogInformation("Updating product {ProductId}", id);

            var product = await _repository.GetByIdAsync(id, cancellationToken)
                ?? throw new InvalidOperationException($"Product with id '{id}' not found.");

            var productWithSameCode = await _repository.GetByCodeAsync(dto.Code, cancellationToken);
            if (productWithSameCode != null && productWithSameCode.Id != id)
            {
                throw new InvalidOperationException($"Product with code '{dto.Code}' already exists.");
            }

            product.Update(dto.Code, dto.Description, dto.StockBalance);
            await _repository.UpdateAsync(product, cancellationToken);

            return MapToDto(product);
        }

        public async Task<ProductDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
        {
            var product = await _repository.GetByIdAsync(id, cancellationToken);
            return product != null ? MapToDto(product) : null;
        }

        public async Task<IEnumerable<ProductDto>> GetAllAsync(CancellationToken cancellationToken = default)
        {
            var products = await _repository.GetAllAsync(cancellationToken);
            return products.Select(MapToDto);
        }

        public async Task<ProductDto> DeductStockAsync(Guid id, decimal quantity, CancellationToken cancellationToken = default)
        {
            _logger.LogInformation("Iniciando baixa de {Quantity} no produto {ProductId}", quantity, id);

            var product = await _repository.GetByIdAsync(id, cancellationToken)
                ?? throw new InvalidOperationException($"Produto com id '{id}' não encontrado.");

            try
            {
                product.DeductStock(quantity);

                await _repository.UpdateAsync(product, cancellationToken);

                _logger.LogInformation("Estoque atualizado com sucesso para o produto {ProductId}. Novo saldo: {Balance}",
                    product.Id, product.StockBalance);

                return MapToDto(product);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning("Validação de domínio falhou para o produto {ProductId}: {Message}", id, ex.Message);
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro inesperado ao processar baixa de estoque do produto {ProductId}", id);
                throw new InvalidOperationException("Não foi possível processar a baixa de estoque. Tente novamente.", ex);
            }
        }

        private static ProductDto MapToDto(Domain.Entities.Product product) => new(
            product.Id,
            product.Code  ?? string.Empty,
            product.Description ?? string.Empty,
            product.StockBalance,
            product.CreatedAt,
            product.UpdatedAt
        );
    }
}
