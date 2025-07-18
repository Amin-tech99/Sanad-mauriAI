import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import TemplateModal from "@/components/modals/template-modal";
import { Plus, Edit, Copy, FileText, AlertTriangle } from "lucide-react";
import type { InstructionTemplate } from "@shared/schema";

export default function Templates() {
  const { user } = useAuth();
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  const { data: templates = [], isLoading } = useQuery<InstructionTemplate[]>({
    queryKey: ["/api/templates"],
  });

  if (user?.role !== "admin") {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 lg:mr-72">
          <Header title="غير مخول" />
          <main className="p-6">
            <div className="text-center">
              <AlertTriangle className="w-16 h-16 text-[var(--project-error)] mx-auto mb-4" />
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
        <Header title="مكتبة نماذج التعليمات" />
        <main className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-[var(--project-text-primary)] arabic-text">
                نماذج التعليمات
              </h2>
              <p className="text-[var(--project-text-secondary)] arabic-text">
                إنشاء وإدارة نماذج المهام
              </p>
            </div>
            <Button
              onClick={() => setShowTemplateModal(true)}
              className="btn-primary arabic-text"
            >
              <Plus className="w-4 h-4 ml-2" />
              إنشاء نموذج جديد
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-[var(--project-text-secondary)] arabic-text">جاري التحميل...</p>
            </div>
          ) : templates.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="w-16 h-16 text-[var(--project-text-secondary)] mx-auto mb-4" />
                <h3 className="text-lg font-medium text-[var(--project-text-primary)] mb-2 arabic-text">
                  لا توجد نماذج
                </h3>
                <p className="text-[var(--project-text-secondary)] mb-4 arabic-text">
                  ابدأ بإنشاء أول نموذج تعليمات للمشروع
                </p>
                <Button 
                  onClick={() => setShowTemplateModal(true)} 
                  className="btn-primary arabic-text"
                >
                  <Plus className="w-4 h-4 ml-2" />
                  إنشاء نموذج جديد
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg arabic-text line-clamp-2">
                        {template.name}
                      </CardTitle>
                      <Badge className="bg-[var(--project-primary)]/20 text-[var(--project-primary)] arabic-text">
                        {template.taskType === "sentence" ? "ترجمة الجمل" :
                         template.taskType === "paragraph" ? "ترجمة الفقرات" :
                         template.taskType === "summarization" ? "تلخيص النصوص" :
                         template.taskType}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-[var(--project-text-secondary)] text-sm mb-4 arabic-text line-clamp-3">
                      {template.instructions}
                    </p>
                    
                    <div className="text-xs text-[var(--project-text-secondary)] mb-4">
                      {template.createdAt && new Date(template.createdAt).toLocaleDateString('ar-SA')}
                    </div>
                    
                    <div className="flex space-x-2 space-x-reverse">
                      <Button size="sm" variant="outline">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <TemplateModal 
            isOpen={showTemplateModal} 
            onClose={() => setShowTemplateModal(false)} 
          />
        </main>
      </div>
    </div>
  );
}
