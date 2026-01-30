import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { Home, ArrowLeft, Search, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NotFound() {
  const { t } = useTranslation(["pages", "common"]);

  return (
    <div
      className="flex items-center justify-center min-h-[60vh]"
      role="main"
      aria-labelledby="not-found-title"
    >
      <Card className="max-w-md w-full">
        <CardHeader className="text-center pb-4">
          <div
            className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mx-auto mb-4"
            aria-hidden="true"
          >
            <span className="text-4xl font-bold text-muted-foreground">404</span>
          </div>
          <CardTitle
            id="not-found-title"
            className="text-2xl font-semibold"
            data-testid="text-page-title"
          >
            {t("pages:notFound.title", { defaultValue: "Page Not Found" })}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-center text-muted-foreground">
            {t("pages:notFound.message", {
              defaultValue: "The page you're looking for doesn't exist or has been moved."
            })}
          </p>

          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium flex items-center gap-2">
              <HelpCircle className="h-4 w-4" aria-hidden="true" />
              {t("pages:notFound.helpTitle", { defaultValue: "What can you do?" })}
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>
                {t("pages:notFound.checkUrl", {
                  defaultValue: "Check the URL for typos"
                })}
              </li>
              <li>
                {t("pages:notFound.goBack", {
                  defaultValue: "Go back to the previous page"
                })}
              </li>
              <li>
                {t("pages:notFound.returnHome", {
                  defaultValue: "Return to the dashboard"
                })}
              </li>
            </ul>
          </div>

          <div className="flex flex-wrap gap-3 justify-center pt-2">
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              data-testid="button-go-back"
              aria-label={t("pages:notFound.goBackAriaLabel", {
                defaultValue: "Go back to previous page"
              })}
            >
              <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
              {t("common:goBack", { defaultValue: "Go Back" })}
            </Button>
            <Link href="/">
              <Button
                data-testid="button-go-home"
                aria-label={t("pages:notFound.dashboardAriaLabel", {
                  defaultValue: "Go to dashboard"
                })}
              >
                <Home className="mr-2 h-4 w-4" aria-hidden="true" />
                {t("common:dashboard", { defaultValue: "Dashboard" })}
              </Button>
            </Link>
          </div>

          <div className="text-center pt-2">
            <p className="text-xs text-muted-foreground">
              {t("pages:notFound.needHelp", {
                defaultValue: "Need help? Contact your system administrator."
              })}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
