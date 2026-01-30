import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Building2, MapPin, Ruler, Calendar, Heart, HeartOff, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { AssetWithDetails } from "@/lib/schema";

const DEMO_INVESTOR_ACCOUNT_ID = "demo-investor-001";

export default function PortalAssetDetail() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  const { data: asset, isLoading } = useQuery<AssetWithDetails>({
    queryKey: ["/api/portal/assets", id],
  });

  const favoriteCheckQuery = `investorAccountId=${DEMO_INVESTOR_ACCOUNT_ID}&assetId=${id}`;
  const { data: favoriteCheck } = useQuery<{ isFavorited: boolean }>({
    queryKey: ["/api/portal/favorites/check", favoriteCheckQuery],
    queryFn: () => fetch(`/api/portal/favorites/check?${favoriteCheckQuery}`).then((r) => r.json()),
    enabled: !!id,
  });

  const addFavoriteMutation = useMutation({
    mutationFn: () => apiRequest("/api/portal/favorites", "POST", {
      investorAccountId: DEMO_INVESTOR_ACCOUNT_ID,
      assetId: id,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portal/favorites/check"] });
      toast({ title: "Added to favorites" });
    },
  });

  const removeFavoriteMutation = useMutation({
    mutationFn: () => apiRequest("/api/portal/favorites", "DELETE", {
      investorAccountId: DEMO_INVESTOR_ACCOUNT_ID,
      assetId: id,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portal/favorites/check"] });
      toast({ title: "Removed from favorites" });
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Asset not found or not available</p>
          <Link href="/portal/assets">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Assets
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Link href="/portal/assets">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold" data-testid="text-asset-name">{asset.assetNameEn}</h1>
            <p className="text-sm text-muted-foreground">{asset.assetNameAr}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {favoriteCheck?.isFavorited ? (
            <Button
              variant="outline"
              onClick={() => removeFavoriteMutation.mutate()}
              disabled={removeFavoriteMutation.isPending}
              data-testid="button-remove-favorite"
            >
              <HeartOff className="h-4 w-4 mr-2" />
              Remove from Favorites
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => addFavoriteMutation.mutate()}
              disabled={addFavoriteMutation.isPending}
              data-testid="button-add-favorite"
            >
              <Heart className="h-4 w-4 mr-2" />
              Add to Favorites
            </Button>
          )}
          <Link href={`/portal/interests/new?assetId=${asset.id}`}>
            <Button data-testid="button-express-interest">
              <Send className="h-4 w-4 mr-2" />
              Express Interest
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="h-64 bg-muted flex items-center justify-center">
              <Building2 className="h-24 w-24 text-muted-foreground" />
            </div>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Asset Type</p>
                  <Badge variant="secondary" className="mt-1 capitalize">
                    {asset.assetType.replace("_", " ")}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Area</p>
                  <p className="font-medium">{asset.totalArea.toLocaleString()} sqm</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Built Area</p>
                  <p className="font-medium">{asset.builtUpArea?.toLocaleString() || "N/A"} sqm</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium capitalize">{asset.currentStatus?.replace("_", " ") || "N/A"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {asset.description || `This is a ${asset.assetType.replace("_", " ")} property located in ${asset.city?.nameEn || "N/A"}, ${asset.region?.nameEn || "N/A"}. 
                The property features ${asset.totalArea?.toLocaleString() || "N/A"} sqm of total area${asset.builtUpArea ? ` with ${asset.builtUpArea.toLocaleString()} sqm of built space` : ""}.`}
              </p>
            </CardContent>
          </Card>

          {asset.features && asset.features.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Features & Amenities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {asset.features.map((feature, i) => (
                    <Badge key={i} variant="outline">{feature}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Region</p>
                <p className="font-medium">{asset.region?.nameEn || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">City</p>
                <p className="font-medium">{asset.city?.nameEn || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">District</p>
                <p className="font-medium">{asset.district?.nameEn || "N/A"}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ruler className="h-5 w-5" />
                Specifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Land Area</p>
                <p className="font-medium">{asset.totalArea.toLocaleString()} sqm</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Built-up Area</p>
                <p className="font-medium">{asset.builtUpArea?.toLocaleString() || "N/A"} sqm</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Land Use</p>
                <p className="font-medium capitalize">{asset.landUseType?.replace("_", " ") || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ownership</p>
                <p className="font-medium capitalize">{asset.ownershipType?.replace("_", " ") || "N/A"}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Visibility</p>
                <p className="font-medium">{asset.visibilityCount || 0} views</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Asset Code</p>
                <p className="font-medium font-mono">{asset.assetCode}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
