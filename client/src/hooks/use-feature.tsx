import { useQuery } from "@tanstack/react-query";
import { createContext, ReactNode, useContext } from "react";
import { useAuth } from "@/hooks/use-auth";
import type { PlatformFeature } from "@shared/schema";

interface FeatureContextType {
  features: PlatformFeature[];
  isFeatureEnabled: (featureKey: string) => boolean;
  isLoading: boolean;
}

const FeatureContext = createContext<FeatureContextType | null>(null);

export function FeatureProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  
  const { data: features = [], isLoading } = useQuery<PlatformFeature[]>({
    queryKey: ["/api/platform-features"],
    enabled: !!user, // Only fetch when user is authenticated
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const isFeatureEnabled = (featureKey: string): boolean => {
    // Platform control feature is always enabled for admins
    if (featureKey === "platform_control" && user?.role === "admin") {
      return true;
    }
    
    // If not logged in or features not loaded, default to true for critical features
    if (!user || isLoading) {
      const criticalFeatures = ["user_authentication", "role_based_access"];
      return criticalFeatures.includes(featureKey);
    }
    
    const feature = features.find(f => f.featureKey === featureKey);
    return feature?.isEnabled ?? false;
  };

  return (
    <FeatureContext.Provider value={{ features, isFeatureEnabled, isLoading }}>
      {children}
    </FeatureContext.Provider>
  );
}

export function useFeature() {
  const context = useContext(FeatureContext);
  if (!context) {
    throw new Error("useFeature must be used within a FeatureProvider");
  }
  return context;
}