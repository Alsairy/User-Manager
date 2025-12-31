import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { 
  ChevronRight, 
  Download, 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Send,
  History,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import type { AssetWithDetails, AssetWorkflowHistory } from "@shared/schema";
import { workflowStageLabels, featureLabels, PredefinedFeature } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  in_review: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  incomplete_bulk: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
};

const statusLabels: Record<string, string> = {
  draft: "Draft",
  in_review: "In review",
  completed: "Approved",
  rejected: "Rejected",
  incomplete_bulk: "Incomplete",
};

const departmentsList = [
  { id: "school_planning", name: "School Planning Department" },
  { id: "safety_security", name: "Safety and Security Department" },
  { id: "investment_partnerships", name: "Investment & Partnerships Dept." },
  { id: "investment_agency", name: "Investment Agency" },
  { id: "tatweer", name: "Tatweer Building Company" },
];

function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "-";
  const d = new Date(date);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }) + " " + d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function InfoRow({ label, value, children }: { label: string; value?: string | number | null; children?: React.ReactNode }) {
  return (
    <div className="flex py-3 border-b last:border-b-0">
      <div className="w-48 flex-shrink-0 text-muted-foreground text-sm">{label}</div>
      <div className="flex-1 text-sm">{children || value || "-"}</div>
    </div>
  );
}

function CommentSection({ department, comment, date }: { department: string; comment: string; date?: string }) {
  return (
    <div className="mt-4 pt-4 border-t">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium">Most recent comment: {department}</p>
          <p className="text-sm text-muted-foreground mt-1">{comment}</p>
        </div>
        {date && (
          <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(date)}</span>
        )}
      </div>
      <button className="text-sm text-primary hover:underline mt-2" data-testid="link-see-all-comments">
        See all comments
      </button>
    </div>
  );
}

