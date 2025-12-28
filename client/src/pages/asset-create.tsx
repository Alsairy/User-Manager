import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation } from "wouter";
import { z } from "zod";
import { ArrowLeft, Check, ChevronRight, Save, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Region, City, District, Asset } from "@shared/schema";
import { predefinedFeatures, featureLabels, PredefinedFeature } from "@shared/schema";

const steps = [
  { id: 1, title: "Basic Info", description: "Asset identification" },
  { id: 2, title: "Location", description: "Geographic details" },
  { id: 3, title: "Property", description: "Area and specifications" },
  { id: 4, title: "Ownership", description: "Legal documentation" },
  { id: 5, title: "Features", description: "Amenities and utilities" },
  { id: 6, title: "Financial", description: "Dues and custody" },
  { id: 7, title: "Additional", description: "Description and notes" },
  { id: 8, title: "Review", description: "Summary and submit" },
];

const formSchema = z.object({
  assetNameAr: z.string().min(1, "Arabic name is required"),
  assetNameEn: z.string().min(1, "English name is required"),
  assetType: z.enum(["land", "building"]),
  regionId: z.string().min(1, "Region is required"),
  cityId: z.string().min(1, "City is required"),
  districtId: z.string().min(1, "District is required"),
  neighborhood: z.string().optional(),
  streetAddress: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  totalArea: z.number().min(1, "Total area is required"),
  builtUpArea: z.number().optional(),
  landUseType: z.enum(["commercial", "residential", "industrial", "agricultural", "mixed_use"]).optional(),
  zoningClassification: z.string().optional(),
  currentStatus: z.enum(["vacant", "occupied", "under_construction", "under_renovation"]).optional(),
  ownershipType: z.enum(["government", "private", "endowment", "leasehold"]).optional(),
  deedNumber: z.string().optional(),
  deedDate: z.string().optional(),
  features: z.array(z.string()).default([]),
  customFeatures: z.string().optional(),
  financialDues: z.string().optional(),
  custodyDetails: z.string().optional(),
  administrativeNotes: z.string().optional(),
  relatedReferences: z.string().optional(),
  description: z.string().optional(),
  specialConditions: z.string().optional(),
  investmentPotential: z.string().optional(),
  restrictions: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function AssetCreate() {
  const [currentStep, setCurrentStep] = useState(1);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      assetNameAr: "",
      assetNameEn: "",
      assetType: "land",
      regionId: "",
      cityId: "",
      districtId: "",
      neighborhood: "",
      streetAddress: "",
      totalArea: 0,
      features: [],
      customFeatures: "",
      financialDues: "",
      custodyDetails: "",
      administrativeNotes: "",
      relatedReferences: "",
      description: "",
      specialConditions: "",
      investmentPotential: "",
      restrictions: "",
    },
  });

  const selectedRegionId = form.watch("regionId");
  const selectedCityId = form.watch("cityId");

  const { data: regions } = useQuery<Region[]>({
    queryKey: ["/api/reference/regions"],
  });

  const { data: cities } = useQuery<City[]>({
    queryKey: ["/api/reference/cities", selectedRegionId],
    enabled: !!selectedRegionId,
  });

  const { data: districts } = useQuery<District[]>({
    queryKey: ["/api/reference/districts", selectedCityId],
    enabled: !!selectedCityId,
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const res = await apiRequest("POST", "/api/assets/registrations", data);
      return res.json() as Promise<Asset>;
    },
    onSuccess: (asset) => {
      queryClient.invalidateQueries({ predicate: (q) => (q.queryKey[0] as string).startsWith("/api/assets") });
      return asset;
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create asset registration.",
        variant: "destructive",
      });
    },
  });

  const submitMutation = useMutation({
    mutationFn: async ({ id, mode }: { id: string; mode: "direct" | "approval_cycle" }) => {
      const res = await apiRequest("POST", `/api/assets/registrations/${id}/submit`, { mode });
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ predicate: (q) => (q.queryKey[0] as string).startsWith("/api/assets") });
      toast({
        title: "Success",
        description: variables.mode === "direct" 
          ? "Asset registered directly to the Asset Bank."
          : "Asset submitted for approval workflow.",
      });
      navigate("/assets/registrations");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit asset.",
        variant: "destructive",
      });
    },
  });

  const handleNext = async () => {
    const fieldsToValidate = getFieldsForStep(currentStep);
    const isValid = await form.trigger(fieldsToValidate as any);
    if (isValid) {
      if (currentStep < steps.length) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSaveDraft = async () => {
    const values = form.getValues();
    try {
      await createMutation.mutateAsync(values);
      toast({
        title: "Draft Saved",
        description: "Your asset registration has been saved as draft.",
      });
      navigate("/assets/registrations");
    } catch {
    }
  };

  const handleSubmit = async (mode: "direct" | "approval_cycle") => {
    const values = form.getValues();
    try {
      const asset = await createMutation.mutateAsync(values);
      await submitMutation.mutateAsync({ id: asset.id, mode });
    } catch {
    }
    setShowSubmitDialog(false);
  };

  const getFieldsForStep = (step: number): (keyof FormValues)[] => {
    switch (step) {
      case 1: return ["assetNameAr", "assetNameEn", "assetType"];
      case 2: return ["regionId", "cityId", "districtId"];
      case 3: return ["totalArea"];
      default: return [];
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="assetNameAr"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Asset Name (Arabic)</FormLabel>
                  <FormControl>
                    <Input placeholder="أدخل اسم الأصل" dir="rtl" {...field} data-testid="input-name-ar" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="assetNameEn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Asset Name (English)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter asset name" {...field} data-testid="input-name-en" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="assetType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Asset Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex gap-6"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="land" id="land" data-testid="radio-land" />
                        <label htmlFor="land" className="text-sm font-medium">Land</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="building" id="building" data-testid="radio-building" />
                        <label htmlFor="building" className="text-sm font-medium">Building</label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
              <FormField
                control={form.control}
                name="regionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Region</FormLabel>
                    <Select onValueChange={(v) => { field.onChange(v); form.setValue("cityId", ""); form.setValue("districtId", ""); }} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-region">
                          <SelectValue placeholder="Select region" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {regions?.map((r) => (
                          <SelectItem key={r.id} value={r.id}>{r.nameEn}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cityId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <Select onValueChange={(v) => { field.onChange(v); form.setValue("districtId", ""); }} value={field.value} disabled={!selectedRegionId}>
                      <FormControl>
                        <SelectTrigger data-testid="select-city">
                          <SelectValue placeholder="Select city" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {cities?.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.nameEn}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="districtId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>District</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={!selectedCityId}>
                      <FormControl>
                        <SelectTrigger data-testid="select-district">
                          <SelectValue placeholder="Select district" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {districts?.map((d) => (
                          <SelectItem key={d.id} value={d.id}>{d.nameEn}</SelectItem>
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
              name="neighborhood"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Neighborhood</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter neighborhood" {...field} data-testid="input-neighborhood" />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="streetAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Street Address</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter street address" {...field} data-testid="input-street" />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="totalArea"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Area (sqm)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Enter total area" 
                        {...field} 
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        data-testid="input-total-area" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="builtUpArea"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Built-up Area (sqm)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Enter built-up area" 
                        {...field} 
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                        data-testid="input-built-area" 
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="landUseType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Land Use Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-land-use">
                          <SelectValue placeholder="Select land use" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="commercial">Commercial</SelectItem>
                        <SelectItem value="residential">Residential</SelectItem>
                        <SelectItem value="industrial">Industrial</SelectItem>
                        <SelectItem value="agricultural">Agricultural</SelectItem>
                        <SelectItem value="mixed_use">Mixed Use</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="currentStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-status">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="vacant">Vacant</SelectItem>
                        <SelectItem value="occupied">Occupied</SelectItem>
                        <SelectItem value="under_construction">Under Construction</SelectItem>
                        <SelectItem value="under_renovation">Under Renovation</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="zoningClassification"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Zoning Classification</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter zoning classification" {...field} data-testid="input-zoning" />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="ownershipType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ownership Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-ownership">
                        <SelectValue placeholder="Select ownership type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="government">Government</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                      <SelectItem value="endowment">Endowment (Waqf)</SelectItem>
                      <SelectItem value="leasehold">Leasehold</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="deedNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deed Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter deed number" {...field} data-testid="input-deed-number" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="deedDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deed Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-deed-date" />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="features"
              render={() => (
                <FormItem>
                  <FormLabel>Available Features & Amenities</FormLabel>
                  <FormDescription>Select all features that apply to this asset</FormDescription>
                  <div className="grid gap-3 md:grid-cols-2 mt-4">
                    {predefinedFeatures.map((feature) => (
                      <FormField
                        key={feature}
                        control={form.control}
                        name="features"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(feature)}
                                onCheckedChange={(checked) => {
                                  const current = field.value || [];
                                  if (checked) {
                                    field.onChange([...current, feature]);
                                  } else {
                                    field.onChange(current.filter((v) => v !== feature));
                                  }
                                }}
                                data-testid={`checkbox-feature-${feature}`}
                              />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              {featureLabels[feature as PredefinedFeature]}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="customFeatures"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Custom Features</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter any additional features not listed above" 
                      {...field} 
                      data-testid="textarea-custom-features"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="financialDues"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Financial Dues</FormLabel>
                  <FormDescription>Outstanding payments, taxes, or financial obligations</FormDescription>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter financial dues details" 
                      {...field} 
                      data-testid="textarea-financial"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="custodyDetails"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Custody Details</FormLabel>
                  <FormDescription>Current custody arrangements and responsible parties</FormDescription>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter custody details" 
                      {...field} 
                      data-testid="textarea-custody"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="administrativeNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Administrative Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter administrative notes" 
                      {...field} 
                      data-testid="textarea-admin-notes"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter detailed description of the asset" 
                      {...field} 
                      className="min-h-[120px]"
                      data-testid="textarea-description"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="investmentPotential"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Investment Potential</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe investment opportunities and potential" 
                      {...field} 
                      data-testid="textarea-investment"
                    />
                  </FormControl>
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
                    <Textarea 
                      placeholder="Enter any special conditions" 
                      {...field} 
                      data-testid="textarea-conditions"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="restrictions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Restrictions</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter any restrictions or limitations" 
                      {...field} 
                      data-testid="textarea-restrictions"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        );

      case 8:
        const values = form.getValues();
        const selectedRegion = regions?.find((r) => r.id === values.regionId);
        const selectedCity = cities?.find((c) => c.id === values.cityId);
        const selectedDistrict = districts?.find((d) => d.id === values.districtId);

        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Review Your Submission</CardTitle>
                <CardDescription>Please review all information before submitting</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-medium mb-2">Basic Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Name (Arabic)</p>
                      <p>{values.assetNameAr}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Name (English)</p>
                      <p>{values.assetNameEn}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Type</p>
                      <p className="capitalize">{values.assetType}</p>
                    </div>
                  </div>
                </div>
                <Separator />
                <div>
                  <h4 className="font-medium mb-2">Location</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Region</p>
                      <p>{selectedRegion?.nameEn || "-"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">City</p>
                      <p>{selectedCity?.nameEn || "-"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">District</p>
                      <p>{selectedDistrict?.nameEn || "-"}</p>
                    </div>
                  </div>
                </div>
                <Separator />
                <div>
                  <h4 className="font-medium mb-2">Property Details</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Total Area</p>
                      <p>{values.totalArea?.toLocaleString() || 0} sqm</p>
                    </div>
                    {values.builtUpArea && (
                      <div>
                        <p className="text-muted-foreground">Built-up Area</p>
                        <p>{values.builtUpArea.toLocaleString()} sqm</p>
                      </div>
                    )}
                    {values.ownershipType && (
                      <div>
                        <p className="text-muted-foreground">Ownership</p>
                        <p className="capitalize">{values.ownershipType}</p>
                      </div>
                    )}
                  </div>
                </div>
                {values.features.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-2">Features</h4>
                      <div className="flex flex-wrap gap-2">
                        {values.features.map((f) => (
                          <span key={f} className="text-sm bg-muted px-2 py-1 rounded">
                            {featureLabels[f as PredefinedFeature] || f}
                          </span>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/assets/registrations">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold">New Asset Registration</h1>
          <p className="text-muted-foreground">
            Complete all sections to register a new asset
          </p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm whitespace-nowrap ${
              currentStep === step.id
                ? "bg-primary text-primary-foreground"
                : currentStep > step.id
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                : "bg-muted text-muted-foreground"
            }`}
            data-testid={`step-${step.id}`}
          >
            {currentStep > step.id ? (
              <Check className="h-4 w-4" />
            ) : (
              <span className="font-medium">{step.id}</span>
            )}
            <span>{step.title}</span>
            {index < steps.length - 1 && (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{steps[currentStep - 1].title}</CardTitle>
          <CardDescription>{steps[currentStep - 1].description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="space-y-6">
              {renderStepContent()}
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 1}
          data-testid="button-previous"
        >
          Previous
        </Button>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleSaveDraft}
            disabled={createMutation.isPending}
            data-testid="button-save-draft"
          >
            <Save className="mr-2 h-4 w-4" />
            Save Draft
          </Button>
          {currentStep < steps.length ? (
            <Button onClick={handleNext} data-testid="button-next">
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={() => setShowSubmitDialog(true)} data-testid="button-submit">
              <Send className="mr-2 h-4 w-4" />
              Submit
            </Button>
          )}
        </div>
      </div>

      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Choose Registration Mode</DialogTitle>
            <DialogDescription>
              Select how you want to register this asset
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Card 
              className="cursor-pointer hover-elevate" 
              onClick={() => handleSubmit("direct")}
              data-testid="card-direct-mode"
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Direct Registration</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Asset will be immediately added to the Asset Bank without requiring departmental approvals.
                </p>
              </CardContent>
            </Card>
            <Card 
              className="cursor-pointer hover-elevate" 
              onClick={() => handleSubmit("approval_cycle")}
              data-testid="card-approval-mode"
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Approval Cycle</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Asset will go through a 5-stage approval workflow: School Planning, Facilities & Security, I&P, Investment Agency, and TBC Approver.
                </p>
              </CardContent>
            </Card>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
