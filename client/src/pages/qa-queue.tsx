import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { useState } from "react";
import { Search, Clock, User, CheckCircle, AlertTriangle, Languages } from "lucide-react";
import type { WorkItem } from "@shared/schema";

export default function QAQueue() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  const { data: workItems = [], isLoading } = useQuery<WorkItem[]>({
    queryKey: ["/api/qa-queue"],
    enabled: user?.role === "qa" || user?.role === "admin",
  });

  // Filter and sort work items
  const filteredItems = workItems
    .filter(item => 
      item.sourceText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.targetText?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime();
      } else if (sortBy === "oldest") {
        return new Date(a.submittedAt || 0).getTime() - new Date(b.submittedAt || 0).getTime();
      }
      return 0;
    });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "غير محدد";
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeAgo = (dateString: string | null) => {
    if (!dateString) return "غير محدد";
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return "منذ دقائق";
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `منذ ${diffDays} يوم`;
    return formatDate(dateString);
  };

  if (!user || (user.role !== "qa" && user.role !== "admin")) {
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

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 lg:mr-72">
        <Header title="مهام المراجعة" />
        <main className="p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[var(--project-text-primary)] arabic-text">
              مهام في انتظار المراجعة
            </h2>
            <p className="text-[var(--project-text-secondary)] arabic-text">
              المهام المرسلة للمراجعة من المترجمين
            </p>
          </div>

          {/* Filter Bar */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4 space-x-reverse">
                <div className="flex-1 relative">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--project-text-secondary)]" />
                  <Input
                    placeholder="البحث في المهام..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="text-right pr-10"
                    dir="rtl"
                  />
                </div>
                <div className="w-48">
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="text-right" dir="rtl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">الأحدث أولاً</SelectItem>
                      <SelectItem value="oldest">الأقدم أولاً</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="text-sm text-[var(--project-text-secondary)] arabic-text">
                  {filteredItems.length} مهمة
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Work Items */}
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-[var(--project-text-secondary)] arabic-text">جاري التحميل...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="w-16 h-16 text-[var(--project-text-secondary)] mx-auto mb-4" />
                <h3 className="text-lg font-medium text-[var(--project-text-primary)] mb-2 arabic-text">
                  {searchTerm ? "لا توجد نتائج" : "لا توجد مهام للمراجعة"}
                </h3>
                <p className="text-[var(--project-text-secondary)] arabic-text">
                  {searchTerm 
                    ? "جرب تغيير كلمات البحث أو المرشحات"
                    : "ستظهر المهام المرسلة للمراجعة هنا"
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredItems.map((item) => (
                <Card key={item.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 space-x-reverse mb-3">
                          <Badge className="bg-yellow-100 text-yellow-800 arabic-text">
                            <Clock className="w-3 h-3 ml-1" />
                            في انتظار المراجعة
                          </Badge>
                          <span className="text-[var(--project-text-secondary)] text-sm">
                            مهمة #{item.id}
                          </span>
                          <Badge variant="outline" className="arabic-text">
                            <Languages className="w-3 h-3 ml-1" />
                            ترجمة
                          </Badge>
                        </div>

                        <h3 className="font-semibold text-[var(--project-text-primary)] mb-2 arabic-text">
                          ترجمة نص - تسلسل {item.sequenceNumber}
                        </h3>

                        {/* Source Text Preview */}
                        <div className="mb-3">
                          <p className="text-xs font-medium text-[var(--project-text-secondary)] mb-1 arabic-text">
                            النص المصدر:
                          </p>
                          <p className="text-sm text-[var(--project-text-primary)] arabic-text line-clamp-2" dir="rtl">
                            {item.sourceText}
                          </p>
                        </div>

                        {/* Translation Preview */}
                        {item.targetText && (
                          <div className="mb-4">
                            <p className="text-xs font-medium text-[var(--project-text-secondary)] mb-1 arabic-text">
                              الترجمة المقدمة:
                            </p>
                            <p className="text-sm text-[var(--project-primary)] arabic-text line-clamp-2" dir="rtl">
                              {item.targetText}
                            </p>
                          </div>
                        )}

                        <div className="flex items-center space-x-4 space-x-reverse text-xs text-[var(--project-text-secondary)]">
                          <span className="flex items-center space-x-1 space-x-reverse">
                            <Clock className="w-3 h-3" />
                            <span>تاريخ الإرسال: {getTimeAgo(item.submittedAt)}</span>
                          </span>
                          <span className="flex items-center space-x-1 space-x-reverse">
                            <User className="w-3 h-3" />
                            <span className="arabic-text">مترجم #{item.assignedTo}</span>
                          </span>
                        </div>
                      </div>

                      <Button
                        onClick={() => setLocation(`/qa-review/${item.id}`)}
                        className="btn-primary arabic-text"
                      >
                        بدء المراجعة
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
