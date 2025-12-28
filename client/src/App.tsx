import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationsDropdown } from "@/components/notifications-dropdown";
import Dashboard from "@/pages/dashboard";
import UsersList from "@/pages/users-list";
import UserCreate from "@/pages/user-create";
import UserEdit from "@/pages/user-edit";
import RolesList from "@/pages/roles-list";
import AuditLogs from "@/pages/audit-logs";
import Settings from "@/pages/settings";
import AssetRegistrations from "@/pages/asset-registrations";
import AssetCreate from "@/pages/asset-create";
import AssetBank from "@/pages/asset-bank";
import AssetBankDetail from "@/pages/asset-bank-detail";
import ReviewQueue from "@/pages/review-queue";
import IsnadForms from "@/pages/isnad-forms";
import IsnadFormCreate from "@/pages/isnad-form-create";
import IsnadFormDetail from "@/pages/isnad-form-detail";
import IsnadPackages from "@/pages/isnad-packages";
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
      <Route path="/assets/reviews" component={ReviewQueue} />
      <Route path="/assets/bank" component={AssetBank} />
      <Route path="/assets/bank/:id" component={AssetBankDetail} />
      <Route path="/isnad/forms" component={IsnadForms} />
      <Route path="/isnad/forms/new" component={IsnadFormCreate} />
      <Route path="/isnad/forms/:id" component={IsnadFormDetail} />
      <Route path="/isnad/packages" component={IsnadPackages} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider style={style as React.CSSProperties}>
          <div className="flex h-screen w-full">
            <AppSidebar />
            <div className="flex flex-col flex-1 overflow-hidden">
              <header className="flex items-center justify-between gap-4 border-b px-4 py-2 bg-background">
                <SidebarTrigger data-testid="button-sidebar-toggle" />
                <div className="flex items-center gap-2">
                  <NotificationsDropdown />
                  <ThemeToggle />
                </div>
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
