using InventoryService.Application.DTOs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace InventoryService.Application.Interfaces
{
    public interface IProductService
    {
        Task<ProductDto> CreateAsync(CreateProductDto dto, CancellationToken cancellationToken = default);
        Task<ProductDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
        Task<IEnumerable<ProductDto>> GetAllAsync(CancellationToken cancellationToken = default);
        Task<ProductDto> DeductStockAsync(Guid id, decimal quantity, CancellationToken cancellationToken = default);
    }
}
