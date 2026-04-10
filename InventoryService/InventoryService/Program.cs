using InventoryService.Application.Interfaces;
using InventoryService.Application.Services;
using InventoryService.Domain.Repositories;
using InventoryService.Infrastructure.Data;
using InventoryService.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using Polly;
using System.Net;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

builder.Services.AddDbContext<InventoryDbContext>(options =>
    options.UseSqlServer(connectionString, sql =>
    {
        sql.EnableRetryOnFailure( 
            maxRetryCount: 5,
            maxRetryDelay: TimeSpan.FromSeconds(30),
            errorNumbersToAdd: null);
    }));

builder.Services.AddScoped<IProductRepository, ProductRepository>();
builder.Services.AddScoped<IProductService, ProductService>();

builder.Services.AddControllers(options =>
{
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Inventory Service API",
        Version = "v1",
        Description = "Microsservice for product and stock management - Korp Technical Test",
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

builder.Services.AddHttpClient("BillingService", client =>
{
    client.BaseAddress = new Uri("http://localhost:5002/");
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

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<InventoryDbContext>();
    await InventoryService.Infrastructure.Data.Seed.SeedDataAsync(dbContext);
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Inventory Service API v1");
    });
}

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseCors("AllowAngular");

app.UseAuthorization();

app.MapControllers();

app.UseExceptionHandler("/error");
app.Map("/error", context =>
{
    context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
    context.Response.ContentType = "application/json";
    return context.Response.WriteAsync("{\"error\":\"An unexpected error occurred. Please try again later.\"}");
});

app.Run();