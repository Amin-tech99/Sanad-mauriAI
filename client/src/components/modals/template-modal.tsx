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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTemplateSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const formSchema = insertTemplateSchema.extend({
  outputFormatString: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const defaultOutputFormat = `{
  "source_text": "النص العربي الفصيح",
  "target_text": "النص المترجم بالحسانية",
  "context": "السياق المستخدم",
  "quality_score": 0.95
}`;

export default function TemplateModal({ isOpen, onClose }: TemplateModalProps) {
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      taskType: "paragraph",
      instructions: "",
      outputFormatString: defaultOutputFormat,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const { outputFormatString, ...templateData } = data;
      
      let outputFormat;
      try {
        outputFormat = outputFormatString ? JSON.parse(outputFormatString) : {};
      } catch (error) {
        throw new Error("صيغة JSON غير صحيحة");
      }

      const res = await apiRequest("POST", "/api/templates", {
        ...templateData,
        outputFormat,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      toast({
        title: "تم الإنشاء بنجاح",
        description: "تم إنشاء نموذج التعليمات بنجاح",
      });
      handleClose();
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ في الإنشاء",
        description: error.message || "فشل في إنشاء النموذج، يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const onSubmit = (data: FormData) => {
    createMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="arabic-text">إنشاء نموذج تعليمات جديد</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <Label htmlFor="name" className="arabic-text">اسم النموذج</Label>
              <Input
                id="name"
                {...form.register("name")}
                className="text-right"
                dir="rtl"
                placeholder="أدخل اسم النموذج"
              />
              {form.formState.errors.name && (
                <p className="text-[var(--project-error)] text-sm mt-1 arabic-text">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="taskType" className="arabic-text">نوع المهمة</Label>
              <Select onValueChange={(value) => form.setValue("taskType", value)} defaultValue="paragraph">
                <SelectTrigger className="text-right" dir="rtl">
                  <SelectValue placeholder="اختر نوع المهمة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sentence">ترجمة الجمل</SelectItem>
                  <SelectItem value="paragraph">ترجمة الفقرات</SelectItem>
                  <SelectItem value="summarization">تلخيص النصوص</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.taskType && (
                <p className="text-[var(--project-error)] text-sm mt-1 arabic-text">
                  {form.formState.errors.taskType.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="instructions" className="arabic-text">تعليمات للمترجم</Label>
            <div className="border border-[var(--project-border)] rounded-lg focus-within:ring-2 focus-within:ring-[var(--project-primary)]">
              <Textarea
                id="instructions"
                {...form.register("instructions")}
                placeholder="أدخل التعليمات المفصلة للمترجم هنا..."
                className="min-h-32 border-0 focus:ring-0 text-right arabic-scroll"
                dir="rtl"
              />
            </div>
            {form.formState.errors.instructions && (
              <p className="text-[var(--project-error)] text-sm mt-1 arabic-text">
                {form.formState.errors.instructions.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="outputFormat" className="arabic-text">صيغة المخرج (JSON)</Label>
            <div className="border border-[var(--project-border)] rounded-lg bg-gray-50">
              <div className="px-4 py-2 border-b border-[var(--project-border)] bg-gray-100 text-xs text-[var(--project-text-secondary)] latin-text">
                JSON Format Definition
              </div>
              <Textarea
                id="outputFormat"
                {...form.register("outputFormatString")}
                className="bg-transparent font-mono text-sm h-32 resize-vertical border-0 focus:ring-0"
                dir="ltr"
              />
            </div>
            {form.formState.errors.outputFormatString && (
              <p className="text-[var(--project-error)] text-sm mt-1 arabic-text">
                {form.formState.errors.outputFormatString.message}
              </p>
            )}
          </div>

          <DialogFooter className="flex justify-start space-x-4 space-x-reverse">
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="btn-primary arabic-text"
            >
              {createMutation.isPending ? "جاري الإنشاء..." : "حفظ النموذج"}
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
