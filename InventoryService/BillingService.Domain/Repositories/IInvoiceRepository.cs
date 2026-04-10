using BillingService.Domain.Entities;

namespace BillingService.Domain.Repositories
{
    public interface IInvoiceRepository
    {
        Task<Invoice?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
        Task<IEnumerable<Invoice>> GetAllAsync(CancellationToken cancellationToken = default);
        Task<int> GetNextSequentialNumberAsync(CancellationToken cancellationToken = default);
        Task AddAsync(Invoice invoice, CancellationToken cancellationToken = default);
        void Update(Invoice invoice);
        Task<Invoice?> GetBySequentialNumberAsync(int number, CancellationToken cancellationToken = default);
    }
}
