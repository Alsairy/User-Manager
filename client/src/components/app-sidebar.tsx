import { useLocation, Link } from "wouter";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  Users,
  Shield,
  ClipboardList,
  Settings,
  LogOut,
  FileText,
  Building2,
  CheckSquare,
  FileCheck2,
  Package,
  FileSignature,
  Wallet,
  UserCircle,
  BarChart3,
  Grid3X3,
  Heart,
  Send,
  Landmark,
  UserCheck,
  TrendingUp,
  Database,
} from "lucide-react";
import madaresLogo from "@assets/madares_business_1766959895640.png";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

export function AppSidebar() {
  const [location] = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation("navigation");

  const mainNavItems = [
    {
      titleKey: "dashboard",
      url: "/",
      icon: LayoutDashboard,
    },
    {
      titleKey: "userManagement",
      url: "/users",
      icon: Users,
    },
    {
      titleKey: "roles",
      url: "/roles",
      icon: Shield,
    },
    {
      titleKey: "auditLogs",
      url: "/audit-logs",
      icon: ClipboardList,
    },
  ];

  const assetNavItems = [
    {
      titleKey: "assetRegistration",
      url: "/assets/registrations",
      icon: FileText,
    },
    {
      titleKey: "reviewQueue",
      url: "/assets/reviews",
      icon: CheckSquare,
    },
    {
      titleKey: "assetsBank",
      url: "/assets/bank",
      icon: Building2,
    },
  ];

  const isnadNavItems = [
    {
      titleKey: "isnadRequests",
      url: "/isnad/forms",
      icon: FileCheck2,
    },
    {
      titleKey: "isnadBank",
      url: "/isnad/bank",
      icon: Database,
    },
    {
      titleKey: "isnadPackages",
      url: "/isnad/packages",
      icon: Package,
    },
  ];

  const contractNavItems = [
    {
      titleKey: "contracts",
      url: "/contracts",
      icon: FileSignature,
    },
    {
      titleKey: "installments",
      url: "/contracts/installments",
      icon: Wallet,
    },
    {
      titleKey: "investors",
      url: "/contracts/investors",
      icon: UserCircle,
    },
    {
      titleKey: "contractsDashboard",
      url: "/contracts/dashboard",
      icon: BarChart3,
    },
  ];

  const portalNavItems = [
    {
      titleKey: "browseAssets",
      url: "/portal/assets",
      icon: Grid3X3,
    },
    {
      titleKey: "myFavorites",
      url: "/portal/favorites",
      icon: Heart,
    },
    {
      titleKey: "myInterests",
      url: "/portal/interests",
      icon: Send,
    },
    {
      titleKey: "istifadaRequests",
      url: "/portal/istifada",
      icon: Landmark,
    },
  ];

  const crmNavItems = [
    {
      titleKey: "crmAnalytics",
      url: "/crm/dashboard",
      icon: TrendingUp,
    },
    {
      titleKey: "investorRecords",
      url: "/crm/investors",
      icon: UserCheck,
    },
    {
      titleKey: "interestPipeline",
      url: "/crm/interests",
      icon: Send,
    },
  ];

  const settingsItems = [
    {
      titleKey: "settings",
      url: "/settings",
      icon: Settings,
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    toast({
      title: t("logoutSuccess", { ns: "common", defaultValue: "Logged out successfully" }),
      description: t("logoutDescription", { ns: "common", defaultValue: "You have been signed out of your account" }),
    });
    window.location.href = "/";
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <img 
            src={madaresLogo} 
            alt="Madares Business" 
            className="h-10 w-auto"
            data-testid="img-logo"
          />
        </div>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wide">
            {t("mainMenu", { defaultValue: "Main Menu" })}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.titleKey}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url || (item.url !== "/" && location.startsWith(item.url))}
                  >
                    <Link href={item.url} data-testid={`link-nav-${item.titleKey}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{t(item.titleKey)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wide">
            {t("assetsManagement", { defaultValue: "Asset Management" })}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {assetNavItems.map((item) => (
                <SidebarMenuItem key={item.titleKey}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url || location.startsWith(item.url + "/")}
                  >
                    <Link href={item.url} data-testid={`link-nav-${item.titleKey}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{t(item.titleKey)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wide">
            {t("isnadWorkflow", { defaultValue: "ISNAD Workflow" })}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {isnadNavItems.map((item) => (
                <SidebarMenuItem key={item.titleKey}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url || location.startsWith(item.url + "/")}
                  >
                    <Link href={item.url} data-testid={`link-nav-${item.titleKey}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{t(item.titleKey)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wide">
            {t("contractManagement", { defaultValue: "Contracts" })}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {contractNavItems.map((item) => (
                <SidebarMenuItem key={item.titleKey}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url || (item.url !== "/contracts" && location.startsWith(item.url))}
                  >
                    <Link href={item.url} data-testid={`link-nav-${item.titleKey}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{t(item.titleKey)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wide">
            {t("investorPortal", { defaultValue: "Investor Portal" })}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {portalNavItems.map((item) => (
                <SidebarMenuItem key={item.titleKey}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url || location.startsWith(item.url + "/")}
                  >
                    <Link href={item.url} data-testid={`link-nav-${item.titleKey}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{t(item.titleKey)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wide">
            {t("investorsCrm", { defaultValue: "Investor CRM" })}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {crmNavItems.map((item) => (
                <SidebarMenuItem key={item.titleKey}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url || location.startsWith(item.url + "/")}
                  >
                    <Link href={item.url} data-testid={`link-nav-${item.titleKey}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{t(item.titleKey)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wide">
            {t("configuration", { defaultValue: "Configuration" })}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.titleKey}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                  >
                    <Link href={item.url} data-testid={`link-nav-${item.titleKey}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{t(item.titleKey)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarSeparator />
      <SidebarFooter className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary/10 text-sm font-medium">
              PA
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-1 flex-col overflow-hidden">
            <span className="truncate text-sm font-medium">{t("platformAdmin", { defaultValue: "Platform Admin" })}</span>
            <span className="truncate text-xs text-muted-foreground">
              admin@madares.sa
            </span>
          </div>
          <SidebarMenuButton
            size="sm"
            className="h-8 w-8 p-0"
            data-testid="button-logout"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
          </SidebarMenuButton>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
