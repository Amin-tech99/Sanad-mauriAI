import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
        <div className="flex-1 mr-64">
          <Header title="غير مخول" />
          <main className="p-6">
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
      <div className="flex-1 mr-64">
        <Header title="لوحة التحكم الرئيسية" />
        <main className="p-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-[var(--project-text-primary)]">
                      {isLoading ? "..." : stats?.approvedSentences || 0}
                    </p>
                    <p className="text-sm text-[var(--project-text-secondary)] arabic-text">
                      الجمل المعتمدة
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-[var(--project-primary)]/10 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-[var(--project-primary)]" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-[var(--project-text-primary)]">
                      {isLoading ? "..." : stats?.todayProduction || 0}
                    </p>
                    <p className="text-sm text-[var(--project-text-secondary)] arabic-text">
                      إنتاج اليوم
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-[var(--project-text-primary)]">
                      {isLoading ? "..." : stats?.qaQueue || 0}
                    </p>
                    <p className="text-sm text-[var(--project-text-secondary)] arabic-text">
                      مهام في المراجعة
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-[var(--project-text-primary)]">
                      {isLoading ? "..." : `${stats?.rejectionRate || 0}%`}
                    </p>
                    <p className="text-sm text-[var(--project-text-secondary)] arabic-text">
                      معدل الرفض
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="arabic-text">الإنتاج اليومي (آخر 30 يومًا)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                  <div className="text-center text-[var(--project-text-secondary)]">
                    <TrendingUp className="w-12 h-12 mx-auto mb-2" />
                    <p className="arabic-text">مخطط الإنتاج اليومي</p>
                    <p className="text-sm arabic-text">(سيتم التنفيذ مع مكتبة الرسوم البيانية)</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="arabic-text">أداء الفريق (هذا الأسبوع)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                  <div className="text-center text-[var(--project-text-secondary)]">
                    <Users className="w-12 h-12 mx-auto mb-2" />
                    <p className="arabic-text">مخطط أداء الفريق</p>
                    <p className="text-sm arabic-text">(سيتم التنفيذ مع مكتبة الرسوم البيانية)</p>
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
