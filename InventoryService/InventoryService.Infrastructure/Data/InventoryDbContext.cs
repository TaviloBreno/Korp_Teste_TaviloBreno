using InventoryService.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace InventoryService.Infrastructure.Data
{
    public class InventoryDbContext : DbContext
    {
        public InventoryDbContext(DbContextOptions<InventoryDbContext> options) : base(options) { }

        public DbSet<Product> Products => Set<Product>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Product>(entity =>
            {
                entity.HasKey(p => p.Id);
                entity.Property(p => p.Code).IsRequired().HasMaxLength(50);
                entity.Property(p => p.Description).IsRequired().HasMaxLength(200);
                entity.Property(p => p.StockBalance).HasColumnType("decimal(18,2)").IsRequired();
                entity.Property(p => p.CreatedAt).IsRequired();

                entity.HasIndex(p => p.Code).IsUnique();
            });
        }
    }
}
