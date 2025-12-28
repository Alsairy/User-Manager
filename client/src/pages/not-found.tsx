import { Link } from "wouter";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full">
        <CardContent className="flex flex-col items-center py-12 px-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-6">
            <span className="text-3xl font-bold text-muted-foreground">404</span>
          </div>
          <h1 className="text-2xl font-semibold mb-2" data-testid="text-page-title">
            Page Not Found
          </h1>
          <p className="text-muted-foreground mb-6">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button variant="outline" onClick={() => window.history.back()} data-testid="button-go-back">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
            <Link href="/">
              <Button data-testid="button-go-home">
                <Home className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
