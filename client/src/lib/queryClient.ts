import { QueryClient, QueryFunction, QueryCache, MutationCache } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

// Error message extraction helper
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Try to parse JSON error message if present
    try {
      const parsed = JSON.parse(error.message.split(": ").slice(1).join(": "));
      return parsed.message || parsed.error || error.message;
    } catch {
      return error.message;
    }
  }
  if (typeof error === "string") {
    return error;
  }
  return "An unexpected error occurred";
}

// Get user-friendly error message based on status code
function getStatusMessage(status: number): string {
  switch (status) {
    case 400:
      return "Invalid request. Please check your input and try again.";
    case 401:
      return "Your session has expired. Please log in again.";
    case 403:
      return "You don't have permission to perform this action.";
    case 404:
      return "The requested resource was not found.";
    case 409:
      return "This action conflicts with existing data.";
    case 422:
      return "The data provided is invalid.";
    case 429:
      return "Too many requests. Please wait a moment and try again.";
    case 500:
      return "Server error. Please try again later.";
    case 502:
    case 503:
    case 504:
      return "Service temporarily unavailable. Please try again later.";
    default:
      return "An error occurred. Please try again.";
  }
}

// Extract status code from error
function getStatusCode(error: unknown): number | null {
  if (error instanceof Error) {
    const match = error.message.match(/^(\d{3}):/);
    if (match) {
      return parseInt(match[1], 10);
    }
  }
  return null;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const token = sessionStorage.getItem('access_token');
  const headers: Record<string, string> = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (data) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const token = sessionStorage.getItem('access_token');
    const headers: Record<string, string> = {};

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(queryKey.join("/") as string, {
      headers,
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

// Create query cache with global error handling
const queryCache = new QueryCache({
  onError: (error, query) => {
    // Don't show toast for background refetches if we already have data
    if (query.state.data !== undefined) {
      console.error("Background fetch error:", error);
      return;
    }

    const status = getStatusCode(error);

    // Handle 401 - redirect to login
    if (status === 401) {
      localStorage.removeItem("isLoggedIn");
      sessionStorage.removeItem("access_token");
      toast({
        variant: "destructive",
        title: "Session Expired",
        description: "Please log in again to continue.",
      });
      // Trigger a page reload to show login
      window.location.reload();
      return;
    }

    // Show toast for other errors
    const message = status ? getStatusMessage(status) : getErrorMessage(error);
    toast({
      variant: "destructive",
      title: "Error",
      description: message,
    });
  },
});

// Create mutation cache with global error handling
const mutationCache = new MutationCache({
  onError: (error) => {
    const status = getStatusCode(error);

    // Handle 401 - redirect to login
    if (status === 401) {
      localStorage.removeItem("isLoggedIn");
      sessionStorage.removeItem("access_token");
      toast({
        variant: "destructive",
        title: "Session Expired",
        description: "Please log in again to continue.",
      });
      window.location.reload();
      return;
    }

    // Show toast for other errors
    const message = status ? getStatusMessage(status) : getErrorMessage(error);
    toast({
      variant: "destructive",
      title: "Operation Failed",
      description: message,
    });
  },
  onSuccess: () => {
    // Optionally show success toast for mutations
    // This is commented out as individual components may want to handle success differently
    // toast({
    //   title: "Success",
    //   description: "Operation completed successfully.",
    // });
  },
});

export const queryClient = new QueryClient({
  queryCache,
  mutationCache,
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (client errors)
        const status = getStatusCode(error);
        if (status && status >= 400 && status < 500) {
          return false;
        }
        // Retry up to 2 times for server errors
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: false,
    },
  },
});
