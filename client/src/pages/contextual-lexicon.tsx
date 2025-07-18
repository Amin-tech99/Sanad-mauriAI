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
import { Plus, AlertTriangle, Library, Languages, Edit } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { StyleTag } from "@shared/schema";

interface LexiconEntry {
  id: number;
  baseWord: string;
  alternatives: {
    id: number;
    word: string;
    styleTags: string[];
  }[];
}

export default function ContextualLexicon() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAddEntryOpen, setIsAddEntryOpen] = useState(false);
  const [isAddAlternativeOpen, setIsAddAlternativeOpen] = useState(false);
  const [selectedEntryId, setSelectedEntryId] = useState<number | null>(null);
  const [newEntry, setNewEntry] = useState({ baseWord: "" });
  const [newAlternative, setNewAlternative] = useState({
    alternativeWord: "",
    styleTagIds: [] as number[],
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

  const { data: lexicon = [], isLoading } = useQuery<LexiconEntry[]>({
    queryKey: ["/api/contextual-lexicon"],
    enabled: user?.role === "admin",
  });

  const { data: styleTags = [] } = useQuery<StyleTag[]>({
    queryKey: ["/api/style-tags"],
    enabled: user?.role === "admin",
  });

  const createEntryMutation = useMutation({
    mutationFn: async (data: typeof newEntry) => {
      const res = await apiRequest("POST", "/api/contextual-lexicon", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contextual-lexicon"] });
      setIsAddEntryOpen(false);
      setNewEntry({ baseWord: "" });
      toast({
        title: "تمت الإضافة بنجاح",
        description: "تم إضافة الكلمة الأساسية بنجاح",
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

  const addAlternativeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof newAlternative }) => {
      const res = await apiRequest("POST", `/api/contextual-lexicon/${id}/alternatives`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contextual-lexicon"] });
      setIsAddAlternativeOpen(false);
      setNewAlternative({ alternativeWord: "", styleTagIds: [] });
      toast({
        title: "تمت الإضافة بنجاح",
        description: "تم إضافة البديل بنجاح",
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

  const handleAddEntry = () => {
    if (!newEntry.baseWord.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال الكلمة الأساسية",
        variant: "destructive",
      });
      return;
    }
    createEntryMutation.mutate(newEntry);
  };

  const handleAddAlternative = () => {
    if (!newAlternative.alternativeWord.trim() || !selectedEntryId) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال البديل",
        variant: "destructive",
      });
      return;
    }
    addAlternativeMutation.mutate({
      id: selectedEntryId,
      data: newAlternative,
    });
  };

  const openAddAlternativeDialog = (entryId: number) => {
    setSelectedEntryId(entryId);
    setIsAddAlternativeOpen(true);
  };

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 lg:mr-72">
        <Header title="المعجم السياقي" />
        <main className="p-4 lg:p-6 overflow-y-auto">
          {/* Header Actions */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-[var(--project-text-primary)] arabic-text">
              إدارة المعجم السياقي
            </h2>
            <Button
              onClick={() => setIsAddEntryOpen(true)}
              className="btn-primary arabic-text"
            >
              <Plus className="w-4 h-4 ml-2" />
              إضافة كلمة أساسية
            </Button>
          </div>

          {/* Info Card */}
          <Card className="mb-6 bg-[var(--project-primary)]/5 border-[var(--project-primary)]/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Library className="w-5 h-5 text-[var(--project-primary)] mt-1" />
                <div>
                  <h3 className="font-medium text-[var(--project-text-primary)] arabic-text mb-1">
                    حول المعجم السياقي
                  </h3>
                  <p className="text-sm text-[var(--project-text-secondary)] arabic-text">
                    يساعد المعجم السياقي المترجمين على اختيار الكلمات المناسبة حسب الأسلوب المطلوب. 
                    عند الترجمة، سيقترح النظام البدائل المناسبة للكلمات بناءً على الأسلوب المحدد للمهمة.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lexicon Entries */}
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--project-primary)] mx-auto"></div>
              <p className="mt-4 text-[var(--project-text-secondary)] arabic-text">
                جاري التحميل...
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {lexicon.map((entry) => (
                <Card key={entry.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="arabic-text text-xl">
                        {entry.baseWord}
                      </CardTitle>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openAddAlternativeDialog(entry.id)}
                        className="arabic-text"
                      >
                        <Plus className="w-4 h-4 ml-2" />
                        إضافة بديل
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {entry.alternatives.length === 0 ? (
                      <p className="text-sm text-[var(--project-text-secondary)] arabic-text">
                        لا توجد بدائل مضافة بعد
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {entry.alternatives.map((alt) => (
                          <div
                            key={alt.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <Languages className="w-4 h-4 text-[var(--project-primary)]" />
                              <span className="font-medium arabic-text">
                                {alt.word}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {alt.styleTags.map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Add Entry Dialog */}
      <Dialog open={isAddEntryOpen} onOpenChange={setIsAddEntryOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="arabic-text">
              إضافة كلمة أساسية جديدة
            </DialogTitle>
            <DialogDescription className="arabic-text">
              أضف كلمة عربية فصحى لإنشاء بدائل لها حسب الأسلوب
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="baseWord" className="arabic-text">
                الكلمة الأساسية (بالعربية الفصحى) *
              </Label>
              <Input
                id="baseWord"
                value={newEntry.baseWord}
                onChange={(e) => setNewEntry({ baseWord: e.target.value })}
                className="arabic-text"
                dir="rtl"
                placeholder="مثال: قال"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddEntryOpen(false)}
              className="arabic-text"
            >
              إلغاء
            </Button>
            <Button
              onClick={handleAddEntry}
              disabled={createEntryMutation.isPending}
              className="btn-primary arabic-text"
            >
              <Library className="w-4 h-4 ml-2" />
              إضافة الكلمة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Alternative Dialog */}
      <Dialog open={isAddAlternativeOpen} onOpenChange={setIsAddAlternativeOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="arabic-text">
              إضافة بديل حسب الأسلوب
            </DialogTitle>
            <DialogDescription className="arabic-text">
              أضف بديلاً بالحسانية مع تحديد الأسلوب المناسب له
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="alternativeWord" className="arabic-text">
                الكلمة البديلة (بالحسانية) *
              </Label>
              <Input
                id="alternativeWord"
                value={newAlternative.alternativeWord}
                onChange={(e) =>
                  setNewAlternative({
                    ...newAlternative,
                    alternativeWord: e.target.value,
                  })
                }
                className="arabic-text"
                dir="rtl"
                placeholder="مثال: گال"
              />
            </div>
            <div className="grid gap-2">
              <Label className="arabic-text">
                الأسلوب المرتبط
              </Label>
              <Select
                value={newAlternative.styleTagIds[0]?.toString() || ""}
                onValueChange={(value) =>
                  setNewAlternative({
                    ...newAlternative,
                    styleTagIds: value ? [parseInt(value)] : [],
                  })
                }
              >
                <SelectTrigger className="arabic-text">
                  <SelectValue placeholder="اختر الأسلوب" />
                </SelectTrigger>
                <SelectContent>
                  {styleTags.map((tag) => (
                    <SelectItem key={tag.id} value={tag.id.toString()}>
                      {tag.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddAlternativeOpen(false)}
              className="arabic-text"
            >
              إلغاء
            </Button>
            <Button
              onClick={handleAddAlternative}
              disabled={addAlternativeMutation.isPending}
              className="btn-primary arabic-text"
            >
              <Languages className="w-4 h-4 ml-2" />
              إضافة البديل
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}