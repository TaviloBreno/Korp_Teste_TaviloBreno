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
            _logger.LogInformation("Deducting {Quantity} from product {ProductId}", quantity, id);

            var product = await _repository.GetByIdAsync(id, cancellationToken)
                ?? throw new InvalidOperationException($"Product with id '{id}' not found.");

            product.DeductStock(quantity);
            _repository.Update(product);

            _logger.LogInformation("Stock updated for product {ProductId}. New balance: {Balance}",
                product.Id, product.StockBalance);

            return MapToDto(product);
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
