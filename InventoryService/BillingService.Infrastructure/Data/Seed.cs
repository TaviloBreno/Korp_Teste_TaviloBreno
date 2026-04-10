using BillingService.Domain.Entities;
using BillingService.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace BillingService.Infrastructure.Data
{
    public static class Seed
    {
        public static async Task SeedDataAsync(BillingDbContext context)
        {
            await context.Database.MigrateAsync();

            if (await context.Invoices.AnyAsync())
                return;

            // IDs de exemplo para produtos (devem existir no InventoryService)
            var product1Id = Guid.Parse("00000000-0000-0000-0000-000000000001");
            var product2Id = Guid.Parse("00000000-0000-0000-0000-000000000002");
            var product3Id = Guid.Parse("00000000-0000-0000-0000-000000000003");

            var invoices = new List<Invoice>
            {
                CreateInvoiceWithItems(new[] 
                { 
                    (product1Id, 2, 1299.99m),
                    (product2Id, 1, 129.99m),
                }),
                CreateInvoiceWithItems(new[] 
                { 
                    (product3Id, 3, 249.99m),
                }),
            };

            await context.Invoices.AddRangeAsync(invoices);
            await context.SaveChangesAsync();
        }

        private static Invoice CreateInvoiceWithItems(
            (Guid ProductId, int Quantity, decimal UnitPrice)[] items)
        {
            var invoice = new Invoice();

            foreach (var (productId, quantity, unitPrice) in items)
            {
                var item = new InvoiceItem(productId, quantity, unitPrice);
                invoice.AddItem(item);
            }

            return invoice;
        }
    }
}
