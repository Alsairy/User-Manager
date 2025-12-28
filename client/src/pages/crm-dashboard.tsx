import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Users, FileText, Landmark, Heart, TrendingUp, BarChart3 } from "lucide-react";
import type { CrmDashboardStats } from "@shared/schema";

export default function CrmDashboard() {
  const { data: stats, isLoading } = useQuery<CrmDashboardStats>({
    queryKey: ["/api/crm/dashboard"],
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-10 w-20 mb-2" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">CRM Analytics</h1>
          <p className="text-sm text-muted-foreground">Investor relationship management dashboard</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Investors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-total-investors">
              {stats?.totalInvestorAccounts || 0}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="default">{stats?.activeInvestors || 0} Active</Badge>
              {(stats?.blockedInvestors || 0) > 0 && (
                <Badge variant="destructive">{stats?.blockedInvestors} Blocked</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Investment Interests</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-total-interests">
              {stats?.totalInterests || 0}
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge variant="secondary">{stats?.newInterests || 0} New</Badge>
              <Badge variant="outline">{stats?.underReviewInterests || 0} Reviewing</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-conversion-rate">
              {stats?.conversionRate || 0}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.convertedInterests || 0} of {stats?.totalInterests || 0} converted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Istifada Requests</CardTitle>
            <Landmark className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-istifada-requests">
              {stats?.totalIstifadaRequests || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.pendingIstifadaRequests || 0} pending review
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Most Favorited Assets
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!stats?.mostFavoritedAssets?.length ? (
              <p className="text-muted-foreground text-center py-4">No favorites data yet</p>
            ) : (
              <div className="space-y-3">
                {stats.mostFavoritedAssets.map((asset, index) => (
                  <div
                    key={asset.assetId}
                    className="flex items-center justify-between"
                    data-testid={`row-favorited-${index}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-semibold text-muted-foreground w-6">
                        {index + 1}
                      </span>
                      <span className="truncate max-w-[200px]">{asset.assetName}</span>
                    </div>
                    <Badge variant="secondary">{asset.count} favorites</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Interests by Purpose
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!stats?.interestsByPurpose?.length ? (
              <p className="text-muted-foreground text-center py-4">No interest data yet</p>
            ) : (
              <div className="space-y-3">
                {stats.interestsByPurpose.map((item, index) => (
                  <div
                    key={item.purpose}
                    className="flex items-center justify-between"
                    data-testid={`row-purpose-${index}`}
                  >
                    <span className="capitalize">{item.purpose.replace("_", " ")}</span>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2 bg-primary rounded"
                        style={{
                          width: `${Math.max(20, (item.count / Math.max(...stats.interestsByPurpose.map(p => p.count))) * 100)}px`,
                        }}
                      />
                      <span className="text-sm font-medium w-8 text-right">{item.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approved Interests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600" data-testid="stat-approved">
              {stats?.approvedInterests || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Converted to Contract</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600" data-testid="stat-converted">
              {stats?.convertedInterests || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Istifada</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600" data-testid="stat-pending-istifada">
              {stats?.pendingIstifadaRequests || 0}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
