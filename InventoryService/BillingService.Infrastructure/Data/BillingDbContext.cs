using BillingService.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace BillingService.Infrastructure.Data
{
    public class BillingDbContext : DbContext
    {
        public BillingDbContext(DbContextOptions<BillingDbContext> options) : base(options) { }

        public DbSet<Invoice> Invoices => Set<Invoice>();
        public DbSet<InvoiceItem> InvoiceItems => Set<InvoiceItem>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Invoice>(entity =>
            {
                entity.HasKey(i => i.Id);

                entity.Property(i => i.SequentialNumber)
                    .ValueGeneratedOnAdd()
                    .UseIdentityColumn(1, 1);

                entity.Property(i => i.Status)
                    .IsRequired();
                entity.Property(i => i.TotalAmount)
                    .HasColumnType("decimal(18,2)");
                
                entity.HasIndex(i => i.SequentialNumber)
                    .IsUnique();
                entity.HasMany(i => i.Items)
                    .WithOne()
                    .HasForeignKey(i => i.InvoiceId);
            });

            modelBuilder.Entity<InvoiceItem>(entity =>
            {
                entity.HasKey(i => i.Id);
                entity.Property(i => i.Quantity).IsRequired();
                entity.Property(i => i.UnitPrice).HasColumnType("decimal(18,2)").IsRequired();
            });
        }
    }
}
