using BillingService.Application.DTOs;

namespace BillingService.Application.Interfaces
{
    public interface IInvoiceService
    {
        Task<InvoiceDto> CreateAsync(CreateInvoiceDto dto, CancellationToken cancellationToken = default);
        Task<InvoiceDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
        Task<IEnumerable<InvoiceDto>> GetAllAsync(CancellationToken cancellationToken = default);
        Task<InvoiceDto> PrintAsync(Guid id, CancellationToken cancellationToken = default);
    }
}
