import { useState, useEffect, Suspense, lazy } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { NotificationsDropdown } from "@/components/notifications-dropdown";
import { LanguageProvider } from "@/components/language-provider";
import { LanguageToggle } from "@/components/language-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { ErrorBoundary } from "@/components/error-boundary";
import { LoadingFallback } from "@/components/loading-fallback";
import { SkipToContent } from "@/components/skip-to-content";
import "@/i18n/config";

// Lazy load pages for code splitting
const LoginPage = lazy(() => import("@/pages/login"));
const Dashboard = lazy(() => import("@/pages/dashboard"));
const UsersList = lazy(() => import("@/pages/users-list"));
const UserCreate = lazy(() => import("@/pages/user-create"));
const UserEdit = lazy(() => import("@/pages/user-edit"));
const RolesList = lazy(() => import("@/pages/roles-list"));
const AuditLogs = lazy(() => import("@/pages/audit-logs"));
const Settings = lazy(() => import("@/pages/settings"));
const AssetRegistrations = lazy(() => import("@/pages/asset-registrations"));
const AssetCreate = lazy(() => import("@/pages/asset-create"));
const AssetRegistrationDetail = lazy(() => import("@/pages/asset-registration-detail"));
const AssetBank = lazy(() => import("@/pages/asset-bank"));
const AssetBankDetail = lazy(() => import("@/pages/asset-bank-detail"));
const ReviewQueue = lazy(() => import("@/pages/review-queue"));
const IsnadForms = lazy(() => import("@/pages/isnad-forms"));
const IsnadFormCreate = lazy(() => import("@/pages/isnad-form-create"));
const IsnadFormDetail = lazy(() => import("@/pages/isnad-form-detail"));
const IsnadPackages = lazy(() => import("@/pages/isnad-packages"));
const IsnadBank = lazy(() => import("@/pages/isnad-bank"));
const Contracts = lazy(() => import("@/pages/contracts"));
const ContractCreate = lazy(() => import("@/pages/contract-create"));
const ContractDetail = lazy(() => import("@/pages/contract-detail"));
const Investors = lazy(() => import("@/pages/investors"));
const ContractsDashboard = lazy(() => import("@/pages/contracts-dashboard"));
const Installments = lazy(() => import("@/pages/installments"));
const PortalAssets = lazy(() => import("@/pages/portal-assets"));
const PortalAssetDetail = lazy(() => import("@/pages/portal-asset-detail"));
const PortalFavorites = lazy(() => import("@/pages/portal-favorites"));
const PortalInterests = lazy(() => import("@/pages/portal-interests"));
const PortalInterestCreate = lazy(() => import("@/pages/portal-interest-create"));
const PortalIstifada = lazy(() => import("@/pages/portal-istifada"));
const PortalIstifadaCreate = lazy(() => import("@/pages/portal-istifada-create"));
const CrmDashboard = lazy(() => import("@/pages/crm-dashboard"));
const CrmInvestors = lazy(() => import("@/pages/crm-investors"));
const CrmInvestorDetail = lazy(() => import("@/pages/crm-investor-detail"));
const CrmInterests = lazy(() => import("@/pages/crm-interests"));
const NotFound = lazy(() => import("@/pages/not-found"));

function Router() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback variant="page" message="Loading page..." />}>
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
      </Suspense>
    </ErrorBoundary>
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
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        role="status"
        aria-live="polite"
        aria-label="Checking authentication status"
      >
        <LoadingFallback variant="minimal" message="Loading application..." />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <TooltipProvider>
            <ErrorBoundary>
              <Suspense fallback={<LoadingFallback variant="minimal" message="Loading login page..." />}>
                <LoginPage />
              </Suspense>
            </ErrorBoundary>
            <Toaster />
          </TooltipProvider>
        </LanguageProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          <SkipToContent />
          <SidebarProvider style={style as React.CSSProperties}>
            <div className="flex h-screen w-full">
              <AppSidebar />
              <div className="flex flex-col flex-1 overflow-hidden">
                <header
                  className="flex items-center justify-between gap-4 border-b px-4 py-2 bg-background"
                  role="banner"
                >
                  <SidebarTrigger
                    data-testid="button-sidebar-toggle"
                    aria-label="Toggle sidebar navigation"
                  />
                  <nav
                    className="flex items-center gap-2"
                    role="navigation"
                    aria-label="Header navigation"
                  >
                    <LanguageToggle />
                    <ThemeToggle />
                    <NotificationsDropdown />
                  </nav>
                </header>
                <main
                  id="main-content"
                  className="flex-1 overflow-auto p-6"
                  role="main"
                  tabIndex={-1}
                >
                  <Router />
                </main>
              </div>
            </div>
          </SidebarProvider>
          <Toaster />
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
