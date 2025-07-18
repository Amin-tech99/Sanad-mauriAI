import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, ArrowLeft, Clock, User, AlertTriangle } from "lucide-react";
import type { WorkItem } from "@shared/schema";

export default function QAReview() {
  const { user } = useAuth();
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [qualityChecks, setQualityChecks] = useState({
    accuracy: false,
    meaning: false,
    dialect: false,
    fluency: false,
  });
  const [comments, setComments] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  if (!user || (user.role !== "qa" && user.role !== "admin")) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">غير مصرح بالدخول</h2>
          <p className="text-muted-foreground">هذه الصفحة متاحة لفريق ضمان الجودة والإدارة فقط</p>
        </div>
      </div>
    );
  }

  const { data: workItem, isLoading } = useQuery<WorkItem>({
    queryKey: ["/api/work-items", id],
    enabled: !!id,
  });

  const { data: qaQueue = [] } = useQuery<WorkItem[]>({
    queryKey: ["/api/qa-queue"],
    enabled: user?.role === "qa" || user?.role === "admin",
  });

  const currentIndex = qaQueue.findIndex(item => item.id === parseInt(id || "0"));
  const totalItems = qaQueue.length;

  const approveMutation = useMutation({
    mutationFn: async (data: { id: number; qualityScore: number; comments?: string }) => {
      const res = await apiRequest("PATCH", `/api/work-items/${data.id}`, {
        status: "approved",
        qualityScore: data.qualityScore,
        rejectionReason: data.comments || "",
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/qa-queue"] });
      queryClient.invalidateQueries({ queryKey: ["/api/work-items", id] });
      toast({
        title: "تم الاعتماد بنجاح",
        description: "تم اعتماد الترجمة وإضافتها للبيانات المعتمدة",
      });
      goToNextItem();
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في اعتماد الترجمة",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (data: { id: number; reason: string }) => {
      const res = await apiRequest("PATCH", `/api/work-items/${data.id}`, {
        status: "rejected",
        rejectionReason: data.reason,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/qa-queue"] });
      queryClient.invalidateQueries({ queryKey: ["/api/work-items", id] });
      toast({
        title: "تم الرفض",
        description: "تم رفض الترجمة وإرسالها للمترجم للمراجعة",
      });
      goToNextItem();
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في رفض الترجمة",
        variant: "destructive",
      });
    },
  });

  const goToNextItem = () => {
    if (currentIndex < totalItems - 1) {
      const nextItem = qaQueue[currentIndex + 1];
      setLocation(`/qa-review/${nextItem.id}`);
    } else {
      setLocation("/qa-queue");
    }
  };

  const handleApprove = () => {
    if (!workItem) return;
    
    const checkedItems = Object.values(qualityChecks).filter(Boolean).length;
    const qualityScore = Math.round((checkedItems / 4) * 5); // Convert to 1-5 scale
    
    approveMutation.mutate({
      id: workItem.id,
      qualityScore,
      comments,
    });
  };

  const handleReject = () => {
    if (!workItem || !rejectionReason.trim()) {
      toast({
        title: "مطلوب",
        description: "يرجى إدخال سبب الرفض",
        variant: "destructive",
      });
      return;
    }
    
    rejectMutation.mutate({
      id: workItem.id,
      reason: rejectionReason,
    });
  };

  const handleQualityCheck = (key: string, checked: boolean) => {
    setQualityChecks(prev => ({
      ...prev,
      [key]: checked,
    }));
  };

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

  if (!user || (user.role !== "qa" && user.role !== "admin")) {
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
          <Header title="مراجعة الجودة" />
          <main className="p-6">
            <div className="text-center py-8">
              <p className="text-[var(--project-text-secondary)] arabic-text">جاري التحميل...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!workItem) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 mr-64">
          <Header title="مراجعة الجودة" />
          <main className="p-6">
            <Card>
              <CardContent className="p-8 text-center">
                <h3 className="text-lg font-medium text-[var(--project-text-primary)] mb-2 arabic-text">
                  المهمة غير موجودة
                </h3>
                <p className="text-[var(--project-text-secondary)] arabic-text">
                  لم يتم العثور على المهمة المطلوبة
                </p>
                <Button 
                  onClick={() => setLocation("/qa-queue")} 
                  className="mt-4 arabic-text"
                  variant="outline"
                >
                  العودة للقائمة
                </Button>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 mr-64">
        <Header title="مراجعة الجودة" />
        <main className="p-6">
          {/* Task Header */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-[var(--project-text-primary)] arabic-text">
                    مراجعة ترجمة - مهمة #{workItem.id}
                  </h2>
                  <div className="flex items-center space-x-4 space-x-reverse text-sm text-[var(--project-text-secondary)] mt-2">
                    <span className="flex items-center space-x-1 space-x-reverse">
                      <User className="w-4 h-4" />
                      <span>مترجم #{workItem.assignedTo}</span>
                    </span>
                    <span className="flex items-center space-x-1 space-x-reverse">
                      <Clock className="w-4 h-4" />
                      <span>تاريخ الإرسال: {formatDate(workItem.submittedAt)}</span>
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-4 space-x-reverse">
                  <Badge className="bg-yellow-100 text-yellow-800 arabic-text">
                    في انتظار المراجعة
                  </Badge>
                  {totalItems > 1 && (
                    <Badge variant="outline" className="arabic-text">
                      مهمة {currentIndex + 1} من {totalItems}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Three-Panel QA Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Source Text */}
            <Card>
              <CardHeader className="bg-gray-50 border-b">
                <h3 className="font-medium text-[var(--project-text-primary)] arabic-text">
                  النص المصدر
                </h3>
              </CardHeader>
              <CardContent className="p-4">
                <div className="bg-gray-50 rounded-lg p-4 h-80 overflow-y-auto arabic-scroll">
                  <p className="text-[var(--project-text-primary)] leading-relaxed arabic-text text-sm" dir="rtl">
                    {workItem.sourceText}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Translation Submission */}
            <Card>
              <CardHeader className="bg-blue-50 border-b">
                <h3 className="font-medium text-[var(--project-text-primary)] arabic-text">
                  الترجمة المقدمة
                </h3>
              </CardHeader>
              <CardContent className="p-4">
                <div className="bg-blue-50 rounded-lg p-4 h-80 overflow-y-auto arabic-scroll">
                  <p className="text-[var(--project-text-primary)] leading-relaxed arabic-text text-sm" dir="rtl">
                    {workItem.targetText || "لا توجد ترجمة"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* QA Action Panel */}
            <Card>
              <CardHeader className="bg-[var(--project-primary)]/5 border-b">
                <h3 className="font-medium text-[var(--project-text-primary)] arabic-text">
                  إجراءات المراجعة
                </h3>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {/* Quality Checklist */}
                <div className="space-y-3">
                  <h4 className="font-medium text-[var(--project-text-primary)] arabic-text">
                    معايير الجودة:
                  </h4>
                  
                  <label className="flex items-center space-x-3 space-x-reverse cursor-pointer">
                    <Checkbox 
                      checked={qualityChecks.accuracy}
                      onCheckedChange={(checked) => handleQualityCheck("accuracy", !!checked)}
                    />
                    <span className="text-sm text-[var(--project-text-secondary)] arabic-text">
                      دقة الترجمة
                    </span>
                  </label>
                  
                  <label className="flex items-center space-x-3 space-x-reverse cursor-pointer">
                    <Checkbox 
                      checked={qualityChecks.meaning}
                      onCheckedChange={(checked) => handleQualityCheck("meaning", !!checked)}
                    />
                    <span className="text-sm text-[var(--project-text-secondary)] arabic-text">
                      الحفاظ على المعنى
                    </span>
                  </label>
                  
                  <label className="flex items-center space-x-3 space-x-reverse cursor-pointer">
                    <Checkbox 
                      checked={qualityChecks.dialect}
                      onCheckedChange={(checked) => handleQualityCheck("dialect", !!checked)}
                    />
                    <span className="text-sm text-[var(--project-text-secondary)] arabic-text">
                      استخدام لهجة حسانية صحيحة
                    </span>
                  </label>
                  
                  <label className="flex items-center space-x-3 space-x-reverse cursor-pointer">
                    <Checkbox 
                      checked={qualityChecks.fluency}
                      onCheckedChange={(checked) => handleQualityCheck("fluency", !!checked)}
                    />
                    <span className="text-sm text-[var(--project-text-secondary)] arabic-text">
                      سلاسة النص
                    </span>
                  </label>
                </div>

                {/* Comments */}
                <div>
                  <Label htmlFor="comments" className="arabic-text">
                    ملاحظات المراجعة:
                  </Label>
                  <Textarea
                    id="comments"
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="أضف ملاحظاتك هنا..."
                    className="h-24 text-sm resize-vertical text-right arabic-scroll mt-1"
                    dir="rtl"
                  />
                </div>

                {/* Action Buttons */}
                <div className="space-y-3 pt-4 border-t border-[var(--project-border)]">
                  {!showRejectForm ? (
                    <>
                      <Button
                        onClick={handleApprove}
                        disabled={approveMutation.isPending}
                        className="w-full btn-primary arabic-text"
                      >
                        <CheckCircle className="w-4 h-4 ml-2" />
                        اعتماد الترجمة
                      </Button>
                      <Button
                        onClick={() => setShowRejectForm(true)}
                        disabled={rejectMutation.isPending}
                        className="w-full btn-error arabic-text"
                      >
                        <XCircle className="w-4 h-4 ml-2" />
                        رفض الترجمة
                      </Button>
                    </>
                  ) : (
                    <div className="space-y-3">
                      <Label htmlFor="rejectionReason" className="arabic-text">
                        سبب الرفض (مطلوب):
                      </Label>
                      <Textarea
                        id="rejectionReason"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="اشرح سبب رفض الترجمة..."
                        className="h-20 text-sm resize-vertical text-right arabic-scroll"
                        dir="rtl"
                      />
                      <div className="flex space-x-2 space-x-reverse">
                        <Button
                          onClick={handleReject}
                          disabled={!rejectionReason.trim() || rejectMutation.isPending}
                          className="flex-1 btn-error arabic-text"
                        >
                          تأكيد الرفض
                        </Button>
                        <Button
                          onClick={() => {
                            setShowRejectForm(false);
                            setRejectionReason("");
                          }}
                          variant="outline"
                          className="flex-1 arabic-text"
                        >
                          إلغاء
                        </Button>
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={goToNextItem}
                    variant="outline"
                    className="w-full arabic-text"
                    disabled={currentIndex >= totalItems - 1}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    المهمة التالية
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Navigation */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-[var(--project-text-secondary)] text-sm arabic-text">
                  مهمة {currentIndex + 1} من {totalItems} في قائمة المراجعة
                </span>
                <div className="flex items-center space-x-4 space-x-reverse">
                  <Button 
                    variant="outline" 
                    onClick={() => setLocation("/qa-queue")}
                    className="arabic-text"
                  >
                    العودة للقائمة
                  </Button>
                  <Button
                    onClick={goToNextItem}
                    disabled={currentIndex >= totalItems - 1}
                    variant="outline"
                    className="arabic-text"
                  >
                    المهمة التالية
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
