using System.Diagnostics.Metrics;

namespace UserManager.Infrastructure.Services;

public interface IMetricsService
{
    void RecordUserLogin(string? ipAddress);
    void RecordUserLoginFailed(string? ipAddress);
    void RecordUserCreated();
    void RecordAssetCreated();
    void RecordAssetStatusChanged(string status);
    void RecordContractCreated(decimal amount);
    void RecordNotificationSent(string type);
    void RecordEmailSent(string template);
    void RecordWorkflowStarted(string workflowName);
    void RecordCacheHit(string key);
    void RecordCacheMiss(string key);
}

public class MetricsService : IMetricsService
{
    private static readonly Meter Meter = new("UserManager.Api", "1.0.0");

    // Counters
    private static readonly Counter<long> UserLogins = Meter.CreateCounter<long>("user_logins_total", description: "Total successful user logins");
    private static readonly Counter<long> UserLoginsFailed = Meter.CreateCounter<long>("user_logins_failed_total", description: "Total failed user login attempts");
    private static readonly Counter<long> UsersCreated = Meter.CreateCounter<long>("users_created_total", description: "Total users created");
    private static readonly Counter<long> AssetsCreated = Meter.CreateCounter<long>("assets_created_total", description: "Total assets created");
    private static readonly Counter<long> AssetStatusChanges = Meter.CreateCounter<long>("asset_status_changes_total", description: "Total asset status changes");
    private static readonly Counter<long> ContractsCreated = Meter.CreateCounter<long>("contracts_created_total", description: "Total contracts created");
    private static readonly Counter<long> NotificationsSent = Meter.CreateCounter<long>("notifications_sent_total", description: "Total notifications sent");
    private static readonly Counter<long> EmailsSent = Meter.CreateCounter<long>("emails_sent_total", description: "Total emails sent");
    private static readonly Counter<long> WorkflowsStarted = Meter.CreateCounter<long>("workflows_started_total", description: "Total workflows started");
    private static readonly Counter<long> CacheHits = Meter.CreateCounter<long>("cache_hits_total", description: "Total cache hits");
    private static readonly Counter<long> CacheMisses = Meter.CreateCounter<long>("cache_misses_total", description: "Total cache misses");

    // Histograms
    private static readonly Histogram<double> ContractAmounts = Meter.CreateHistogram<double>("contract_amount", unit: "SAR", description: "Contract amounts");

    public void RecordUserLogin(string? ipAddress)
    {
        UserLogins.Add(1, new KeyValuePair<string, object?>("ip_country", GetCountryFromIp(ipAddress)));
    }

    public void RecordUserLoginFailed(string? ipAddress)
    {
        UserLoginsFailed.Add(1, new KeyValuePair<string, object?>("ip_country", GetCountryFromIp(ipAddress)));
    }

    public void RecordUserCreated()
    {
        UsersCreated.Add(1);
    }

    public void RecordAssetCreated()
    {
        AssetsCreated.Add(1);
    }

    public void RecordAssetStatusChanged(string status)
    {
        AssetStatusChanges.Add(1, new KeyValuePair<string, object?>("status", status));
    }

    public void RecordContractCreated(decimal amount)
    {
        ContractsCreated.Add(1);
        ContractAmounts.Record((double)amount);
    }

    public void RecordNotificationSent(string type)
    {
        NotificationsSent.Add(1, new KeyValuePair<string, object?>("type", type));
    }

    public void RecordEmailSent(string template)
    {
        EmailsSent.Add(1, new KeyValuePair<string, object?>("template", template));
    }

    public void RecordWorkflowStarted(string workflowName)
    {
        WorkflowsStarted.Add(1, new KeyValuePair<string, object?>("workflow", workflowName));
    }

    public void RecordCacheHit(string key)
    {
        var prefix = GetKeyPrefix(key);
        CacheHits.Add(1, new KeyValuePair<string, object?>("key_prefix", prefix));
    }

    public void RecordCacheMiss(string key)
    {
        var prefix = GetKeyPrefix(key);
        CacheMisses.Add(1, new KeyValuePair<string, object?>("key_prefix", prefix));
    }

    private static string GetKeyPrefix(string key)
    {
        var colonIndex = key.IndexOf(':');
        return colonIndex > 0 ? key[..colonIndex] : key;
    }

    private static string GetCountryFromIp(string? ipAddress)
    {
        // Simplified - in production you'd use a GeoIP service
        if (string.IsNullOrEmpty(ipAddress)) return "unknown";
        if (ipAddress.StartsWith("127.") || ipAddress == "::1") return "localhost";
        return "unknown";
    }
}
