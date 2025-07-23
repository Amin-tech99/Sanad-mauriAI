import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { 
  ArrowLeft, 
  ArrowRight, 
  Save, 
  Send, 
  Menu,
  X,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  RotateCcw,
  Check,
  Clock,
  Target,
  BookOpen,
  Lightbulb,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import ApprovedTermsSuggestions from '@/components/approved-terms-suggestions';
import ContextualWordAssistant from '@/components/contextual-word-assistant';
import WordSuggestionDialog from '@/components/word-suggestion-dialog';
import ContextualHints from '@/components/contextual-hints';
import { FeatureGate } from '@/components/feature-gate';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { WorkItem, ApprovedTerm, StyleTag } from '@shared/schema';

export function MobileWorkspace() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();

  if (user?.role !== "translator") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">غير مصرح بالدخول</h2>
          <p className="text-muted-foreground">هذه الصفحة متاحة للمترجمين فقط</p>
        </div>
      </div>
    );
  }
  
  // State management
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [translation, setTranslation] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionQuery, setSuggestionQuery] = useState('');
  const [suggestionPosition, setSuggestionPosition] = useState({ x: 0, y: 0 });
  const [textareaRef, setTextareaRef] = useState<HTMLTextAreaElement | null>(null);
  const [sessionStartTime] = useState(Date.now());
  const [currentWord, setCurrentWord] = useState('');
  const [approvedTermsUsed, setApprovedTermsUsed] = useState(0);
  const [wordsCompleted, setWordsCompleted] = useState(0);
  const [hasUnapprovedTerms, setHasUnapprovedTerms] = useState(false);
  const [showWordSuggestionDialog, setShowWordSuggestionDialog] = useState(false);
  const [completedWorkItem, setCompletedWorkItem] = useState<WorkItem | null>(null);
  
  // Mobile-specific state
  const [isSourceVisible, setIsSourceVisible] = useState(true);
  const [activeTab, setActiveTab] = useState('translate');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const textareaRefCallback = useRef<HTMLTextAreaElement>(null);

  // Fetch work items
  const { data: workItems = [], isLoading } = useQuery<Array<WorkItem & { styleTag?: StyleTag }>>({
    queryKey: ['/api/my-work'],
    enabled: user?.role === 'translator',
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 20000, // Consider data stale after 20 seconds
  });
  
  const { data: approvedTerms = [] } = useQuery<ApprovedTerm[]>({
    queryKey: ['/api/approved-terms'],
    enabled: user?.role === 'translator',
  });

  const currentItem = workItems[currentItemIndex];

  // Set translation when current item changes
  React.useEffect(() => {
    if (currentItem) {
      setTranslation(currentItem.targetText || "");
    }
  }, [currentItem]);

  // Auto-save functionality
  useEffect(() => {
    if (!currentItem || !translation.trim() || translation === currentItem.targetText) {
      return;
    }

    const autoSaveTimer = setTimeout(() => {
      setIsSaving(true);
      updateMutation.mutate({
        id: currentItem.id,
        targetText: translation,
      });
    }, 3000); // Auto-save after 3 seconds of no typing

    return () => clearTimeout(autoSaveTimer);
  }, [translation, currentItem]);

  // Handle text changes and detect Arabic words for suggestions
  const handleTranslationChange = (value: string) => {
    setTranslation(value);
    
    if (!textareaRefCallback.current) return;
    
    const cursorPosition = textareaRefCallback.current.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPosition);
    const words = textBeforeCursor.split(/\s+/);
    const currentWord = words[words.length - 1];
    
    // Update current word for hints
    setCurrentWord(currentWord);
    
    // Check for unapproved Arabic terms
    const arabicWords = value.match(/[\u0600-\u06FF]+/g) || [];
    const approvedArabicTerms = new Set(approvedTerms.map(term => term.arabicTerm));
    const hasUnapproved = arabicWords.some(word => word.length > 2 && !approvedArabicTerms.has(word));
    setHasUnapprovedTerms(hasUnapproved);
    
    // Check if typing an Arabic word
    if (currentWord && /[\u0600-\u06FF]/.test(currentWord)) {
      setSuggestionQuery(currentWord);
      
      // Calculate position for suggestions
      const textarea = textareaRefCallback.current;
      const textareaRect = textarea.getBoundingClientRect();
      
      // Simple position calculation (can be improved)
      const position = {
        top: textareaRect.bottom + 5,
        left: textareaRect.left,
      };
      
      setSuggestionPosition(position);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };
  
  // Handle term selection
  const handleSelectTerm = (term: ApprovedTerm) => {
    if (!textareaRefCallback.current) return;
    
    const cursorPosition = textareaRefCallback.current.selectionStart;
    const textBeforeCursor = translation.substring(0, cursorPosition);
    const textAfterCursor = translation.substring(cursorPosition);
    
    // Find the current word being typed
    const words = textBeforeCursor.split(/\s+/);
    const currentWord = words[words.length - 1];
    const textWithoutCurrentWord = textBeforeCursor.substring(0, textBeforeCursor.length - currentWord.length);
    
    // Replace with Hassaniya term
    const newText = textWithoutCurrentWord + term.hassaniyaTerm + " " + textAfterCursor;
    setTranslation(newText);
    
    // Track approved term usage
    setApprovedTermsUsed(prev => prev + 1);
    
    // Set cursor position after the inserted term
    setTimeout(() => {
      if (textareaRefCallback.current) {
        const newCursorPosition = textWithoutCurrentWord.length + term.hassaniyaTerm.length + 1;
        textareaRefCallback.current.setSelectionRange(newCursorPosition, newCursorPosition);
        textareaRefCallback.current.focus();
      }
    }, 0);
    
    setShowSuggestions(false);
  };

  // Mutations
  const updateMutation = useMutation({
    mutationFn: async (data: { id: number; targetText?: string; status?: string }) => {
      const res = await apiRequest("PATCH", `/api/work-items/${data.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-work"] });
      setLastSaved(new Date());
      setIsSaving(false);
      toast({
        title: "تم الحفظ بنجاح",
        description: "تم حفظ الترجمة بنجاح",
      });
    },
    onError: () => {
      setIsSaving(false);
      toast({
        title: "خطأ",
        description: "فشل في حفظ الترجمة",
        variant: "destructive",
      });
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: { id: number; targetText: string }) => {
      const res = await apiRequest("PATCH", `/api/work-items/${data.id}`, {
        targetText: data.targetText,
        status: "in_qa",
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-work"] });
      
      // Show word suggestion dialog
      if (currentItem) {
        setCompletedWorkItem({
          sourceText: currentItem.sourceText,
          targetText: translation,
          id: currentItem.id
        });
        setShowWordSuggestionDialog(true);
      }
      
      // Update words completed
      setWordsCompleted(prev => prev + 1);
      
      setTranslation("");
      toast({
        title: "تم الإرسال بنجاح",
        description: "تم إرسال الترجمة للمراجعة",
      });
      // Move to next item
      if (currentItemIndex < workItems.length - 1) {
        setCurrentItemIndex(currentItemIndex + 1);
      }
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في إرسال الترجمة",
        variant: "destructive",
      });
    },
  });

  // Helper functions
  const handleSaveDraft = () => {
    if (!currentItem || !translation.trim()) return;
    
    setIsSaving(true);
    updateMutation.mutate({
      id: currentItem.id,
      targetText: translation,
    });
  };

  const handleSubmitForQA = () => {
    if (!currentItem || !translation.trim()) return;
    
    submitMutation.mutate({
      id: currentItem.id,
      targetText: translation,
    });
  };

  const handlePreviousItem = () => {
    if (currentItemIndex > 0) {
      setCurrentItemIndex(currentItemIndex - 1);
      setTranslation(workItems[currentItemIndex - 1]?.targetText || "");
    }
  };

  const handleNextItem = () => {
    if (currentItemIndex < workItems.length - 1) {
      setCurrentItemIndex(currentItemIndex + 1);
      setTranslation(workItems[currentItemIndex + 1]?.targetText || "");
    }
  };

  // Auto-save functionality
  useEffect(() => {
    if (!currentItem || !translation.trim() || translation === currentItem.targetText) {
      return;
    }

    const autoSaveTimer = setTimeout(() => {
      setIsSaving(true);
      updateMutation.mutate({
        id: currentItem.id,
        targetText: translation,
      });
    }, 3000); // Auto-save after 3 seconds of no typing

    return () => clearTimeout(autoSaveTimer);
  }, [translation, currentItem]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveDraft();
      }
      // Ctrl/Cmd + Enter to submit
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSubmitForQA();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [translation, currentItem]);

  // Initialize translation when item changes
  useEffect(() => {
    if (currentItem) {
      setTranslation(currentItem.targetText || '');
    }
  }, [currentItem]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--project-background)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--project-primary)] mx-auto mb-4"></div>
          <p className="text-[var(--project-text-secondary)] arabic-text">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!workItems.length) {
    return (
      <div className="min-h-screen bg-[var(--project-background)] flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <BookOpen className="w-12 h-12 text-[var(--project-text-secondary)] mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[var(--project-text-primary)] mb-2 arabic-text">
              لا توجد مهام ترجمة
            </h3>
            <p className="text-[var(--project-text-secondary)] arabic-text mb-4">
              لم يتم تعيين أي مهام ترجمة لك حالياً
            </p>
            <Button onClick={() => setLocation('/dashboard')} className="arabic-text">
              العودة للوحة التحكم
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progress = ((currentItemIndex + 1) / workItems.length) * 100;

  return (
    <div className="mobile-workspace min-h-screen bg-[var(--project-background)]">
      {/* Mobile Header */}
      <div className="mobile-header sticky top-0 z-50 bg-white border-b border-[var(--project-border)] shadow-sm mobile-safe-area-top">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="mobile-touch-target p-2">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 mobile-sheet">
                <div className="py-4">
                  <h3 className="text-lg font-medium mb-4 arabic-text">قائمة المهام</h3>
                  <ScrollArea className="h-[calc(100vh-120px)]">
                    {workItems.map((item, index) => (
                      <div
                        key={item.id}
                        className={`mobile-card p-3 rounded-lg mb-2 cursor-pointer transition-colors mobile-fade-in ${
                          index === currentItemIndex
                            ? 'bg-[var(--project-primary)]/10 border border-[var(--project-primary)]/20'
                            : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                        onClick={() => {
                          setCurrentItemIndex(index);
                          setIsMenuOpen(false);
                        }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium arabic-text">
                            مهمة {index + 1}
                          </span>
                          <Badge
                            variant={item.status === 'completed' ? 'default' : 'secondary'}
                            className="mobile-badge text-xs"
                          >
                            {item.status === 'pending' && 'في الانتظار'}
                            {item.status === 'in_progress' && 'قيد التنفيذ'}
                            {item.status === 'completed' && 'مكتملة'}
                            {item.status === 'qa_review' && 'قيد المراجعة'}
                          </Badge>
                        </div>
                        <p className="text-xs text-[var(--project-text-secondary)] arabic-text line-clamp-2">
                          {item.sourceText.substring(0, 80)}...
                        </p>
                      </div>
                    ))}
                  </ScrollArea>
                </div>
              </SheetContent>
            </Sheet>
            
            <div className="text-center">
              <h1 className="text-lg font-medium text-[var(--project-text-primary)] arabic-text">
                مساحة الترجمة
              </h1>
              <p className="text-xs text-[var(--project-text-secondary)] arabic-text">
                مهمة {currentItemIndex + 1} من {workItems.length}
              </p>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/dashboard')}
            className="mobile-touch-target p-2"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        {/* Progress Bar */}
        <div className="px-4 pb-2">
          <Progress value={progress} className="mobile-progress h-1" />
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 pb-20 mobile-safe-area-left mobile-safe-area-right">
        {/* Style Tag Info */}
        {currentItem?.styleTag && (
          <Card className="mobile-card mb-4 mobile-fade-in">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-[var(--project-primary)]/10 rounded-lg">
                  <Target className="w-4 h-4 text-[var(--project-primary)]" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="mobile-badge bg-[var(--project-primary)]/20 text-[var(--project-primary)]">
                      {currentItem.styleTag.name}
                    </Badge>
                  </div>
                  <p className="text-sm text-[var(--project-text-primary)] arabic-text mb-1">
                    {currentItem.styleTag.description}
                  </p>
                  <p className="text-xs text-[var(--project-text-secondary)] arabic-text">
                    {currentItem.styleTag.guidelines}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mobile Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
          <TabsList className="mobile-tabs grid w-full grid-cols-2">
            <TabsTrigger value="translate" className="mobile-tab-trigger arabic-text">ترجمة</TabsTrigger>
            <TabsTrigger value="source" className="mobile-tab-trigger arabic-text">النص المصدر</TabsTrigger>
          </TabsList>
          
          <TabsContent value="source" className="mt-4">
            <Card className="mobile-card mobile-fade-in">
              <CardHeader className="pb-3">
                <h3 className="font-medium text-[var(--project-text-primary)] arabic-text">
                  النص المصدر (العربية الفصحى)
                </h3>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <p className="text-[var(--project-text-primary)] leading-relaxed arabic-text" dir="rtl">
                    {currentItem.sourceText}
                  </p>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="translate" className="mt-4">
            <Card className="mobile-card mobile-fade-in">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-[var(--project-text-primary)] arabic-text">
                    الترجمة (الحسانية)
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsSourceVisible(!isSourceVisible)}
                    className="mobile-touch-target p-2"
                  >
                    {isSourceVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Source Text Preview (Collapsible) */}
                {isSourceVisible && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg mobile-fade-in">
                    <p className="text-sm text-[var(--project-text-secondary)] arabic-text line-clamp-3" dir="rtl">
                      {currentItem.sourceText}
                    </p>
                  </div>
                )}
                
                {/* Translation Textarea */}
                <Textarea
                  ref={textareaRefCallback}
                  value={translation}
                  onChange={(e) => handleTranslationChange(e.target.value)}
                  placeholder="أدخل الترجمة بلهجة الحسانية هنا..."
                  className="mobile-textarea min-h-[200px] border-[var(--project-border)] focus:ring-2 focus:ring-[var(--project-primary)] focus:border-transparent arabic-text resize-none text-base"
                  dir="rtl"
                />
                
                {/* Character Count */}
                <div className="flex justify-between items-center mt-2 text-xs text-[var(--project-text-secondary)]">
                  <span className="arabic-text">عدد الأحرف: {translation.length}</span>
                  <span className="arabic-text">الكلمات: {translation.trim().split(/\s+/).filter(word => word.length > 0).length}</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Fixed Bottom Action Bar */}
      <div className="mobile-bottom-bar fixed bottom-0 left-0 right-0 bg-white border-t border-[var(--project-border)] shadow-lg mobile-safe-area-bottom">
        <div className="p-4">
          {/* Navigation Controls */}
          <div className="flex items-center justify-between mb-3">
            <Button
              onClick={handlePreviousItem}
              disabled={currentItemIndex === 0}
              variant="outline"
              size="sm"
              className="flex-1 mr-2 mobile-touch-target"
            >
              <ArrowRight className="w-4 h-4 ml-1" />
              <span className="arabic-text">السابق</span>
            </Button>
            
            <div className="px-4 py-2 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-[var(--project-text-primary)] arabic-text">
                {currentItemIndex + 1} / {workItems.length}
              </span>
            </div>
            
            <Button
              onClick={handleNextItem}
              disabled={currentItemIndex === workItems.length - 1}
              variant="outline"
              size="sm"
              className="flex-1 ml-2 mobile-touch-target"
            >
              <span className="arabic-text">التالي</span>
              <ArrowLeft className="w-4 h-4 mr-1" />
            </Button>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleSaveDraft}
              disabled={!translation.trim() || updateMutation.isPending}
              variant="outline"
              className="flex-1 arabic-text mobile-touch-target"
            >
              <Save className="w-4 h-4 ml-2" />
              حفظ مسودة
            </Button>
            <Button
              onClick={handleSubmitForQA}
              disabled={!translation.trim() || submitMutation.isPending}
              className="flex-1 btn-primary arabic-text mobile-touch-target"
            >
              <Send className="w-4 h-4 ml-2" />
              إرسال للمراجعة
            </Button>
          </div>
        </div>
      </div>

      {/* Feature Components */}
      <FeatureGate featureKey="approved_terms">
        <ApprovedTermsSuggestions
          searchQuery={suggestionQuery}
          onSelectTerm={handleSelectTerm}
          position={suggestionPosition}
          isVisible={showSuggestions}
          onClose={() => setShowSuggestions(false)}
        />
      </FeatureGate>
      
      <FeatureGate featureKey="contextual_word_assistant">
        <ContextualWordAssistant
          styleTag={currentItem?.styleTag}
          currentText={translation}
          onWordSelect={setTranslation}
          textareaRef={textareaRefCallback.current}
        />
      </FeatureGate>
      
      <FeatureGate featureKey="word_suggestions">
        {completedWorkItem && (
          <WordSuggestionDialog
            open={showWordSuggestionDialog}
            onClose={() => setShowWordSuggestionDialog(false)}
            sourceText={completedWorkItem.sourceText}
            translatedText={completedWorkItem.targetText}
            workItemId={completedWorkItem.id}
          />
        )}
      </FeatureGate>
      
      <FeatureGate featureKey="contextual_hints">
        <ContextualHints
          currentWord={currentWord}
          translationLength={translation.length}
          approvedTermsCount={approvedTermsUsed}
          timeSpent={Math.floor((Date.now() - sessionStartTime) / 1000)}
          wordsCompleted={wordsCompleted}
          hasUnapprovedTerms={hasUnapprovedTerms}
          styleTag={currentItem?.styleTag?.name}
        />
      </FeatureGate>
    </div>
  );
}