import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error for debugging
    console.error("ErrorBoundary caught an error:", error);
    console.error("Component stack:", errorInfo.componentStack);

    this.setState({ errorInfo });

    // You can also log to an error reporting service here
    // Example: logErrorToService(error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = (): void => {
    window.location.href = "/";
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          className="flex items-center justify-center min-h-[60vh] p-4"
          role="alert"
          aria-live="assertive"
        >
          <Card className="max-w-lg w-full">
            <CardHeader className="text-center pb-4">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 mx-auto mb-4"
                aria-hidden="true"
              >
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle className="text-xl font-semibold">
                Something went wrong
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-center text-muted-foreground">
                An unexpected error occurred. We apologize for the inconvenience.
                Please try again or return to the dashboard.
              </p>

              {import.meta.env.DEV && this.state.error && (
                <details className="mt-4 p-4 bg-muted rounded-lg text-sm">
                  <summary className="cursor-pointer font-medium text-foreground">
                    Error Details (Development Only)
                  </summary>
                  <pre className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground overflow-auto max-h-40">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}

              <div className="flex flex-wrap gap-3 justify-center pt-2">
                <Button
                  variant="outline"
                  onClick={this.handleRetry}
                  aria-label="Try again to reload the component"
                >
                  <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
                  Try Again
                </Button>
                <Button
                  onClick={this.handleGoHome}
                  aria-label="Return to the dashboard"
                >
                  <Home className="mr-2 h-4 w-4" aria-hidden="true" />
                  Go to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
