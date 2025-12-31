import { useState } from "react";
import { X, ChevronRight, ChevronLeft, Check, FileText, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { AssetWithDetails } from "@shared/schema";

interface AssetReviewWizardProps {
  asset: AssetWithDetails;
  open: boolean;
  onClose: () => void;
  onSubmit: (decision: "accept" | "reject", comments: ReviewComments) => void;
}

interface ReviewComments {
  assetDetails: string;
  assetLocation: string;
  features: string;
}

type ReviewStep = "introduction" | "asset_details" | "summary";

function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "-";
  const d = new Date(date);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }) + ", " + d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  }) + " " + (d.getHours() >= 12 ? "PM" : "AM");
}

function InfoRow({ label, value, children }: { label: string; value?: string | number | null; children?: React.ReactNode }) {
  return (
    <div className="flex py-2.5 border-b last:border-b-0">
      <div className="w-44 flex-shrink-0 text-muted-foreground text-sm">{label}</div>
      <div className="flex-1 text-sm font-medium">{children || value || "-"}</div>
    </div>
  );
}

function SectionHeader({ title, description, showToReview = false }: { title: string; description?: string; showToReview?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-4">
      <div>
        <h3 className="font-semibold text-base">{title}</h3>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      {showToReview && (
        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
          To review
        </Badge>
      )}
    </div>
  );
}

function CommentDisplay({ department, comment, date }: { department: string; comment: string; date?: string }) {
  return (
    <div className="mt-4 pt-4 border-t">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm font-medium">{department} comment</p>
        {date && <span className="text-xs text-muted-foreground">{formatDate(date)}</span>}
      </div>
      <p className="text-sm text-muted-foreground mt-1">{comment}</p>
    </div>
  );
}

function CommentInput({ value, onChange, label = "Your comment" }: { value: string; onChange: (v: string) => void; label?: string }) {
  return (
    <div className="mt-4">
      <Label className="text-sm">{label} <span className="text-muted-foreground">(optional)</span></Label>
      <Textarea 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder=""
        className="mt-2 min-h-[100px]"
        maxLength={2000}
      />
      <div className="text-xs text-muted-foreground text-right mt-1">{value.length}/2000</div>
    </div>
  );
}

