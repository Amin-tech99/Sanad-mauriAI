import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { useToast } from "@/hooks/use-toast";
import { useFeature } from "@/hooks/use-feature";
import { FeatureGate } from "@/components/feature-gate";
import { Download, FileText, Database, AlertTriangle, Loader2, Upload, Shield } from "lucide-react";
import type { User } from "@shared/schema";

interface ExportFilters {
  format: "jsonl" | "csv";
  taskType?: string;
  translatorId?: string;
  fromDate?: string;
  toDate?: string;
}

export default function ExportPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [filters, setFilters] = useState<ExportFilters>({
    format: "jsonl",
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const exportMutation = useMutation({
    mutationFn: async (exportFilters: ExportFilters) => {
      const params = new URLSearchParams();
      params.append("format", exportFilters.format);
      if (exportFilters.taskType) params.append("taskType", exportFilters.taskType);
      if (exportFilters.translatorId) params.append("translatorId", exportFilters.translatorId);
      if (exportFilters.fromDate) params.append("fromDate", exportFilters.fromDate);
      if (exportFilters.toDate) params.append("toDate", exportFilters.toDate);

      const response = await fetch(`/api/export?${params.toString()}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("فشل في تصدير البيانات");
      }

      // Get filename from response headers or create default
      const contentDisposition = response.headers.get("Content-Disposition");
      const filename = contentDisposition
        ? contentDisposition.split("filename=")[1]?.replace(/"/g, "")
        : `translations.${exportFilters.format}`;

      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "تم التصدير بنجاح",
        description: "تم تحميل ملف البيانات المعتمدة",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ في التصدير",
        description: error.message || "فشل في تصدير البيانات",
        variant: "destructive",
      });
    },
  });

  const exportBackupMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/backup/export", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("فشل في تصدير النسخة الاحتياطية");
      }

      const blob = await response.blob();
      const filename = `sanad-backup-${new Date().toISOString().split('T')[0]}.json`;
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "تم التصدير بنجاح",
        description: "تم تحميل النسخة الاحتياطية لمعرفة المنصة",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ في التصدير",
        description: error.message || "فشل في تصدير النسخة الاحتياطية",
        variant: "destructive",
      });
    },
  });

  const importBackupMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("backup", file);

      const response = await fetch("/api/backup/import", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "فشل في استعادة النسخة الاحتياطية");
      }

      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "تم الاستعادة بنجاح",
        description: `تم استيراد: ${data.imported.approvedTerms} مصطلحات، ${data.imported.styleTags} تصنيفات، ${data.imported.contextualLexicon} معجم سياقي، ${data.imported.wordSuggestions} اقتراحات`,
      });
      
      // Refresh queries
      queryClient.invalidateQueries({ queryKey: ["/api/approved-terms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/style-tags"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contextual-lexicon"] });
      queryClient.invalidateQueries({ queryKey: ["/api/word-suggestions"] });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ في الاستعادة",
        description: error.message || "فشل في استعادة النسخة الاحتياطية",
        variant: "destructive",
      });
    },
  });

  const translators = users.filter(u => u.role === "translator");

  const handleExport = () => {
    exportMutation.mutate(filters);
  };

  const updateFilter = (key: keyof ExportFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      importBackupMutation.mutate(file);
    }
    // Reset the input
    event.target.value = "";
  };

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
        <Header title="تصدير البيانات" />
        <main className="p-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-[var(--project-text-primary)] arabic-text">
                مستكشف ومصدّر البيانات
              </h2>
              <p className="text-[var(--project-text-secondary)] arabic-text">
                تصفية وتصدير البيانات المعتمدة
              </p>
            </div>

            {/* Filter Section */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="arabic-text">عوامل التصفية</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="taskType" className="arabic-text">نوع المهمة</Label>
                    <Select value={filters.taskType || "all"} onValueChange={(value) => updateFilter("taskType", value === "all" ? "" : value)}>
                      <SelectTrigger className="text-right" dir="rtl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">جميع الأنواع</SelectItem>
                        <SelectItem value="sentence">ترجمة الجمل</SelectItem>
                        <SelectItem value="paragraph">ترجمة الفقرات</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="translator" className="arabic-text">المترجم</Label>
                    <Select value={filters.translatorId || "all"} onValueChange={(value) => updateFilter("translatorId", value === "all" ? "" : value)}>
                      <SelectTrigger className="text-right" dir="rtl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">جميع المترجمين</SelectItem>
                        {translators.map((translator) => (
                          <SelectItem key={translator.id} value={translator.id.toString()}>
                            {translator.username}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="fromDate" className="arabic-text">من تاريخ</Label>
                    <Input
                      id="fromDate"
                      type="date"
                      value={filters.fromDate || ""}
                      onChange={(e) => updateFilter("fromDate", e.target.value)}
                      className="text-right"
                      dir="rtl"
                    />
                  </div>

                  <div>
                    <Label htmlFor="toDate" className="arabic-text">إلى تاريخ</Label>
                    <Input
                      id="toDate"
                      type="date"
                      value={filters.toDate || ""}
                      onChange={(e) => updateFilter("toDate", e.target.value)}
                      className="text-right"
                      dir="rtl"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Export Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Export Options */}
              <Card>
                <CardHeader>
                  <CardTitle className="arabic-text">خيارات التصدير</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="arabic-text">تنسيق الملف</Label>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <Card 
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          filters.format === "jsonl" ? 'ring-2 ring-[var(--project-primary)]' : ''
                        }`}
                        onClick={() => setFilters(prev => ({ ...prev, format: "jsonl" }))}
                      >
                        <CardContent className="p-4 text-center">
                          <Database className="w-8 h-8 mx-auto mb-2 text-[var(--project-primary)]" />
                          <h4 className="font-medium arabic-text">JSONL</h4>
                          <p className="text-xs text-[var(--project-text-secondary)] arabic-text">للذكاء الاصطناعي</p>
                        </CardContent>
                      </Card>

                      <Card 
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          filters.format === "csv" ? 'ring-2 ring-[var(--project-primary)]' : ''
                        }`}
                        onClick={() => setFilters(prev => ({ ...prev, format: "csv" }))}
                      >
                        <CardContent className="p-4 text-center">
                          <FileText className="w-8 h-8 mx-auto mb-2 text-[var(--project-text-secondary)]" />
                          <h4 className="font-medium arabic-text">CSV</h4>
                          <p className="text-xs text-[var(--project-text-secondary)] arabic-text">للتحليل والمراجعة</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[var(--project-border)]">
                    <Button
                      onClick={handleExport}
                      disabled={exportMutation.isPending}
                      className="w-full btn-primary arabic-text"
                    >
                      {exportMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                          جاري التصدير...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 ml-2" />
                          تصدير البيانات
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Preview/Info Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="arabic-text">معلومات التصدير</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-[var(--project-primary)]/5 rounded-lg">
                      <h4 className="font-medium text-[var(--project-text-primary)] mb-2 arabic-text">
                        محتويات الملف:
                      </h4>
                      <ul className="text-sm text-[var(--project-text-secondary)] space-y-1 arabic-text">
                        <li>• النص المصدر (العربية الفصحى)</li>
                        <li>• النص المترجم (الحسانية)</li>
                        <li>• تقييم الجودة</li>
                        <li>• تاريخ المراجعة</li>
                        <li>• معلومات إضافية عن السياق</li>
                      </ul>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-[var(--project-text-primary)] mb-2 arabic-text">
                        تنسيق JSONL:
                      </h4>
                      <p className="text-sm text-[var(--project-text-secondary)] arabic-text">
                        مثالي لتدريب نماذج الذكاء الاصطناعي ومعالجة البيانات المتقدمة
                      </p>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-[var(--project-text-primary)] mb-2 arabic-text">
                        تنسيق CSV:
                      </h4>
                      <p className="text-sm text-[var(--project-text-secondary)] arabic-text">
                        سهل الفتح في Excel أو أدوات التحليل الأخرى
                      </p>
                    </div>

                    <div className="text-xs text-[var(--project-text-secondary)] arabic-text">
                      ملاحظة: سيتم تصدير البيانات المعتمدة فقط وفقاً للمرشحات المحددة
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Platform Knowledge Backup Section */}
            <FeatureGate featureKey="platform_backup">
              <div className="mt-8">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-[var(--project-text-primary)] arabic-text">
                    نسخ احتياطي لمعرفة المنصة
                  </h3>
                  <p className="text-[var(--project-text-secondary)] arabic-text">
                    احتفظ بنسخة احتياطية من البيانات التي تعلمتها المنصة من المترجمين
                  </p>
                </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Export Platform Knowledge */}
                <Card>
                  <CardHeader>
                    <CardTitle className="arabic-text flex items-center gap-2">
                      <Shield className="w-5 h-5 text-[var(--project-primary)]" />
                      تصدير معرفة المنصة
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-[var(--project-primary)]/5 rounded-lg">
                      <h4 className="font-medium text-[var(--project-text-primary)] mb-2 arabic-text">
                        يشمل:
                      </h4>
                      <ul className="text-sm text-[var(--project-text-secondary)] space-y-1 arabic-text">
                        <li>• المصطلحات المعتمدة</li>
                        <li>• تصنيفات الأسلوب</li>
                        <li>• المعجم السياقي</li>
                        <li>• اقتراحات الكلمات من المترجمين</li>
                      </ul>
                    </div>

                    <Button
                      onClick={() => exportBackupMutation.mutate()}
                      disabled={exportBackupMutation.isPending}
                      className="w-full btn-primary arabic-text"
                    >
                      {exportBackupMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                          جاري التصدير...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 ml-2" />
                          تحميل النسخة الاحتياطية
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Import Platform Knowledge */}
                <Card>
                  <CardHeader>
                    <CardTitle className="arabic-text flex items-center gap-2">
                      <Upload className="w-5 h-5 text-[var(--project-primary)]" />
                      استعادة معرفة المنصة
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-amber-50 rounded-lg">
                      <h4 className="font-medium text-amber-900 mb-2 arabic-text">
                        تنبيه:
                      </h4>
                      <p className="text-sm text-amber-800 arabic-text">
                        سيتم دمج البيانات المستوردة مع البيانات الموجودة. لن يتم حذف أي بيانات حالية.
                      </p>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json"
                      className="hidden"
                      onChange={handleFileUpload}
                    />

                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={importBackupMutation.isPending}
                      className="w-full btn-secondary arabic-text"
                    >
                      {importBackupMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                          جاري الاستعادة...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 ml-2" />
                          اختر ملف النسخة الاحتياطية
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>
              </div>
            </FeatureGate>
          </div>
        </main>
      </div>
    </div>
  );
}
