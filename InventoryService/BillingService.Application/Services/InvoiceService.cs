using BillingService.Application.DTOs;
using BillingService.Application.Interfaces;
using BillingService.Domain.Entities;
using BillingService.Domain.Enums;
using BillingService.Domain.Repositories;
using Microsoft.Extensions.Logging;

namespace BillingService.Application.Services
{
    public class InvoiceService : IInvoiceService
    {
        private readonly IInvoiceRepository _repository;
        private readonly IInventoryClient _inventoryClient;
        private readonly ILogger<InvoiceService> _logger;

        public InvoiceService(
            IInvoiceRepository repository,
            IInventoryClient inventoryClient,
            ILogger<InvoiceService> logger)
        {
            _repository = repository;
            _inventoryClient = inventoryClient;
            _logger = logger;
        }

        public async Task<InvoiceDto> CreateAsync(CreateInvoiceDto dto, CancellationToken cancellationToken = default)
        {
            _logger.LogInformation("Creating new invoice with {ItemCount} items", dto.Items.Count());

            var invoice = new Invoice();

            foreach (var itemDto in dto.Items)
            {
                var product = await _inventoryClient.GetProductAsync(itemDto.ProductId, cancellationToken);
                if (product == null)
                    throw new InvalidOperationException($"Product with ID '{itemDto.ProductId}' not found.");

                if (product.StockBalance < itemDto.Quantity)
                    throw new InvalidOperationException($"Insufficient stock for product '{product.Code}'. Available: {product.StockBalance}, Requested: {itemDto.Quantity}");

                var item = new InvoiceItem(itemDto.ProductId, itemDto.Quantity, itemDto.UnitPrice);
                invoice.AddItem(item);
            }

            await _repository.AddAsync(invoice, cancellationToken);

            _logger.LogInformation("Invoice created with number {SequentialNumber} and ID {InvoiceId}",
                invoice.SequentialNumber, invoice.Id);

            return MapToDto(invoice);
        }

        public async Task<InvoiceDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
        {
            var invoice = await _repository.GetByIdAsync(id, cancellationToken);
            return invoice != null ? MapToDto(invoice) : null;
        }

        public async Task<IEnumerable<InvoiceDto>> GetAllAsync(CancellationToken cancellationToken = default)
        {
            var invoices = await _repository.GetAllAsync(cancellationToken);
            return invoices.Select(MapToDto);
        }

        public async Task<InvoiceDto> PrintAsync(Guid id, CancellationToken cancellationToken = default)
        {
            _logger.LogInformation("Printing invoice {InvoiceId}", id);

            var invoice = await _repository.GetByIdAsync(id, cancellationToken)
                ?? throw new InvalidOperationException($"Invoice with ID '{id}' not found.");

            if (invoice.Status != InvoiceStatus.Open)
                throw new InvalidOperationException(
                    $"Invoice {invoice.SequentialNumber} is already closed. Only open invoices can be printed.");

            if (!invoice.Items.Any())
                throw new InvalidOperationException(
                    $"Cannot close invoice {invoice.SequentialNumber} without items.");

            foreach (var item in invoice.Items)
            {
                _logger.LogInformation("Deducting {Quantity} from product {ProductId}",
                    item.Quantity, item.ProductId);

                try
                {
                    var success = await _inventoryClient.DeductStockAsync(
                        item.ProductId,
                        item.Quantity,
                        cancellationToken);

                    if (!success)
                    {
                        _logger.LogError("Failed to deduct stock for product {ProductId}. Rolling back...",
                            item.ProductId);

                        throw new InvalidOperationException(
                            $"Failed to deduct stock for product {item.ProductId}. " +
                            "The InventoryService may be unavailable or product has insufficient stock.");
                    }

                    _logger.LogInformation("Successfully deducted stock for product {ProductId}", item.ProductId);
                }
                catch (HttpRequestException ex)
                {
                    _logger.LogError(ex, "InventoryService unavailable while deducting stock for product {ProductId}",
                        item.ProductId);

                    throw new InvalidOperationException(
                        "InventoryService is currently unavailable. Please try again later. " +
                        "The invoice was NOT closed.", ex);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Unexpected error deducting stock for product {ProductId}",
                        item.ProductId);

                    throw new InvalidOperationException(
                        $"Error processing stock deduction for product {item.ProductId}", ex);
                }
            }

            invoice.Close();
            _repository.Update(invoice);

            _logger.LogInformation("Invoice {SequentialNumber} printed and closed successfully",
                invoice.SequentialNumber);

            return MapToDto(invoice);
        }

        public async Task<InvoiceDto> UpdateStatusAsync(Guid id, InvoiceStatus status, CancellationToken cancellationToken = default)
        {
            _logger.LogInformation("Updating status of invoice {InvoiceId} to {Status}", id, status);

            var invoice = await _repository.GetByIdAsync(id, cancellationToken)
                ?? throw new InvalidOperationException($"Invoice with ID '{id}' not found.");

            if (status == InvoiceStatus.Closed && invoice.Status == InvoiceStatus.Open)
            {
                throw new InvalidOperationException(
                    "Nao e permitido fechar nota manualmente. Use a emissao/impressao para fechar e baixar o estoque.");
            }

            if (status == InvoiceStatus.Open && invoice.Status == InvoiceStatus.Closed)
            {
                invoice.Reopen();
            }

            _repository.Update(invoice);

            _logger.LogInformation("Invoice {SequentialNumber} status updated to {Status}",
                invoice.SequentialNumber, invoice.Status);

            return MapToDto(invoice);
        }

        private static InvoiceDto MapToDto(Invoice invoice) => new(
            invoice.Id,
            invoice.SequentialNumber,
            invoice.Status,
            invoice.CreatedAt,
            invoice.ClosedAt,
            invoice.TotalAmount,
            invoice.Items.Select(i => new InvoiceItemDto(i.Id, i.ProductId, i.Quantity, i.UnitPrice))
        );
    }
}