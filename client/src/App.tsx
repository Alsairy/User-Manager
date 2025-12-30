import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { NotificationsDropdown } from "@/components/notifications-dropdown";
import LoginPage from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import UsersList from "@/pages/users-list";
import UserCreate from "@/pages/user-create";
import UserEdit from "@/pages/user-edit";
import RolesList from "@/pages/roles-list";
import AuditLogs from "@/pages/audit-logs";
import Settings from "@/pages/settings";
import AssetRegistrations from "@/pages/asset-registrations";
import AssetCreate from "@/pages/asset-create";
import AssetRegistrationDetail from "@/pages/asset-registration-detail";
import AssetBank from "@/pages/asset-bank";
import AssetBankDetail from "@/pages/asset-bank-detail";
import ReviewQueue from "@/pages/review-queue";
import IsnadForms from "@/pages/isnad-forms";
import IsnadFormCreate from "@/pages/isnad-form-create";
import IsnadFormDetail from "@/pages/isnad-form-detail";
import IsnadPackages from "@/pages/isnad-packages";
import IsnadBank from "@/pages/isnad-bank";
import Contracts from "@/pages/contracts";
import ContractCreate from "@/pages/contract-create";
import ContractDetail from "@/pages/contract-detail";
import Investors from "@/pages/investors";
import ContractsDashboard from "@/pages/contracts-dashboard";
import Installments from "@/pages/installments";
import PortalAssets from "@/pages/portal-assets";
import PortalAssetDetail from "@/pages/portal-asset-detail";
import PortalFavorites from "@/pages/portal-favorites";
import PortalInterests from "@/pages/portal-interests";
import PortalInterestCreate from "@/pages/portal-interest-create";
import PortalIstifada from "@/pages/portal-istifada";
import PortalIstifadaCreate from "@/pages/portal-istifada-create";
import CrmDashboard from "@/pages/crm-dashboard";
import CrmInvestors from "@/pages/crm-investors";
import CrmInvestorDetail from "@/pages/crm-investor-detail";
import CrmInterests from "@/pages/crm-interests";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/users" component={UsersList} />
      <Route path="/users/create" component={UserCreate} />
      <Route path="/users/:id/edit" component={UserEdit} />
      <Route path="/roles" component={RolesList} />
      <Route path="/audit-logs" component={AuditLogs} />
      <Route path="/settings" component={Settings} />
      <Route path="/assets/registrations" component={AssetRegistrations} />
      <Route path="/assets/registrations/create" component={AssetCreate} />
      <Route path="/assets/registrations/:id" component={AssetRegistrationDetail} />
      <Route path="/assets/reviews" component={ReviewQueue} />
      <Route path="/assets/bank" component={AssetBank} />
      <Route path="/assets/bank/:id" component={AssetBankDetail} />
      <Route path="/isnad/forms" component={IsnadForms} />
      <Route path="/isnad/forms/new" component={IsnadFormCreate} />
      <Route path="/isnad/forms/:id" component={IsnadFormDetail} />
      <Route path="/isnad/packages" component={IsnadPackages} />
      <Route path="/isnad/bank" component={IsnadBank} />
      <Route path="/contracts" component={Contracts} />
      <Route path="/contracts/new" component={ContractCreate} />
      <Route path="/contracts/dashboard" component={ContractsDashboard} />
      <Route path="/contracts/investors" component={Investors} />
      <Route path="/contracts/installments" component={Installments} />
      <Route path="/contracts/:id" component={ContractDetail} />
      <Route path="/portal/assets" component={PortalAssets} />
      <Route path="/portal/assets/:id" component={PortalAssetDetail} />
      <Route path="/portal/favorites" component={PortalFavorites} />
      <Route path="/portal/interests" component={PortalInterests} />
      <Route path="/portal/interests/new" component={PortalInterestCreate} />
      <Route path="/portal/istifada" component={PortalIstifada} />
      <Route path="/portal/istifada/new" component={PortalIstifadaCreate} />
      <Route path="/crm/dashboard" component={CrmDashboard} />
      <Route path="/crm/investors" component={CrmInvestors} />
      <Route path="/crm/investors/:id" component={CrmInvestorDetail} />
      <Route path="/crm/interests" component={CrmInterests} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const loggedIn = localStorage.getItem("isLoggedIn") === "true";
    setIsLoggedIn(loggedIn);
  }, []);

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  if (isLoggedIn === null) {
    return null;
  }

  if (!isLoggedIn) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <LoginPage />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider style={style as React.CSSProperties}>
          <div className="flex h-screen w-full">
            <AppSidebar />
            <div className="flex flex-col flex-1 overflow-hidden">
              <header className="flex items-center justify-between gap-4 border-b px-4 py-2 bg-background">
                <SidebarTrigger data-testid="button-sidebar-toggle" />
                <NotificationsDropdown />
              </header>
              <main className="flex-1 overflow-auto p-6">
                <Router />
              </main>
            </div>
          </div>
        </SidebarProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
