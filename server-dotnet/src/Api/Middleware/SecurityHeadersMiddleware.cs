namespace UserManager.Api.Middleware;

public class SecurityHeadersMiddleware
{
    private readonly RequestDelegate _next;

    public SecurityHeadersMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public Task Invoke(HttpContext context)
    {
        var isSwagger = context.Request.Path.StartsWithSegments("/swagger");
        var isHealthCheck = context.Request.Path.StartsWithSegments("/health");

        context.Response.OnStarting(() =>
        {
            var headers = context.Response.Headers;

            // Prevent MIME type sniffing
            headers["X-Content-Type-Options"] = "nosniff";

            // Prevent clickjacking
            headers["X-Frame-Options"] = "DENY";

            // Control referrer information
            headers["Referrer-Policy"] = "strict-origin-when-cross-origin";

            // Disable dangerous browser features
            headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=(), usb=(), payment=()";

            // Legacy XSS protection for older browsers
            headers["X-XSS-Protection"] = "1; mode=block";

            // Prevent content from being loaded by browsers when DNS rebinding attacks
            headers["Cross-Origin-Opener-Policy"] = "same-origin";
            headers["Cross-Origin-Resource-Policy"] = "same-origin";

            // Remove potentially sensitive headers
            headers.Remove("X-Powered-By");
            headers.Remove("Server");

            // Apply CSP only to non-Swagger and non-health-check endpoints
            if (!isSwagger && !isHealthCheck)
            {
                headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'";
            }

            return Task.CompletedTask;
        });

        return _next(context);
    }
}
