import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  User, 
  Building2, 
  Mail, 
  Phone, 
  Calendar,
  FileText,
  Heart,
  Clock,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { format } from "date-fns";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "Active", variant: "default" },
  blocked: { label: "Blocked", variant: "destructive" },
  pending_verification: { label: "Pending Verification", variant: "secondary" },
};

const accountTypeConfig: Record<string, { label: string; icon: typeof User }> = {
  individual: { label: "Individual", icon: User },
  company: { label: "Company", icon: Building2 },
};

const verificationConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  verified: { label: "Verified", variant: "default" },
  pending: { label: "Pending", variant: "secondary" },
  rejected: { label: "Rejected", variant: "destructive" },
};

interface InvestorAccount {
  id: string;
  ssoUserId: string;
  investorId: string;
  accountType: string;
  fullNameAr: string;
  fullNameEn: string;
  nationalIdOrCr: string;
  email: string;
  phone: string | null;
  companyName: string | null;
  contactPerson: string | null;
  verificationStatus: string;
  status: string;
  registrationDate: string;
  lastLoginAt: string | null;
  totalInterests: number;
  totalContracts: number;
  createdAt: string;
  updatedAt: string;
}

export default function CrmInvestorDetail() {
  const [, params] = useRoute("/crm/investors/:id");
  const investorId = params?.id;

  const { data: investor, isLoading } = useQuery<InvestorAccount>({
    queryKey: ["/api/crm/investors", investorId],
    queryFn: () => fetch(`/api/crm/investors/${investorId}`).then(r => r.json()),
    enabled: !!investorId,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!investor) {
    return (
      <div className="text-center py-12">
        <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium">Investor not found</h3>
        <p className="text-muted-foreground mb-4">The investor record could not be found.</p>
        <Link href="/crm/investors">
          <Button>Back to Investors</Button>
        </Link>
      </div>
    );
  }

  const statusInfo = statusConfig[investor.status] || { label: investor.status, variant: "secondary" };
  const typeInfo = accountTypeConfig[investor.accountType] || { label: investor.accountType, icon: User };
  const verificationInfo = verificationConfig[investor.verificationStatus] || { label: investor.verificationStatus, variant: "secondary" };
  const TypeIcon = typeInfo.icon;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/crm/investors">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">{investor.fullNameEn}</h1>
          <p className="text-muted-foreground">{investor.investorId}</p>
        </div>
        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="interests" data-testid="tab-interests">Interests</TabsTrigger>
          <TabsTrigger value="activity" data-testid="tab-activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Full Name (English)</p>
                    <p className="font-medium">{investor.fullNameEn}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Full Name (Arabic)</p>
                    <p className="font-medium" dir="rtl">{investor.fullNameAr}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Account Type</p>
                    <div className="flex items-center gap-1">
                      <TypeIcon className="h-4 w-4 text-muted-foreground" />
                      <span>{typeInfo.label}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">National ID / CR</p>
                    <p className="font-medium">{investor.nationalIdOrCr}</p>
                  </div>
                  {investor.companyName && (
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">Company Name</p>
                      <p className="font-medium">{investor.companyName}</p>
                    </div>
                  )}
                  {investor.contactPerson && (
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">Contact Person</p>
                      <p className="font-medium">{investor.contactPerson}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    {investor.email}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    {investor.phone || "Not provided"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Account Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Verification</p>
                    <Badge variant={verificationInfo.variant}>{verificationInfo.label}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Registration Date</p>
                    <p className="font-medium">{format(new Date(investor.registrationDate), "MMM d, yyyy")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last Login</p>
                    <p className="font-medium">
                      {investor.lastLoginAt 
                        ? format(new Date(investor.lastLoginAt), "MMM d, yyyy h:mm a")
                        : "Never"
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <Heart className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{investor.totalInterests}</p>
                    <p className="text-sm text-muted-foreground">Investment Interests</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{investor.totalContracts}</p>
                    <p className="text-sm text-muted-foreground">Active Contracts</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {Math.floor((Date.now() - new Date(investor.registrationDate).getTime()) / (1000 * 60 * 60 * 24))}
                    </p>
                    <p className="text-sm text-muted-foreground">Days Since Registration</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="interests">
          <Card>
            <CardHeader>
              <CardTitle>Investment Interests</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                No investment interests found for this investor.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                No recent activity found for this investor.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
