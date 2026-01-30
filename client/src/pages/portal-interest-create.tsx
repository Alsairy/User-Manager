import { useState, useEffect } from "react";
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
import { ArrowLeft, Send, Building2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { AssetWithDetails } from "@/lib/schema";
import { 
  investmentPurposeEnum, 
  investmentPurposeLabels, 
  investmentAmountRangeEnum, 
  investmentAmountRangeLabels,
  investmentTimelineEnum,
  investmentTimelineLabels
} from "@/lib/schema";

const DEMO_INVESTOR_ACCOUNT_ID = "demo-investor-001";

const interestFormSchema = z.object({
  assetId: z.string().min(1, "Please select an asset"),
  investmentPurpose: z.enum(investmentPurposeEnum),
  proposedUseDescription: z.string().min(20, "Please provide at least 20 characters"),
  investmentAmountRange: z.enum(investmentAmountRangeEnum).optional(),
  expectedTimeline: z.enum(investmentTimelineEnum).optional(),
  additionalComments: z.string().optional(),
});

type InterestFormValues = z.infer<typeof interestFormSchema>;

export default function PortalInterestCreate() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const searchParams = new URLSearchParams(window.location.search);
  const preselectedAssetId = searchParams.get("assetId") || "";

  const form = useForm<InterestFormValues>({
    resolver: zodResolver(interestFormSchema),
    defaultValues: {
      assetId: preselectedAssetId,
      investmentPurpose: "commercial_development",
      proposedUseDescription: "",
      investmentAmountRange: undefined,
      expectedTimeline: undefined,
      additionalComments: "",
    },
  });

  const { data: assetsData } = useQuery<{ assets: AssetWithDetails[]; total: number }>({
    queryKey: ["/api/portal/assets", "limit=100"],
    queryFn: () => fetch("/api/portal/assets?limit=100").then((r) => r.json()),
  });

  const selectedAssetId = form.watch("assetId");
  const { data: selectedAsset } = useQuery<AssetWithDetails>({
    queryKey: ["/api/portal/assets", selectedAssetId],
    enabled: !!selectedAssetId,
  });

  const submitMutation = useMutation({
    mutationFn: (data: InterestFormValues) =>
      apiRequest("/api/portal/interests", "POST", {
        ...data,
        investorAccountId: DEMO_INVESTOR_ACCOUNT_ID,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portal/interests"] });
      toast({ title: "Interest submitted successfully" });
      setLocation("/portal/interests");
    },
    onError: () => {
      toast({ title: "Failed to submit interest", variant: "destructive" });
    },
  });

  const onSubmit = (data: InterestFormValues) => {
    submitMutation.mutate(data);
  };

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/portal/interests">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">Express Investment Interest</h1>
          <p className="text-sm text-muted-foreground">Submit your interest in an investment opportunity</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Asset Selection</CardTitle>
              <CardDescription>Choose the asset you're interested in</CardDescription>
            </CardHeader>
            <CardContent>
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
                        {assetsData?.assets.map((asset) => (
                          <SelectItem key={asset.id} value={asset.id}>
                            {asset.assetNameEn} - {asset.city?.cityName || "Unknown"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedAsset && (
                <div className="mt-4 p-4 bg-muted rounded-md">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-10 w-10 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{selectedAsset.assetNameEn}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedAsset.city?.cityName} | {selectedAsset.totalArea.toLocaleString()} sqm | {selectedAsset.assetType}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Investment Details</CardTitle>
              <CardDescription>Provide details about your investment interest</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="investmentPurpose"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Investment Purpose</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-purpose">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {investmentPurposeEnum.map((value) => (
                          <SelectItem key={value} value={value}>
                            {investmentPurposeLabels[value]}
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
                name="proposedUseDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Proposed Use Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe how you plan to use or develop this asset..."
                        className="min-h-[100px]"
                        {...field}
                        data-testid="input-description"
                      />
                    </FormControl>
                    <FormDescription>Explain your intended use of the asset in detail</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="investmentAmountRange"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Investment Amount Range</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-amount">
                            <SelectValue placeholder="Select range" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {investmentAmountRangeEnum.map((value) => (
                            <SelectItem key={value} value={value}>
                              {investmentAmountRangeLabels[value]}
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
                  name="expectedTimeline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expected Timeline</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-timeline">
                            <SelectValue placeholder="Select timeline" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {investmentTimelineEnum.map((value) => (
                            <SelectItem key={value} value={value}>
                              {investmentTimelineLabels[value]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="additionalComments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Comments (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any additional information you'd like to share..."
                        className="min-h-[80px]"
                        {...field}
                        data-testid="input-comments"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-4">
            <Link href="/portal/interests">
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
                  Submit Interest
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
