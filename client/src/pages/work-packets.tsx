import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Circle, ArrowLeft, Package, Users, AlertTriangle } from "lucide-react";
import type { Source, InstructionTemplate, User, StyleTag } from "@shared/schema";

interface CreateWorkPacketData {
  sourceId: number;
  templateId: number;
  unitType: string;
  translatorIds: number[];
  styleTagId?: number;
}

export default function WorkPackets() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedSource, setSelectedSource] = useState<number | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [unitType, setUnitType] = useState("paragraph");
  const [selectedTranslators, setSelectedTranslators] = useState<number[]>([]);
  const [selectedStyleTag, setSelectedStyleTag] = useState<number | null>(null);

  const { data: sources = [] } = useQuery<Source[]>({
    queryKey: ["/api/sources"],
  });

  const { data: templates = [] } = useQuery<InstructionTemplate[]>({
    queryKey: ["/api/templates"],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });
  
  const { data: styleTags = [] } = useQuery<StyleTag[]>({
    queryKey: ["/api/style-tags"],
  });

  const createPacketMutation = useMutation({
    mutationFn: async (data: CreateWorkPacketData) => {
      const res = await apiRequest("POST", "/api/work-packets", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-packets"] });
      toast({
        title: "تم الإنشاء بنجاح",
        description: "تم إنشاء حزمة العمل وتعيين المهام للمترجمين",
      });
      resetForm();
    },
    onError: () => {
      toast({
        title: "خطأ في الإنشاء",
        description: "فشل في إنشاء حزمة العمل، يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
    },
  });

  const translators = users.filter(u => u.role === "translator" && u.isActive);
  const availableSources = sources.filter(s => s.status === "processing" || s.status === "completed");
  const selectedSourceData = sources.find(s => s.id === selectedSource);
  const selectedTemplateData = templates.find(t => t.id === selectedTemplate);

  const resetForm = () => {
    setCurrentStep(1);
    setSelectedSource(null);
    setSelectedTemplate(null);
    setUnitType("paragraph");
    setSelectedTranslators([]);
    setSelectedStyleTag(null);
  };

  const handleTranslatorToggle = (translatorId: number) => {
    setSelectedTranslators(prev => 
      prev.includes(translatorId) 
        ? prev.filter(id => id !== translatorId)
        : [...prev, translatorId]
    );
  };

  const canProceedToStep2 = selectedSource && unitType;
  const canProceedToStep3 = canProceedToStep2 && selectedTemplate;
  const canCreatePacket = canProceedToStep3 && selectedTranslators.length > 0;

  const handleCreatePacket = () => {
    if (canCreatePacket) {
      createPacketMutation.mutate({
        sourceId: selectedSource!,
        templateId: selectedTemplate!,
        unitType,
        translatorIds: selectedTranslators,
        styleTagId: selectedStyleTag || undefined,
      });
    }
  };

  const getEstimatedUnits = () => {
    if (!selectedSourceData) return 0;
    
    if (unitType === "paragraph") {
      return selectedSourceData.content.split('\n\n').filter(p => p.trim().length > 0).length;
    } else {
      return selectedSourceData.content.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    }
  };

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
        <Header title="إنشاء حزم العمل" />
        <main className="p-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-[var(--project-text-primary)] arabic-text">
                إنشاء حزمة عمل جديدة
              </h2>
              <p className="text-[var(--project-text-secondary)] arabic-text">
                اتبع الخطوات لتعيين المهام للفريق
              </p>
            </div>

            {/* Wizard Steps */}
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center space-x-4 space-x-reverse">
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep >= 1 ? "bg-[var(--project-primary)] text-white" : "bg-gray-200 text-[var(--project-text-secondary)]"
                  }`}>
                    {currentStep > 1 ? <CheckCircle className="w-4 h-4" /> : "1"}
                  </div>
                  <span className="mr-2 text-sm text-[var(--project-text-primary)] arabic-text">اختر المصدر</span>
                </div>
                <div className="w-16 h-px bg-[var(--project-border)]"></div>
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep >= 2 ? "bg-[var(--project-primary)] text-white" : "bg-gray-200 text-[var(--project-text-secondary)]"
                  }`}>
                    {currentStep > 2 ? <CheckCircle className="w-4 h-4" /> : "2"}
                  </div>
                  <span className="mr-2 text-sm text-[var(--project-text-primary)] arabic-text">حدد النموذج</span>
                </div>
                <div className="w-16 h-px bg-[var(--project-border)]"></div>
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep >= 3 ? "bg-[var(--project-primary)] text-white" : "bg-gray-200 text-[var(--project-text-secondary)]"
                  }`}>
                    {currentStep > 3 ? <CheckCircle className="w-4 h-4" /> : "3"}
                  </div>
                  <span className="mr-2 text-sm text-[var(--project-text-primary)] arabic-text">عين المترجمين</span>
                </div>
              </div>
            </div>

            {/* Step Content */}
            <Card>
              <CardContent className="p-8">
                {currentStep === 1 && (
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--project-text-primary)] mb-6 arabic-text">
                      الخطوة 1: اختيار المصدر وتحديد وحدة البيانات
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label className="block text-sm font-medium text-[var(--project-text-primary)] mb-2 arabic-text">
                          اختر المقال المصدر
                        </label>
                        <Select value={selectedSource?.toString()} onValueChange={(value) => setSelectedSource(parseInt(value))}>
                          <SelectTrigger className="text-right" dir="rtl">
                            <SelectValue placeholder="اختر مقال مصدر" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableSources.length === 0 ? (
                              <SelectItem value="no-sources" disabled>
                                لا توجد مقالات متاحة
                              </SelectItem>
                            ) : (
                              availableSources.map((source) => (
                                <SelectItem key={source.id} value={source.id.toString()}>
                                  {source.title}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[var(--project-text-primary)] mb-2 arabic-text">
                          وحدة البيانات
                        </label>
                        <Select value={unitType} onValueChange={setUnitType}>
                          <SelectTrigger className="text-right" dir="rtl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sentence">ترجمة الجمل</SelectItem>
                            <SelectItem value="paragraph">ترجمة الفقرات</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {selectedSourceData && (
                      <div className="p-4 bg-gray-50 rounded-lg mb-6">
                        <h4 className="font-medium text-[var(--project-text-primary)] mb-2 arabic-text">
                          معاينة التقسيم:
                        </h4>
                        <p className="text-sm text-[var(--project-text-secondary)] arabic-text">
                          سيتم تقسيم المقال إلى {getEstimatedUnits()} {unitType === "paragraph" ? "فقرة" : "جملة"} للترجمة
                        </p>
                        <div className="mt-3 p-3 bg-white rounded border text-sm arabic-text" dir="rtl">
                          {selectedSourceData.content.substring(0, 200)}...
                        </div>
                      </div>
                    )}

                    <div className="flex justify-start">
                      <Button
                        onClick={() => setCurrentStep(2)}
                        disabled={!canProceedToStep2}
                        className="btn-primary arabic-text"
                      >
                        التالي
                        <ArrowLeft className="w-4 h-4 mr-2" />
                      </Button>
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--project-text-primary)] mb-6 arabic-text">
                      الخطوة 2: اختيار نموذج التعليمات
                    </h3>
                    
                    {!selectedTemplate && (
                      <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-sm text-amber-800 arabic-text">
                          <strong>مطلوب:</strong> يجب اختيار نموذج التعليمات للمتابعة
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      {templates.map((template) => (
                        <Card 
                          key={template.id} 
                          className={`cursor-pointer transition-all hover:shadow-md ${
                            selectedTemplate === template.id ? 'ring-2 ring-[var(--project-primary)]' : ''
                          }`}
                          onClick={() => setSelectedTemplate(template.id)}
                        >
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base arabic-text">{template.name}</CardTitle>
                              <div className="flex items-center gap-2">
                                {selectedTemplate === template.id && (
                                  <CheckCircle className="w-5 h-5 text-[var(--project-primary)]" />
                                )}
                                <Badge className="bg-[var(--project-primary)]/20 text-[var(--project-primary)] arabic-text">
                                  {template.taskType === "paragraph" ? "ترجمة الفقرات" : "ترجمة الجمل"}
                                </Badge>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-[var(--project-text-secondary)] arabic-text line-clamp-3">
                              {template.instructions}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {selectedTemplateData && (
                      <div className="p-4 bg-[var(--project-primary)]/5 rounded-lg mb-6">
                        <h4 className="font-medium text-[var(--project-text-primary)] mb-2 arabic-text">
                          معاينة التعليمات:
                        </h4>
                        <p className="text-sm text-[var(--project-text-secondary)] arabic-text">
                          {selectedTemplateData.instructions}
                        </p>
                      </div>
                    )}
                    
                    {/* Style Tag Selection */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-[var(--project-text-primary)] mb-2 arabic-text">
                        اختر أسلوب الترجمة <span className="text-[var(--project-text-secondary)]">(اختياري)</span>
                      </label>
                      <Select value={selectedStyleTag?.toString()} onValueChange={(value) => setSelectedStyleTag(parseInt(value))}>
                        <SelectTrigger className="text-right" dir="rtl">
                          <SelectValue placeholder="اختر أسلوب الترجمة" />
                        </SelectTrigger>
                        <SelectContent>
                          {styleTags.map((tag) => (
                            <SelectItem key={tag.id} value={tag.id.toString()}>
                              {tag.name} - {tag.description}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedStyleTag && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-[var(--project-text-secondary)] arabic-text">
                            <strong>الإرشادات:</strong> {styleTags.find(t => t.id === selectedStyleTag)?.guidelines}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-start space-x-4 space-x-reverse">
                      <Button
                        onClick={() => setCurrentStep(3)}
                        disabled={!canProceedToStep3}
                        className="btn-primary arabic-text"
                      >
                        التالي
                        <ArrowLeft className="w-4 h-4 mr-2" />
                      </Button>
                      <Button
                        onClick={() => setCurrentStep(1)}
                        variant="outline"
                        className="arabic-text"
                      >
                        السابق
                      </Button>
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--project-text-primary)] mb-6 arabic-text">
                      الخطوة 3: اختيار المترجمين
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                      {translators.map((translator) => (
                        <Card 
                          key={translator.id}
                          className={`cursor-pointer transition-all hover:shadow-md ${
                            selectedTranslators.includes(translator.id) ? 'ring-2 ring-[var(--project-primary)]' : ''
                          }`}
                          onClick={() => handleTranslatorToggle(translator.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center space-x-3 space-x-reverse">
                              <Checkbox 
                                checked={selectedTranslators.includes(translator.id)}
                                onChange={() => handleTranslatorToggle(translator.id)}
                              />
                              <div className="flex-1">
                                <p className="font-medium text-[var(--project-text-primary)] arabic-text">
                                  {translator.username}
                                </p>
                                <p className="text-sm text-[var(--project-text-secondary)] arabic-text">
                                  مترجم نشط
                                </p>
                              </div>
                              <Users className="w-5 h-5 text-[var(--project-text-secondary)]" />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {selectedTranslators.length === 0 && (
                      <div className="text-center py-4 text-[var(--project-text-secondary)] arabic-text">
                        يرجى اختيار مترجم واحد على الأقل
                      </div>
                    )}

                    <div className="flex justify-start space-x-4 space-x-reverse">
                      <Button
                        onClick={handleCreatePacket}
                        disabled={!canCreatePacket || createPacketMutation.isPending}
                        className="btn-primary arabic-text"
                      >
                        <Package className="w-4 h-4 ml-2" />
                        {createPacketMutation.isPending ? "جاري الإنشاء..." : "إنشاء وتعيين الحزمة"}
                      </Button>
                      <Button
                        onClick={() => setCurrentStep(2)}
                        variant="outline"
                        className="arabic-text"
                      >
                        السابق
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
