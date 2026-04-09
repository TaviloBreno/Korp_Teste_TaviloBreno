using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BillingService.Application.Interfaces
{
    public interface IInventoryClient
    {
        Task<bool> DeductStockAsync(Guid productId, int quantity, CancellationToken cancellationToken = default);
        Task<ProductInfo?> GetProductAsync(Guid productId, CancellationToken cancellationToken = default);
    }

    public record ProductInfo(
        Guid Id,
        string Code,
        string Description,
        decimal StockBalance
    );
}
