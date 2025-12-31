import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Save, Send, Building2, DollarSign, ClipboardList, Wrench } from "lucide-react";
import { insertIsnadFormSchema, InsertIsnadForm, AssetWithDetails } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const formSteps = [
  { id: "asset", title: "Select Asset", icon: Building2 },
  { id: "investment", title: "Investment Criteria", icon: ClipboardList },
  { id: "technical", title: "Technical Assessment", icon: Wrench },
  { id: "financial", title: "Financial Analysis", icon: DollarSign },
];

const extendedSchema = z.object({
  assetId: z.string().min(1, "Please select an asset"),
  investmentPurpose: z.string().min(10, "Investment purpose must be at least 10 characters"),
  revenueProjection: z.string().optional(),
  projectTimeline: z.string().min(1, "Project timeline is required"),
  requiredModifications: z.string().optional(),
  complianceRequirements: z.string().optional(),
  riskAssessment: z.string().min(20, "Risk assessment must be at least 20 characters"),
  structuralCondition: z.string().optional(),
  utilitiesAvailability: z.string().optional(),
  accessInfrastructure: z.string().optional(),
  environmentalConsiderations: z.string().optional(),
  zoningCompliance: z.string().optional(),
  currentValuation: z.coerce.number().min(0).default(0),
  outstandingDues: z.coerce.number().min(0).default(0),
  maintenanceCosts: z.coerce.number().min(0).default(0),
  expectedReturns: z.coerce.number().min(0).default(0),
  breakEvenAnalysis: z.string().optional(),
});

type FormData = z.infer<typeof extendedSchema>;

