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
import { Plus, AlertTriangle, Languages, TrendingUp } from "lucide-react";
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
  const [newTerm, setNewTerm] = useState({
    arabicTerm: "",
    hassaniyaTerm: "",
    context: "",
    category: "",
  });

  if (user?.role !== "admin") {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 lg:mr-64">
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

  const { data: terms = [], isLoading } = useQuery<ApprovedTerm[]>({
    queryKey: ["/api/approved-terms"],
    enabled: user?.role === "admin",
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
    },
  });

  const handleAddTerm = () => {
    if (!newTerm.arabicTerm.trim() || !newTerm.hassaniyaTerm.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال المصطلح بالعربية والحسانية",
        variant: "destructive",
      });
      return;
    }
    createTermMutation.mutate(newTerm);
  };

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 lg:mr-64">
        <Header title="المصطلحات المعتمدة" />
        <main className="p-4 lg:p-6 overflow-y-auto">
          {/* Header Actions */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-[var(--project-text-primary)] arabic-text">
              إدارة المصطلحات المعتمدة
            </h2>
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="btn-primary arabic-text"
            >
              <Plus className="w-4 h-4 ml-2" />
              إضافة مصطلح جديد
            </Button>
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
    </div>
  );
}