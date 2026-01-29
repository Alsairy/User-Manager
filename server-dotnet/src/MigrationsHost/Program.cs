using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using UserManager.Infrastructure;
using UserManager.Infrastructure.Persistence;

var configuration = new ConfigurationBuilder()
    .AddEnvironmentVariables()
    .Build();

var services = new ServiceCollection();
services.AddInfrastructure(configuration);

await using var provider = services.BuildServiceProvider();
await using var scope = provider.CreateAsyncScope();
var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

await dbContext.Database.MigrateAsync();
Console.WriteLine("Database migrations applied.");
