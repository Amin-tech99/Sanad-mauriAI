import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FeatureGate } from "@/components/feature-gate";
import { useAuth } from "@/hooks/use-auth";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { CheckCircle, Calendar, Clock, AlertTriangle, TrendingUp, Users } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    enabled: user?.role === "admin",
  });

  if (user?.role !== "admin") {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 lg:mr-72">
          <Header title="غير مخول" />
          <main className="p-4 lg:p-6">
            <div className="text-center">
              <AlertTriangle className="w-16 h-16 text-[var(--project-error)] mx-auto mb-4" />
              <h2 className="text-xl font-bold arabic-text">غير مخول للوصول</h2>
              <p className="text-[var(--project-text-secondary)] arabic-text">
                هذه الصفحة مخصصة للمديرين فقط
              </p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 lg:mr-72">
        <Header title="لوحة التحكم" />
        <main className="p-4 lg:p-6 overflow-y-auto">
          {/* Welcome Section */}
          <div className="mb-8">
            <div className="bg-gradient-to-r from-[var(--project-primary)] to-[var(--project-primary)]/80 text-white p-6 rounded-lg mb-6">
              <h2 className="text-2xl font-bold mb-2 arabic-text">مرحباً بك في مشروع سند</h2>
              <p className="text-white/90 arabic-text">منصة شاملة لإدارة البيانات اللغوية وترجمة النصوص من العربية الفصحى إلى الحسانية</p>
            </div>
          </div>
          
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
            <Card className="border-l-4 border-[var(--project-primary)]">
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl lg:text-3xl font-bold text-[var(--project-text-primary)]">
                      {isLoading ? "..." : stats?.approvedSentences || 0}
                    </p>
                    <p className="text-xs lg:text-sm text-[var(--project-text-secondary)] arabic-text">
                      الجمل المعتمدة
                    </p>
                  </div>
                  <div className="w-10 h-10 lg:w-12 lg:h-12 bg-[var(--project-primary)]/10 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 lg:w-6 lg:h-6 text-[var(--project-primary)]" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-blue-500">
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl lg:text-3xl font-bold text-[var(--project-text-primary)]">
                      {isLoading ? "..." : stats?.todayProduction || 0}
                    </p>
                    <p className="text-xs lg:text-sm text-[var(--project-text-secondary)] arabic-text">
                      إنتاج اليوم
                    </p>
                  </div>
                  <div className="w-10 h-10 lg:w-12 lg:h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Calendar className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-yellow-500">
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl lg:text-3xl font-bold text-[var(--project-text-primary)]">
                      {isLoading ? "..." : stats?.qaQueue || 0}
                    </p>
                    <p className="text-xs lg:text-sm text-[var(--project-text-secondary)] arabic-text">
                      مهام في المراجعة
                    </p>
                  </div>
                  <div className="w-10 h-10 lg:w-12 lg:h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Clock className="w-5 h-5 lg:w-6 lg:h-6 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-red-500">
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl lg:text-3xl font-bold text-[var(--project-text-primary)]">
                      {isLoading ? "..." : `${stats?.rejectionRate || 0}%`}
                    </p>
                    <p className="text-xs lg:text-sm text-[var(--project-text-secondary)] arabic-text">
                      معدل الرفض
                    </p>
                  </div>
                  <div className="w-10 h-10 lg:w-12 lg:h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 lg:w-6 lg:h-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mb-8">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="arabic-text text-lg lg:text-xl">نظرة عامة على النظام</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                  <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="font-semibold text-[var(--project-text-primary)] arabic-text">الإنتاج اليومي</h4>
                    <p className="text-sm text-[var(--project-text-secondary)] arabic-text">تتبع الإنتاج اليومي للمترجمين</p>
                  </div>
                  
                  <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="font-semibold text-[var(--project-text-primary)] arabic-text">أداء الفريق</h4>
                    <p className="text-sm text-[var(--project-text-secondary)] arabic-text">مراقبة أداء فريق الترجمة</p>
                  </div>
                  
                  <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                    <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="font-semibold text-[var(--project-text-primary)] arabic-text">الجودة</h4>
                    <p className="text-sm text-[var(--project-text-secondary)] arabic-text">مراقبة معايير الجودة</p>
                  </div>
                  
                  <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
                    <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-3">
                      <AlertTriangle className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="font-semibold text-[var(--project-text-primary)] arabic-text">التحليل</h4>
                    <p className="text-sm text-[var(--project-text-secondary)] arabic-text">تحليل البيانات والأداء</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="arabic-text">النشاط الأخير</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4 space-x-reverse p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-[var(--project-primary)]/20 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-[var(--project-primary)]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[var(--project-text-primary)] arabic-text">
                      تم اعتماد عدة ترجمات بواسطة مراجع الجودة
                    </p>
                    <p className="text-xs text-[var(--project-text-secondary)]">
                      منذ دقائق قليلة
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 space-x-reverse p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[var(--project-text-primary)] arabic-text">
                      بدء عدة مترجمين في مهام جديدة
                    </p>
                    <p className="text-xs text-[var(--project-text-secondary)]">
                      منذ ساعة
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 space-x-reverse p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Clock className="w-4 h-4 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[var(--project-text-primary)] arabic-text">
                      تم رفع مقالات جديدة للترجمة
                    </p>
                    <p className="text-xs text-[var(--project-text-secondary)]">
                      منذ ساعتين
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
