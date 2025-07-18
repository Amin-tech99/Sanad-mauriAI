import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSourceSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { X, Plus } from "lucide-react";
import { z } from "zod";

const formSchema = insertSourceSchema.extend({
  tagsInput: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface UploadArticleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UploadArticleModal({ isOpen, onClose }: UploadArticleModalProps) {
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      content: "",
      tags: [],
      status: "pending",
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const { tagsInput, ...sourceData } = data;
      const res = await apiRequest("POST", "/api/sources", {
        ...sourceData,
        tags,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sources"] });
      toast({
        title: "تم الرفع بنجاح",
        description: "تم رفع المقال وسيتم معالجته قريباً",
      });
      handleClose();
    },
    onError: () => {
      toast({
        title: "خطأ في الرفع",
        description: "فشل في رفع المقال، يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    form.reset();
    setTags([]);
    setTagInput("");
    onClose();
  };

  const addTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  const onSubmit = (data: FormData) => {
    uploadMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="arabic-text">رفع مقال جديد</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Label htmlFor="title" className="arabic-text">عنوان المقال</Label>
            <Input
              id="title"
              {...form.register("title")}
              className="text-right"
              dir="rtl"
              placeholder="أدخل عنوان المقال"
            />
            {form.formState.errors.title && (
              <p className="text-[var(--project-error)] text-sm mt-1 arabic-text">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>

          <div>
            <Label className="arabic-text">تصنيفات المصدر</Label>
            <div className="flex flex-wrap gap-2 mb-3">
              {tags.map((tag) => (
                <Badge key={tag} className="bg-[var(--project-primary)]/10 text-[var(--project-primary)] arabic-text">
                  {tag}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 ml-1"
                    onClick={() => removeTag(tag)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              ))}
            </div>
            <div className="flex space-x-2 space-x-reverse">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="أضف تصنيف جديد"
                className="text-right flex-1"
                dir="rtl"
              />
              <Button type="button" onClick={addTag} variant="outline" size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="content" className="arabic-text">نص المقال</Label>
            <Textarea
              id="content"
              {...form.register("content")}
              placeholder="الصق النص العربي الفصيح هنا..."
              className="h-48 resize-vertical text-right arabic-scroll"
              dir="rtl"
            />
            {form.formState.errors.content && (
              <p className="text-[var(--project-error)] text-sm mt-1 arabic-text">
                {form.formState.errors.content.message}
              </p>
            )}
          </div>

          <DialogFooter className="flex justify-start space-x-4 space-x-reverse">
            <Button
              type="submit"
              disabled={uploadMutation.isPending}
              className="btn-primary arabic-text"
            >
              {uploadMutation.isPending ? "جاري الرفع..." : "حفظ ومعالجة"}
            </Button>
            <Button
              type="button"
              onClick={handleClose}
              variant="outline"
              className="arabic-text"
            >
              إلغاء
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
