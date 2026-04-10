using BillingService.Domain.Entities;
using BillingService.Infrastructure.Data;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using BillingService.Domain.Repositories;

namespace BillingService.Infrastructure.Repositories
{
    public class InvoiceRepository : IInvoiceRepository
    {
        private readonly BillingDbContext _context;
        private readonly ILogger<InvoiceRepository> _logger;

        public InvoiceRepository(BillingDbContext context, ILogger<InvoiceRepository> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<Invoice?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
        {
            _logger.LogDebug("Fetching invoice by id: {InvoiceId}", id);
            return await _context.Invoices
                .Include(i => i.Items)
                .FirstOrDefaultAsync(i => i.Id == id, cancellationToken);
        }

        public async Task<IEnumerable<Invoice>> GetAllAsync(CancellationToken cancellationToken = default)
        {
            return await _context.Invoices
                .Include(i => i.Items)
                .OrderByDescending(i => i.CreatedAt)
                .ToListAsync(cancellationToken);
        }

        public async Task<int> GetNextSequentialNumberAsync(CancellationToken cancellationToken = default)
        {
            var maxNumber = await _context.Invoices
                .MaxAsync(i => (int?)i.SequentialNumber) ?? 0;

            return maxNumber + 1;
        }

        public async Task AddAsync(Invoice invoice, CancellationToken cancellationToken = default)
        {
            await _context.Invoices.AddAsync(invoice, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);
        }

        public void Update(Invoice invoice)
        {
            _context.Invoices.Update(invoice);
            _context.SaveChanges();
        }

        public async Task<Invoice?> GetBySequentialNumberAsync(int number, CancellationToken cancellationToken = default)
        {
            return await _context.Invoices
                .Include(i => i.Items)
                .FirstOrDefaultAsync(i => i.SequentialNumber == number, cancellationToken);
        }
    }
}
