import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/use-auth";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Settings, 
  AlertTriangle, 
  Shield, 
  Database, 
  Users, 
  Languages, 
  CheckCircle,
  Package,
  BarChart3,
  Lock
} from "lucide-react";
import type { PlatformFeature } from "@shared/schema";

const categoryIcons = {
  core: Package,
  translation: Languages,
  quality: CheckCircle,
  data: Database,
  user: Users,
};

const categoryLabels = {
  core: "الوظائف الأساسية",
  translation: "أدوات الترجمة",
  quality: "ضمان الجودة",
  data: "البيانات والتحليلات",
  user: "إدارة المستخدمين",
};

export default function PlatformControl() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  if (user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">غير مصرح بالدخول</h2>
          <p className="text-muted-foreground">هذه الصفحة متاحة للمسؤولين فقط</p>
        </div>
      </div>
    );
  }

  // Fetch platform features
  const { data: features = [], isLoading, refetch } = useQuery<PlatformFeature[]>({
    queryKey: ["/api/platform-features"],
    enabled: user?.role === "admin",
  });

  // Update feature mutation
  const updateFeatureMutation = useMutation({
    mutationFn: async ({ featureKey, isEnabled }: { featureKey: string; isEnabled: boolean }) => {
      const res = await apiRequest("PATCH", `/api/platform-features/${featureKey}`, {
        isEnabled,
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update feature");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/platform-features"] });
      refetch();
      toast({
        title: "تم التحديث بنجاح",
        description: "تم تحديث إعدادات الميزة",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ في التحديث",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleToggleFeature = (featureKey: string, currentState: boolean) => {
    updateFeatureMutation.mutate({
      featureKey,
      isEnabled: !currentState,
    });
  };

  // Group features by category
  const featuresByCategory = features.reduce((acc, feature) => {
    const category = feature.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(feature);
    return acc;
  }, {} as Record<string, PlatformFeature[]>);

  const categories = Object.keys(featuresByCategory);
  const filteredFeatures = selectedCategory 
    ? featuresByCategory[selectedCategory] || []
    : features;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        <Header />
        
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl lg:text-3xl font-bold text-[var(--project-text-primary)] mb-2 arabic-text flex items-center gap-2">
                <Shield className="w-8 h-8 text-[var(--project-primary)]" />
                التحكم في المنصة
              </h1>
              <p className="text-[var(--project-text-secondary)] arabic-text">
                تحكم في تفعيل أو تعطيل أي ميزة في المنصة
              </p>
            </div>

            {/* Warning Alert */}
            <Alert className="mb-6 border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="arabic-text text-amber-800">
                تنبيه: تعطيل بعض الميزات قد يؤثر على عمل المنصة. بعض الميزات لها تبعيات ولا يمكن تعطيلها إذا كانت ميزات أخرى تعتمد عليها.
              </AlertDescription>
            </Alert>

            {/* Category Filter */}
            <div className="mb-6 flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(null)}
                className="arabic-text"
              >
                جميع الميزات
              </Button>
              {categories.map((category) => {
                const Icon = categoryIcons[category as keyof typeof categoryIcons] || Package;
                return (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className="arabic-text"
                  >
                    <Icon className="w-4 h-4 ml-2" />
                    {categoryLabels[category as keyof typeof categoryLabels] || category}
                  </Button>
                );
              })}
            </div>

            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--project-primary)]"></div>
              </div>
            ) : (
              <div className="grid gap-4">
                {Object.entries(selectedCategory ? { [selectedCategory]: filteredFeatures } : featuresByCategory).map(([category, categoryFeatures]) => {
                  const Icon = categoryIcons[category as keyof typeof categoryIcons] || Package;
                  
                  return (
                    <Card key={category} className="overflow-hidden">
                      <CardHeader className="bg-gray-50 border-b">
                        <CardTitle className="text-lg arabic-text flex items-center gap-2">
                          <Icon className="w-5 h-5 text-[var(--project-primary)]" />
                          {categoryLabels[category as keyof typeof categoryLabels] || category}
                        </CardTitle>
                      </CardHeader>
                      
                      <CardContent className="p-0">
                        <div className="divide-y">
                          {(categoryFeatures as PlatformFeature[]).map((feature) => (
                            <div key={feature.id} className="p-4 hover:bg-gray-50 transition-colors">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-medium text-[var(--project-text-primary)] arabic-text">
                                      {feature.featureName}
                                    </h3>
                                    {feature.dependencies && feature.dependencies.length > 0 && (
                                      <Lock className="w-4 h-4 text-gray-400" title="Has dependencies" />
                                    )}
                                  </div>
                                  <p className="text-sm text-[var(--project-text-secondary)] arabic-text mb-2">
                                    {feature.description}
                                  </p>
                                  
                                  {/* Dependencies */}
                                  {feature.dependencies && feature.dependencies.length > 0 && (
                                    <div className="flex items-center gap-2 mt-2">
                                      <span className="text-xs text-gray-500 arabic-text">يعتمد على:</span>
                                      <div className="flex gap-1 flex-wrap">
                                        {feature.dependencies.map(dep => {
                                          const depFeature = features.find(f => f.featureKey === dep);
                                          return (
                                            <Badge 
                                              key={dep} 
                                              variant={depFeature?.isEnabled ? "secondary" : "destructive"}
                                              className="text-xs"
                                            >
                                              {depFeature?.featureName || dep}
                                            </Badge>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* Feature Key (for debugging) */}
                                  <code className="text-xs text-gray-400 mt-2 block">
                                    {feature.featureKey}
                                  </code>
                                </div>
                                
                                <div className="flex items-center gap-3">
                                  <Badge 
                                    variant={feature.isEnabled ? "default" : "secondary"}
                                    className={feature.isEnabled ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}
                                  >
                                    {feature.isEnabled ? "مفعل" : "معطل"}
                                  </Badge>
                                  
                                  <Switch
                                    checked={feature.isEnabled}
                                    onCheckedChange={() => handleToggleFeature(feature.featureKey, feature.isEnabled)}
                                    disabled={updateFeatureMutation.isPending}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
            
            {/* Feature Statistics */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg arabic-text flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-[var(--project-primary)]" />
                  إحصائيات الميزات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[var(--project-primary)]">
                      {features.length}
                    </div>
                    <div className="text-sm text-[var(--project-text-secondary)] arabic-text">
                      إجمالي الميزات
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {features.filter(f => f.isEnabled).length}
                    </div>
                    <div className="text-sm text-[var(--project-text-secondary)] arabic-text">
                      ميزات مفعلة
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">
                      {features.filter(f => !f.isEnabled).length}
                    </div>
                    <div className="text-sm text-[var(--project-text-secondary)] arabic-text">
                      ميزات معطلة
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-amber-600">
                      {features.filter(f => f.dependencies && f.dependencies.length > 0).length}
                    </div>
                    <div className="text-sm text-[var(--project-text-secondary)] arabic-text">
                      ميزات لها تبعيات
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}