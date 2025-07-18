import { ReactNode } from "react";
import { useFeature } from "@/hooks/use-feature";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock } from "lucide-react";

interface FeatureGateProps {
  featureKey: string;
  children: ReactNode;
  fallback?: ReactNode;
  showDisabledMessage?: boolean;
}

export function FeatureGate({ 
  featureKey, 
  children, 
  fallback,
  showDisabledMessage = true 
}: FeatureGateProps) {
  const { isFeatureEnabled, isLoading } = useFeature();
  
  if (isLoading) {
    return null; // Or a loading state
  }
  
  if (!isFeatureEnabled(featureKey)) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    if (showDisabledMessage) {
      return (
        <Alert className="border-amber-200 bg-amber-50">
          <Lock className="h-4 w-4 text-amber-600" />
          <AlertDescription className="arabic-text text-amber-800">
            هذه الميزة معطلة حالياً من قبل إدارة النظام
          </AlertDescription>
        </Alert>
      );
    }
    
    return null;
  }
  
  return <>{children}</>;
}