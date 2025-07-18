import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Save, Send, ArrowRight, ArrowLeft, AlertTriangle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import type { WorkItem } from "@shared/schema";

export default function Workspace() {
  const { user } = useAuth();
  const { id } = useParams();
  const { toast } = useToast();
  const [translation, setTranslation] = useState("");
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  if (user?.role !== "translator") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">غير مصرح بالدخول</h2>
          <p className="text-muted-foreground">هذه الصفحة متاحة للمترجمين فقط</p>
        </div>
      </div>
    );
  }

  const { data: workItems = [], isLoading } = useQuery<WorkItem[]>({
    queryKey: ["/api/my-work"],
    enabled: user?.role === "translator",
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 20000, // Consider data stale after 20 seconds
  });

  const currentItem = workItems[currentItemIndex];

  const updateMutation = useMutation({
    mutationFn: async (data: { id: number; targetText?: string; status?: string }) => {
      const res = await apiRequest("PATCH", `/api/work-items/${data.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-work"] });
      setLastSaved(new Date());
      setIsSaving(false);
      toast({
        title: "تم الحفظ بنجاح",
        description: "تم حفظ الترجمة بنجاح",
      });
    },
    onError: () => {
      setIsSaving(false);
      toast({
        title: "خطأ",
        description: "فشل في حفظ الترجمة",
        variant: "destructive",
      });
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: { id: number; targetText: string }) => {
      const res = await apiRequest("PATCH", `/api/work-items/${data.id}`, {
        targetText: data.targetText,
        status: "in_qa",
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-work"] });
      setTranslation("");
      toast({
        title: "تم الإرسال بنجاح",
        description: "تم إرسال الترجمة للمراجعة",
      });
      // Move to next item
      if (currentItemIndex < workItems.length - 1) {
        setCurrentItemIndex(currentItemIndex + 1);
      }
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في إرسال الترجمة",
        variant: "destructive",
      });
    },
  });

  const handleSaveDraft = () => {
    if (currentItem && translation.trim()) {
      updateMutation.mutate({
        id: currentItem.id,
        targetText: translation,
      });
    }
  };

  const handleSubmitForQA = () => {
    if (currentItem && translation.trim()) {
      submitMutation.mutate({
        id: currentItem.id,
        targetText: translation,
      });
    }
  };

  const handlePreviousItem = () => {
    if (currentItemIndex > 0) {
      setCurrentItemIndex(currentItemIndex - 1);
      setTranslation(workItems[currentItemIndex - 1]?.targetText || "");
    }
  };

  const handleNextItem = () => {
    if (currentItemIndex < workItems.length - 1) {
      setCurrentItemIndex(currentItemIndex + 1);
      setTranslation(workItems[currentItemIndex + 1]?.targetText || "");
    }
  };

  // Set translation when current item changes
  React.useEffect(() => {
    if (currentItem) {
      setTranslation(currentItem.targetText || "");
    }
  }, [currentItem]);

  // Auto-save functionality
  useEffect(() => {
    if (!currentItem || !translation.trim() || translation === currentItem.targetText) {
      return;
    }

    const autoSaveTimer = setTimeout(() => {
      setIsSaving(true);
      updateMutation.mutate({
        id: currentItem.id,
        targetText: translation,
      });
    }, 3000); // Auto-save after 3 seconds of no typing

    return () => clearTimeout(autoSaveTimer);
  }, [translation, currentItem]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveDraft();
      }
      // Ctrl/Cmd + Enter to submit
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSubmitForQA();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [translation, currentItem]);

  if (user?.role !== "translator") {
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

  if (isLoading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 mr-64">
          <Header title="مساحة العمل" />
          <main className="p-6">
            <div className="text-center py-8">
              <LoadingSpinner size="lg" className="mx-auto mb-4" />
              <p className="text-[var(--project-text-secondary)] arabic-text">جاري تحميل مهام الترجمة...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!workItems.length) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 mr-64">
          <Header title="مساحة العمل" />
          <main className="p-6">
            <Card>
              <CardContent className="p-8 text-center">
                <h3 className="text-lg font-medium text-[var(--project-text-primary)] mb-2 arabic-text">
                  لا توجد مهام متاحة
                </h3>
                <p className="text-[var(--project-text-secondary)] arabic-text">
                  لا توجد مهام ترجمة معينة لك حاليًا
                </p>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    );
  }

  if (!currentItem) {
    return null;
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 lg:mr-64">
        <Header title="مساحة العمل" />
        <main className="p-4 lg:p-6 overflow-y-auto max-h-[calc(100vh-64px)]">
          {/* Task Header */}
          <Card className="mb-6">
            <CardContent className="p-4 lg:p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-xl font-bold text-[var(--project-text-primary)] arabic-text">
                    ترجمة النص - المهمة #{currentItem.id}
                  </h2>
                  <p className="text-[var(--project-text-secondary)] arabic-text">
                    نوع المهمة: ترجمة من العربية الفصحى إلى الحسانية
                  </p>
                </div>
                <div className="flex items-center space-x-4 space-x-reverse">
                  <Badge className="bg-blue-100 text-blue-800 arabic-text">
                    مهمة {currentItemIndex + 1} من {workItems.length}
                  </Badge>
                  <Badge className="bg-yellow-100 text-yellow-800 arabic-text">
                    {currentItem.status === "pending" ? "في الانتظار" : 
                     currentItem.status === "in_progress" ? "قيد التنفيذ" : 
                     currentItem.status === "rejected" ? "مرفوضة" : "أخرى"}
                  </Badge>
                  {isSaving && (
                    <Badge className="bg-green-100 text-green-800 arabic-text flex items-center">
                      <LoadingSpinner size="sm" className="ml-1" />
                      جاري الحفظ...
                    </Badge>
                  )}
                  {lastSaved && !isSaving && (
                    <Badge className="bg-gray-100 text-gray-700 arabic-text flex items-center">
                      <CheckCircle className="w-3 h-3 ml-1" />
                      تم الحفظ {new Date(lastSaved).toLocaleTimeString('ar-SA')}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Instructions Banner */}
              <div className="bg-[var(--project-primary)]/10 border border-[var(--project-primary)]/20 rounded-lg p-4">
                <h4 className="font-medium text-[var(--project-text-primary)] mb-2 arabic-text">
                  تعليمات الترجمة:
                </h4>
                <p className="text-sm text-[var(--project-text-secondary)] arabic-text">
                  يرجى ترجمة النص التالي من العربية الفصحى إلى لهجة الحسانية مع الحفاظ على المعنى الأصلي والسياق الثقافي. 
                  استخدم التعابير المحلية المناسبة وتأكد من سلاسة النص المترجم.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Translation Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mb-4 lg:mb-6">
            {/* Source Text Panel */}
            <Card>
              <CardHeader className="bg-gray-50 border-b">
                <h3 className="font-medium text-[var(--project-text-primary)] arabic-text">
                  النص المصدر (العربية الفصحى)
                </h3>
              </CardHeader>
              <CardContent className="p-6">
                <div className="workspace-panel bg-gray-50 rounded-lg p-4 overflow-y-auto arabic-scroll">
                  <p className="text-[var(--project-text-primary)] leading-relaxed arabic-text" dir="rtl">
                    {currentItem.sourceText}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Translation Panel */}
            <Card>
              <CardHeader className="bg-[var(--project-primary)]/5 border-b">
                <h3 className="font-medium text-[var(--project-text-primary)] arabic-text">
                  الترجمة (الحسانية)
                </h3>
              </CardHeader>
              <CardContent className="p-6">
                <Textarea
                  value={translation}
                  onChange={(e) => setTranslation(e.target.value)}
                  placeholder="أدخل الترجمة بلهجة الحسانية هنا..."
                  className="paragraph-textarea border-[var(--project-border)] focus:ring-2 focus:ring-[var(--project-primary)] focus:border-transparent arabic-text resize-none"
                  dir="rtl"
                />
              </CardContent>
            </Card>
          </div>

          {/* Action Bar */}
          <Card className="mb-4 lg:mb-6">
            <CardContent className="p-4 lg:p-6">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                <div className="flex flex-col lg:flex-row items-center gap-2 lg:gap-4 lg:space-x-4 lg:space-x-reverse">
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handlePreviousItem}
                      disabled={currentItemIndex === 0}
                      variant="outline"
                      size="sm"
                      className="arabic-text"
                    >
                      <ArrowRight className="w-4 h-4 ml-1 lg:ml-2" />
                      <span className="hidden sm:inline">المهمة السابقة</span>
                    </Button>
                    <span className="text-[var(--project-text-secondary)] text-xs lg:text-sm arabic-text px-2">
                      {currentItemIndex + 1} / {workItems.length}
                    </span>
                    <Button
                      onClick={handleNextItem}
                      disabled={currentItemIndex === workItems.length - 1}
                      variant="outline"
                      size="sm"
                      className="arabic-text"
                    >
                      <ArrowLeft className="w-4 h-4 mr-1 lg:mr-2" />
                      <span className="hidden sm:inline">المهمة التالية</span>
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col lg:flex-row items-center gap-2 lg:gap-4 lg:space-x-4 lg:space-x-reverse">
                  <Button
                    onClick={handleSaveDraft}
                    disabled={!translation.trim() || updateMutation.isPending}
                    variant="outline"
                    size="sm"
                    className="arabic-text w-full lg:w-auto"
                  >
                    <Save className="w-4 h-4 ml-2" />
                    حفظ مسودة
                  </Button>
                  <Button
                    onClick={handleSubmitForQA}
                    disabled={!translation.trim() || submitMutation.isPending}
                    size="sm"
                    className="btn-primary arabic-text w-full lg:w-auto"
                  >
                    <Send className="w-4 h-4 ml-2" />
                    إرسال للمراجعة
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progress Indicator */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-[var(--project-text-secondary)] arabic-text">
                  تقدم المهام
                </span>
                <span className="text-sm text-[var(--project-text-primary)] arabic-text">
                  {Math.round(((currentItemIndex + 1) / workItems.length) * 100)}% مكتمل
                </span>
              </div>
              <Progress 
                value={((currentItemIndex + 1) / workItems.length) * 100} 
                className="w-full"
              />
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
