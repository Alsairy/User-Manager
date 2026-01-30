using System.Text;
using Asp.Versioning;
using Elsa.EntityFrameworkCore.Modules.Management;
using Elsa.EntityFrameworkCore.Modules.Runtime;
using Elsa.EntityFrameworkCore.SqlServer;
using Elsa.Extensions;
using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;
using Serilog;
using System.Security.Claims;
using System.Threading.RateLimiting;
using UserManager.Api.HealthChecks;
using UserManager.Api.Middleware;
using UserManager.Application;
using UserManager.Infrastructure;
using UserManager.Infrastructure.Options;
using UserManager.Api.Authorization;
using UserManager.Domain.Constants;
using UserManager.Workflows.Workflows;

var builder = WebApplication.CreateBuilder(args);

Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .CreateLogger();

builder.Host.UseSerilog();

builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});

var requestLimitsSection = builder.Configuration.GetSection("RequestLimits");
var maxBodyBytes = requestLimitsSection.GetValue<long>("MaxBodyBytes", 20 * 1024 * 1024);
var maxMultipartBytes = requestLimitsSection.GetValue<long>("MaxMultipartBodyBytes", 20 * 1024 * 1024);

builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize = maxBodyBytes;
});

builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = maxMultipartBytes;
});

builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.Providers.Add<BrotliCompressionProvider>();
    options.Providers.Add<GzipCompressionProvider>();
});

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration, skipDatabase: builder.Environment.IsEnvironment("Testing"));
builder.Services.AddHttpContextAccessor();

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = null;
    });
builder.Services.AddValidatorsFromAssemblyContaining<Program>();
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddFluentValidationClientsideAdapters();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "UserManager API",
        Version = "v1.0.0",
        Description = "A comprehensive API for managing users, roles, assets, contracts, and ISNAD forms. This API provides authentication, authorization, and CRUD operations for all major entities in the system.",
        Contact = new OpenApiContact
        {
            Name = "API Support",
            Email = "support@usermanager.com",
            Url = new Uri("https://usermanager.com/support")
        },
        License = new OpenApiLicense
        {
            Name = "Proprietary",
            Url = new Uri("https://usermanager.com/license")
        }
    });

    // Include XML comments for API documentation
    var xmlFilename = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFilename);
    if (File.Exists(xmlPath))
    {
        options.IncludeXmlComments(xmlPath);
    }

    // Group endpoints by tags
    options.TagActionsBy(api =>
    {
        if (api.GroupName != null)
        {
            return new[] { api.GroupName };
        }

        if (api.ActionDescriptor is Microsoft.AspNetCore.Mvc.Controllers.ControllerActionDescriptor controllerActionDescriptor)
        {
            return new[] { controllerActionDescriptor.ControllerName };
        }

        return new[] { "Other" };
    });

    options.DocInclusionPredicate((name, api) => true);

    // Add security definition for JWT Bearer
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter your JWT token in the format: Bearer {your_token}\n\nExample: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    });
    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

builder.Services.AddApiVersioning(options =>
{
    options.DefaultApiVersion = new ApiVersion(1, 0);
    options.AssumeDefaultVersionWhenUnspecified = true;
    options.ReportApiVersions = true;
    options.ApiVersionReader = new UrlSegmentApiVersionReader();
});

var jwtOptions = builder.Configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>() ?? new JwtOptions();
if (!builder.Environment.IsEnvironment("Testing"))
{
    if (string.IsNullOrWhiteSpace(jwtOptions.SigningKey) ||
        jwtOptions.SigningKey.StartsWith("CHANGE_ME", StringComparison.OrdinalIgnoreCase) ||
        jwtOptions.SigningKey.Length < 32)
    {
        throw new InvalidOperationException("Jwt:SigningKey must be set to a strong value (>=32 chars).");
    }
}
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtOptions.Issuer,
            ValidAudience = jwtOptions.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.SigningKey)),
            ClockSkew = TimeSpan.FromSeconds(5)
        };
    });

builder.Services.AddSingleton<IAuthorizationHandler, PermissionAuthorizationHandler>();
builder.Services.AddAuthorization(options =>
{
    foreach (var permission in Permissions.All)
    {
        options.AddPolicy(permission, policy =>
            policy.Requirements.Add(new PermissionRequirement(permission)));
    }
});

var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();
builder.Services.AddCors(options =>
{
    options.AddPolicy("Default", policy =>
    {
        var origins = allowedOrigins.Length > 0
            ? allowedOrigins
            : new[] { "http://localhost:5173" };

        policy.WithOrigins(origins)
            .WithHeaders("Authorization", "Content-Type", "Accept", "X-Correlation-Id", "X-Requested-With")
            .WithMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
            .AllowCredentials();
    });
});

