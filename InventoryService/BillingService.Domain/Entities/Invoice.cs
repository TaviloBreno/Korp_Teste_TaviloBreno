using BillingService.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BillingService.Domain.Entities
{
    public class Invoice
    {
        public Guid Id { get; private set; }
        public int SequentialNumber { get; private set; }
        public InvoiceStatus Status { get; private set; }
        public DateTime CreatedAt { get; private set; }
        public DateTime? ClosedAt { get; private set; }
        public decimal TotalAmount { get; private set; }

        public ICollection<InvoiceItem> Items { get; private set; } = new List<InvoiceItem>();

        public Invoice()
        {
            Id = Guid.NewGuid();
            Status = InvoiceStatus.Open;
            CreatedAt = DateTime.UtcNow;
            TotalAmount = 0;
        }

        public Invoice(int sequentialNumber) : this()
        {
            if (sequentialNumber <= 0)
                throw new ArgumentException("Sequential number must be positive.", nameof(sequentialNumber));

            SequentialNumber = sequentialNumber;
        }

        public void AddItem(InvoiceItem item)
        {
            if (Status != InvoiceStatus.Open)
                throw new InvalidOperationException("Cannot add items to a closed invoice.");

            Items.Add(item);
            RecalculateTotal();
        }

        public void Close()
        {
            if (Status != InvoiceStatus.Open)
                throw new InvalidOperationException("Invoice is already closed.");

            if (!Items.Any())
                throw new InvalidOperationException("Cannot close an invoice without items.");

            Status = InvoiceStatus.Closed;
            ClosedAt = DateTime.UtcNow;
        }

        public void Reopen()
        {
            if (Status != InvoiceStatus.Closed)
                throw new InvalidOperationException("Invoice is already open.");

            Status = InvoiceStatus.Open;
            ClosedAt = null;
        }

        private void RecalculateTotal()
        {
            TotalAmount = Items.Sum(i => i.Quantity * i.UnitPrice);
        }
    }
}
