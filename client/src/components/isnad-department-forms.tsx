import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, Banknote, FileText, Shield, Save, CheckCircle, Upload } from "lucide-react";
import type { 
  SchoolPlanningSection, 
  InvestmentPartnershipsSection, 
  FinanceSection, 
  LandRegistrySection, 
  SecurityFacilitiesSection 
} from "@shared/schema";

interface DepartmentFormProps {
  initialData?: any;
  onSave: (data: any) => void;
  onComplete: (data: any) => void;
  isReadOnly?: boolean;
  isPending?: boolean;
}

export function SchoolPlanningForm({ initialData, onSave, onComplete, isReadOnly, isPending }: DepartmentFormProps) {
  const formSchema = z.object({
    assetStatus: z.enum(["vacant_land", "existing_building", "vacated_building", "stalled_project", "other"]),
    assetStatusOther: z.string().optional(),
    buildingName: z.string().optional(),
    decisionNumber: z.string().optional(),
    decisionDate: z.string().optional(),
    planningNeed: z.enum(["no_need", "has_need"]),
    needExpectedPeriod: z.string().optional(),
    hasProgrammingForm: z.boolean(),
    programmingFormDate: z.string().optional(),
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      assetStatus: initialData?.assetStatus || "vacant_land",
      assetStatusOther: initialData?.assetStatusOther || "",
      buildingName: initialData?.buildingName || "",
      decisionNumber: initialData?.decisionNumber || "",
      decisionDate: initialData?.decisionDate || "",
      planningNeed: initialData?.planningNeed || "no_need",
      needExpectedPeriod: initialData?.needExpectedPeriod || "",
      hasProgrammingForm: initialData?.hasProgrammingForm || false,
      programmingFormDate: initialData?.programmingFormDate || "",
    },
  });

  const assetStatus = form.watch("assetStatus");
  const planningNeed = form.watch("planningNeed");
  const hasProgrammingForm = form.watch("hasProgrammingForm");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          School Planning Section
        </CardTitle>
        <CardDescription>
          Sections 1-2: Asset Status and Planning Need Assessment
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="space-y-6">
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground">Section 1: Asset Status</h4>
              
              <FormField
                control={form.control}
                name="assetStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asset Status *</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isReadOnly}
                        className="grid grid-cols-2 gap-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="vacant_land" id="vacant_land" data-testid="radio-vacant-land" />
                          <label htmlFor="vacant_land" className="text-sm">Vacant Land</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="existing_building" id="existing_building" data-testid="radio-existing-building" />
                          <label htmlFor="existing_building" className="text-sm">Existing Building</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="vacated_building" id="vacated_building" data-testid="radio-vacated-building" />
                          <label htmlFor="vacated_building" className="text-sm">Vacated Building</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="stalled_project" id="stalled_project" data-testid="radio-stalled-project" />
                          <label htmlFor="stalled_project" className="text-sm">Stalled/Rescinded Project</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="other" id="other" data-testid="radio-other" />
                          <label htmlFor="other" className="text-sm">Other</label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {assetStatus === "other" && (
                <FormField
                  control={form.control}
                  name="assetStatusOther"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Specify Other Status</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isReadOnly} data-testid="input-status-other" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {(assetStatus === "existing_building" || assetStatus === "vacated_building") && (
                <FormField
                  control={form.control}
                  name="buildingName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Building Name</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isReadOnly} data-testid="input-building-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {(assetStatus === "vacated_building" || assetStatus === "stalled_project") && (
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="decisionNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Decision Number</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={isReadOnly} data-testid="input-decision-number" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="decisionDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Decision Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} disabled={isReadOnly} data-testid="input-decision-date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground">Section 2: Planning Need</h4>
              
              <FormField
                control={form.control}
                name="planningNeed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Planning Need *</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isReadOnly}
                        className="space-y-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no_need" id="no_need" data-testid="radio-no-need" />
                          <label htmlFor="no_need" className="text-sm">No Planning Need</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="has_need" id="has_need" data-testid="radio-has-need" />
                          <label htmlFor="has_need" className="text-sm">There is a Planning Need</label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {planningNeed === "has_need" && (
                <FormField
                  control={form.control}
                  name="needExpectedPeriod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expected Period to Start Needing the Asset After</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isReadOnly} placeholder="e.g., 2 years" data-testid="input-need-period" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="hasProgrammingForm"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isReadOnly}
                        data-testid="checkbox-programming-form"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Previously Submitted Programming/Capacity and Demand Form</FormLabel>
                      <FormDescription>Check if a form was previously submitted (attach a copy)</FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              {hasProgrammingForm && (
                <FormField
                  control={form.control}
                  name="programmingFormDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Form Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} disabled={isReadOnly} data-testid="input-programming-form-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {!isReadOnly && (
              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onSave(form.getValues())}
                  disabled={isPending}
                  data-testid="button-save-school-planning"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Draft
                </Button>
                <Button
                  type="button"
                  onClick={() => onComplete(form.getValues())}
                  disabled={isPending}
                  data-testid="button-complete-school-planning"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Complete Section
                </Button>
              </div>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

export function InvestmentPartnershipsForm({ initialData, onSave, onComplete, isReadOnly, isPending }: DepartmentFormProps) {
  const formSchema = z.object({
    cityPreferred: z.boolean(),
    districtPreferred: z.boolean(),
    isCriticalArea: z.boolean(),
    hasInvestmentBlockers: z.boolean(),
    blockers: z.object({
      lackOfDeed: z.boolean(),
      financialLiabilities: z.boolean(),
      other: z.string().optional(),
    }).optional(),
    investmentProposal: z.enum(["partial", "full"]),
    investmentType: z.enum(["educational", "commercial", "other"]),
    investmentTypeOther: z.string().optional(),
    partialSketchFileName: z.string().optional(),
    partialSketchFileUrl: z.string().optional(),
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cityPreferred: initialData?.cityPreferred || false,
      districtPreferred: initialData?.districtPreferred || false,
      isCriticalArea: initialData?.isCriticalArea || false,
      hasInvestmentBlockers: initialData?.hasInvestmentBlockers || false,
      blockers: initialData?.blockers || { lackOfDeed: false, financialLiabilities: false, other: "" },
      investmentProposal: initialData?.investmentProposal || "full",
      investmentType: initialData?.investmentType || "educational",
      investmentTypeOther: initialData?.investmentTypeOther || "",
      partialSketchFileName: initialData?.partialSketchFileName || "",
      partialSketchFileUrl: initialData?.partialSketchFileUrl || "",
    },
  });

  const hasBlockers = form.watch("hasInvestmentBlockers");
  const investmentType = form.watch("investmentType");
  const investmentProposal = form.watch("investmentProposal");
  const partialSketchFileName = form.watch("partialSketchFileName");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue("partialSketchFileName", file.name);
      form.setValue("partialSketchFileUrl", URL.createObjectURL(file));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Investment & Partnerships Section
        </CardTitle>
        <CardDescription>
          Sections 3-5: Location Attractiveness, Investment Blockers, and Investment Proposal
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="space-y-6">
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground">Section 3: Location Attractiveness</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="cityPreferred"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isReadOnly}
                          data-testid="checkbox-city-preferred"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>City Preferred by Investors</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="districtPreferred"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isReadOnly}
                          data-testid="checkbox-district-preferred"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>District Preferred by Investors</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isCriticalArea"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isReadOnly}
                          data-testid="checkbox-critical-area"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Critical Area</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground">Section 4: Investment Blockers</h4>
              
              <FormField
                control={form.control}
                name="hasInvestmentBlockers"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isReadOnly}
                        data-testid="checkbox-has-blockers"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Are there any blockers preventing investment in the asset?</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              {hasBlockers && (
                <div className="ml-6 space-y-2 border-l-2 pl-4">
                  <FormField
                    control={form.control}
                    name="blockers.lackOfDeed"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isReadOnly}
                            data-testid="checkbox-lack-deed"
                          />
                        </FormControl>
                        <FormLabel>Lack of an Ownership Deed</FormLabel>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="blockers.financialLiabilities"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isReadOnly}
                            data-testid="checkbox-financial-liabilities"
                          />
                        </FormControl>
                        <FormLabel>Presence of Financial Liabilities on the Asset</FormLabel>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="blockers.other"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Other Blockers</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={isReadOnly} placeholder="Specify other blockers..." data-testid="input-blockers-other" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground">Section 5: Investment Proposal</h4>
              
              <FormField
                control={form.control}
                name="investmentProposal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Investment Proposal Type *</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isReadOnly}
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="partial" id="partial" data-testid="radio-partial" />
                          <label htmlFor="partial" className="text-sm">Partial</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="full" id="full" data-testid="radio-full" />
                          <label htmlFor="full" className="text-sm">Full</label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormDescription>
                      If partial, an illustrative sketch must be attached
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {investmentProposal === "partial" && (
                <div className="space-y-2 rounded-md border p-4 bg-muted/50">
                  <FormLabel className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Illustrative Sketch (Required) *
                  </FormLabel>
                  <FormDescription>
                    Upload an illustrative sketch showing the partial investment area
                  </FormDescription>
                  {!isReadOnly ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={handleFileChange}
                        className="flex-1"
                        data-testid="input-partial-sketch-file"
                      />
                      {partialSketchFileName && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {partialSketchFileName}
                        </Badge>
                      )}
                    </div>
                  ) : (
                    partialSketchFileName && (
                      <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                        <FileText className="h-3 w-3" />
                        {partialSketchFileName}
                      </Badge>
                    )
                  )}
                </div>
              )}

              <FormField
                control={form.control}
                name="investmentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Investment Type *</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isReadOnly}
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="educational" id="educational" data-testid="radio-educational" />
                          <label htmlFor="educational" className="text-sm">Educational</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="commercial" id="commercial" data-testid="radio-commercial" />
                          <label htmlFor="commercial" className="text-sm">Commercial</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="other" id="investment_other" data-testid="radio-investment-other" />
                          <label htmlFor="investment_other" className="text-sm">Other</label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {investmentType === "other" && (
                <FormField
                  control={form.control}
                  name="investmentTypeOther"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Specify Other Investment Type</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isReadOnly} data-testid="input-investment-type-other" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {!isReadOnly && (
              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onSave(form.getValues())}
                  disabled={isPending}
                  data-testid="button-save-ip"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Draft
                </Button>
                <Button
                  type="button"
                  onClick={() => onComplete(form.getValues())}
                  disabled={isPending}
                  data-testid="button-complete-ip"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Complete Section
                </Button>
              </div>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

export function FinanceForm({ initialData, onSave, onComplete, isReadOnly, isPending }: DepartmentFormProps) {
  const formSchema = z.object({
    hasFinancialDues: z.boolean(),
    financialDuesAction: z.string().optional(),
    custodyItemsCleared: z.boolean(),
    electricityAccountNumber: z.string().optional(),
    electricityMeterNumbers: z.string().optional(),
    waterAccountNumber: z.string().optional(),
    waterMeterNumbers: z.string().optional(),
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      hasFinancialDues: initialData?.hasFinancialDues || false,
      financialDuesAction: initialData?.financialDuesAction || "",
      custodyItemsCleared: initialData?.custodyItemsCleared || false,
      electricityAccountNumber: initialData?.electricityAccountNumber || "",
      electricityMeterNumbers: initialData?.electricityMeterNumbers || "",
      waterAccountNumber: initialData?.waterAccountNumber || "",
      waterMeterNumbers: initialData?.waterMeterNumbers || "",
    },
  });

  const hasFinancialDues = form.watch("hasFinancialDues");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Banknote className="h-5 w-5" />
          Finance Department Section
        </CardTitle>
        <CardDescription>
          Sections 6-9: Financial Dues, Custody Items, and Utility Meters
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="space-y-6">
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground">Section 6: Financial Dues</h4>
              
              <FormField
                control={form.control}
                name="hasFinancialDues"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isReadOnly}
                        data-testid="checkbox-financial-dues"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Are there any previous financial dues?</FormLabel>
                      <FormDescription>Electricity bills, water bills, previous investor dues, etc.</FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              {hasFinancialDues && (
                <FormField
                  control={form.control}
                  name="financialDuesAction"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Action Taken</FormLabel>
                      <FormControl>
                        <Textarea {...field} disabled={isReadOnly} placeholder="Describe the last action taken regarding financial dues..." data-testid="input-financial-action" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground">Section 7: Custody Items</h4>
              
              <FormField
                control={form.control}
                name="custodyItemsCleared"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isReadOnly}
                        data-testid="checkbox-custody-cleared"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Asset has been cleared of all custody items</FormLabel>
                      <FormDescription>Only applicable if the asset is a building</FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground">Section 8: Electricity Meters</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="electricityAccountNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Number</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isReadOnly} data-testid="input-electricity-account" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="electricityMeterNumbers"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meter Numbers</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isReadOnly} placeholder="Comma-separated if multiple" data-testid="input-electricity-meters" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground">Section 9: Water Meters</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="waterAccountNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Number</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isReadOnly} data-testid="input-water-account" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="waterMeterNumbers"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meter Numbers</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isReadOnly} placeholder="Comma-separated if multiple" data-testid="input-water-meters" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {!isReadOnly && (
              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onSave(form.getValues())}
                  disabled={isPending}
                  data-testid="button-save-finance"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Draft
                </Button>
                <Button
                  type="button"
                  onClick={() => onComplete(form.getValues())}
                  disabled={isPending}
                  data-testid="button-complete-finance"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Complete Section
                </Button>
              </div>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

export function LandRegistryForm({ initialData, onSave, onComplete, isReadOnly, isPending }: DepartmentFormProps) {
  const formSchema = z.object({
    assetOwnership: z.enum(["ministry_of_education", "education_department", "other"]),
    assetOwnershipOther: z.string().optional(),
    ownershipReference: z.enum(["deed", "building_permit", "receipt_record", "survey_decision", "allocation_decision", "regulatory_sketch", "other"]),
    ownershipReferenceOther: z.string().optional(),
    ownershipDocumentNumber: z.string().optional(),
    ownershipDocumentDate: z.string().optional(),
    regulatoryPlanReference: z.string().optional(),
    plotNumber: z.string().optional(),
    planNumber: z.string().optional(),
    areaInWords: z.string().optional(),
    areaInNumbers: z.number().optional(),
    areaDocumentNumber: z.string().optional(),
    areaDocumentDate: z.string().optional(),
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      assetOwnership: initialData?.assetOwnership || "ministry_of_education",
      assetOwnershipOther: initialData?.assetOwnershipOther || "",
      ownershipReference: initialData?.ownershipReference || "deed",
      ownershipReferenceOther: initialData?.ownershipReferenceOther || "",
      ownershipDocumentNumber: initialData?.ownershipDocumentNumber || "",
      ownershipDocumentDate: initialData?.ownershipDocumentDate || "",
      regulatoryPlanReference: initialData?.regulatoryPlanReference || "",
      plotNumber: initialData?.plotNumber || "",
      planNumber: initialData?.planNumber || "",
      areaInWords: initialData?.areaInWords || "",
      areaInNumbers: initialData?.areaInNumbers || 0,
      areaDocumentNumber: initialData?.areaDocumentNumber || "",
      areaDocumentDate: initialData?.areaDocumentDate || "",
    },
  });

  const assetOwnership = form.watch("assetOwnership");
  const ownershipReference = form.watch("ownershipReference");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Land Registry Section
        </CardTitle>
        <CardDescription>
          Sections 10-12: Asset Ownership, Regulatory Plan, and Asset Area
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="space-y-6">
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground">Section 10: Asset Ownership</h4>
              
              <FormField
                control={form.control}
                name="assetOwnership"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asset Ownership *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isReadOnly}>
                      <FormControl>
                        <SelectTrigger data-testid="select-ownership">
                          <SelectValue placeholder="Select ownership" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ministry_of_education">Ministry of Education</SelectItem>
                        <SelectItem value="education_department">Education Department</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {assetOwnership === "other" && (
                <FormField
                  control={form.control}
                  name="assetOwnershipOther"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Specify Other Ownership</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isReadOnly} data-testid="input-ownership-other" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="ownershipReference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ownership Reference *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isReadOnly}>
                      <FormControl>
                        <SelectTrigger data-testid="select-reference">
                          <SelectValue placeholder="Select reference type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="deed">Deed</SelectItem>
                        <SelectItem value="building_permit">Building Permit</SelectItem>
                        <SelectItem value="receipt_record">Receipt Record</SelectItem>
                        <SelectItem value="survey_decision">Survey Decision</SelectItem>
                        <SelectItem value="allocation_decision">Allocation Decision</SelectItem>
                        <SelectItem value="regulatory_sketch">Regulatory Sketch</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {ownershipReference === "other" && (
                <FormField
                  control={form.control}
                  name="ownershipReferenceOther"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Specify Other Reference</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isReadOnly} data-testid="input-reference-other" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="ownershipDocumentNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Document Number</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isReadOnly} data-testid="input-doc-number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ownershipDocumentDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Document Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} disabled={isReadOnly} data-testid="input-doc-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground">Section 11: Regulatory Plan</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="plotNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plot Number</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isReadOnly} data-testid="input-plot-number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="planNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plan Number</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isReadOnly} data-testid="input-plan-number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground">Section 12: Asset Area</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="areaInWords"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Area (in words)</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isReadOnly} placeholder="e.g., Five thousand square meters" data-testid="input-area-words" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="areaInNumbers"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Area (in numbers, m²)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          disabled={isReadOnly} 
                          data-testid="input-area-numbers" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="areaDocumentNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Area Document Number</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isReadOnly} data-testid="input-area-doc-number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="areaDocumentDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Area Document Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} disabled={isReadOnly} data-testid="input-area-doc-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {!isReadOnly && (
              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onSave(form.getValues())}
                  disabled={isPending}
                  data-testid="button-save-land-registry"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Draft
                </Button>
                <Button
                  type="button"
                  onClick={() => onComplete(form.getValues())}
                  disabled={isPending}
                  data-testid="button-complete-land-registry"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Complete Section
                </Button>
              </div>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

export function SecurityFacilitiesForm({ initialData, onSave, onComplete, isReadOnly, isPending }: DepartmentFormProps) {
  const referenceTypes = ["deed", "building_permit", "receipt_record", "survey_decision", "allocation_decision", "regulatory_sketch", "other"] as const;
  
  const formSchema = z.object({
    assetOwnership: z.enum(["ministry_of_education", "education_department", "other"]).optional(),
    assetOwnershipOther: z.string().optional(),
    ownershipReference: z.enum(referenceTypes).optional(),
    ownershipReferenceOther: z.string().optional(),
    ownershipDocumentNumber: z.string().optional(),
    ownershipDocumentDate: z.string().optional(),
    regulatoryPlanReference: z.enum(referenceTypes).optional(),
    regulatoryPlanReferenceOther: z.string().optional(),
    plotNumber: z.string().optional(),
    planNumber: z.string().optional(),
    areaReference: z.enum(referenceTypes).optional(),
    areaReferenceOther: z.string().optional(),
    areaInWords: z.string().optional(),
    areaInNumbers: z.number().optional(),
    areaDocumentNumber: z.string().optional(),
    areaDocumentDate: z.string().optional(),
    structuralCondition: z.enum(["operational", "requires_renovation", "dilapidated", "other"]),
    structuralConditionOther: z.string().optional(),
    hasDemolitionDecision: z.boolean(),
    demolitionDecisionNumber: z.string().optional(),
    demolitionDecisionDate: z.string().optional(),
    dimensions: z.object({
      north: z.string().optional(),
      east: z.string().optional(),
      south: z.string().optional(),
      west: z.string().optional(),
    }),
    boundaries: z.object({
      north: z.enum(["commercial_street", "internal_street", "other"]),
      northOther: z.string().optional(),
      east: z.enum(["commercial_street", "internal_street", "other"]),
      eastOther: z.string().optional(),
      south: z.enum(["commercial_street", "internal_street", "other"]),
      southOther: z.string().optional(),
      west: z.enum(["commercial_street", "internal_street", "other"]),
      westOther: z.string().optional(),
    }),
    location: z.object({
      region: z.string().optional(),
      governorate: z.string().optional(),
      city: z.string().optional(),
      district: z.string().optional(),
      shortNationalAddress: z.string().optional(),
      longitude: z.number().optional(),
      latitude: z.number().optional(),
    }),
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      assetOwnership: initialData?.assetOwnership || undefined,
      assetOwnershipOther: initialData?.assetOwnershipOther || "",
      ownershipReference: initialData?.ownershipReference || undefined,
      ownershipReferenceOther: initialData?.ownershipReferenceOther || "",
      ownershipDocumentNumber: initialData?.ownershipDocumentNumber || "",
      ownershipDocumentDate: initialData?.ownershipDocumentDate || "",
      regulatoryPlanReference: initialData?.regulatoryPlanReference || undefined,
      regulatoryPlanReferenceOther: initialData?.regulatoryPlanReferenceOther || "",
      plotNumber: initialData?.plotNumber || "",
      planNumber: initialData?.planNumber || "",
      areaReference: initialData?.areaReference || undefined,
      areaReferenceOther: initialData?.areaReferenceOther || "",
      areaInWords: initialData?.areaInWords || "",
      areaInNumbers: initialData?.areaInNumbers || undefined,
      areaDocumentNumber: initialData?.areaDocumentNumber || "",
      areaDocumentDate: initialData?.areaDocumentDate || "",
      structuralCondition: initialData?.structuralCondition || "operational",
      structuralConditionOther: initialData?.structuralConditionOther || "",
      hasDemolitionDecision: initialData?.hasDemolitionDecision || false,
      demolitionDecisionNumber: initialData?.demolitionDecisionNumber || "",
      demolitionDecisionDate: initialData?.demolitionDecisionDate || "",
      dimensions: initialData?.dimensions || { north: "", east: "", south: "", west: "" },
      boundaries: initialData?.boundaries || {
        north: "internal_street",
        east: "internal_street",
        south: "internal_street",
        west: "internal_street",
      },
      location: initialData?.location || {
        region: "",
        governorate: "",
        city: "",
        district: "",
        shortNationalAddress: "",
        longitude: 0,
        latitude: 0,
      },
    },
  });

  const assetOwnership = form.watch("assetOwnership");
  const ownershipReference = form.watch("ownershipReference");
  const regulatoryPlanReference = form.watch("regulatoryPlanReference");
  const areaReference = form.watch("areaReference");
  const structuralCondition = form.watch("structuralCondition");
  const hasDemolitionDecision = form.watch("hasDemolitionDecision");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Security, Safety & Facilities Section
        </CardTitle>
        <CardDescription>
          Sections 10-16: Asset Ownership, Regulatory Plan, Asset Area, Structural Condition, Dimensions, Boundaries, and Location
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="space-y-6">
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground">Section 10: Asset Ownership Reference</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="assetOwnership"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Asset Ownership</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={isReadOnly}>
                        <FormControl>
                          <SelectTrigger data-testid="select-asset-ownership">
                            <SelectValue placeholder="Select ownership" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ministry_of_education">Ministry of Education</SelectItem>
                          <SelectItem value="education_department">Education Department</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {assetOwnership === "other" && (
                  <FormField
                    control={form.control}
                    name="assetOwnershipOther"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Specify Other</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={isReadOnly} data-testid="input-ownership-other" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <FormField
                control={form.control}
                name="ownershipReference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ownership Reference Document</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isReadOnly}>
                      <FormControl>
                        <SelectTrigger data-testid="select-ownership-reference">
                          <SelectValue placeholder="Select reference type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="deed">Deed</SelectItem>
                        <SelectItem value="building_permit">Building Permit</SelectItem>
                        <SelectItem value="receipt_record">Receipt Record</SelectItem>
                        <SelectItem value="survey_decision">Survey Decision</SelectItem>
                        <SelectItem value="allocation_decision">Allocation Decision</SelectItem>
                        <SelectItem value="regulatory_sketch">Regulatory Sketch</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {ownershipReference === "other" && (
                <FormField
                  control={form.control}
                  name="ownershipReferenceOther"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Specify Other Reference</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isReadOnly} data-testid="input-ownership-ref-other" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="ownershipDocumentNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Document Number</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isReadOnly} data-testid="input-ownership-doc-number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ownershipDocumentDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Document Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} disabled={isReadOnly} data-testid="input-ownership-doc-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground">Section 11: Regulatory Plan</h4>
              
              <FormField
                control={form.control}
                name="regulatoryPlanReference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Regulatory Plan Reference</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isReadOnly}>
                      <FormControl>
                        <SelectTrigger data-testid="select-regulatory-reference">
                          <SelectValue placeholder="Select reference type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="deed">Deed</SelectItem>
                        <SelectItem value="building_permit">Building Permit</SelectItem>
                        <SelectItem value="receipt_record">Receipt Record</SelectItem>
                        <SelectItem value="survey_decision">Survey Decision</SelectItem>
                        <SelectItem value="allocation_decision">Allocation Decision</SelectItem>
                        <SelectItem value="regulatory_sketch">Regulatory Sketch</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {regulatoryPlanReference === "other" && (
                <FormField
                  control={form.control}
                  name="regulatoryPlanReferenceOther"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Specify Other Reference</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isReadOnly} data-testid="input-regulatory-ref-other" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="plotNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plot Number</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isReadOnly} data-testid="input-plot-number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="planNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plan Number</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isReadOnly} data-testid="input-plan-number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground">Section 12: Asset Area</h4>
              
              <FormField
                control={form.control}
                name="areaReference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Area Reference Document</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isReadOnly}>
                      <FormControl>
                        <SelectTrigger data-testid="select-area-reference">
                          <SelectValue placeholder="Select reference type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="deed">Deed</SelectItem>
                        <SelectItem value="building_permit">Building Permit</SelectItem>
                        <SelectItem value="receipt_record">Receipt Record</SelectItem>
                        <SelectItem value="survey_decision">Survey Decision</SelectItem>
                        <SelectItem value="allocation_decision">Allocation Decision</SelectItem>
                        <SelectItem value="regulatory_sketch">Regulatory Sketch</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {areaReference === "other" && (
                <FormField
                  control={form.control}
                  name="areaReferenceOther"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Specify Other Reference</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isReadOnly} data-testid="input-area-ref-other" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="areaInWords"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Area (in words)</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isReadOnly} placeholder="e.g., Five thousand square meters" data-testid="input-area-words" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="areaInNumbers"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Area (in numbers, sqm)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          value={field.value ?? ""} 
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)} 
                          disabled={isReadOnly} 
                          data-testid="input-area-numbers" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="areaDocumentNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Area Document Number</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isReadOnly} data-testid="input-area-doc-number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="areaDocumentDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Area Document Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} disabled={isReadOnly} data-testid="input-area-doc-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground">Section 13: Structural Condition (if building)</h4>
              
              <FormField
                control={form.control}
                name="structuralCondition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Structural Condition *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isReadOnly}>
                      <FormControl>
                        <SelectTrigger data-testid="select-structural-condition">
                          <SelectValue placeholder="Select condition" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="operational">Operational</SelectItem>
                        <SelectItem value="requires_renovation">Requires Renovation and Rehabilitation</SelectItem>
                        <SelectItem value="dilapidated">Dilapidated</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {structuralCondition === "other" && (
                <FormField
                  control={form.control}
                  name="structuralConditionOther"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Specify Other Condition</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isReadOnly} data-testid="input-condition-other" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="hasDemolitionDecision"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isReadOnly}
                        data-testid="checkbox-demolition"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Is there a demolition decision?</FormLabel>
                      <FormDescription>Attach a copy of the decision if yes</FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              {hasDemolitionDecision && (
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="demolitionDecisionNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Decision Number</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={isReadOnly} data-testid="input-demolition-number" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="demolitionDecisionDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Decision Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} disabled={isReadOnly} data-testid="input-demolition-date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground">Section 14: Asset Dimensions</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="dimensions.north"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>North (meters)</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isReadOnly} data-testid="input-dim-north" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dimensions.east"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>East (meters)</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isReadOnly} data-testid="input-dim-east" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dimensions.south"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>South (meters)</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isReadOnly} data-testid="input-dim-south" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dimensions.west"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>West (meters)</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isReadOnly} data-testid="input-dim-west" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground">Section 15: Asset Boundaries</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="boundaries.north"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>North Boundary</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={isReadOnly}>
                        <FormControl>
                          <SelectTrigger data-testid="select-boundary-north">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="commercial_street">Commercial Street</SelectItem>
                          <SelectItem value="internal_street">Internal Street</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="boundaries.east"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>East Boundary</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={isReadOnly}>
                        <FormControl>
                          <SelectTrigger data-testid="select-boundary-east">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="commercial_street">Commercial Street</SelectItem>
                          <SelectItem value="internal_street">Internal Street</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="boundaries.south"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>South Boundary</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={isReadOnly}>
                        <FormControl>
                          <SelectTrigger data-testid="select-boundary-south">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="commercial_street">Commercial Street</SelectItem>
                          <SelectItem value="internal_street">Internal Street</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="boundaries.west"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>West Boundary</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={isReadOnly}>
                        <FormControl>
                          <SelectTrigger data-testid="select-boundary-west">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="commercial_street">Commercial Street</SelectItem>
                          <SelectItem value="internal_street">Internal Street</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground">Section 16: Asset Location</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="location.region"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Region</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isReadOnly} data-testid="input-loc-region" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location.governorate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Governorate</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isReadOnly} data-testid="input-loc-governorate" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location.city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isReadOnly} data-testid="input-loc-city" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location.district"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>District</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isReadOnly} data-testid="input-loc-district" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="location.shortNationalAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Short National Address</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isReadOnly} data-testid="input-loc-address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="location.longitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Longitude</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.000001"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          disabled={isReadOnly} 
                          data-testid="input-loc-longitude" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location.latitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Latitude</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.000001"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          disabled={isReadOnly} 
                          data-testid="input-loc-latitude" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {!isReadOnly && (
              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onSave(form.getValues())}
                  disabled={isPending}
                  data-testid="button-save-security"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Draft
                </Button>
                <Button
                  type="button"
                  onClick={() => onComplete(form.getValues())}
                  disabled={isPending}
                  data-testid="button-complete-security"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Complete Section
                </Button>
              </div>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
