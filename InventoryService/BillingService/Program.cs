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
using Polly.Extensions.Http;

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
    var logger = services.GetRequiredService<ILogger<Program>>();

    var retryPolicy = HttpPolicyExtensions
        .HandleTransientHttpError()
        .WaitAndRetryAsync(3, retryAttempt => TimeSpan.FromSeconds(Math.Pow(2, retryAttempt)),
            (outcome, timespan, retryCount, context) =>
                logger.LogWarning("⚡ Retry {RetryCount} after {Timespan}s due to {StatusCode}",
                    retryCount, timespan.TotalSeconds, outcome.Result?.StatusCode));

    var circuitBreakerPolicy = HttpPolicyExtensions
        .HandleTransientHttpError()
        .CircuitBreakerAsync(3, TimeSpan.FromSeconds(30),
            onBreak: (outcome, breakDuration) =>
                logger.LogWarning("🔴 Circuit Breaker OPENED for {Duration}s. InventoryService is unstable.", breakDuration.TotalSeconds),
            onReset: () => logger.LogInformation("🟢 Circuit Breaker RESET. InventoryService is healthy again."));

    return retryPolicy.WrapAsync(circuitBreakerPolicy);
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

// Seed do banco de dados
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<BillingDbContext>();
    await BillingService.Infrastructure.Data.Seed.SeedDataAsync(dbContext);
}

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Billing Service API v1");
    });
}
else
{
    app.UseExceptionHandler("/error");
    app.UseHsts();
}

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}
app.UseCors("AllowAngular");
app.UseAuthorization();
app.MapControllers();

if (!app.Environment.IsDevelopment())
{
    app.Map("/error", async context =>
    {
        context.Response.StatusCode = 500;
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsync("{\"error\":\"An unexpected error occurred. Please try again later.\"}");
    });
}

app.Run();