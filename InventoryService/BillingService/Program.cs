using BillingService.Application.Interfaces;
using BillingService.Application.Services;
using BillingService.Domain.Repositories;
using BillingService.Infrastructure.Data;
using BillingService.Infrastructure.Repositories;
using BillingService.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.OpenApi.Models;
using Polly;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

builder.Services.AddDbContext<BillingDbContext>(options =>
    options.UseSqlServer(connectionString, sql => sql.EnableRetryOnFailure()));

builder.Services.AddScoped<IInvoiceRepository, InvoiceRepository>();
builder.Services.AddScoped<IInvoiceService, InvoiceService>();

var inventoryServiceUrl = builder.Configuration["Services:InventoryService"]
    ?? "https://localhost:7126";

builder.Services.AddHttpClient<IInventoryClient, InventoryClient>(client =>
{
    client.BaseAddress = new Uri(inventoryServiceUrl);
    client.DefaultRequestHeaders.Add("Accept", "application/json");
})
.AddPolicyHandler((services, request) =>
{
    return Policy
        .Handle<HttpRequestException>()
        .OrResult<HttpResponseMessage>(r => !r.IsSuccessStatusCode)
        .WaitAndRetryAsync(3, retryAttempt =>
            TimeSpan.FromSeconds(Math.Pow(2, retryAttempt)),
        (outcome, timespan, retryCount, context) =>
        {
            var logger = services.GetRequiredService<ILogger<Program>>();
            logger.LogWarning("Retry {RetryCount} after {Timespan}s due to {StatusCode}",
                retryCount, timespan.TotalSeconds, outcome.Result?.StatusCode);
        });
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Billing Service API",
        Version = "v1",
        Description = "Invoice Management Microsservice - Korp Technical Test",
        Contact = new OpenApiContact
        {
            Name = "Tavilo Breno",
            Email = "tavilo@example.com"
        }
    });
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular", policy =>
    {
        policy.WithOrigins("http://localhost:4200")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Billing Service API v1");
    });
}

app.UseHttpsRedirection();
app.UseCors("AllowAngular");
app.UseAuthorization();
app.MapControllers();
app.UseExceptionHandler("/error");

app.Run();