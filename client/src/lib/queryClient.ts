import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Environment-specific API configuration
const API_BASE_URL = import.meta.env.PROD  
  ? '' // Use relative URLs in production 
  : 'http://localhost:5000'; // Use absolute URL in development

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    try {
      // Check if the response is JSON
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const errorData = await res.json();
        const error = new Error(errorData.error || res.statusText);
        (error as any).response = { data: errorData };
        throw error;
      } else {
        // Handle non-JSON responses (like HTML error pages)
        const text = await res.text();
        if (text.includes("Vercel Authentication")) {
          throw new Error("Authentication required. Please check your deployment settings.");
        }
        throw new Error(`${res.status}: ${text.substring(0, 200)}...`);
      }
    } catch (e) {
      if (e instanceof Error && e.message) {
        throw e;
      }
      const text = (await res.text()) || res.statusText;
      throw new Error(`${res.status}: ${text}`);
    }
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const fullUrl = `${API_BASE_URL}${url}`;
  const res = await fetch(fullUrl, {
    method,
    headers: {
      "Content-Type": "application/json",
      // Add any auth headers if needed
    },
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
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
    const url = queryKey.join("/") as string;
    const fullUrl = `${API_BASE_URL}${url}`;
    const res = await fetch(fullUrl, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
