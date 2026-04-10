using InventoryService.Domain.Entities;
using InventoryService.Domain.Repositories;
using InventoryService.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace InventoryService.Infrastructure.Repositories
{
    public class ProductRepository : IProductRepository
    {
        private readonly InventoryDbContext _context;
        private readonly ILogger<ProductRepository> _logger;

        public ProductRepository(InventoryDbContext context, ILogger<ProductRepository> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<Product?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
        {
            _logger.LogDebug("Fetching product by id: {ProductId}", id);
            return await _context.Products.FindAsync(new object[] { id }, cancellationToken);
        }

        public async Task<Product?> GetByCodeAsync(string code, CancellationToken cancellationToken = default)
        {
            return await _context.Products.FirstOrDefaultAsync(p => p.Code == code, cancellationToken);
        }

        public async Task<IEnumerable<Product>> GetAllAsync(CancellationToken cancellationToken = default)
        {
            return await _context.Products
                .Where(p => p.StockBalance >= 0)
                .OrderBy(p => p.Description)
                .ToListAsync(cancellationToken);
        }

        public async Task AddAsync(Product product, CancellationToken cancellationToken = default)
        {
            await _context.Products.AddAsync(product, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken); 
        }

        public async Task UpdateAsync(Product product, CancellationToken cancellationToken = default)
        {
            _context.Products.Update(product);
            await _context.SaveChangesAsync(cancellationToken);
        }

        public async Task DeleteAsync(Product product, CancellationToken cancellationToken = default)
        {
            _context.Products.Remove(product);
            await _context.SaveChangesAsync(cancellationToken);
        }

        public async Task<bool> ExistsByCodeAsync(string code, CancellationToken cancellationToken = default)
        {
            return await _context.Products.AnyAsync(p => p.Code == code, cancellationToken);
        }
    }
}