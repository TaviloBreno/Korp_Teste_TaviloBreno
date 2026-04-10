using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using BillingService.Application.Interfaces;

namespace BillingService.Infrastructure.Services;

public class InventoryClient : IInventoryClient
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<InventoryClient> _logger;

    public InventoryClient(HttpClient httpClient, ILogger<InventoryClient> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task<bool> DeductStockAsync(Guid productId, int quantity, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Calling InventoryService to deduct {Quantity} from product {ProductId}",
                quantity, productId);

            var response = await _httpClient.PatchAsJsonAsync(
                $"/api/Products/{productId}/deduct-stock",
                quantity,
                cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync(cancellationToken);

                _logger.LogWarning(
                    "Failed to deduct stock for product {ProductId}. " +
                    "Status: {StatusCode}. Error: {Error}",
                    productId, response.StatusCode, errorContent);

                return false;
            }

            _logger.LogInformation("Successfully deducted stock for product {ProductId}", productId);
            return true;
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "HttpRequestException while deducting stock for product {ProductId}", productId);
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error deducting stock for product {ProductId}", productId);
            return false;
        }
    }

    public async Task<ProductInfo?> GetProductAsync(Guid productId, CancellationToken cancellationToken = default)
    {
        try
        {
            var response = await _httpClient.GetAsync($"/api/Products/{productId}", cancellationToken);

            if (!response.IsSuccessStatusCode)
                return null;

            var content = await response.Content.ReadAsStringAsync(cancellationToken);
            return JsonSerializer.Deserialize<ProductInfo>(content, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching product {ProductId}", productId);
            return null;
        }
    }
}