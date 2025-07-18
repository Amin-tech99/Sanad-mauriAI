import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Target,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Zap,
  Filter,
  Download
} from "lucide-react";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function Analytics() {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter'>('month');

  const { data: analytics, isLoading, refetch } = useQuery({
    queryKey: ["/api/analytics/advanced", selectedPeriod],
    enabled: user?.role === "admin",
  });

  if (user?.role !== "admin") {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 lg:mr-72">
          <Header title="غير مخول" />
          <main className="p-6">
            <div className="text-center">
              <AlertTriangle className="w-16 h-16 text-[var(--project-error)] mx-auto mb-4" />
              <h2 className="text-xl font-bold arabic-text">غير مخول للوصول</h2>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const handlePeriodChange = (period: 'week' | 'month' | 'quarter') => {
    setSelectedPeriod(period);
  };

  const exportData = () => {
    if (analytics) {
      const dataStr = JSON.stringify(analytics, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analytics-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 lg:mr-72">
          <Header title="التحليلات المتقدمة" />
          <main className="p-6">
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--project-primary)] mx-auto"></div>
              <p className="mt-4 text-[var(--project-text-secondary)] arabic-text">
                جاري تحميل التحليلات...
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
        <Header title="التحليلات المتقدمة" />
        <main className="p-6 overflow-y-auto">
          {/* Header Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-bold text-[var(--project-text-primary)] arabic-text">
                التحليلات المتقدمة
              </h2>
              <p className="text-[var(--project-text-secondary)] arabic-text">
                تحليل شامل للأداء والجودة والإنتاجية
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
                <SelectTrigger className="w-40 text-right" dir="rtl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">الأسبوع الماضي</SelectItem>
                  <SelectItem value="month">الشهر الماضي</SelectItem>
                  <SelectItem value="quarter">الربع الماضي</SelectItem>
                </SelectContent>
              </Select>
              
              <Button onClick={exportData} variant="outline" className="arabic-text">
                <Download className="w-4 h-4 mr-2" />
                تصدير البيانات
              </Button>
            </div>
          </div>

          {/* Overview Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="border-l-4 border-green-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-[var(--project-text-primary)]">
                      {analytics?.qualityMetrics.overallApprovalRate || 0}%
                    </p>
                    <p className="text-sm text-[var(--project-text-secondary)] arabic-text">
                      معدل الموافقة العام
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-blue-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-[var(--project-text-primary)]">
                      {analytics?.qualityMetrics.avgItemsPerDay || 0}
                    </p>
                    <p className="text-sm text-[var(--project-text-secondary)] arabic-text">
                      متوسط العناصر يومياً
                    </p>
                  </div>
                  <Activity className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-purple-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-[var(--project-text-primary)]">
                      {analytics?.qualityMetrics.peakProductionHour || 0}:00
                    </p>
                    <p className="text-sm text-[var(--project-text-secondary)] arabic-text">
                      ساعة الذروة
                    </p>
                  </div>
                  <Zap className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-orange-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-[var(--project-text-primary)]">
                      {analytics?.translatorPerformance.length || 0}
                    </p>
                    <p className="text-sm text-[var(--project-text-secondary)] arabic-text">
                      مترجمين نشطين
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Production Trends Chart */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 arabic-text">
                <TrendingUp className="w-5 h-5" />
                اتجاهات الإنتاج
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analytics?.productionTrends || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="approved" 
                    stackId="1" 
                    stroke="#10B981" 
                    fill="#10B981" 
                    fillOpacity={0.6}
                    name="معتمد"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="rejected" 
                    stackId="1" 
                    stroke="#EF4444" 
                    fill="#EF4444" 
                    fillOpacity={0.6}
                    name="مرفوض"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Performance & Quality Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Translator Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 arabic-text">
                  <Users className="w-5 h-5" />
                  أداء المترجمين
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics?.translatorPerformance.slice(0, 5).map((translator, index) => (
                    <div key={translator.translatorId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[var(--project-primary)] text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-[var(--project-text-primary)] arabic-text">
                            {translator.username}
                          </p>
                          <p className="text-sm text-[var(--project-text-secondary)] arabic-text">
                            {translator.totalCompleted} عنصر مكتمل
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={translator.approvalRate >= 80 ? "default" : "secondary"}>
                          {translator.approvalRate}%
                        </Badge>
                        <p className="text-xs text-[var(--project-text-secondary)] mt-1 arabic-text">
                          {translator.avgTimePerItem}س متوسط الوقت
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Common Rejection Reasons */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 arabic-text">
                  <AlertTriangle className="w-5 h-5" />
                  أسباب الرفض الشائعة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={analytics?.qualityMetrics.commonRejectionReasons || []}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      label={({ reason, percent }) => `${reason} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {analytics?.qualityMetrics.commonRejectionReasons.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Workflow Analytics */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 arabic-text">
                <BarChart3 className="w-5 h-5" />
                تحليل سير العمل
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Bottlenecks */}
                <div>
                  <h4 className="font-medium text-[var(--project-text-primary)] mb-4 arabic-text">
                    الاختناقات في سير العمل
                  </h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={analytics?.workflowAnalytics.bottlenecks || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="stage" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="avgWaitTime" fill="#EF4444" name="متوسط وقت الانتظار (ساعة)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Completion Times */}
                <div>
                  <h4 className="font-medium text-[var(--project-text-primary)] mb-4 arabic-text">
                    أوقات الإنجاز
                  </h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={analytics?.workflowAnalytics.completionTimes || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="stage" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="avgTime" fill="#10B981" name="متوسط الوقت (ساعة)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Source Types Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm arabic-text">أداء أنواع المصادر</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics?.contentAnalytics.sourceTypes.map((source, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-[var(--project-text-primary)] arabic-text">
                          {source.type}
                        </p>
                        <p className="text-xs text-[var(--project-text-secondary)] arabic-text">
                          {source.count} عنصر
                        </p>
                      </div>
                      <Badge variant={source.avgQuality >= 80 ? "default" : "secondary"}>
                        {source.avgQuality.toFixed(1)}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Template Effectiveness */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm arabic-text">فعالية القوالب</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics?.contentAnalytics.templateEffectiveness.map((template) => (
                    <div key={template.templateId} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-[var(--project-text-primary)] arabic-text">
                          {template.name}
                        </p>
                      </div>
                      <Badge variant={template.successRate >= 80 ? "default" : "secondary"}>
                        {template.successRate}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Style Tag Usage */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm arabic-text">استخدام تصنيفات الأسلوب</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics?.contentAnalytics.styleTagUsage.map((tag) => (
                    <div key={tag.tagId} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-[var(--project-text-primary)] arabic-text">
                          {tag.name}
                        </p>
                        <p className="text-xs text-[var(--project-text-secondary)] arabic-text">
                          {tag.usage} استخدام
                        </p>
                      </div>
                      <Badge variant={tag.quality >= 80 ? "default" : "secondary"}>
                        {tag.quality.toFixed(1)}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}