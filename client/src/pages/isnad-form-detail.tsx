import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Send,
  AlertTriangle,
  FileText,
  User,
  Calendar,
  MapPin,
  DollarSign,
  MessageSquareMore,
  Wrench,
} from "lucide-react";
import {
  IsnadFormWithDetails,
  IsnadApproval,
  isnadStatusLabels,
  isnadStageLabels,
  isnadActionLabels,
  IsnadStatus,
  departmentLabels,
  DepartmentReviewer,
} from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const statusColors: Record<IsnadStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  pending_verification: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  verification_due: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  changes_requested: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  verified_filled: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
  investment_agency_review: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  in_package: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  pending_ceo: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  pending_minister: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  approved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  cancelled: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
};

export default function IsnadFormDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const [requestInfoOpen, setRequestInfoOpen] = useState(false);
  const [comments, setComments] = useState("");
  const [returnComments, setReturnComments] = useState("");
  const [requestInfoComments, setRequestInfoComments] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionJustification, setRejectionJustification] = useState("");

  const { data: form, isLoading } = useQuery<IsnadFormWithDetails>({
    queryKey: ["/api/isnad/forms", id],
    queryFn: () => fetch(`/api/isnad/forms/${id}`).then((r) => r.json()),
    enabled: !!id,
  });

  const { data: approvals } = useQuery<IsnadApproval[]>({
    queryKey: ["/api/isnad/forms", id, "approvals"],
    queryFn: () => fetch(`/api/isnad/forms/${id}/approvals`).then((r) => r.json()),
    enabled: !!id,
  });

  const submitMutation = useMutation({
    mutationFn: async () => apiRequest("POST", `/api/isnad/forms/${id}/submit`),
    onSuccess: () => {
      toast({ title: "Request submitted for review" });
      queryClient.invalidateQueries({ predicate: (q) => (q.queryKey[0]?.toString().includes("/api/isnad") ?? false) });
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async (action: { action: string; comments?: string; rejectionReason?: string; rejectionJustification?: string }) => {
      return apiRequest("POST", `/api/isnad/forms/${id}/review`, action);
    },
    onSuccess: () => {
      toast({ title: "Review action processed" });
      queryClient.invalidateQueries({ predicate: (q) => (q.queryKey[0]?.toString().includes("/api/isnad") ?? false) });
      setApproveOpen(false);
      setRejectOpen(false);
      setReturnOpen(false);
      setRequestInfoOpen(false);
      setComments("");
      setReturnComments("");
      setRequestInfoComments("");
      setRejectionReason("");
      setRejectionJustification("");
    },
  });

  const canReview = form && ["pending_verification", "verification_due", "verified_filled", "investment_agency_review", "pending_ceo", "pending_minister"].includes(form.status);
  const canSubmit = form && form.status === "draft";
  const canEdit = form && (form.status === "draft" || form.status === "changes_requested");
  const isDepartmentReview = form && form.currentStage === "department_review";

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-16 text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">ISNAD form not found</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate("/isnad/forms")}>
              Back to Forms
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="page-isnad-form-detail">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/isnad/forms")} data-testid="button-back">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold font-mono">{form.formCode}</h1>
              <Badge className={statusColors[form.status]}>{isnadStatusLabels[form.status]}</Badge>
            </div>
            <p className="text-muted-foreground">{form.asset?.assetNameEn}</p>
          </div>
        </div>

        <div className="flex gap-2">
          {canEdit && (
            <Button variant="outline" onClick={() => navigate(`/isnad/forms/${id}/edit`)} data-testid="button-edit">
              Edit Form
            </Button>
          )}
          {canSubmit && (
            <Button onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending} data-testid="button-submit">
              <Send className="w-4 h-4 mr-2" />
              Submit for Review
            </Button>
          )}
          {canReview && (
            <>
              <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
                <DialogTrigger asChild>
                  <Button variant="default" data-testid="button-approve">
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Approve ISNAD Request</DialogTitle>
                    <DialogDescription>Confirm approval to move this form to the next review stage.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Comments (Optional)</Label>
                      <Textarea
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        placeholder="Add any comments..."
                        data-testid="input-approve-comments"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setApproveOpen(false)}>Cancel</Button>
                    <Button
                      onClick={() => reviewMutation.mutate({ action: "approve", comments })}
                      disabled={reviewMutation.isPending}
                      data-testid="button-confirm-approve"
                    >
                      Confirm Approval
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={returnOpen} onOpenChange={setReturnOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" data-testid="button-return">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Return
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Return for Modification</DialogTitle>
                    <DialogDescription>Return this form to the initiator for modifications.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Comments</Label>
                      <Textarea
                        value={returnComments}
                        onChange={(e) => setReturnComments(e.target.value)}
                        placeholder="Specify what needs to be modified..."
                        data-testid="input-return-comments"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setReturnOpen(false)}>Cancel</Button>
                    <Button
                      onClick={() => reviewMutation.mutate({ action: "return", comments: returnComments })}
                      disabled={reviewMutation.isPending}
                      data-testid="button-confirm-return"
                    >
                      Confirm Return
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive" data-testid="button-reject">
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Reject ISNAD Request</DialogTitle>
                    <DialogDescription>Provide a detailed rejection reason and justification.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Rejection Reason</Label>
                      <Textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Brief reason for rejection..."
                        data-testid="input-rejection-reason"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Justification (minimum 50 characters)</Label>
                      <Textarea
                        value={rejectionJustification}
                        onChange={(e) => setRejectionJustification(e.target.value)}
                        placeholder="Detailed justification..."
                        className="min-h-[100px]"
                        data-testid="input-rejection-justification"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
                    <Button
                      variant="destructive"
                      onClick={() => reviewMutation.mutate({ action: "reject", rejectionReason, rejectionJustification })}
                      disabled={reviewMutation.isPending || rejectionJustification.length < 50}
                      data-testid="button-confirm-reject"
                    >
                      Confirm Rejection
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={requestInfoOpen} onOpenChange={setRequestInfoOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" data-testid="button-request-info">
                    <MessageSquareMore className="w-4 h-4 mr-2" />
                    Request Info
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Request Additional Information</DialogTitle>
                    <DialogDescription>Request clarification or additional details from the form initiator.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Questions / Information Needed</Label>
                      <Textarea
                        value={requestInfoComments}
                        onChange={(e) => setRequestInfoComments(e.target.value)}
                        placeholder="Specify what additional information or clarification is needed..."
                        className="min-h-[100px]"
                        data-testid="input-request-info"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setRequestInfoOpen(false)}>Cancel</Button>
                    <Button
                      onClick={() => reviewMutation.mutate({ action: "request_info", comments: requestInfoComments })}
                      disabled={reviewMutation.isPending || !requestInfoComments.trim()}
                      data-testid="button-confirm-request-info"
                    >
                      Send Request
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Asset Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Asset Name</p>
                  <p className="font-medium">{form.asset?.assetNameEn}</p>
                  <p className="text-sm text-muted-foreground">{form.asset?.assetNameAr}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Asset Code</p>
                  <p className="font-mono font-medium">{form.asset?.assetCode}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium capitalize">{form.asset?.assetType}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Area</p>
                  <p className="font-medium">{form.asset?.totalArea.toLocaleString()} sqm</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    Location
                  </p>
                  <p className="font-medium">
                    {form.asset?.region?.nameEn}, {form.asset?.city?.nameEn}, {form.asset?.district?.nameEn}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {form.investmentCriteria && (
            <Card>
              <CardHeader>
                <CardTitle>Investment Criteria</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Investment Purpose</p>
                  <p>{form.investmentCriteria.investmentPurpose}</p>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Project Timeline</p>
                    <p>{form.investmentCriteria.projectTimeline}</p>
                  </div>
                  {form.investmentCriteria.revenueProjection && (
                    <div>
                      <p className="text-sm text-muted-foreground">Revenue Projection</p>
                      <p>{form.investmentCriteria.revenueProjection}</p>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Risk Assessment</p>
                  <p>{form.investmentCriteria.riskAssessment}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {form.technicalAssessment && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="w-5 h-5" />
                  Technical Assessment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {form.technicalAssessment.structuralCondition && (
                  <div>
                    <p className="text-sm text-muted-foreground">Structural Condition</p>
                    <p>{form.technicalAssessment.structuralCondition}</p>
                  </div>
                )}
                <div className="grid md:grid-cols-2 gap-4">
                  {form.technicalAssessment.utilitiesAvailability && (
                    <div>
                      <p className="text-sm text-muted-foreground">Utilities Availability</p>
                      <p>{form.technicalAssessment.utilitiesAvailability}</p>
                    </div>
                  )}
                  {form.technicalAssessment.accessInfrastructure && (
                    <div>
                      <p className="text-sm text-muted-foreground">Access & Infrastructure</p>
                      <p>{form.technicalAssessment.accessInfrastructure}</p>
                    </div>
                  )}
                </div>
                {form.technicalAssessment.environmentalConsiderations && (
                  <div>
                    <p className="text-sm text-muted-foreground">Environmental Considerations</p>
                    <p>{form.technicalAssessment.environmentalConsiderations}</p>
                  </div>
                )}
                {form.technicalAssessment.zoningCompliance && (
                  <div>
                    <p className="text-sm text-muted-foreground">Zoning & Legal Compliance</p>
                    <p>{form.technicalAssessment.zoningCompliance}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {form.financialAnalysis && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Financial Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Current Valuation</p>
                    <p className="font-medium">SAR {form.financialAnalysis.currentValuation.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Outstanding Dues</p>
                    <p className="font-medium">SAR {form.financialAnalysis.outstandingDues.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Maintenance Costs</p>
                    <p className="font-medium">SAR {form.financialAnalysis.maintenanceCosts.toLocaleString()}/year</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Expected Returns</p>
                    <p className="font-medium">SAR {form.financialAnalysis.expectedReturns.toLocaleString()}/year</p>
                  </div>
                  {form.financialAnalysis.breakEvenAnalysis && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-muted-foreground">Break-Even Analysis</p>
                      <p>{form.financialAnalysis.breakEvenAnalysis}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Current Stage</span>
                  <span className="font-medium">{isnadStageLabels[form.currentStage]}</span>
                </div>
                {form.slaStatus && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">SLA Status</span>
                    <Badge variant="outline" className="capitalize">{form.slaStatus.replace("_", " ")}</Badge>
                  </div>
                )}
                {form.returnCount > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Return Count</span>
                    <Badge variant="outline">{form.returnCount}</Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {form.departmentApprovals && form.departmentApprovals.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Department Review Status</CardTitle>
                <CardDescription>
                  All 19 departments must approve. A single rejection will reject the entire form.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2 text-muted-foreground">Core Departments</h4>
                    <div className="space-y-2">
                      {form.departmentApprovals
                        .filter((dept) => ["school_planning", "safety_security_facilities", "investment_partnerships"].includes(dept.department))
                        .map((dept) => (
                          <div
                            key={dept.department}
                            className="flex items-center justify-between gap-2 p-2 rounded-md border"
                            data-testid={`dept-approval-${dept.department}`}
                          >
                            <div className="flex items-center gap-2">
                              {dept.status === "approved" && (
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                              )}
                              {dept.status === "rejected" && (
                                <XCircle className="w-4 h-4 text-red-600" />
                              )}
                              {dept.status === "modification_requested" && (
                                <RotateCcw className="w-4 h-4 text-amber-600" />
                              )}
                              {dept.status === "pending" && (
                                <Clock className="w-4 h-4 text-muted-foreground" />
                              )}
                              <span className="text-sm font-medium">
                                {departmentLabels[dept.department as DepartmentReviewer]}
                              </span>
                            </div>
                            <Badge
                              variant="outline"
                              className={
                                dept.status === "approved"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                  : dept.status === "rejected"
                                  ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                  : dept.status === "modification_requested"
                                  ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
                                  : ""
                              }
                            >
                              {dept.status === "modification_requested" ? "Changes Requested" : dept.status.charAt(0).toUpperCase() + dept.status.slice(1)}
                            </Badge>
                          </div>
                        ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2 text-muted-foreground">Regional Education Departments</h4>
                    <div className="space-y-2">
                      {form.departmentApprovals
                        .filter((dept) => !["school_planning", "safety_security_facilities", "investment_partnerships"].includes(dept.department))
                        .map((dept) => (
                          <div
                            key={dept.department}
                            className="flex items-center justify-between gap-2 p-2 rounded-md border"
                            data-testid={`dept-approval-${dept.department}`}
                          >
                            <div className="flex items-center gap-2">
                              {dept.status === "approved" && (
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                              )}
                              {dept.status === "rejected" && (
                                <XCircle className="w-4 h-4 text-red-600" />
                              )}
                              {dept.status === "modification_requested" && (
                                <RotateCcw className="w-4 h-4 text-amber-600" />
                              )}
                              {dept.status === "pending" && (
                                <Clock className="w-4 h-4 text-muted-foreground" />
                              )}
                              <span className="text-sm font-medium">
                                {departmentLabels[dept.department as DepartmentReviewer]}
                              </span>
                            </div>
                            <Badge
                              variant="outline"
                              className={
                                dept.status === "approved"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                  : dept.status === "rejected"
                                  ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                  : dept.status === "modification_requested"
                                  ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
                                  : ""
                              }
                            >
                              {dept.status === "modification_requested" ? "Changes Requested" : dept.status.charAt(0).toUpperCase() + dept.status.slice(1)}
                            </Badge>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
                {form.currentStage === "department_review" && (
                  <p className="mt-4 text-xs text-muted-foreground">
                    {form.departmentApprovals.filter((d) => d.status === "approved").length} of{" "}
                    {form.departmentApprovals.length} departments have approved
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Created by:</span>
                <span>{form.createdByUser?.email || "Unknown"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Created:</span>
                <span>{new Date(form.createdAt).toLocaleDateString()}</span>
              </div>
              {form.submittedAt && (
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Submitted:</span>
                  <span>{new Date(form.submittedAt).toLocaleDateString()}</span>
                </div>
              )}
              {form.completedAt && (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Completed:</span>
                  <span>{new Date(form.completedAt).toLocaleDateString()}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Approval History</CardTitle>
            </CardHeader>
            <CardContent>
              {approvals && approvals.length > 0 ? (
                <div className="space-y-3">
                  {approvals.map((approval) => (
                    <div key={approval.id} className="flex items-start gap-3 text-sm">
                      <div className="mt-1">
                        {approval.action === "approved" && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                        {approval.action === "rejected" && <XCircle className="w-4 h-4 text-red-600" />}
                        {approval.action === "modification_requested" && <RotateCcw className="w-4 h-4 text-amber-600" />}
                        {approval.action === "request_info" && <AlertTriangle className="w-4 h-4 text-yellow-600" />}
                        {!["approved", "rejected", "modification_requested", "request_info"].includes(approval.action) && (
                          <Clock className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{isnadActionLabels[approval.action]}</p>
                        <p className="text-muted-foreground">{isnadStageLabels[approval.stage]}</p>
                        {approval.comments && <p className="mt-1 text-muted-foreground italic">{approval.comments}</p>}
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(approval.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No approval history yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