export default function IsnadFormCreatePage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);

  const { data: assets, isLoading: loadingAssets } = useQuery<{ assets: AssetWithDetails[] }>({
    queryKey: ["/api/assets/bank"],
    queryFn: () => fetch("/api/assets/bank?limit=100&visibilityStatus=all").then((r) => r.json()),
  });

  const availableAssets = assets?.assets?.filter((a) => !a.hasActiveIsnad) || [];

  const form = useForm<FormData>({
    resolver: zodResolver(extendedSchema),
    defaultValues: {
      assetId: "",
      investmentPurpose: "",
      revenueProjection: "",
      projectTimeline: "",
      requiredModifications: "",
      complianceRequirements: "",
      riskAssessment: "",
      structuralCondition: "",
      utilitiesAvailability: "",
      accessInfrastructure: "",
      environmentalConsiderations: "",
      zoningCompliance: "",
      currentValuation: 0,
      outstandingDues: 0,
      maintenanceCosts: 0,
      expectedReturns: 0,
      breakEvenAnalysis: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload: InsertIsnadForm = {
        assetId: data.assetId,
        investmentCriteria: {
          investmentPurpose: data.investmentPurpose,
          revenueProjection: data.revenueProjection || "",
          projectTimeline: data.projectTimeline,
          requiredModifications: data.requiredModifications || "",
          complianceRequirements: data.complianceRequirements || "",
          riskAssessment: data.riskAssessment,
        },
        technicalAssessment: {
          structuralCondition: data.structuralCondition || "",
          utilitiesAvailability: data.utilitiesAvailability || "",
          accessInfrastructure: data.accessInfrastructure || "",
          environmentalConsiderations: data.environmentalConsiderations || "",
          zoningCompliance: data.zoningCompliance || "",
        },
        financialAnalysis: {
          currentValuation: data.currentValuation,
          outstandingDues: data.outstandingDues,
          maintenanceCosts: data.maintenanceCosts,
          expectedReturns: data.expectedReturns,
          breakEvenAnalysis: data.breakEvenAnalysis || "",
        },
      };
      return apiRequest("POST", "/api/isnad/forms", payload);
    },
    onSuccess: async (response) => {
      const form = await response.json();
      toast({ title: "ISNAD form created successfully" });
      queryClient.invalidateQueries({ predicate: (q) => (q.queryKey[0]?.toString().includes("/api/isnad") ?? false) });
      navigate(`/isnad/forms/${form.id}`);
    },
    onError: (error: any) => {
      toast({ title: "Failed to create form", description: error.message, variant: "destructive" });
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (formId: string) => {
      return apiRequest("POST", `/api/isnad/forms/${formId}/submit`);
    },
    onSuccess: () => {
      toast({ title: "ISNAD form submitted for review" });
      queryClient.invalidateQueries({ predicate: (q) => (q.queryKey[0]?.toString().includes("/api/isnad") ?? false) });
      navigate("/isnad/forms");
    },
  });

  const handleSubmit = async (data: FormData, submitForReview: boolean = false) => {
    const result = await createMutation.mutateAsync(data);
    if (submitForReview) {
      const form = await result.json();
      await submitMutation.mutateAsync(form.id);
    }
  };

  const progress = ((currentStep + 1) / formSteps.length) * 100;

  const canProceed = () => {
    const values = form.getValues();
    if (currentStep === 0) return !!values.assetId;
    if (currentStep === 1) return !!values.investmentPurpose && !!values.projectTimeline && !!values.riskAssessment;
    if (currentStep === 2) return true; // Technical assessment fields are optional
    return true;
  };

  const selectedAsset = availableAssets.find((a) => a.id === form.watch("assetId"));

  return (
    <div className="p-6 space-y-6" data-testid="page-isnad-form-create">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/isnad/forms")} data-testid="button-back">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Create ISNAD Request</h1>
          <p className="text-muted-foreground">Initiate investment suitability assessment</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                {formSteps.map((step, i) => (
                  <div
                    key={step.id}
                    className={`flex items-center gap-2 ${i <= currentStep ? "text-primary" : "text-muted-foreground"}`}
                  >
                    <step.icon className="w-4 h-4" />
                    <span>{step.title}</span>
                  </div>
                ))}
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => handleSubmit(data, false))}>
            {currentStep === 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Select Asset</CardTitle>
                  <CardDescription>Choose an asset from the asset bank to assess for investment</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loadingAssets ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <FormField
                      control={form.control}
                      name="assetId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Asset</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-asset">
                                <SelectValue placeholder="Select an asset" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {availableAssets.map((asset) => (
                                <SelectItem key={asset.id} value={asset.id}>
                                  {asset.assetNameEn} ({asset.assetCode})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>Only completed assets without active ISNAD forms are shown</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {selectedAsset && (
                    <Card className="bg-muted/50">
                      <CardContent className="pt-4">
                        <h4 className="font-medium mb-2">Asset Details</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Type:</span>{" "}
                            <span className="capitalize">{selectedAsset.assetType}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Area:</span>{" "}
                            {selectedAsset.totalArea.toLocaleString()} sqm
                          </div>
                          <div>
                            <span className="text-muted-foreground">Location:</span>{" "}
                            {selectedAsset.region?.nameEn}, {selectedAsset.city?.nameEn}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Ownership:</span>{" "}
                            <span className="capitalize">{selectedAsset.ownershipType?.replace("_", " ")}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            )}

            {currentStep === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle>Investment Criteria</CardTitle>
                  <CardDescription>Define the investment opportunity and assessment parameters</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="investmentPurpose"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Investment Purpose</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe the intended investment use for this asset..."
                            className="min-h-[100px]"
                            data-testid="input-investment-purpose"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="projectTimeline"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Project Timeline</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 12-18 months" data-testid="input-timeline" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="revenueProjection"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Revenue Projection (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Expected annual revenue" data-testid="input-revenue" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="requiredModifications"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Required Modifications (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Any modifications needed for the intended use..."
                            data-testid="input-modifications"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="riskAssessment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Risk Assessment</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Identify potential risks and mitigation strategies..."
                            className="min-h-[100px]"
                            data-testid="input-risk"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            )}

            {currentStep === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle>Technical Assessment</CardTitle>
                  <CardDescription>Evaluate the technical suitability of the asset for investment</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="structuralCondition"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Structural Condition (for buildings)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe the structural condition and any needed repairs..."
                            data-testid="input-structural"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="utilitiesAvailability"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Utilities Availability</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Water, Electricity, Sewage" data-testid="input-utilities" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="accessInfrastructure"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Access & Infrastructure</FormLabel>
                          <FormControl>
                            <Input placeholder="Roads, parking, accessibility" data-testid="input-access" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="environmentalConsiderations"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Environmental Considerations</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Any environmental factors or concerns..."
                            data-testid="input-environmental"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="zoningCompliance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Zoning & Legal Compliance</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Zoning restrictions, legal requirements, permits needed..."
                            data-testid="input-zoning"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            )}

            {currentStep === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle>Financial Analysis</CardTitle>
                  <CardDescription>Provide financial details for investment evaluation</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="currentValuation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Valuation (SAR)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0" data-testid="input-valuation" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="outstandingDues"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Outstanding Dues (SAR)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0" data-testid="input-dues" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="maintenanceCosts"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Annual Maintenance Costs (SAR)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0" data-testid="input-maintenance" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="expectedReturns"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expected Annual Returns (SAR)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0" data-testid="input-returns" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="breakEvenAnalysis"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Break-Even Analysis (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Provide break-even analysis details..."
                            data-testid="input-breakeven"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            )}

            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
                data-testid="button-previous"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              <div className="flex gap-2">
                {currentStep < formSteps.length - 1 ? (
                  <Button
                    type="button"
                    onClick={() => setCurrentStep(currentStep + 1)}
                    disabled={!canProceed()}
                    data-testid="button-next"
                  >
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <>
                    <Button
                      type="submit"
                      variant="outline"
                      disabled={createMutation.isPending}
                      data-testid="button-save-draft"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save as Draft
                    </Button>
                    <Button
                      type="button"
                      onClick={form.handleSubmit((data) => handleSubmit(data, true))}
                      disabled={createMutation.isPending || submitMutation.isPending}
                      data-testid="button-submit"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Submit for Review
                    </Button>
                  </>
                )}
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