export function AssetReviewWizard({ asset, open, onClose, onSubmit }: AssetReviewWizardProps) {
  const [currentStep, setCurrentStep] = useState<ReviewStep>("introduction");
  const [skipIntro, setSkipIntro] = useState(false);
  const [decision, setDecision] = useState<"accept" | "reject" | null>(null);
  const [comments, setComments] = useState<ReviewComments>({
    assetDetails: "",
    assetLocation: "",
    features: "",
  });

  if (!open) return null;

  const steps = [
    { id: "introduction", label: "Introduction", number: 1 },
    { id: "asset_details", label: "Asset details", number: 2 },
    { id: "summary", label: "Summary", number: 3 },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);
  const isStepComplete = (stepId: string) => {
    const stepIndex = steps.findIndex(s => s.id === stepId);
    return stepIndex < currentStepIndex;
  };

  const assetName = asset.assetNameEn || `${asset.assetType === "land" ? "Land" : "Building"} in ${asset.city?.nameEn || "Riyadh"}`;

  const handleNext = () => {
    if (currentStep === "introduction") {
      setCurrentStep("asset_details");
    } else if (currentStep === "asset_details") {
      setCurrentStep("summary");
    }
  };

  const handlePrevious = () => {
    if (currentStep === "asset_details") {
      setCurrentStep("introduction");
    } else if (currentStep === "summary") {
      setCurrentStep("asset_details");
    }
  };

  const handleSubmit = () => {
    if (decision) {
      onSubmit(decision, comments);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background">
      <div className="flex h-full">
        <div className="w-64 bg-muted/30 border-r p-6 flex flex-col">
          <div className="mb-8">
            <div className="w-10 h-10 bg-primary/10 rounded flex items-center justify-center mb-4">
              <span className="text-primary font-semibold">M</span>
            </div>
            <h2 className="font-semibold text-lg">Asset registration</h2>
            <p className="text-sm text-muted-foreground">{assetName}</p>
          </div>

          <nav className="space-y-2">
            {steps.map((step) => (
              <div key={step.id} className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                  isStepComplete(step.id)
                    ? "bg-primary text-primary-foreground"
                    : step.id === currentStep
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}>
                  {isStepComplete(step.id) ? <Check className="h-3 w-3" /> : step.number}
                </div>
                <span className={`text-sm ${step.id === currentStep ? "font-medium" : "text-muted-foreground"}`}>
                  {step.label}
                </span>
                {isStepComplete(step.id) && (
                  <Pencil className="h-3 w-3 text-muted-foreground ml-auto" />
                )}
              </div>
            ))}
          </nav>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-end p-4 border-b">
            <Button variant="ghost" onClick={onClose} data-testid="button-cancel-review">
              <X className="h-4 w-4 mr-2" />
              Cancel and close
            </Button>
          </div>

          <ScrollArea className="flex-1">
            <div className="max-w-3xl mx-auto p-8">
              {currentStep === "introduction" && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-2xl font-semibold">Introduction</h1>
                    <p className="text-muted-foreground mt-1">
                      Get to know the process, requirements and details of the review progress.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h2 className="font-semibold">Welcome to Asset registration</h2>
                    <p className="text-sm text-muted-foreground">
                      This form digitizes and automates the multi-step asset registration process for investors in
                      Madares Business. It replaces manual paper approvals with a fully digital, guided workflow.
                    </p>
                  </div>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Request details</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <InfoRow label="Request date" value={formatDate(asset.createdAt)} />
                      <InfoRow label="Requested by" value="School Planning Dept." />
                      <InfoRow label="Ministry official" value="Lima Alamri" />
                      <InfoRow label="Submission to" value="Safety, Security & Facilities Dept." />
                    </CardContent>
                  </Card>

                  <p className="text-sm text-muted-foreground">
                    Compare uploaded attachments with the data in the form. If you need expert validation, add a
                    comment request. Approve - if the asset meets all criteria.
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 border rounded-md">
                      <div>
                        <p className="font-medium text-sm">Asset details</p>
                        <p className="text-xs text-muted-foreground">Review asset details and documents if available.</p>
                      </div>
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                        To review
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-md">
                      <div>
                        <p className="font-medium text-sm">Asset location</p>
                        <p className="text-xs text-muted-foreground">Review asset location and add a photos if available.</p>
                      </div>
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                        To review
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-md">
                      <div>
                        <p className="font-medium text-sm">Features</p>
                        <p className="text-xs text-muted-foreground">Review asset description and features if available.</p>
                      </div>
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                        To review
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="skip-intro" 
                      checked={skipIntro} 
                      onCheckedChange={(checked) => setSkipIntro(checked as boolean)}
                    />
                    <Label htmlFor="skip-intro" className="text-sm">Skip this introduction next time</Label>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleNext} data-testid="button-start-review">
                      Start asset review
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {currentStep === "asset_details" && (
                <div className="space-y-8">
                  <div>
                    <h1 className="text-2xl font-semibold">Asset details</h1>
                    <p className="text-muted-foreground mt-1">
                      Review the data showing the asset adheres to the following regulations.
                    </p>
                  </div>

                  <Card>
                    <CardContent className="pt-6">
                      <SectionHeader 
                        title="Asset details" 
                        description="Review asset details and documents if available."
                        showToReview
                      />
                      <InfoRow label="Asset name" value={assetName} />
                      <InfoRow label="Land code" value={asset.assetCode} />
                      <InfoRow label="Asset size (m²)" value={asset.totalArea?.toLocaleString()} />
                      <InfoRow label="Asset type" value={asset.assetType === "land" ? "Land" : "Building"} />
                      <InfoRow label="Asset sub-type" value="Kindergarten" />
                      <InfoRow label="Educational department" value="Safety & Security Dept." />
                      <InfoRow label="Classification" value="For sale" />
                      <InfoRow label="Attached documents">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <a href="#" className="text-primary hover:underline text-sm">document_1768869391254_0.pdf</a>
                            <span className="text-xs text-muted-foreground">0 KB</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <a href="#" className="text-primary hover:underline text-sm">document_1768869391254_1.pdf</a>
                            <span className="text-xs text-muted-foreground">0 KB</span>
                          </div>
                        </div>
                      </InfoRow>

                      <CommentDisplay 
                        department="School Planning Dept."
                        comment="The asset size seems sufficient for establishing a medium-sized school facility in Riyadh."
                        date={asset.createdAt}
                      />
                      <CommentInput 
                        value={comments.assetDetails}
                        onChange={(v) => setComments(prev => ({ ...prev, assetDetails: v }))}
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <SectionHeader 
                        title="Asset location" 
                        description="Review asset location and add a photos if available."
                        showToReview
                      />
                      <InfoRow label="Region" value={asset.region?.nameEn || "Riyadh"} />
                      <InfoRow label="City" value={asset.city?.nameEn || "Riyadh"} />
                      <InfoRow label="District" value={asset.district?.nameEn || "Al-Olayya"} />
                      <InfoRow label="Short National Address" value="RRMC2286" />
                      <InfoRow label="Latitude" value={asset.latitude?.toString() || "24.7136"} />
                      <InfoRow label="Longitude" value={asset.longitude?.toString() || "46.6753"} />
                      <InfoRow label="Justification">
                        <span className="text-muted-foreground">
                          The selected location is adjacent to an existing educational facility, which may require coordination for shared infrastructure and resources.
                        </span>
                      </InfoRow>
                      <InfoRow label="Aerial photograph">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <a href="#" className="text-primary hover:underline text-sm">photo_1768869391254_0.png</a>
                            <span className="text-xs text-muted-foreground">0 KB</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <a href="#" className="text-primary hover:underline text-sm">photo_1768869391254_1.png</a>
                            <span className="text-xs text-muted-foreground">0 KB</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <a href="#" className="text-primary hover:underline text-sm">photo_1768869391254_2.png</a>
                            <span className="text-xs text-muted-foreground">0 KB</span>
                          </div>
                        </div>
                      </InfoRow>

                      <CommentDisplay 
                        department="School Planning Dept."
                        comment="The asset size seems sufficient for establishing a medium-sized school facility in Riyadh."
                        date={asset.createdAt}
                      />
                      <CommentInput 
                        value={comments.assetLocation}
                        onChange={(v) => setComments(prev => ({ ...prev, assetLocation: v }))}
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <SectionHeader 
                        title="Features" 
                        description="Review asset description and features if available."
                        showToReview
                      />
                      <InfoRow label="Asset description">
                        <span className="text-muted-foreground">
                          Invest in the future with this unique building in Riyadh in Al Olaya. It offers an area of 13 175 m², making it the perfect educational building, and is ready to start immediately.
                        </span>
                      </InfoRow>
                      <InfoRow label="Features">
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                          <li>Prime location in Riyadh, Al Olaya</li>
                          <li>Spacious area of 826,562 m²</li>
                          <li>Excellent investment opportunity in the education sector</li>
                          <li>Close to public transportation</li>
                          <li>Modern infrastructure ready</li>
                        </ul>
                      </InfoRow>

                      <CommentDisplay 
                        department="School Planning Dept."
                        comment="The asset size seems sufficient for establishing a medium-sized school facility in Riyadh."
                        date={asset.createdAt}
                      />
                      <CommentInput 
                        value={comments.features}
                        onChange={(v) => setComments(prev => ({ ...prev, features: v }))}
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <h3 className="font-semibold text-base mb-2">Decision</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Based on the review, choose the appropriate action for this request.
                      </p>
                      <div className="space-y-2">
                        <Label className="text-sm">Decide on an action *</Label>
                        <RadioGroup value={decision || ""} onValueChange={(v) => setDecision(v as "accept" | "reject")}>
                          <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                              <RadioGroupItem value="accept" id="accept" />
                              <Label htmlFor="accept">Accept</Label>
                            </div>
                            <div className="flex items-center gap-2">
                              <RadioGroupItem value="reject" id="reject" />
                              <Label htmlFor="reject">Reject</Label>
                            </div>
                          </div>
                        </RadioGroup>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex items-center justify-between pt-4">
                    <Button variant="ghost" onClick={handlePrevious} data-testid="button-previous-step">
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      Previous step
                    </Button>
                    <Button onClick={handleNext} disabled={!decision} data-testid="button-go-to-summary">
                      Go to summary
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {currentStep === "summary" && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-2xl font-semibold">Summary</h1>
                    <p className="text-muted-foreground mt-1">
                      Check the review request details before sending to the next stakeholder.
                    </p>
                  </div>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-base">Review outcome</h3>
                        <Button variant="ghost" size="sm" className="text-primary">
                          <Pencil className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                      </div>
                      <InfoRow label="Decision">
                        <span className={decision === "accept" ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                          {decision === "accept" ? "Approved" : "Rejected"}
                        </span>
                      </InfoRow>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Review details</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <InfoRow label="Decision date" value={formatDate(new Date())} />
                      <InfoRow label="Submitted by" value="School Planning Dept." />
                      <InfoRow label="Ministry official" value="Lima Alamri" />
                      <InfoRow label="Submission to" value="Safety, Security & Facilities Dept." />
                    </CardContent>
                  </Card>

                  <div className="flex items-center justify-between pt-4">
                    <Button variant="ghost" onClick={handlePrevious} data-testid="button-previous-step-summary">
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      Previous step
                    </Button>
                    <Button onClick={handleSubmit} data-testid="button-submit-decision">
                      Submit decision
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
