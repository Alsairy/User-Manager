import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, HeartOff, Building2, MapPin, Ruler, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { InvestorFavoriteWithAsset } from "@shared/schema";

const DEMO_INVESTOR_ACCOUNT_ID = "demo-investor-001";

export default function PortalFavorites() {
  const { t } = useTranslation(["pages", "common"]);
  const { toast } = useToast();

  const queryString = `investorAccountId=${DEMO_INVESTOR_ACCOUNT_ID}`;
  const { data: favorites, isLoading } = useQuery<InvestorFavoriteWithAsset[]>({
    queryKey: ["/api/portal/favorites", queryString],
    queryFn: () => fetch(`/api/portal/favorites?${queryString}`).then((r) => r.json()),
  });

  const removeFavoriteMutation = useMutation({
    mutationFn: (assetId: string) => apiRequest("/api/portal/favorites", "DELETE", {
      investorAccountId: DEMO_INVESTOR_ACCOUNT_ID,
      assetId,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portal/favorites"] });
      toast({ title: "Removed from favorites" });
    },
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Heart className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">{t("pages:portal.myFavorites")}</h1>
          <p className="text-sm text-muted-foreground">{t("pages:portal.favoritesSubtitle")}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-40 w-full rounded" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !favorites || favorites.length === 0 ? (
        <div className="text-center py-12">
          <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">No favorite assets yet</p>
          <Link href="/portal/assets">
            <Button data-testid="button-browse-assets">Browse Available Assets</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {favorites.map((favorite) => (
            <Card key={favorite.id} data-testid={`card-favorite-${favorite.id}`}>
              <div className="h-40 bg-muted flex items-center justify-center">
                <Building2 className="h-16 w-16 text-muted-foreground" />
              </div>
              <CardHeader className="p-4 pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base line-clamp-2">
                    {favorite.asset?.assetNameEn || "Unknown Asset"}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => removeFavoriteMutation.mutate(favorite.assetId)}
                    disabled={removeFavoriteMutation.isPending}
                    data-testid={`button-unfavorite-${favorite.id}`}
                  >
                    <HeartOff className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-2">
                {favorite.asset && (
                  <>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{favorite.asset.city?.cityName || "Unknown"}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Ruler className="h-3.5 w-3.5" />
                      <span>{favorite.asset.totalArea.toLocaleString()} sqm</span>
                    </div>
                    <Badge variant="secondary" className="capitalize">
                      {favorite.asset.assetType.replace("_", " ")}
                    </Badge>
                  </>
                )}
              </CardContent>
              <CardFooter className="p-4 pt-0 gap-2 flex-wrap">
                <Link href={`/portal/assets/${favorite.assetId}`} className="flex-1">
                  <Button variant="outline" className="w-full" data-testid={`button-view-${favorite.id}`}>
                    View Details
                  </Button>
                </Link>
                <Link href={`/portal/interests/new?assetId=${favorite.assetId}`}>
                  <Button size="icon" data-testid={`button-interest-${favorite.id}`}>
                    <Send className="h-4 w-4" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
