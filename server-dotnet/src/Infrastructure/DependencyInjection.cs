using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using UserManager.Application.Interfaces;
using UserManager.Infrastructure.Options;
using UserManager.Infrastructure.Persistence;
using UserManager.Infrastructure.Services;

namespace UserManager.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration, bool skipDatabase = false)
    {
        services.Configure<JwtOptions>(options =>
            configuration.GetSection(JwtOptions.SectionName).Bind(options));
        services.Configure<SeedOptions>(options =>
            configuration.GetSection(SeedOptions.SectionName).Bind(options));
        services.Configure<EmailOptions>(options =>
            configuration.GetSection(EmailOptions.SectionName).Bind(options));

        if (!skipDatabase)
        {
            services.AddDbContext<AppDbContext>(options =>
            {
                var connectionString = configuration.GetConnectionString("Default");
                if (string.IsNullOrWhiteSpace(connectionString))
                {
                    throw new InvalidOperationException("ConnectionStrings:Default is required.");
                }

                options.UseSqlServer(connectionString, sql =>
                {
                    sql.EnableRetryOnFailure(5, TimeSpan.FromSeconds(10), null);
                });
            });
        }

        services.AddScoped<IAppDbContext>(sp => sp.GetRequiredService<AppDbContext>());
        services.AddScoped<IAuthService, AuthService>();
        services.AddSingleton<IDateTimeProvider, DateTimeProvider>();
        services.AddSingleton<IPasswordHasher, PasswordHasher>();
        services.AddScoped<IJwtTokenService, JwtTokenService>();
        services.AddScoped<ICurrentUser, CurrentUser>();
        services.AddHostedService<SeedDataHostedService>();
        services.AddScoped<IEmailService, SendGridEmailService>();
        services.AddScoped<INotificationService, NotificationService>();
        services.AddSingleton<IMetricsService, MetricsService>();
        services.AddHostedService<ScheduledTasksService>();

        var redisConnection = configuration.GetConnectionString("Redis");
        if (!string.IsNullOrWhiteSpace(redisConnection))
        {
            services.AddStackExchangeRedisCache(options =>
            {
                options.Configuration = redisConnection;
                options.InstanceName = "UserManager:";
            });
            services.AddScoped<ICacheService, RedisCacheService>();
        }
        else
        {
            // Fallback to in-memory cache when Redis is not configured
            services.AddDistributedMemoryCache();
            services.AddScoped<ICacheService, InMemoryCacheService>();
        }

        return services;
    }
}
