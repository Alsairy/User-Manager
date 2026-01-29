import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Building2, MapPin, Ruler, Heart, ChevronLeft, ChevronRight, Grid3X3 } from "lucide-react";
import type { AssetWithDetails } from "@shared/schema";

export default function PortalAssets() {
  const { t } = useTranslation(["pages", "common"]);
  const [search, setSearch] = useState("");
  const [assetType, setAssetType] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);
  const limit = 12;

  const queryParams = new URLSearchParams();
  if (search) queryParams.set("search", search);
  if (assetType !== "all") queryParams.set("assetType", assetType);
  if (sortBy) queryParams.set("sortBy", sortBy);
  queryParams.set("page", page.toString());
  queryParams.set("limit", limit.toString());

  const queryString = queryParams.toString();
  const { data, isLoading } = useQuery<{
    assets: AssetWithDetails[];
    total: number;
    page: number;
    limit: number;
  }>({
    queryKey: ["/api/portal/assets", queryString],
    queryFn: () => fetch(`/api/portal/assets?${queryString}`).then((r) => r.json()),
  });

  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Grid3X3 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-semibold" data-testid="text-page-title">{t("pages:portal.browseAssets")}</h1>
            <p className="text-sm text-muted-foreground">{t("pages:portal.browseAssetsSubtitle")}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or location..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-10"
              data-testid="input-search"
            />
          </div>

          <Select value={assetType} onValueChange={(val) => { setAssetType(val); setPage(1); }}>
            <SelectTrigger className="w-[180px]" data-testid="select-asset-type">
              <SelectValue placeholder="Asset Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="commercial">Commercial</SelectItem>
              <SelectItem value="residential">Residential</SelectItem>
              <SelectItem value="industrial">Industrial</SelectItem>
              <SelectItem value="agricultural">Agricultural</SelectItem>
              <SelectItem value="mixed_use">Mixed Use</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]" data-testid="select-sort">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="name">Name A-Z</SelectItem>
              <SelectItem value="area_asc">Area (Low to High)</SelectItem>
              <SelectItem value="area_desc">Area (High to Low)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-40 w-full rounded" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : data?.assets.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No assets found matching your criteria</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {data?.assets.map((asset) => (
              <Card key={asset.id} className="overflow-hidden hover-elevate" data-testid={`card-asset-${asset.id}`}>
                <div className="h-40 bg-muted flex items-center justify-center">
                  <Building2 className="h-16 w-16 text-muted-foreground" />
                </div>
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base line-clamp-2">{asset.assetNameEn}</CardTitle>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" data-testid={`button-favorite-${asset.id}`}>
                      <Heart className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-2">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{asset.city?.nameEn || "Unknown"}, {asset.district?.nameEn || ""}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Ruler className="h-3.5 w-3.5" />
                    <span>{asset.totalArea.toLocaleString()} sqm</span>
                  </div>
                  <Badge variant="secondary" className="capitalize">
                    {asset.assetType.replace("_", " ")}
                  </Badge>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <Link href={`/portal/assets/${asset.id}`} className="w-full">
                    <Button variant="outline" className="w-full" data-testid={`button-view-${asset.id}`}>
                      View Details
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                data-testid="button-prev-page"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                data-testid="button-next-page"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
