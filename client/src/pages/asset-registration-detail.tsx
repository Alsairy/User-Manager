import { useState } from "react";
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
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { AssetWithDetails, AssetWorkflowHistory } from "@shared/schema";
import { workflowStageLabels, featureLabels, PredefinedFeature } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AssetReviewWizard } from "@/components/asset-review-wizard";

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

interface ChangeHistoryItem {
  id: number;
  type: "modified" | "created" | "approved" | "rejected";
  editedBy: string;
  date: string;
  description: string;
}

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

function formatShortDate(date: string | Date | null | undefined): string {
  if (!date) return "-";
  const d = new Date(date);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }) + ", " + d.toLocaleTimeString("en-GB", {
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

function ChangeHistoryPanel({ 
  open, 
  onOpenChange, 
  assetCode,
  history 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  assetCode: string;
  history: ChangeHistoryItem[];
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="p-6 pb-4 border-b">
          <SheetTitle className="text-lg font-semibold">
            Asset registration request {assetCode}
          </SheetTitle>
          <div className="pt-4">
            <h3 className="text-base font-medium">Change history</h3>
            <SheetDescription className="mt-1">
              Here you can view all edits that have been made to this request.
            </SheetDescription>
          </div>
        </SheetHeader>
        
        <ScrollArea className="flex-1 p-6">
          <div className="relative">
            <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-border" />
            
            <div className="space-y-6">
              {history.map((item, index) => (
                <div key={item.id} className="relative pl-6">
                  <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-background" />
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-sm">Request modified</p>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatShortDate(item.date)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Edited by: {item.editedBy}
                    </p>
                    <div className="pt-2">
                      <p className="text-sm font-medium">Changes description:</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    <button className="text-sm text-primary hover:underline pt-1" data-testid={`link-view-details-${item.id}`}>
                      View details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>
        
        <div className="p-6 border-t">
          <SheetClose asChild>
            <Button variant="outline" className="w-full" data-testid="button-close-history">
              Close history
            </Button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default function AssetRegistrationDetail() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [reviewWizardOpen, setReviewWizardOpen] = useState(false);

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
      const mode = asset?.registrationMode || "direct";
      const res = await apiRequest("POST", `/api/assets/registrations/${id}/submit`, { mode });
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

  const mockChangeHistory: ChangeHistoryItem[] = [
    {
      id: 1,
      type: "modified",
      editedBy: "Khalid Sabah",
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      description: "Safety and Security Department approved the request",
    },
    {
      id: 2,
      type: "modified",
      editedBy: "Fatima Hassan",
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      description: "Location coordinates refined",
    },
    {
      id: 3,
      type: "modified",
      editedBy: "Mohammed Ali",
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      description: "Asset request approved",
    },
    {
      id: 4,
      type: "modified",
      editedBy: "Sarah Ahmed",
      date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      description: "Asset description and location justification updated",
    },
    {
      id: 5,
      type: "modified",
      editedBy: "Khalid Sabah",
      date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      description: "Asset request information updated by School Planning Department",
    },
  ];

  return (
    <div className="space-y-6">
      <ChangeHistoryPanel 
        open={historyOpen} 
        onOpenChange={setHistoryOpen}
        assetCode={asset.assetCode || ""}
        history={mockChangeHistory}
      />

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
          <Button onClick={() => setReviewWizardOpen(true)} data-testid="button-review-request">
            Review request
          </Button>
        )}
        <Button variant="outline" data-testid="button-download-report">
          Download asset report
          <Download className="ml-2 h-4 w-4" />
        </Button>
      </div>

      <AssetReviewWizard
        asset={asset}
        open={reviewWizardOpen}
        onClose={() => setReviewWizardOpen(false)}
        onSubmit={(decision, comments) => {
          toast({
            title: decision === "accept" ? "Asset Approved" : "Asset Rejected",
            description: `The review decision has been submitted.`,
          });
          queryClient.invalidateQueries({ queryKey: ["/api/assets/registrations", id] });
        }}
      />

      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-lg">Asset details</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <InfoRow label="Asset creation date" value={formatDate(asset.createdAt)} />
          <InfoRow label="Created by">
            <span>{asset.createdBy || "Amin Nasrallah"}</span>
          </InfoRow>
          <button 
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mt-3" 
            onClick={() => setHistoryOpen(true)}
            data-testid="link-view-history"
          >
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
          <InfoRow label="Asset name" value={asset.assetNameEn || `${asset.assetType === "land" ? "Land" : "Building"} in ${asset.city?.nameEn || "Riyadh"}`} />
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
          <InfoRow label="Short National Address" value={asset.streetAddress || "RRR2929"} />
          <InfoRow label="Latitude" value={asset.latitude?.toString()} />
          <InfoRow label="Longitude" value={asset.longitude?.toString()} />
          <InfoRow label="Justification">
            <span className="text-muted-foreground italic">
              This is a justification from Amin Nasrallah about duplicated asset location
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
              {asset.description || "This is a description from Amin Nasrallah about the asset"}
            </span>
          </InfoRow>
          <InfoRow label="Features">
            <ul className="list-disc list-inside space-y-1">
              <li>Prime location in Riyadh, Al Olayya</li>
              <li>Spacious area of 826,562 m²</li>
              <li>Making it ideal for developing an educational building</li>
              <li>Available for lease</li>
              <li>Excellent investment opportunity in the education sector</li>
            </ul>
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
