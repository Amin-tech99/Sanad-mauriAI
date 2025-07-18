import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Lightbulb, 
  AlertCircle, 
  CheckCircle, 
  TrendingUp,
  Sparkles,
  Target,
  Clock,
  BookOpen,
  Award,
  MessageSquare,
  ThumbsUp,
  X,
  ChevronRight,
  Info
} from "lucide-react";

interface Hint {
  id: string;
  type: 'tip' | 'warning' | 'success' | 'progress' | 'achievement';
  icon: React.ReactNode;
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  priority?: 'low' | 'medium' | 'high';
}

interface ContextualHintsProps {
  currentWord?: string;
  translationLength: number;
  approvedTermsCount: number;
  timeSpent: number;
  wordsCompleted: number;
  hasUnapprovedTerms: boolean;
  styleTag?: string;
}

export default function ContextualHints({
  currentWord,
  translationLength,
  approvedTermsCount,
  timeSpent,
  wordsCompleted,
  hasUnapprovedTerms,
  styleTag
}: ContextualHintsProps) {
  const [hints, setHints] = useState<Hint[]>([]);
  const [dismissedHints, setDismissedHints] = useState<Set<string>>(new Set());
  const [currentHintIndex, setCurrentHintIndex] = useState(0);

  // Generate contextual hints based on current state
  useEffect(() => {
    const newHints: Hint[] = [];

    // Progress tracking
    if (wordsCompleted > 0 && wordsCompleted % 10 === 0) {
      newHints.push({
        id: `milestone-${wordsCompleted}`,
        type: 'achievement',
        icon: <Award className="w-5 h-5 text-yellow-500" />,
        title: "إنجاز رائع! 🎉",
        message: `لقد أكملت ${wordsCompleted} كلمة! استمر في العمل الممتاز.`,
        priority: 'high'
      });
    }

    // Consistency warnings
    if (hasUnapprovedTerms) {
      newHints.push({
        id: 'unapproved-terms',
        type: 'warning',
        icon: <AlertCircle className="w-5 h-5 text-orange-500" />,
        title: "تنبيه: مصطلحات غير معتمدة",
        message: "يحتوي النص على كلمات قد تحتاج لمراجعة. تحقق من المصطلحات المعتمدة.",
        action: {
          label: "عرض المصطلحات",
          onClick: () => console.log("Show approved terms")
        },
        priority: 'high'
      });
    }

    // Style-specific tips
    if (styleTag === 'formal') {
      newHints.push({
        id: 'formal-style-tip',
        type: 'tip',
        icon: <BookOpen className="w-5 h-5 text-blue-500" />,
        title: "نصيحة: الأسلوب الرسمي",
        message: "تذكر استخدام صيغ الاحترام والكلمات الرسمية المناسبة للسياق.",
        priority: 'medium'
      });
    } else if (styleTag === 'informal') {
      newHints.push({
        id: 'informal-style-tip',
        type: 'tip',
        icon: <MessageSquare className="w-5 h-5 text-green-500" />,
        title: "نصيحة: الأسلوب غير الرسمي",
        message: "يمكنك استخدام لغة أكثر بساطة وودية في هذا النص.",
        priority: 'medium'
      });
    }

    // Time-based encouragement
    if (timeSpent > 0 && timeSpent % 600 === 0) { // Every 10 minutes
      newHints.push({
        id: `time-break-${timeSpent}`,
        type: 'tip',
        icon: <Clock className="w-5 h-5 text-purple-500" />,
        title: "وقت للراحة",
        message: "لقد عملت لمدة 10 دقائق. خذ استراحة قصيرة لتجديد نشاطك!",
        priority: 'medium'
      });
    }

    // Quality tips based on translation length
    if (translationLength > 200 && translationLength % 200 === 0) {
      newHints.push({
        id: `quality-check-${translationLength}`,
        type: 'tip',
        icon: <CheckCircle className="w-5 h-5 text-green-500" />,
        title: "تحقق من الجودة",
        message: "راجع ما كتبته للتأكد من التدفق الطبيعي والدقة.",
        priority: 'low'
      });
    }

    // Approved terms usage encouragement
    if (approvedTermsCount > 0) {
      newHints.push({
        id: 'approved-terms-usage',
        type: 'success',
        icon: <ThumbsUp className="w-5 h-5 text-green-500" />,
        title: "ممتاز!",
        message: `استخدمت ${approvedTermsCount} من المصطلحات المعتمدة. هذا يحسن الاتساق.`,
        priority: 'medium'
      });
    }

    // Productivity tips
    const randomTips = [
      {
        id: 'tip-shortcuts',
        message: "اضغط على المصطلحات المقترحة لإدراجها بسرعة في النص.",
        icon: <Sparkles className="w-5 h-5 text-yellow-500" />
      },
      {
        id: 'tip-context',
        message: "انتبه للسياق العام للنص لضمان ترجمة طبيعية ومتدفقة.",
        icon: <Target className="w-5 h-5 text-blue-500" />
      },
      {
        id: 'tip-consistency',
        message: "حافظ على اتساق المصطلحات عبر النص بأكمله.",
        icon: <TrendingUp className="w-5 h-5 text-green-500" />
      }
    ];

    // Add a random tip occasionally
    if (Math.random() < 0.1) { // 10% chance
      const randomTip = randomTips[Math.floor(Math.random() * randomTips.length)];
      newHints.push({
        ...randomTip,
        type: 'tip',
        title: "نصيحة مفيدة",
        priority: 'low'
      });
    }

    // Filter out dismissed hints and update state
    const activeHints = newHints.filter(hint => !dismissedHints.has(hint.id));
    setHints(activeHints);
  }, [currentWord, translationLength, approvedTermsCount, timeSpent, wordsCompleted, hasUnapprovedTerms, styleTag, dismissedHints]);

  const dismissHint = (hintId: string) => {
    setDismissedHints(prev => new Set([...prev, hintId]));
  };

  const nextHint = () => {
    setCurrentHintIndex((prev) => (prev + 1) % hints.length);
  };

  const currentHint = hints[currentHintIndex];

  if (hints.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-6 z-50 max-w-md">
      <AnimatePresence mode="wait">
        {currentHint && (
          <motion.div
            key={currentHint.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <Card className={`
              p-4 shadow-lg border-2 
              ${currentHint.type === 'warning' ? 'border-orange-200 bg-orange-50' : ''}
              ${currentHint.type === 'success' ? 'border-green-200 bg-green-50' : ''}
              ${currentHint.type === 'achievement' ? 'border-yellow-200 bg-yellow-50' : ''}
              ${currentHint.type === 'tip' ? 'border-blue-200 bg-blue-50' : ''}
              ${currentHint.type === 'progress' ? 'border-purple-200 bg-purple-50' : ''}
            `}>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {currentHint.icon}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold text-sm arabic-text">
                      {currentHint.title}
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => dismissHint(currentHint.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <p className="text-sm text-gray-700 arabic-text mb-3">
                    {currentHint.message}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    {currentHint.action && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={currentHint.action.onClick}
                        className="text-xs arabic-text"
                      >
                        {currentHint.action.label}
                      </Button>
                    )}
                    
                    {hints.length > 1 && (
                      <div className="flex items-center gap-2 mr-auto">
                        <Badge variant="secondary" className="text-xs">
                          {currentHintIndex + 1} / {hints.length}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={nextHint}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress indicator */}
      {wordsCompleted > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4"
        >
          <Card className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium arabic-text">تقدم اليوم</span>
                  <span className="text-xs text-gray-600">{wordsCompleted} كلمة</span>
                </div>
                <Progress value={Math.min((wordsCompleted / 100) * 100, 100)} className="h-2" />
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}