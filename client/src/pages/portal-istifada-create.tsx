import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { ArrowLeft, Send, Landmark, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { AssetWithDetails } from "@shared/schema";
import { istifadaProgramTypeEnum, istifadaProgramTypeLabels } from "@shared/schema";

const DEMO_INVESTOR_ACCOUNT_ID = "demo-investor-001";

const istifadaFormSchema = z.object({
  assetId: z.string().optional(),
  programType: z.enum(istifadaProgramTypeEnum),
  programTitle: z.string().min(5, "Program title must be at least 5 characters"),
  programDescription: z.string().min(20, "Please provide at least 20 characters"),
  targetBeneficiaries: z.string().optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  budgetEstimate: z.string().optional(),
});

type IstifadaFormValues = z.infer<typeof istifadaFormSchema>;

export default function PortalIstifadaCreate() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<IstifadaFormValues>({
    resolver: zodResolver(istifadaFormSchema),
    defaultValues: {
      assetId: "",
      programType: "educational_services",
      programTitle: "",
      programDescription: "",
      targetBeneficiaries: "",
      startDate: "",
      endDate: "",
      budgetEstimate: "",
    },
  });

  const { data: assetsData } = useQuery<{ assets: AssetWithDetails[]; total: number }>({
    queryKey: ["/api/portal/assets", { limit: 100 }],
  });

  const submitMutation = useMutation({
    mutationFn: (data: IstifadaFormValues) =>
      apiRequest("/api/portal/istifada", "POST", {
        ...data,
        investorAccountId: DEMO_INVESTOR_ACCOUNT_ID,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portal/istifada"] });
      toast({ title: "Istifada request submitted successfully" });
      setLocation("/portal/istifada");
    },
    onError: () => {
      toast({ title: "Failed to submit request", variant: "destructive" });
    },
  });

  const onSubmit = (data: IstifadaFormValues) => {
    submitMutation.mutate(data);
  };

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/portal/istifada">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">Istifada Program Request</h1>
          <p className="text-sm text-muted-foreground">Apply to utilize an asset for a program</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Program Information</CardTitle>
              <CardDescription>Provide details about your program</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="programType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Program Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-program-type">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {istifadaProgramTypeEnum.map((value) => (
                          <SelectItem key={value} value={value}>
                            {istifadaProgramTypeLabels[value]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="programTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Program Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter program title" {...field} data-testid="input-title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="programDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Program Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your program in detail..."
                        className="min-h-[120px]"
                        {...field}
                        data-testid="input-description"
                      />
                    </FormControl>
                    <FormDescription>Explain the objectives, activities, and expected outcomes</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="targetBeneficiaries"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Beneficiaries (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Students, Elderly, Youth" {...field} data-testid="input-beneficiaries" />
                    </FormControl>
                    <FormDescription>Who will benefit from this program?</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Asset & Timeline</CardTitle>
              <CardDescription>Select an asset and specify the program duration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="assetId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Asset (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-asset">
                          <SelectValue placeholder="Select an asset (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {assetsData?.assets.map((asset) => (
                          <SelectItem key={asset.id} value={asset.id}>
                            {asset.assetNameEn} - {asset.city?.cityName || "Unknown"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>Leave empty if you're open to any suitable asset</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-start-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-end-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="budgetEstimate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Budget Estimate (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 50,000 SAR" {...field} data-testid="input-budget" />
                    </FormControl>
                    <FormDescription>Estimated budget for the program</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-4">
            <Link href="/portal/istifada">
              <Button type="button" variant="outline" data-testid="button-cancel">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={submitMutation.isPending} data-testid="button-submit">
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Request
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
