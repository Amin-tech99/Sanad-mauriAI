import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CheckCircle, XCircle, Clock, AlertTriangle, Languages } from "lucide-react";
import type { WordSuggestion, StyleTag, User } from "@shared/schema";

interface WordSuggestionWithDetails extends WordSuggestion {
  styleTag?: StyleTag;
  suggestedByUser?: User;
}

export default function WordSuggestions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedSuggestion, setSelectedSuggestion] = useState<number | null>(null);
  const [reviewNotes, setReviewNotes] = useState<{ [key: number]: string }>({});

  if (user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">غير مصرح بالدخول</h2>
          <p className="text-muted-foreground">هذه الصفحة متاحة للمسؤولين فقط</p>
        </div>
      </div>
    );
  }

  // Fetch pending word suggestions
  const { data: suggestions = [], isLoading, refetch } = useQuery<WordSuggestionWithDetails[]>({
    queryKey: ["/api/word-suggestions/pending"],
    enabled: user?.role === "admin",
  });

  // Fetch style tags for display
  const { data: styleTags = [] } = useQuery<StyleTag[]>({
    queryKey: ["/api/style-tags"],
  });

  // Fetch users for display
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Update suggestion status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, reviewNotes }: { id: number; status: string; reviewNotes?: string }) => {
      const res = await apiRequest("PATCH", `/api/word-suggestions/${id}`, {
        status,
        reviewNotes,
      });
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/word-suggestions/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contextual-lexicon"] });
      refetch();
      
      toast({
        title: variables.status === "approved" ? "تمت الموافقة" : "تم الرفض",
        description: variables.status === "approved" 
          ? "تمت الموافقة على الاقتراح وإضافته للمعجم السياقي"
          : "تم رفض الاقتراح",
      });
      
      setSelectedSuggestion(null);
      setReviewNotes({});
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في تحديث حالة الاقتراح",
        variant: "destructive",
      });
    },
  });

  const handleApprove = (suggestionId: number) => {
    updateStatusMutation.mutate({
      id: suggestionId,
      status: "approved",
      reviewNotes: reviewNotes[suggestionId],
    });
  };

  const handleReject = (suggestionId: number) => {
    updateStatusMutation.mutate({
      id: suggestionId,
      status: "rejected",
      reviewNotes: reviewNotes[suggestionId],
    });
  };

  // Enhance suggestions with details
  const enhancedSuggestions = suggestions.map(suggestion => ({
    ...suggestion,
    styleTag: styleTags.find(tag => tag.id === suggestion.styleTagId),
    suggestedByUser: users.find(u => u.id === suggestion.suggestedBy),
  }));

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        <Header />
        
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl lg:text-3xl font-bold text-[var(--project-text-primary)] mb-2 arabic-text">
                اقتراحات الكلمات
              </h1>
              <p className="text-[var(--project-text-secondary)] arabic-text">
                مراجعة والموافقة على اقتراحات الكلمات من المترجمين
              </p>
            </div>

            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--project-primary)]"></div>
              </div>
            ) : enhancedSuggestions.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-[var(--project-text-secondary)] arabic-text">
                    لا توجد اقتراحات كلمات في انتظار المراجعة
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {enhancedSuggestions.map((suggestion) => (
                  <Card key={suggestion.id} className="overflow-hidden">
                    <CardHeader className="bg-gray-50 border-b">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Languages className="w-5 h-5 text-[var(--project-primary)]" />
                          <div>
                            <h3 className="font-medium text-[var(--project-text-primary)] arabic-text">
                              {suggestion.baseWord} ← {suggestion.alternativeWord}
                            </h3>
                            <p className="text-sm text-[var(--project-text-secondary)] arabic-text mt-1">
                              اقترح بواسطة: {suggestion.suggestedByUser?.username || "غير معروف"}
                            </p>
                          </div>
                        </div>
                        
                        <Badge className="bg-[var(--project-primary)]/10 text-[var(--project-primary)]">
                          {suggestion.styleTag?.name || "غير محدد"}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="p-6">
                      {suggestion.context && (
                        <div className="mb-4">
                          <p className="text-sm font-medium text-[var(--project-text-primary)] mb-1 arabic-text">
                            السياق:
                          </p>
                          <p className="text-sm text-[var(--project-text-secondary)] arabic-text">
                            {suggestion.context}
                          </p>
                        </div>
                      )}
                      
                      <div className="mb-4">
                        <p className="text-sm font-medium text-[var(--project-text-primary)] mb-1 arabic-text">
                          وصف الأسلوب:
                        </p>
                        <p className="text-sm text-[var(--project-text-secondary)] arabic-text">
                          {suggestion.styleTag?.description || "غير متوفر"}
                        </p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-[var(--project-text-primary)] mb-2 block arabic-text">
                          ملاحظات المراجعة (اختياري):
                        </label>
                        <Textarea
                          value={reviewNotes[suggestion.id] || ""}
                          onChange={(e) => setReviewNotes({ ...reviewNotes, [suggestion.id]: e.target.value })}
                          placeholder="أضف ملاحظات حول قرار الموافقة أو الرفض..."
                          className="arabic-text mb-4"
                          dir="rtl"
                        />
                      </div>
                      
                      <div className="flex gap-3">
                        <Button
                          onClick={() => handleApprove(suggestion.id)}
                          disabled={updateStatusMutation.isPending}
                          className="flex-1 btn-primary arabic-text"
                        >
                          <CheckCircle className="w-4 h-4 ml-2" />
                          موافقة وإضافة للمعجم
                        </Button>
                        
                        <Button
                          onClick={() => handleReject(suggestion.id)}
                          disabled={updateStatusMutation.isPending}
                          variant="destructive"
                          className="flex-1 arabic-text"
                        >
                          <XCircle className="w-4 h-4 ml-2" />
                          رفض الاقتراح
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}