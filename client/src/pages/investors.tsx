import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Search, Edit2, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
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
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Investor, InvestorStatus } from "@shared/schema";

const investorSchema = z.object({
  investorCode: z.string().min(1, "Investor code is required"),
  nameAr: z.string().min(1, "Arabic name is required"),
  nameEn: z.string().min(1, "English name is required"),
  contactPerson: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  companyRegistration: z.string().optional(),
  taxId: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().default("Saudi Arabia"),
  status: z.enum(["active", "inactive", "blacklisted"]).default("active"),
  notes: z.string().optional(),
});

type InvestorForm = z.infer<typeof investorSchema>;

const statusConfig: Record<InvestorStatus, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  active: { label: "Active", variant: "default" },
  inactive: { label: "Inactive", variant: "secondary" },
  blacklisted: { label: "Blacklisted", variant: "destructive" },
};

export default function InvestorsPage() {
  const { t } = useTranslation(["pages", "common"]);
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingInvestor, setEditingInvestor] = useState<Investor | null>(null);

  const { data: investors = [], isLoading } = useQuery<Investor[]>({
    queryKey: ["/api/investors"],
  });

  const form = useForm<InvestorForm>({
    resolver: zodResolver(investorSchema),
    defaultValues: {
      investorCode: "",
      nameAr: "",
      nameEn: "",
      contactPerson: "",
      email: "",
      phone: "",
      companyRegistration: "",
      taxId: "",
      address: "",
      city: "",
      country: "Saudi Arabia",
      status: "active",
      notes: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InvestorForm) => {
      return await apiRequest("POST", "/api/investors", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/investors"] });
      setDialogOpen(false);
      form.reset();
      toast({ title: "Investor created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create investor", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InvestorForm) => {
      return await apiRequest("PATCH", `/api/investors/${editingInvestor?.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/investors"] });
      setDialogOpen(false);
      setEditingInvestor(null);
      form.reset();
      toast({ title: "Investor updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update investor", variant: "destructive" });
    },
  });

  const filteredInvestors = investors.filter((inv) =>
    inv.nameEn.toLowerCase().includes(search.toLowerCase()) ||
    inv.nameAr.includes(search) ||
    inv.investorCode.toLowerCase().includes(search.toLowerCase())
  );

  const openCreateDialog = () => {
    setEditingInvestor(null);
    form.reset({
      investorCode: "",
      nameAr: "",
      nameEn: "",
      contactPerson: "",
      email: "",
      phone: "",
      companyRegistration: "",
      taxId: "",
      address: "",
      city: "",
      country: "Saudi Arabia",
      status: "active",
      notes: "",
    });
    setDialogOpen(true);
  };

  const openEditDialog = (investor: Investor) => {
    setEditingInvestor(investor);
    form.reset({
      investorCode: investor.investorCode,
      nameAr: investor.nameAr,
      nameEn: investor.nameEn,
      contactPerson: investor.contactPerson ?? "",
      email: investor.email ?? "",
      phone: investor.phone ?? "",
      companyRegistration: investor.companyRegistration ?? "",
      taxId: investor.taxId ?? "",
      address: investor.address ?? "",
      city: investor.city ?? "",
      country: investor.country,
      status: investor.status,
      notes: investor.notes ?? "",
    });
    setDialogOpen(true);
  };

  const onSubmit = (data: InvestorForm) => {
    if (editingInvestor) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">{t("pages:investors.title")}</h1>
          <p className="text-muted-foreground text-sm">{t("pages:investors.subtitle")}</p>
        </div>
        <Button onClick={openCreateDialog} data-testid="button-create-investor">
          <Plus className="h-4 w-4 me-2" />
          {t("pages:investors.addInvestor")}
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <CardTitle className="text-lg">All Investors ({filteredInvestors.length})</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search investors..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-64"
                data-testid="input-search"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredInvestors.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <UserCircle className="h-12 w-12 mx-auto mb-4 opacity-40" />
              <p className="font-medium">No investors found</p>
              <p className="text-sm">Add your first investor to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name (English)</TableHead>
                  <TableHead>Name (Arabic)</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvestors.map((investor) => {
                  const config = statusConfig[investor.status];
                  return (
                    <TableRow key={investor.id} data-testid={`row-investor-${investor.id}`}>
                      <TableCell className="font-medium">{investor.investorCode}</TableCell>
                      <TableCell>{investor.nameEn}</TableCell>
                      <TableCell>{investor.nameAr}</TableCell>
                      <TableCell>
                        {investor.email && <p className="text-sm">{investor.email}</p>}
                        {investor.phone && <p className="text-sm text-muted-foreground">{investor.phone}</p>}
                      </TableCell>
                      <TableCell>
                        <Badge variant={config.variant}>{config.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(investor)}
                          data-testid={`button-edit-${investor.id}`}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingInvestor ? "Edit Investor" : "Add Investor"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="investorCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Investor Code</FormLabel>
                      <FormControl>
                        <Input placeholder="INV-001" {...field} data-testid="input-investor-code" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-status">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="blacklisted">Blacklisted</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nameEn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name (English)</FormLabel>
                      <FormControl>
                        <Input placeholder="Company Name" {...field} data-testid="input-name-en" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nameAr"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name (Arabic)</FormLabel>
                      <FormControl>
                        <Input placeholder="اسم الشركة" dir="rtl" {...field} data-testid="input-name-ar" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="contactPerson"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Person</FormLabel>
                      <FormControl>
                        <Input placeholder="Contact name" {...field} data-testid="input-contact" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="email@example.com" {...field} data-testid="input-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="+966 5x xxx xxxx" {...field} data-testid="input-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="Riyadh" {...field} data-testid="input-city" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Additional notes..." rows={2} {...field} data-testid="input-notes" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-submit"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Saving..."
                    : editingInvestor
                    ? "Update Investor"
                    : "Create Investor"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
