import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Plus, AlertTriangle, Languages, TrendingUp, Trash2 } from "lucide-react";
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
import type { ApprovedTerm } from "@shared/schema";

export default function ApprovedTerms() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [termToDelete, setTermToDelete] = useState<ApprovedTerm | null>(null);
  const [newTerm, setNewTerm] = useState({
    arabicTerm: "",
    hassaniyaTerm: "",
    context: "",
    category: "",
  });

  // Allow access for admin and translator roles
  if (user?.role !== "admin" && user?.role !== "translator") {
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
                هذه الصفحة مخصصة للمديرين والمترجمين فقط
              </p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const { data: terms = [], isLoading } = useQuery<ApprovedTerm[]>({
    queryKey: ["/api/approved-terms"],
    enabled: user?.role === "admin" || user?.role === "translator",
  });

  const createTermMutation = useMutation({
    mutationFn: async (termData: typeof newTerm) => {
      const res = await apiRequest("POST", "/api/approved-terms", termData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/approved-terms"] });
      setIsAddDialogOpen(false);
      setNewTerm({
        arabicTerm: "",
        hassaniyaTerm: "",
        context: "",
        category: "",
      });
      toast({
        title: "تمت الإضافة بنجاح",
        description: "تم إضافة المصطلح المعتمد بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ في الإضافة",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const deleteTermMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/approved-terms/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/approved-terms"] });
      setIsDeleteDialogOpen(false);
      setTermToDelete(null);
      toast({
        title: "تم الحذف بنجاح",
        description: "تم حذف المصطلح المعتمد بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ في الحذف",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleAddTerm = () => {
    if (!newTerm.arabicTerm.trim() || !newTerm.hassaniyaTerm.trim()) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى إدخال المصطلح العربي والحساني",
        variant: "destructive",
      });
      return;
    }
    createTermMutation.mutate(newTerm);
  };

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 lg:mr-72">
        <Header title="المصطلحات المعتمدة" />
        <main className="p-4 lg:p-6 overflow-y-auto">
          {/* Header Actions */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-[var(--project-text-primary)] arabic-text">
              {user?.role === "admin" ? "إدارة المصطلحات المعتمدة" : "المصطلحات المعتمدة"}
            </h2>
            {user?.role === "admin" && (
              <Button
                onClick={() => setIsAddDialogOpen(true)}
                className="btn-primary arabic-text"
              >
                <Plus className="w-4 h-4 ml-2" />
                إضافة مصطلح جديد
              </Button>
            )}
          </div>

          {/* Terms Table */}
          <Card>
            <CardHeader>
              <CardTitle className="arabic-text">
                المصطلحات المعتمدة للحسانية
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--project-primary)] mx-auto"></div>
                  <p className="mt-4 text-[var(--project-text-secondary)] arabic-text">
                    جاري التحميل...
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b">
                      <tr>
                        <th className="text-right px-4 py-3 font-medium text-[var(--project-text-primary)] arabic-text">
                          المصطلح العربي
                        </th>
                        <th className="text-right px-4 py-3 font-medium text-[var(--project-text-primary)] arabic-text">
                          المصطلح بالحسانية
                        </th>
                        <th className="text-right px-4 py-3 font-medium text-[var(--project-text-primary)] arabic-text">
                          السياق
                        </th>
                        <th className="text-right px-4 py-3 font-medium text-[var(--project-text-primary)] arabic-text">
                          الفئة
                        </th>
                        <th className="text-right px-4 py-3 font-medium text-[var(--project-text-primary)] arabic-text">
                          الاستخدام
                        </th>
                        {user?.role === "admin" && (
                          <th className="text-center px-4 py-3 font-medium text-[var(--project-text-primary)] arabic-text">
                            الإجراءات
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {terms.map((term) => (
                        <tr key={term.id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3 arabic-text">
                            {term.arabicTerm}
                          </td>
                          <td className="px-4 py-3 arabic-text font-medium text-[var(--project-primary)]">
                            {term.hassaniyaTerm}
                          </td>
                          <td className="px-4 py-3 arabic-text text-sm text-[var(--project-text-secondary)]">
                            {term.context || "-"}
                          </td>
                          <td className="px-4 py-3">
                            {term.category && (
                              <Badge className="arabic-text">
                                {term.category}
                              </Badge>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-2 space-x-reverse">
                              <TrendingUp className="w-4 h-4 text-[var(--project-primary)]" />
                              <span className="text-sm font-medium">
                                {term.frequency}
                              </span>
                            </div>
                          </td>
                          {user?.role === "admin" && (
                            <td className="px-4 py-3 text-center">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setTermToDelete(term);
                                  setIsDeleteDialogOpen(true);
                                }}
                                className="text-red-600 hover:bg-red-50 hover:border-red-400 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Add Term Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="arabic-text">
              إضافة مصطلح معتمد جديد
            </DialogTitle>
            <DialogDescription className="arabic-text">
              أضف مصطلحاً جديداً للحفاظ على اتساق الترجمة
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="arabicTerm" className="arabic-text">
                المصطلح بالعربية الفصحى *
              </Label>
              <Input
                id="arabicTerm"
                value={newTerm.arabicTerm}
                onChange={(e) =>
                  setNewTerm({ ...newTerm, arabicTerm: e.target.value })
                }
                className="arabic-text"
                dir="rtl"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="hassaniyaTerm" className="arabic-text">
                المصطلح بالحسانية *
              </Label>
              <Input
                id="hassaniyaTerm"
                value={newTerm.hassaniyaTerm}
                onChange={(e) =>
                  setNewTerm({ ...newTerm, hassaniyaTerm: e.target.value })
                }
                className="arabic-text"
                dir="rtl"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="context" className="arabic-text">
                السياق (اختياري)
              </Label>
              <Input
                id="context"
                value={newTerm.context}
                onChange={(e) =>
                  setNewTerm({ ...newTerm, context: e.target.value })
                }
                className="arabic-text"
                dir="rtl"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category" className="arabic-text">
                الفئة (اختياري)
              </Label>
              <Input
                id="category"
                value={newTerm.category}
                onChange={(e) =>
                  setNewTerm({ ...newTerm, category: e.target.value })
                }
                className="arabic-text"
                dir="rtl"
                placeholder="مثال: تحيات، أسئلة، عبارات"
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
              onClick={handleAddTerm}
              disabled={createTermMutation.isPending}
              className="btn-primary arabic-text"
            >
              <Languages className="w-4 h-4 ml-2" />
              إضافة المصطلح
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white border-2 border-red-200 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-red-800 flex items-center gap-2 arabic-text">
              <AlertTriangle className="h-5 w-5" />
              تأكيد الحذف
            </DialogTitle>
            <DialogDescription className="text-red-600 arabic-text">
              هل أنت متأكد من أنك تريد حذف هذا المصطلح المعتمد؟ لا يمكن التراجع عن هذا الإجراء.
            </DialogDescription>
          </DialogHeader>
          
          {termToDelete && (
            <div className="bg-red-50 p-4 rounded-lg border border-red-200 my-4">
              <div className="space-y-2">
                <div className="arabic-text">
                  <span className="font-semibold text-red-800">المصطلح العربي: </span>
                  <span className="text-red-700">{termToDelete.arabicTerm}</span>
                </div>
                <div className="arabic-text">
                  <span className="font-semibold text-red-800">المصطلح الحساني: </span>
                  <span className="text-red-700">{termToDelete.hassaniyaTerm}</span>
                </div>
                <div className="arabic-text">
                  <span className="font-semibold text-red-800">الفئة: </span>
                  <span className="text-red-700">{termToDelete.category || "-"}</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setTermToDelete(null);
              }}
              className="border-gray-300 text-gray-700 hover:bg-gray-50 arabic-text"
            >
              إلغاء
            </Button>
            <Button
              onClick={() => {
                if (termToDelete) {
                  deleteTermMutation.mutate(termToDelete.id);
                }
              }}
              disabled={deleteTermMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white border-red-600 hover:border-red-700 transition-all duration-200 arabic-text"
            >
              {deleteTermMutation.isPending ? "جاري الحذف..." : "حذف"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}