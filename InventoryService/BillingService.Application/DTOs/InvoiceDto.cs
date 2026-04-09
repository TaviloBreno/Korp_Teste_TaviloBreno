using BillingService.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BillingService.Application.DTOs
{
    public record InvoiceDto(
    Guid Id,
    int SequentialNumber,
    InvoiceStatus Status,
    DateTime CreatedAt,
    DateTime? ClosedAt,
    decimal TotalAmount,
    IEnumerable<InvoiceItemDto> Items
);

    public record CreateInvoiceDto(
        IEnumerable<CreateInvoiceItemDto> Items
    );

    public record CreateInvoiceItemDto(
        Guid ProductId,
        int Quantity,
        decimal UnitPrice
    );

    public record InvoiceItemDto(
        Guid Id,
        Guid ProductId,
        int Quantity,
        decimal UnitPrice
    );
}