export default function AssetRegistrationDetail() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  const { data: asset, isLoading } = useQuery<AssetWithDetails>({
    queryKey: ["/api/assets/registrations", id],
    queryFn: () => fetch(`/api/assets/registrations/${id}`).then((r) => r.json()),
  });

  const { data: workflowHistory } = useQuery<AssetWorkflowHistory[]>({
    queryKey: ["/api/assets/registrations", id, "history"],
    queryFn: () => fetch(`/api/assets/registrations/${id}/history`).then((r) => r.json()),
    enabled: !!id,
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/assets/registrations/${id}/submit`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assets/registrations", id] });
      toast({
        title: "Asset Submitted",
        description: "The asset has been submitted for review.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit asset for review.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Asset not found</p>
        <Link href="/assets/registrations">
          <Button variant="outline" className="mt-4">
            Back to Registrations
          </Button>
        </Link>
      </div>
    );
  }

  const customFeatures = asset.customFeatures?.split(", ") || [];
  const assetSubType = customFeatures[0] || "-";
  const educationalDept = customFeatures[1] || "-";
  const classification = customFeatures[2] || "-";

  const verificationMap = new Map<string, { status: string; date?: string; userName?: string }>();
  if (asset.verifiedBy) {
    asset.verifiedBy.forEach((v) => {
      verificationMap.set(v.department, { 
        status: "approved", 
        date: v.date,
        userName: v.userName 
      });
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/assets/registrations" className="hover:text-foreground">
          Asset registration
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">Asset registration request {asset.assetCode?.split("-")[0]}...</span>
      </div>

      <div className="space-y-2">
        <Badge className={statusColors[asset.status]}>
          {statusLabels[asset.status]}
        </Badge>
        <h1 className="text-2xl font-semibold" data-testid="text-asset-title">
          Asset registration request <span className="text-muted-foreground">{asset.assetCode}</span>
        </h1>
        <p className="text-muted-foreground font-mono">{asset.assetCode}</p>
      </div>

      <div className="flex items-center gap-3">
        {asset.status === "draft" ? (
          <Button
            onClick={() => submitMutation.mutate()}
            disabled={submitMutation.isPending}
            data-testid="button-submit"
          >
            <Send className="mr-2 h-4 w-4" />
            Submit for Review
          </Button>
        ) : (
          <Button data-testid="button-review-request">
            Review request
          </Button>
        )}
        <Button variant="outline" data-testid="button-download-report">
          Download asset report
          <Download className="ml-2 h-4 w-4" />
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-lg">Asset details</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <InfoRow label="Asset creation date" value={formatDate(asset.createdAt)} />
          <InfoRow label="Created by">
            <span>{asset.createdBy || "System"}</span>
          </InfoRow>
          <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mt-3" data-testid="link-view-history">
            <History className="h-4 w-4" />
            View full change history
          </button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-lg">Asset information</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <InfoRow label="Asset name" value={asset.assetNameEn || `${asset.assetType === "land" ? "Land" : "Building"} in ${asset.city?.nameEn || "N/A"}`} />
          <InfoRow label="Land code" value={asset.assetCode} />
          <InfoRow label="Asset size (m²)" value={asset.totalArea?.toLocaleString()} />
          <InfoRow label="Asset type" value={asset.assetType === "land" ? "Land" : "Building"} />
          <InfoRow label="Asset sub-type" value={assetSubType} />
          <InfoRow label="Educational department" value={educationalDept} />
          <InfoRow label="Classification" value={classification} />
          <InfoRow label="Attached documents">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <a href="#" className="text-primary hover:underline">document_1768869391232_0.pdf</a>
                <span className="text-xs text-muted-foreground">0 KB</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <a href="#" className="text-primary hover:underline">document_1768869391232_1.pdf</a>
                <span className="text-xs text-muted-foreground">0 KB</span>
              </div>
            </div>
          </InfoRow>
          
          <CommentSection 
            department="Investment & Partnerships Dept."
            comment="This is a comment from Amin Nasrallah number three about asset information"
            date={asset.updatedAt}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-lg">Asset location</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <InfoRow label="Region" value={asset.region?.nameEn} />
          <InfoRow label="City" value={asset.city?.nameEn} />
          <InfoRow label="District" value={asset.district?.nameEn} />
          <InfoRow label="Short National Address" value={asset.streetAddress || "N/A"} />
          <InfoRow label="Latitude" value={asset.latitude?.toString()} />
          <InfoRow label="Longitude" value={asset.longitude?.toString()} />
          <InfoRow label="Justification">
            <span className="text-muted-foreground italic">
              {asset.administrativeNotes?.split("\n\n")[1] || "No justification provided"}
            </span>
          </InfoRow>
          <InfoRow label="Aerial photograph">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <a href="#" className="text-primary hover:underline">photo_1768869391232_0.png</a>
                <span className="text-xs text-muted-foreground">0 KB</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <a href="#" className="text-primary hover:underline">photo_1768869391232_1.png</a>
                <span className="text-xs text-muted-foreground">0 KB</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <a href="#" className="text-primary hover:underline">photo_1768869391232_2.png</a>
                <span className="text-xs text-muted-foreground">0 KB</span>
              </div>
            </div>
          </InfoRow>

          <CommentSection 
            department="Investment & Partnerships Dept."
            comment="This is a comment from Amin Nasrallah number three about asset location"
            date={asset.updatedAt}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-lg">Features</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <InfoRow label="Asset description">
            <span className="italic text-muted-foreground">
              {asset.description || "No description provided"}
            </span>
          </InfoRow>
          <InfoRow label="Features">
            {asset.features && asset.features.length > 0 ? (
              <ul className="list-disc list-inside space-y-1">
                {asset.features.map((feature, idx) => (
                  <li key={idx}>{featureLabels[feature as PredefinedFeature] || feature}</li>
                ))}
              </ul>
            ) : (
              <span className="text-muted-foreground">No features listed</span>
            )}
          </InfoRow>

          <CommentSection 
            department="Investment & Partnerships Dept."
            comment="This is a comment from Amin Nasrallah number three about features"
            date={asset.updatedAt}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-lg">Asset status</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-4">
            {departmentsList.map((dept) => {
              const verification = verificationMap.get(dept.id);
              const isApproved = verification?.status === "approved";
              const isPending = !isApproved;
              
              return (
                <div key={dept.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      isApproved 
                        ? "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400" 
                        : "bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400"
                    }`}>
                      {isApproved ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Clock className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{dept.name}</p>
                      {isApproved && verification?.date && (
                        <p className="text-xs text-muted-foreground">
                          Approved date: {formatDate(verification.date)}
                        </p>
                      )}
                      {isPending && (
                        <p className="text-xs text-muted-foreground">
                          Due date: {formatDate(new Date(Date.now() + 5 * 24 * 60 * 60 * 1000))}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge 
                    variant="outline"
                    className={isApproved 
                      ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
                      : "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800"
                    }
                  >
                    {isApproved ? "Approved" : "Pending"}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {asset.rejectionReason && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              Rejection Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Reason</p>
                <p className="capitalize">{asset.rejectionReason.replace(/_/g, " ")}</p>
              </div>
              {asset.rejectionJustification && (
                <div>
                  <p className="text-sm text-muted-foreground">Justification</p>
                  <p>{asset.rejectionJustification}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
