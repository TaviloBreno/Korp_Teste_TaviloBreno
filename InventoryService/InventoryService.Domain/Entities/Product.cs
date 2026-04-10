using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace InventoryService.Domain.Entities
{
    public class Product
    {
        public Guid Id { get; private set; }
        public string? Code { get; private set; }
        public string? Description { get; private set; }
        public decimal StockBalance { get; private set; }
        public DateTime CreatedAt { get; private set; }
        public DateTime? UpdatedAt { get; private set; }

        private Product() { }

        public Product(string code, string description, decimal stockBalance)
        {
            if (string.IsNullOrWhiteSpace(code))
                throw new ArgumentException("Product code is required.", nameof(code));
            if (string.IsNullOrWhiteSpace(description))
                throw new ArgumentException("Product description is required.", nameof(description));
            if (stockBalance < 0)
                throw new ArgumentException("Stock balance cannot be negative.", nameof(stockBalance));

            Id = Guid.NewGuid();
            Code = code;
            Description = description;
            StockBalance = stockBalance;
            CreatedAt = DateTime.UtcNow;
        }

        public void DeductStock(decimal quantity)
        {
            if (quantity <= 0)
                throw new ArgumentException("Quantity must be positive.", nameof(quantity));
            if (quantity > StockBalance)
                throw new InvalidOperationException($"Insufficient stock. Available: {StockBalance}, Requested: {quantity}");

            StockBalance -= quantity;
            UpdatedAt = DateTime.UtcNow;
        }

        public void Update(string description, decimal stockBalance)
        {
            Description = !string.IsNullOrWhiteSpace(description) ? description : Description;
            StockBalance = stockBalance >= 0 ? stockBalance : StockBalance;
            UpdatedAt = DateTime.UtcNow;
        }

        public void DeductStock(int quantity)
        {
            if (quantity <= 0)
                throw new ArgumentException("Quantity must be positive.", nameof(quantity));

            if (StockBalance < quantity)
                throw new InvalidOperationException($"Insufficient stock. Available: {StockBalance}, Requested: {quantity}");

            StockBalance -= quantity;
            UpdatedAt = DateTime.UtcNow;
        }
    }
}