builder.Services.AddRateLimiter(options =>
{
    var rateLimitSection = builder.Configuration.GetSection("RateLimiting");
    var windowSeconds = rateLimitSection.GetValue("WindowSeconds", 60);
    var globalPermitLimit = rateLimitSection.GetValue("GlobalPermitLimit", 300);
    var authPermitLimit = rateLimitSection.GetValue("AuthPermitLimit", 20);
    var queueLimit = rateLimitSection.GetValue("QueueLimit", 0);

    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
    {
        var userId = context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
        var key = !string.IsNullOrWhiteSpace(userId)
            ? $"user:{userId}"
            : $"ip:{context.Connection.RemoteIpAddress}";

        return RateLimitPartition.GetFixedWindowLimiter(key, _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = globalPermitLimit,
            Window = TimeSpan.FromSeconds(windowSeconds),
            QueueLimit = queueLimit,
            QueueProcessingOrder = QueueProcessingOrder.OldestFirst
        });
    });

    // Auth endpoints use stricter rate limiting (5 attempts per 5 minutes by default)
    var authWindowSeconds = rateLimitSection.GetValue("AuthWindowSeconds", 300);
    options.AddPolicy("auth", context =>
        RateLimitPartition.GetSlidingWindowLimiter(
            context.Connection.RemoteIpAddress?.ToString() ?? $"unknown:{Guid.NewGuid()}",
            _ => new SlidingWindowRateLimiterOptions
            {
                PermitLimit = authPermitLimit,
                Window = TimeSpan.FromSeconds(authWindowSeconds),
                SegmentsPerWindow = 5,
                QueueLimit = 0,
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst
            }));
});

var serviceName = "UserManager.Api";
var serviceVersion = "1.0.0";
var otlpEndpoint = builder.Configuration["OpenTelemetry:OtlpEndpoint"];

builder.Services.AddOpenTelemetry()
    .ConfigureResource(resource => resource
        .AddService(serviceName, serviceVersion: serviceVersion)
        .AddAttributes(new Dictionary<string, object>
        {
            ["environment"] = builder.Environment.EnvironmentName,
            ["host.name"] = Environment.MachineName
        }))
    .WithTracing(tracing =>
    {
        tracing
            .AddAspNetCoreInstrumentation(options =>
            {
                options.RecordException = true;
                options.Filter = context =>
                    !context.Request.Path.StartsWithSegments("/health") &&
                    !context.Request.Path.StartsWithSegments("/swagger");
            })
            .AddHttpClientInstrumentation(options =>
            {
                options.RecordException = true;
            })
            .AddSqlClientInstrumentation(options =>
            {
                options.RecordException = true;
            });

        if (!string.IsNullOrWhiteSpace(otlpEndpoint))
        {
            tracing.AddOtlpExporter(options => options.Endpoint = new Uri(otlpEndpoint));
        }
    })
    .WithMetrics(metrics =>
    {
        metrics
            .AddAspNetCoreInstrumentation()
            .AddHttpClientInstrumentation()
            .AddRuntimeInstrumentation()
            .AddMeter(serviceName);

        if (!string.IsNullOrWhiteSpace(otlpEndpoint))
        {
            metrics.AddOtlpExporter(options => options.Endpoint = new Uri(otlpEndpoint));
        }
    });

var redisHealthConnection = builder.Configuration.GetConnectionString("Redis");
builder.Services.AddHealthChecks()
    .AddCheck<DatabaseHealthCheck>("database", tags: new[] { "ready" })
    .AddRedis(
        redisHealthConnection ?? "localhost:6379",
        name: "redis",
        tags: new[] { "ready" },
        timeout: TimeSpan.FromSeconds(5));

var elsaConnection = builder.Configuration.GetConnectionString("Elsa");
var skipElsa = builder.Configuration.GetValue<bool>("SkipElsa", false);
if (!builder.Environment.IsEnvironment("Testing") && !skipElsa && !string.IsNullOrWhiteSpace(elsaConnection))
{
    builder.Services.AddDbContext<ManagementElsaDbContext>(options =>
    {
        options.UseSqlServer(elsaConnection);
    });
    builder.Services.AddDbContext<RuntimeElsaDbContext>(options =>
    {
        options.UseSqlServer(elsaConnection);
    });
    builder.Services.AddElsa(elsa =>
    {
        elsa.UseWorkflowManagement(management =>
        {
            management.UseEntityFrameworkCore(ef =>
            {
                ef.DbContextOptionsBuilder = (_, db) => db.UseSqlServer(elsaConnection);
                ef.RunMigrations = true;
            });
        });
        elsa.UseWorkflowRuntime(runtime =>
        {
            runtime.UseEntityFrameworkCore(ef =>
            {
                ef.DbContextOptionsBuilder = (_, db) => db.UseSqlServer(elsaConnection);
                ef.RunMigrations = true;
            });
        });
        elsa.AddWorkflow<AssetRegistrationWorkflow>();
        elsa.AddWorkflow<IsnadWorkflow>();
        elsa.AddWorkflow<ContractWorkflow>();
        elsa.AddWorkflow<CrmWorkflow>();
        elsa.AddWorkflow<PortalWorkflow>();
        elsa.AddWorkflow<UserLifecycleWorkflow>();
    });
}

var app = builder.Build();

app.UseForwardedHeaders();
app.UseMiddleware<CorrelationIdMiddleware>();
app.UseSerilogRequestLogging();
app.UseMiddleware<SecurityHeadersMiddleware>();
app.UseMiddleware<ExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseResponseCompression();
app.UseCors("Default");
app.UseAuthentication();
app.UseRateLimiter();
app.UseAuthorization();


app.MapHealthChecks("/health/live", new HealthCheckOptions
{
    Predicate = _ => false
});
app.MapHealthChecks("/health/ready", new HealthCheckOptions
{
    Predicate = check => check.Tags.Contains("ready")
});
app.MapHealthChecks("/health", new HealthCheckOptions
{
    Predicate = _ => true
});
app.MapControllers();

app.Run();

public partial class Program { }
