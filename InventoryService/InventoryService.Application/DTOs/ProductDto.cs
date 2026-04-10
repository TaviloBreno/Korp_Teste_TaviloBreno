using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace InventoryService.Application.DTOs
{
    public record ProductDto(
    Guid Id,
    string Code,
    string Description,
    decimal StockBalance,
    DateTime CreatedAt,
    DateTime? UpdatedAt
);

    public record CreateProductDto(
        string Code,
        string Description,
        decimal StockBalance
    );

    public record UpdateProductDto(
        string Code,
        string Description,
        decimal StockBalance
    );
}
