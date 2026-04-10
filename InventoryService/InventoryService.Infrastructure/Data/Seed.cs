using InventoryService.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace InventoryService.Infrastructure.Data
{
    public static class Seed
    {
        public static async Task SeedDataAsync(InventoryDbContext context)
        {
            await context.Database.MigrateAsync();

            if (await context.Products.AnyAsync())
                return;

            var products = new List<Product>
            {
                new Product("SKU-001", "Notebook Dell Inspiron 15", 50),
                new Product("SKU-002", "Mouse Logitech MX Master 3", 200),
                new Product("SKU-003", "Teclado Mecânico RGB", 75),
                new Product("SKU-004", "Monitor LG 27'' 144Hz", 30),
                new Product("SKU-005", "Webcam HD 1080p", 120),
                new Product("SKU-006", "Headset Gamer HyperX Cloud", 45),
                new Product("SKU-007", "SSD NVMe 1TB", 85),
                new Product("SKU-008", "Memória RAM 16GB DDR4", 60),
                new Product("SKU-009", "Mousepad Grande", 150),
                new Product("SKU-010", "Hub USB 3.0 7 Portas", 40),
            };

            await context.Products.AddRangeAsync(products);
            await context.SaveChangesAsync();
        }
    }
}
