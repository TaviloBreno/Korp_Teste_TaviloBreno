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

            var product1Id = Guid.Parse("00000000-0000-0000-0000-000000000001");
            var product2Id = Guid.Parse("00000000-0000-0000-0000-000000000002");
            var product3Id = Guid.Parse("00000000-0000-0000-0000-000000000003");
            var product4Id = Guid.Parse("00000000-0000-0000-0000-000000000004");
            var product5Id = Guid.Parse("00000000-0000-0000-0000-000000000005");
            var product6Id = Guid.Parse("00000000-0000-0000-0000-000000000006");
            var product7Id = Guid.Parse("00000000-0000-0000-0000-000000000007");
            var product8Id = Guid.Parse("00000000-0000-0000-0000-000000000008");
            var product9Id = Guid.Parse("00000000-0000-0000-0000-000000000009");
            var product10Id = Guid.Parse("00000000-0000-0000-0000-000000000010");

            var products = new List<Product>
            {
                new Product(product1Id, "SKU-001", "Notebook Dell Inspiron 15", 3499.99m, 50),
                new Product(product2Id, "SKU-002", "Mouse Logitech MX Master 3", 349.90m, 200),
                new Product(product3Id, "SKU-003", "Teclado Mecânico RGB", 449.90m, 75),
                new Product(product4Id, "SKU-004", "Monitor LG 27'' 144Hz", 1299.90m, 30),
                new Product(product5Id, "SKU-005", "Webcam HD 1080p", 249.90m, 120),
                new Product(product6Id, "SKU-006", "Headset Gamer HyperX Cloud", 599.90m, 45),
                new Product(product7Id, "SKU-007", "SSD NVMe 1TB", 399.90m, 85),
                new Product(product8Id, "SKU-008", "Memória RAM 16GB DDR4", 289.90m, 60),
                new Product(product9Id, "SKU-009", "Mousepad Grande", 79.90m, 150),
                new Product(product10Id, "SKU-010", "Hub USB 3.0 7 Portas", 129.90m, 40),
            };

            await context.Products.AddRangeAsync(products);
            await context.SaveChangesAsync();
        }
    }
}
