import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, addYears } from "date-fns";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Calendar as CalendarIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import type { Asset, AssetWithDetails, Investor } from "@shared/schema";

const steps = [
  { id: 1, title: "Asset Selection", description: "Select asset and land code" },
  { id: 2, title: "Investor", description: "Select or create investor" },
  { id: 3, title: "Contract Terms", description: "Rental amount and duration" },
  { id: 4, title: "Dates", description: "Signing and contract dates" },
  { id: 5, title: "Additional Info", description: "Notes and conditions" },
  { id: 6, title: "Review", description: "Review and submit" },
];

const formSchema = z.object({
  landCode: z.string().regex(/^[A-Z]{3}-\d{1,6}$/, "Land code must be format XXX-### (e.g., RYD-001)"),
  assetId: z.string().min(1, "Asset is required"),
  investorId: z.string().min(1, "Investor is required"),
  annualRentalAmount: z.coerce.number().positive("Amount must be positive"),
  vatRate: z.coerce.number().refine((v) => [0, 5, 15].includes(v), "VAT rate must be 0%, 5%, or 15%"),
  contractDuration: z.coerce.number().int().positive("Duration must be at least 1 year"),
  signingDate: z.string().min(1, "Signing date is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  notes: z.string().optional(),
  specialConditions: z.string().optional(),
  approvalAuthority: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function ContractCreatePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(1);

  const { data: assetsData, isLoading: isLoadingAssets } = useQuery<{ assets: AssetWithDetails[]; total: number }>({
    queryKey: ["/api/assets/bank", { status: "approved", page: 1, limit: 100 }],
  });

  const { data: investors = [], isLoading: isLoadingInvestors } = useQuery<Investor[]>({
    queryKey: ["/api/investors"],
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      landCode: "",
      assetId: "",
      investorId: "",
      annualRentalAmount: 0,
      vatRate: 15,
      contractDuration: 1,
      signingDate: format(new Date(), "yyyy-MM-dd"),
      startDate: format(new Date(), "yyyy-MM-dd"),
      endDate: format(addYears(new Date(), 1), "yyyy-MM-dd"),
      notes: "",
      specialConditions: "",
      approvalAuthority: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const selectedAsset = assets.find((a) => a.id === data.assetId);
      const selectedInvestor = investors.find((i) => i.id === data.investorId);

      if (!selectedAsset || !selectedInvestor) {
        throw new Error("Invalid asset or investor selection");
      }

      const payload = {
        ...data,
        assetNameAr: selectedAsset.assetNameAr,
        assetNameEn: selectedAsset.assetNameEn,
        investorNameAr: selectedInvestor.nameAr,
        investorNameEn: selectedInvestor.nameEn,
      };

      return await apiRequest("POST", "/api/contracts", payload);
    },
    onSuccess: async (response) => {
      const contract = await response.json();
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      toast({ title: "Contract created successfully" });
      setLocation(`/contracts/${contract.id}`);
    },
    onError: (error: Error) => {
      toast({ title: error.message || "Failed to create contract", variant: "destructive" });
    },
  });

  const assets = assetsData?.assets ?? [];

  const selectedAsset = assets.find((a) => a.id === form.watch("assetId"));
  const selectedInvestor = investors.find((i) => i.id === form.watch("investorId"));

  const handleNext = async () => {
    let fieldsToValidate: (keyof FormValues)[] = [];
    switch (step) {
      case 1: fieldsToValidate = ["landCode", "assetId"]; break;
      case 2: fieldsToValidate = ["investorId"]; break;
      case 3: fieldsToValidate = ["annualRentalAmount", "vatRate", "contractDuration"]; break;
      case 4: fieldsToValidate = ["signingDate", "startDate", "endDate"]; break;
      case 5: fieldsToValidate = []; break;
    }

    const valid = await form.trigger(fieldsToValidate);
    if (valid) {
      if (step < 6) {
        setStep(step + 1);
      }
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const onSubmit = (data: FormValues) => {
    createMutation.mutate(data);
  };

  const updateEndDate = (startDate: string, duration: number) => {
    const start = new Date(startDate);
    const end = addYears(start, duration);
    form.setValue("endDate", format(end, "yyyy-MM-dd"));
  };

  const annualAmount = form.watch("annualRentalAmount") || 0;
  const vatRate = form.watch("vatRate") || 0;
  const duration = form.watch("contractDuration") || 1;
  const totalAnnual = annualAmount * (1 + vatRate / 100);
  const totalContract = totalAnnual * duration;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-SA", {
      style: "currency",
      currency: "SAR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  if (isLoadingAssets || isLoadingInvestors) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/contracts")} data-testid="button-back">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">Create Contract</h1>
          <p className="text-muted-foreground text-sm">Step {step} of 6: {steps[step - 1].description}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        {steps.map((s, i) => (
          <div key={s.id} className="flex items-center">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                step > s.id ? "bg-primary text-primary-foreground" :
                step === s.id ? "bg-primary text-primary-foreground" :
                "bg-muted text-muted-foreground"
              )}
            >
              {step > s.id ? <Check className="h-4 w-4" /> : s.id}
            </div>
            {i < steps.length - 1 && (
              <div className={cn("w-8 h-0.5", step > s.id ? "bg-primary" : "bg-muted")} />
            )}
          </div>
        ))}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>{steps[step - 1].title}</CardTitle>
              <CardDescription>{steps[step - 1].description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {step === 1 && (
                <>
                  <FormField
                    control={form.control}
                    name="landCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Land Code</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="RYD-001"
                            {...field}
                            className="uppercase"
                            data-testid="input-land-code"
                          />
                        </FormControl>
                        <FormDescription>Format: XXX-### (e.g., RYD-001)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                            {assets.map((asset) => (
                              <SelectItem key={asset.id} value={asset.id}>
                                {asset.assetCode} - {asset.assetNameEn}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {selectedAsset && (
                    <div className="p-4 bg-muted rounded-md space-y-1">
                      <p className="font-medium">{selectedAsset.assetNameEn}</p>
                      <p className="text-sm text-muted-foreground">{selectedAsset.assetNameAr}</p>
                      <p className="text-sm">
                        {selectedAsset.district?.nameEn ?? selectedAsset.districtId} - {selectedAsset.city?.nameEn ?? selectedAsset.cityId}, {selectedAsset.region?.nameEn ?? selectedAsset.regionId}
                      </p>
                    </div>
                  )}
                </>
              )}

              {step === 2 && (
                <>
                  <FormField
                    control={form.control}
                    name="investorId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Investor</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-investor">
                              <SelectValue placeholder="Select an investor" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {investors.map((investor) => (
                              <SelectItem key={investor.id} value={investor.id}>
                                {investor.investorCode} - {investor.nameEn}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {selectedInvestor && (
                    <div className="p-4 bg-muted rounded-md space-y-1">
                      <p className="font-medium">{selectedInvestor.nameEn}</p>
                      <p className="text-sm text-muted-foreground">{selectedInvestor.nameAr}</p>
                      {selectedInvestor.email && <p className="text-sm">{selectedInvestor.email}</p>}
                      {selectedInvestor.phone && <p className="text-sm">{selectedInvestor.phone}</p>}
                    </div>
                  )}
                  {investors.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No investors found. Please create an investor first in the Investors section.
                    </p>
                  )}
                </>
              )}

              {step === 3 && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="annualRentalAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Annual Rental Amount (SAR)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="100000"
                              {...field}
                              data-testid="input-annual-amount"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="vatRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>VAT Rate</FormLabel>
                          <Select onValueChange={field.onChange} value={String(field.value)}>
                            <FormControl>
                              <SelectTrigger data-testid="select-vat">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="0">0%</SelectItem>
                              <SelectItem value="5">5%</SelectItem>
                              <SelectItem value="15">15%</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="contractDuration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contract Duration (Years)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              updateEndDate(form.getValues("startDate"), Number(e.target.value));
                            }}
                            data-testid="input-duration"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="p-4 bg-muted rounded-md space-y-2">
                    <div className="flex justify-between">
                      <span>Annual Amount:</span>
                      <span className="font-medium">{formatCurrency(annualAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>VAT ({vatRate}%):</span>
                      <span className="font-medium">{formatCurrency(annualAmount * vatRate / 100)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span>Total Annual:</span>
                      <span className="font-semibold">{formatCurrency(totalAnnual)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span>Total Contract ({duration} year{duration > 1 ? "s" : ""}):</span>
                      <span className="font-bold text-lg">{formatCurrency(totalContract)}</span>
                    </div>
                  </div>
                </>
              )}

              {step === 4 && (
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="signingDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Signing Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button variant="outline" className="w-full justify-start" data-testid="input-signing-date">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? format(new Date(field.value), "PPP") : "Pick a date"}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value ? new Date(field.value) : undefined}
                              onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button variant="outline" className="w-full justify-start" data-testid="input-start-date">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? format(new Date(field.value), "PPP") : "Pick a date"}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value ? new Date(field.value) : undefined}
                              onSelect={(date) => {
                                const dateStr = date ? format(date, "yyyy-MM-dd") : "";
                                field.onChange(dateStr);
                                if (dateStr) {
                                  updateEndDate(dateStr, form.getValues("contractDuration"));
                                }
                              }}
                            />
                          </PopoverContent>
                        </Popover>
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
                          <Button variant="outline" className="w-full justify-start" disabled data-testid="input-end-date">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(new Date(field.value), "PPP") : "Auto-calculated"}
                          </Button>
                        </FormControl>
                        <FormDescription>Calculated from start date and duration</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {step === 5 && (
                <>
                  <FormField
                    control={form.control}
                    name="approvalAuthority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Approval Authority</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Board of Directors" {...field} data-testid="input-approval-authority" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="specialConditions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Special Conditions</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Any special conditions..." rows={3} {...field} data-testid="input-conditions" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Additional notes..." rows={3} {...field} data-testid="input-notes" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {step === 6 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium">Asset</h4>
                      <p className="text-sm">{selectedAsset?.assetNameEn}</p>
                      <p className="text-sm text-muted-foreground">{form.getValues("landCode")}</p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">Investor</h4>
                      <p className="text-sm">{selectedInvestor?.nameEn}</p>
                      <p className="text-sm text-muted-foreground">{selectedInvestor?.investorCode}</p>
                    </div>
                  </div>
                  <div className="p-4 bg-muted rounded-md space-y-2">
                    <div className="flex justify-between">
                      <span>Annual Rental:</span>
                      <span className="font-medium">{formatCurrency(annualAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>VAT ({vatRate}%):</span>
                      <span className="font-medium">{formatCurrency(annualAmount * vatRate / 100)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span className="font-medium">{duration} year{duration > 1 ? "s" : ""}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span>Total Contract Amount:</span>
                      <span className="font-bold text-lg">{formatCurrency(totalContract)}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Signing Date:</span>
                      <p>{format(new Date(form.getValues("signingDate")), "PPP")}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Start Date:</span>
                      <p>{format(new Date(form.getValues("startDate")), "PPP")}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">End Date:</span>
                      <p>{format(new Date(form.getValues("endDate")), "PPP")}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-between mt-6">
            <Button type="button" variant="outline" onClick={handleBack} disabled={step === 1} data-testid="button-previous">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            {step < 6 ? (
              <Button type="button" onClick={handleNext} data-testid="button-next">
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit">
                {createMutation.isPending ? "Creating..." : "Create Contract"}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
