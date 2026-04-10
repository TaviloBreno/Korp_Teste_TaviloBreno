using System;
using System.ComponentModel.DataAnnotations;

namespace Shared.Models
{
    public class Product
    {
       public int Id { get; set; }
       public string? Code { get; set; }
       public string? Description { get; set; }
       public decimal Price { get; set; }
       public int StockBalance { get; set; }

        [Timestamp]
        public byte[]? RowVersion { get; set; }

        public ICollection<InvoiceItem> InvoiceItems { get; set; } = new List<InvoiceItem>();
    }
}
