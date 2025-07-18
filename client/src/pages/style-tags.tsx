import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/use-auth";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Plus, AlertTriangle, Tag, Edit, Check, X } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { StyleTag } from "@shared/schema";

export default function StyleTags() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<StyleTag>>({});
  const [newTag, setNewTag] = useState({
    name: "",
    description: "",
    guidelines: "",
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

  const { data: tags = [], isLoading } = useQuery<StyleTag[]>({
    queryKey: ["/api/style-tags"],
    enabled: user?.role === "admin",
  });

  const createTagMutation = useMutation({
    mutationFn: async (tagData: typeof newTag) => {
      const res = await apiRequest("POST", "/api/style-tags", tagData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/style-tags"] });
      setIsAddDialogOpen(false);
      setNewTag({
        name: "",
        description: "",
        guidelines: "",
      });
      toast({
        title: "تمت الإضافة بنجاح",
        description: "تم إضافة تصنيف الأسلوب بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ في الإضافة",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateTagMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<StyleTag> }) => {
      const res = await apiRequest("PATCH", `/api/style-tags/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/style-tags"] });
      setEditingId(null);
      setEditForm({});
      toast({
        title: "تم التحديث بنجاح",
        description: "تم تحديث تصنيف الأسلوب بنجاح",
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

  const handleAddTag = () => {
    if (!newTag.name.trim() || !newTag.description.trim() || !newTag.guidelines.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }
    createTagMutation.mutate(newTag);
  };

  const handleEditTag = (tag: StyleTag) => {
    setEditingId(tag.id);
    setEditForm({
      name: tag.name,
      description: tag.description,
      guidelines: tag.guidelines,
      isActive: tag.isActive,
    });
  };

  const handleSaveEdit = () => {
    if (editingId) {
      updateTagMutation.mutate({ id: editingId, data: editForm });
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 lg:mr-72">
        <Header title="إدارة تصنيفات الأسلوب" />
        <main className="p-4 lg:p-6 overflow-y-auto">
          {/* Header Actions */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-[var(--project-text-primary)] arabic-text">
              تصنيفات الأسلوب
            </h2>
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="btn-primary arabic-text"
            >
              <Plus className="w-4 h-4 ml-2" />
              إضافة تصنيف جديد
            </Button>
          </div>

          {/* Style Tags Grid */}
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--project-primary)] mx-auto"></div>
              <p className="mt-4 text-[var(--project-text-secondary)] arabic-text">
                جاري التحميل...
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {tags.map((tag) => (
                <Card key={tag.id} className={!tag.isActive ? "opacity-60" : ""}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Tag className="w-5 h-5 text-[var(--project-primary)]" />
                        {editingId === tag.id ? (
                          <Input
                            value={editForm.name || ""}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="w-48"
                            dir="rtl"
                          />
                        ) : (
                          <CardTitle className="text-lg arabic-text">{tag.name}</CardTitle>
                        )}
                        {!tag.isActive && (
                          <Badge variant="secondary" className="arabic-text">
                            غير نشط
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {editingId === tag.id ? (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleSaveEdit}
                              disabled={updateTagMutation.isPending}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleCancelEdit}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditTag(tag)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {editingId === tag.id ? (
                      <div className="space-y-4">
                        <div>
                          <Label className="arabic-text">الوصف</Label>
                          <Textarea
                            value={editForm.description || ""}
                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                            className="arabic-text mt-1"
                            rows={2}
                            dir="rtl"
                          />
                        </div>
                        <div>
                          <Label className="arabic-text">الإرشادات</Label>
                          <Textarea
                            value={editForm.guidelines || ""}
                            onChange={(e) => setEditForm({ ...editForm, guidelines: e.target.value })}
                            className="arabic-text mt-1"
                            rows={3}
                            dir="rtl"
                          />
                        </div>
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <Switch
                            checked={editForm.isActive}
                            onCheckedChange={(checked) => setEditForm({ ...editForm, isActive: checked })}
                          />
                          <Label className="arabic-text">نشط</Label>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="mb-3">
                          <h4 className="font-medium text-[var(--project-text-primary)] arabic-text mb-1">
                            الوصف:
                          </h4>
                          <p className="text-sm text-[var(--project-text-secondary)] arabic-text">
                            {tag.description}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-medium text-[var(--project-text-primary)] arabic-text mb-1">
                            الإرشادات:
                          </h4>
                          <p className="text-sm text-[var(--project-text-secondary)] arabic-text whitespace-pre-line">
                            {tag.guidelines}
                          </p>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Add Style Tag Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="arabic-text">
              إضافة تصنيف أسلوب جديد
            </DialogTitle>
            <DialogDescription className="arabic-text">
              حدد تصنيفاً جديداً للأسلوب ليستخدمه المترجمون
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="arabic-text">
                اسم التصنيف *
              </Label>
              <Input
                id="name"
                value={newTag.name}
                onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
                className="arabic-text"
                dir="rtl"
                placeholder="مثال: formal, informal_friendly"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description" className="arabic-text">
                الوصف *
              </Label>
              <Textarea
                id="description"
                value={newTag.description}
                onChange={(e) => setNewTag({ ...newTag, description: e.target.value })}
                className="arabic-text"
                dir="rtl"
                rows={3}
                placeholder="وصف مختصر للأسلوب"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="guidelines" className="arabic-text">
                الإرشادات التفصيلية *
              </Label>
              <Textarea
                id="guidelines"
                value={newTag.guidelines}
                onChange={(e) => setNewTag({ ...newTag, guidelines: e.target.value })}
                className="arabic-text"
                dir="rtl"
                rows={5}
                placeholder="إرشادات مفصلة للمترجمين مع أمثلة"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddDialogOpen(false)}
              className="arabic-text"
            >
              إلغاء
            </Button>
            <Button
              onClick={handleAddTag}
              disabled={createTagMutation.isPending}
              className="btn-primary arabic-text"
            >
              <Tag className="w-4 h-4 ml-2" />
              إضافة التصنيف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}