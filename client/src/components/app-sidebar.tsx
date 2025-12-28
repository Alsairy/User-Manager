import { useLocation, Link } from "wouter";
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

const mainNavItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "User Management",
    url: "/users",
    icon: Users,
  },
  {
    title: "Role Management",
    url: "/roles",
    icon: Shield,
  },
  {
    title: "Audit Logs",
    url: "/audit-logs",
    icon: ClipboardList,
  },
];

const assetNavItems = [
  {
    title: "Asset Registration",
    url: "/assets/registrations",
    icon: FileText,
  },
  {
    title: "Review Queue",
    url: "/assets/reviews",
    icon: CheckSquare,
  },
  {
    title: "Asset Bank",
    url: "/assets/bank",
    icon: Building2,
  },
];

const isnadNavItems = [
  {
    title: "ISNAD Forms",
    url: "/isnad/forms",
    icon: FileCheck2,
  },
  {
    title: "ISNAD Packages",
    url: "/isnad/packages",
    icon: Package,
  },
];

const contractNavItems = [
  {
    title: "Contracts",
    url: "/contracts",
    icon: FileSignature,
  },
  {
    title: "Installments",
    url: "/contracts/installments",
    icon: Wallet,
  },
  {
    title: "Investors",
    url: "/contracts/investors",
    icon: UserCircle,
  },
  {
    title: "Dashboard",
    url: "/contracts/dashboard",
    icon: BarChart3,
  },
];

const portalNavItems = [
  {
    title: "Browse Assets",
    url: "/portal/assets",
    icon: Grid3X3,
  },
  {
    title: "My Favorites",
    url: "/portal/favorites",
    icon: Heart,
  },
  {
    title: "My Interests",
    url: "/portal/interests",
    icon: Send,
  },
  {
    title: "Istifada Requests",
    url: "/portal/istifada",
    icon: Landmark,
  },
];

const crmNavItems = [
  {
    title: "CRM Analytics",
    url: "/crm/dashboard",
    icon: TrendingUp,
  },
  {
    title: "Investor Records",
    url: "/crm/investors",
    icon: UserCheck,
  },
  {
    title: "Interest Pipeline",
    url: "/crm/interests",
    icon: Send,
  },
];

const settingsItems = [
  {
    title: "System Settings",
    url: "/settings",
    icon: Settings,
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { toast } = useToast();

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    toast({
      title: "Logged out successfully",
      description: "You have been signed out of your account",
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
            Main Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url || (item.url !== "/" && location.startsWith(item.url))}
                  >
                    <Link href={item.url} data-testid={`link-nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wide">
            Asset Management
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {assetNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url || location.startsWith(item.url + "/")}
                  >
                    <Link href={item.url} data-testid={`link-nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wide">
            ISNAD Workflow
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {isnadNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url || location.startsWith(item.url + "/")}
                  >
                    <Link href={item.url} data-testid={`link-nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wide">
            Contracts
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {contractNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url || (item.url !== "/contracts" && location.startsWith(item.url))}
                  >
                    <Link href={item.url} data-testid={`link-nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wide">
            Investor Portal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {portalNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url || location.startsWith(item.url + "/")}
                  >
                    <Link href={item.url} data-testid={`link-nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wide">
            Investor CRM
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {crmNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url || location.startsWith(item.url + "/")}
                  >
                    <Link href={item.url} data-testid={`link-nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wide">
            Configuration
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                  >
                    <Link href={item.url} data-testid={`link-nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
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
            <span className="truncate text-sm font-medium">Platform Admin</span>
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
