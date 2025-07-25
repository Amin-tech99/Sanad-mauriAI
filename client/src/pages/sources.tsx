import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import UploadArticleModal from "@/components/modals/upload-article-modal";
import { Plus, Eye, Edit, Trash, Upload } from "lucide-react";
import type { Source } from "@shared/schema";

export default function Sources() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSource, setSelectedSource] = useState<Source | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const { data: sources = [], isLoading } = useQuery<Source[]>({
    queryKey: ["/api/sources"],
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Source> }) => {
      await apiRequest("PATCH", `/api/sources/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "تم التحديث",
        description: "تم تحديث المصدر بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/sources"] });
      setShowEditModal(false);
      setSelectedSource(null);
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث المصدر",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ id, cascade = false }: { id: number; cascade?: boolean }) => {
      const url = cascade ? `/api/sources/${id}?cascade=true` : `/api/sources/${id}`;
      const response = await apiRequest("DELETE", url);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "تم الحذف",
        description: "تم حذف المصدر بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/sources"] });
    },
    onError: async (error: any, variables) => {
      // Extract error data from the response
      let errorData;
      try {
        const response = error.response || error;
        errorData = response.data || (await response.json?.()) || {};
      } catch {
        errorData = {};
      }
      
      if (errorData?.hasWorkPackets) {
        // Show confirmation dialog for cascade delete
        const confirmCascade = confirm(
          "هذا المصدر مرتبط بحزم عمل. هل تريد حذف المصدر مع جميع حزم العمل والعناصر المرتبطة به؟\n\nتحذير: هذا الإجراء لا يمكن التراجع عنه!"
        );
        
        if (confirmCascade && variables?.id) {
          // Retry with cascade option using the original variables
          deleteMutation.mutate({ id: variables.id, cascade: true });
        }
      } else {
        const errorMessage = errorData?.error || "حدث خطأ أثناء حذف المصدر";
        toast({
          title: "خطأ",
          description: errorMessage,
          variant: "destructive",
        });
      }
    },
  });

  const filteredSources = sources.filter(source => {
    const matchesSearch = source.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         source.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || source.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || 
                           (source.tags && source.tags.includes(categoryFilter));
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "في الانتظار", className: "bg-yellow-100 text-yellow-800" },
      processing: { label: "قيد المعالجة", className: "bg-blue-100 text-blue-800" },
      completed: { label: "مكتمل", className: "bg-[var(--project-primary)]/20 text-[var(--project-primary)]" },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return (
      <Badge className={`${config.className} arabic-text`}>
        {config.label}
      </Badge>
    );
  };

  if (user?.role !== "admin") {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 lg:mr-72">
          <Header title="غير مخول" />
          <main className="p-4 lg:p-6">
            <div className="text-center">
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
        <Header title="مكتبة المصادر" />
        <main className="p-4 lg:p-6 overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-[var(--project-text-primary)] arabic-text">
                مكتبة المصادر
              </h2>
              <p className="text-[var(--project-text-secondary)] arabic-text">
                إدارة المقالات والنصوص المصدرية
              </p>
            </div>
            <Button
              onClick={() => setShowUploadModal(true)}
              className="btn-primary arabic-text"
            >
              <Plus className="w-4 h-4 ml-2" />
              رفع مقال جديد
            </Button>
          </div>

          {/* Filter Bar */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Input
                    placeholder="البحث في المقالات..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="text-right"
                    dir="rtl"
                  />
                </div>
                <div>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="text-right" dir="rtl">
                      <SelectValue placeholder="التصنيف" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع التصنيفات</SelectItem>
                      <SelectItem value="أخبار">أخبار</SelectItem>
                      <SelectItem value="أدب">أدب</SelectItem>
                      <SelectItem value="علوم">علوم</SelectItem>
                      <SelectItem value="اقتصاد">اقتصاد</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="text-right" dir="rtl">
                      <SelectValue placeholder="الحالة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الحالات</SelectItem>
                      <SelectItem value="pending">في الانتظار</SelectItem>
                      <SelectItem value="processing">قيد المعالجة</SelectItem>
                      <SelectItem value="completed">مكتمل</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Input
                    type="date"
                    className="text-right"
                    dir="rtl"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sources Grid */}
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-[var(--project-text-secondary)] arabic-text">جاري التحميل...</p>
            </div>
          ) : filteredSources.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Upload className="w-16 h-16 text-[var(--project-text-secondary)] mx-auto mb-4" />
                <h3 className="text-lg font-medium text-[var(--project-text-primary)] mb-2 arabic-text">
                  لا توجد مصادر
                </h3>
                <p className="text-[var(--project-text-secondary)] mb-4 arabic-text">
                  ابدأ برفع أول مقال للمشروع
                </p>
                <Button onClick={() => setShowUploadModal(true)} className="btn-primary arabic-text">
                  <Plus className="w-4 h-4 ml-2" />
                  رفع مقال جديد
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSources.map((source) => (
                <Card key={source.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg arabic-text line-clamp-2">
                        {source.title}
                      </CardTitle>
                      {getStatusBadge(source.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-[var(--project-text-secondary)] text-sm mb-4 arabic-text line-clamp-3">
                      {source.content.substring(0, 150)}...
                    </p>
                    
                    {source.tags && source.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {source.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs arabic-text">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    <div className="text-xs text-[var(--project-text-secondary)] mb-4">
                      {source.createdAt && new Date(source.createdAt).toLocaleDateString('ar-SA')}
                    </div>
                    
                    <div className="flex space-x-2 space-x-reverse">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setSelectedSource(source)}
                        className="hover:bg-[var(--project-primary)]/5"
                        title="عرض التفاصيل"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setSelectedSource(source);
                          setShowEditModal(true);
                        }}
                        className="hover:bg-blue-50"
                        title="تعديل"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-[var(--project-error)] hover:bg-red-50"
                        onClick={() => {
                          if (confirm('هل أنت متأكد من حذف هذا المصدر؟')) {
                            deleteMutation.mutate({ id: source.id });
                          }
                        }}
                        title="حذف"
                      >
                        <Trash className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <UploadArticleModal 
            isOpen={showUploadModal} 
            onClose={() => setShowUploadModal(false)} 
          />
          
          {/* View Source Modal */}
          {selectedSource && !showEditModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <CardHeader>
                  <CardTitle className="text-xl arabic-text">{selectedSource.title}</CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setSelectedSource(null)}
                    className="absolute top-4 left-4"
                  >
                    ✕
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold arabic-text mb-2">المحتوى:</h4>
                    <p className="text-[var(--project-text-secondary)] arabic-text whitespace-pre-wrap">
                      {selectedSource.content}
                    </p>
                  </div>
                  {selectedSource.tags && selectedSource.tags.length > 0 && (
                    <div>
                      <h4 className="font-semibold arabic-text mb-2">التصنيفات:</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedSource.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="arabic-text">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-4 border-t">
                    <div className="text-sm text-[var(--project-text-secondary)]">
                      {selectedSource.createdAt && new Date(selectedSource.createdAt).toLocaleDateString('ar-SA')}
                    </div>
                    {getStatusBadge(selectedSource.status)}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Edit Source Modal */}
          {selectedSource && showEditModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <CardHeader>
                  <CardTitle className="text-xl arabic-text">تعديل المصدر</CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedSource(null);
                    }}
                    className="absolute top-4 left-4"
                  >
                    ✕
                  </Button>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      const tags = formData.get('tags') as string;
                      updateMutation.mutate({
                        id: selectedSource.id,
                        data: {
                          title: formData.get('title') as string,
                          content: formData.get('content') as string,
                          tags: tags ? tags.split(',').map(t => t.trim()) : [],
                          status: formData.get('status') as string,
                        },
                      });
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-sm font-medium mb-2 arabic-text">العنوان</label>
                      <Input
                        name="title"
                        defaultValue={selectedSource.title}
                        required
                        className="arabic-text"
                        dir="rtl"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 arabic-text">المحتوى</label>
                      <Textarea
                        name="content"
                        defaultValue={selectedSource.content}
                        required
                        rows={10}
                        className="arabic-text"
                        dir="rtl"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 arabic-text">التصنيفات (مفصولة بفاصلة)</label>
                      <Input
                        name="tags"
                        defaultValue={selectedSource.tags?.join(', ')}
                        placeholder="مثال: تقنية، علوم، تعليم"
                        className="arabic-text"
                        dir="rtl"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 arabic-text">الحالة</label>
                      <Select name="status" defaultValue={selectedSource.status}>
                        <SelectTrigger className="text-right" dir="rtl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">في الانتظار</SelectItem>
                          <SelectItem value="processing">قيد المعالجة</SelectItem>
                          <SelectItem value="completed">مكتمل</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end space-x-2 space-x-reverse pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowEditModal(false);
                          setSelectedSource(null);
                        }}
                        className="arabic-text"
                      >
                        إلغاء
                      </Button>
                      <Button
                        type="submit"
                        className="btn-primary arabic-text"
                        disabled={updateMutation.isPending}
                      >
                        {updateMutation.isPending ? "جاري الحفظ..." : "حفظ التغييرات"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
