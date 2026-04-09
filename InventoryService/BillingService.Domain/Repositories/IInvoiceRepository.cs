using BillingService.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

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
