import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, X, Languages } from "lucide-react";
import type { StyleTag } from "@shared/schema";

interface WordSuggestionDialogProps {
  open: boolean;
  onClose: () => void;
  sourceText: string;
  translatedText: string;
  workItemId: number;
}

interface WordSuggestionPair {
  baseWord: string;
  alternativeWord: string;
  styleTagId: number | null;
  context: string;
}

export default function WordSuggestionDialog({
  open,
  onClose,
  sourceText,
  translatedText,
  workItemId
}: WordSuggestionDialogProps) {
  const { toast } = useToast();
  const [suggestions, setSuggestions] = useState<WordSuggestionPair[]>([
    { baseWord: "", alternativeWord: "", styleTagId: null, context: "" }
  ]);

  // Fetch style tags
  const { data: styleTags = [] } = useQuery<StyleTag[]>({
    queryKey: ["/api/style-tags"],
    enabled: open,
  });

  // Create word suggestion mutation
  const createSuggestionMutation = useMutation({
    mutationFn: async (suggestion: WordSuggestionPair) => {
      const res = await apiRequest("POST", "/api/word-suggestions", {
        ...suggestion,
        workItemId,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contextual-lexicon"] });
    },
  });

  const handleAddSuggestion = () => {
    setSuggestions([...suggestions, { baseWord: "", alternativeWord: "", styleTagId: null, context: "" }]);
  };

  const handleRemoveSuggestion = (index: number) => {
    setSuggestions(suggestions.filter((_, i) => i !== index));
  };

  const handleUpdateSuggestion = (index: number, field: keyof WordSuggestionPair, value: any) => {
    const updated = [...suggestions];
    updated[index] = { ...updated[index], [field]: value };
    setSuggestions(updated);
  };

  const handleSubmit = async () => {
    const validSuggestions = suggestions.filter(
      s => s.baseWord && s.alternativeWord && s.styleTagId
    );

    if (validSuggestions.length === 0) {
      toast({
        title: "لا توجد اقتراحات صالحة",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    try {
      await Promise.all(validSuggestions.map(s => createSuggestionMutation.mutateAsync(s)));
      
      toast({
        title: "تم إرسال الاقتراحات بنجاح",
        description: `تم إرسال ${validSuggestions.length} اقتراح للمراجعة`,
      });
      
      onClose();
      setSuggestions([{ baseWord: "", alternativeWord: "", styleTagId: null, context: "" }]);
    } catch (error) {
      toast({
        title: "خطأ في إرسال الاقتراحات",
        description: "حدث خطأ أثناء إرسال الاقتراحات",
        variant: "destructive",
      });
    }
  };

  const handleSkip = () => {
    onClose();
    setSuggestions([{ baseWord: "", alternativeWord: "", styleTagId: null, context: "" }]);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="arabic-text flex items-center gap-2">
            <Languages className="w-5 h-5 text-[var(--project-primary)]" />
            هل تريد اقتراح كلمات للأساليب المختلفة؟
          </DialogTitle>
          <DialogDescription className="arabic-text">
            إذا لاحظت كلمات يمكن إضافتها لأسلوب معين لتحسين الترجمات المستقبلية، يمكنك اقتراحها هنا.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 space-y-4">
          {/* Show source and translated text for reference */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4">
              <h4 className="text-sm font-medium mb-2 arabic-text">النص المصدر</h4>
              <p className="text-sm arabic-text text-[var(--project-text-secondary)]" dir="rtl">
                {sourceText.substring(0, 200)}...
              </p>
            </Card>
            <Card className="p-4">
              <h4 className="text-sm font-medium mb-2 arabic-text">الترجمة</h4>
              <p className="text-sm arabic-text text-[var(--project-text-secondary)]" dir="rtl">
                {translatedText.substring(0, 200)}...
              </p>
            </Card>
          </div>

          {/* Word suggestions */}
          <div className="space-y-3">
            {suggestions.map((suggestion, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-start gap-2">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <Label className="arabic-text text-sm">الكلمة الأصلية</Label>
                      <Input
                        value={suggestion.baseWord}
                        onChange={(e) => handleUpdateSuggestion(index, "baseWord", e.target.value)}
                        placeholder="أدخل الكلمة بالعربية الفصحى"
                        dir="rtl"
                        className="arabic-text mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label className="arabic-text text-sm">البديل المقترح</Label>
                      <Input
                        value={suggestion.alternativeWord}
                        onChange={(e) => handleUpdateSuggestion(index, "alternativeWord", e.target.value)}
                        placeholder="أدخل البديل بالحسانية"
                        dir="rtl"
                        className="arabic-text mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label className="arabic-text text-sm">الأسلوب</Label>
                      <Select
                        value={suggestion.styleTagId?.toString() || ""}
                        onValueChange={(value) => handleUpdateSuggestion(index, "styleTagId", parseInt(value))}
                      >
                        <SelectTrigger className="arabic-text mt-1">
                          <SelectValue placeholder="اختر الأسلوب" />
                        </SelectTrigger>
                        <SelectContent>
                          {styleTags.map((tag) => (
                            <SelectItem key={tag.id} value={tag.id.toString()}>
                              <span className="arabic-text">{tag.name}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveSuggestion(index)}
                    className="mt-6"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="mt-3">
                  <Label className="arabic-text text-sm">السياق (اختياري)</Label>
                  <Textarea
                    value={suggestion.context}
                    onChange={(e) => handleUpdateSuggestion(index, "context", e.target.value)}
                    placeholder="أضف سياق أو ملاحظات حول استخدام هذه الكلمة"
                    dir="rtl"
                    className="arabic-text mt-1 h-20"
                  />
                </div>
              </Card>
            ))}
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddSuggestion}
              className="arabic-text w-full"
            >
              <Plus className="w-4 h-4 ml-2" />
              إضافة اقتراح آخر
            </Button>
          </div>
        </div>

        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={handleSkip}
            className="arabic-text"
          >
            تخطي
          </Button>
          
          <Button
            onClick={handleSubmit}
            disabled={createSuggestionMutation.isPending}
            className="btn-primary arabic-text"
          >
            إرسال الاقتراحات
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}