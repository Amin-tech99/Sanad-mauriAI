import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
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
  const [suggestion, setSuggestion] = useState<WordSuggestionPair>({
    baseWord: "",
    alternativeWord: "",
    styleTagId: null,
    context: ""
  });

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

  const handleUpdateSuggestion = (field: keyof WordSuggestionPair, value: any) => {
    setSuggestion(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!suggestion.baseWord || !suggestion.alternativeWord || !suggestion.styleTagId) {
      toast({
        title: "يرجى ملء جميع الحقول",
        description: "الكلمة الأصلية والبديل والأسلوب مطلوبة",
        variant: "destructive",
      });
      return;
    }

    try {
      await createSuggestionMutation.mutateAsync(suggestion);
      
      toast({
        title: "تم إرسال الاقتراح بنجاح",
        description: "شكراً لمساهمتك في تحسين الترجمة",
      });
      
      onClose();
      setSuggestion({ baseWord: "", alternativeWord: "", styleTagId: null, context: "" });
    } catch (error) {
      toast({
        title: "خطأ في إرسال الاقتراح",
        description: "حدث خطأ أثناء إرسال الاقتراح",
        variant: "destructive",
      });
    }
  };

  const handleSkip = () => {
    onClose();
    setSuggestion({ baseWord: "", alternativeWord: "", styleTagId: null, context: "" });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="arabic-text text-lg">
            اقتراح كلمات جديدة؟
          </DialogTitle>
          <DialogDescription className="arabic-text text-sm">
            هل تريد إضافة كلمات لتحسين الترجمات المستقبلية؟
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-3">
          <div>
            <Label className="arabic-text text-sm">الكلمة الأصلية</Label>
            <Input
              value={suggestion.baseWord}
              onChange={(e) => handleUpdateSuggestion("baseWord", e.target.value)}
              placeholder="الكلمة بالعربية"
              dir="rtl"
              className="arabic-text mt-1"
            />
          </div>
          
          <div>
            <Label className="arabic-text text-sm">البديل بالحسانية</Label>
            <Input
              value={suggestion.alternativeWord}
              onChange={(e) => handleUpdateSuggestion("alternativeWord", e.target.value)}
              placeholder="البديل بالحسانية"
              dir="rtl"
              className="arabic-text mt-1"
            />
          </div>
          
          <div>
            <Label className="arabic-text text-sm">الأسلوب</Label>
            <Select
              value={suggestion.styleTagId?.toString() || ""}
              onValueChange={(value) => handleUpdateSuggestion("styleTagId", parseInt(value))}
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

        <div className="flex gap-2 mt-6">
          <Button
            variant="outline"
            onClick={handleSkip}
            className="arabic-text flex-1"
          >
            تخطي
          </Button>
          
          <Button
            onClick={handleSubmit}
            disabled={createSuggestionMutation.isPending}
            className="btn-primary arabic-text flex-1"
          >
            إرسال
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}