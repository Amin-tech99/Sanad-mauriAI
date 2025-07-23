import { useAuth } from "@/hooks/use-auth";
import { useFeature } from "@/hooks/use-feature";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useMobileMenu } from "@/hooks/use-mobile-menu";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { 
  BarChart3, 
  BookOpen, 
  FileText, 
  Package, 
  Users, 
  Download, 
  ClipboardList, 
  Edit, 
  CheckCircle, 
  Search,
  Languages,
  Tag,
  Library,
  Shield,
  LogOut,
  X,
  MessageCircle,
  Home,
  Settings,
  Briefcase,
  HelpCircle,
  Smartphone
} from "lucide-react";

const roleNavigation = {
  admin: [
    {
      section: "الرئيسية",
      items: [
        { icon: Home, text: "لوحة التحكم", path: "/dashboard" },
        { icon: BarChart3, text: "التحليلات المتقدمة", path: "/analytics" },
      ]
    },
    {
      section: "إدارة النظام",
      items: [
        { icon: Settings, text: "التحكم في المنصة", path: "/platform-control" },
        { icon: Users, text: "إدارة المستخدمين", path: "/users" },
      ]
    },
    {
      section: "إدارة المحتوى والمشاريع",
      items: [
        { icon: BookOpen, text: "مكتبة المصادر", path: "/sources" },
        { icon: FileText, text: "نماذج التعليمات", path: "/templates" },
        { icon: Briefcase, text: "إنشاء حزم العمل", path: "/work-packets" },
      ]
    },
    {
      section: "أدوات اللغة والترجمة",
      items: [
        { icon: Languages, text: "المصطلحات المعتمدة", path: "/approved-terms" },
        { icon: Tag, text: "تصنيفات الأسلوب", path: "/style-tags" },
        { icon: Library, text: "المعجم السياقي", path: "/contextual-lexicon" },
        { icon: HelpCircle, text: "اقتراحات الكلمات", path: "/word-suggestions" },
      ]
    },
    {
      section: "التواصل والمراجعة",
      items: [
        { icon: MessageCircle, text: "إدارة المحادثات", path: "/conversations" },
        { icon: CheckCircle, text: "مراجعة الجودة", path: "/qa-review" },
        { icon: ClipboardList, text: "قائمة المهام", path: "/qa-queue" },
      ]
    },
    {
      section: "البيانات والتقارير",
      items: [
        { icon: Download, text: "تصدير البيانات", path: "/export" },
      ]
    }
  ],
  translator: [
    {
      section: "مساحة العمل",
      items: [
        { icon: Home, text: "قائمة مهامي", path: "/my-work" },
        { icon: Edit, text: "مساحة الترجمة", path: "/workspace" },
        { icon: Smartphone, text: "مساحة العمل المحمولة", path: "/mobile-workspace" },
      ]
    },
    {
      section: "أدوات المساعدة",
      items: [
        { icon: Languages, text: "المصطلحات المعتمدة", path: "/approved-terms" },
        { icon: Library, text: "المعجم السياقي", path: "/contextual-lexicon" },
        { icon: MessageCircle, text: "المحادثات", path: "/conversations" },
      ]
    }
  ],
  qa: [
    {
      section: "مراجعة الجودة",
      items: [
        { icon: Home, text: "مهام المراجعة", path: "/qa-queue" },
        { icon: CheckCircle, text: "مساحة المراجعة", path: "/qa-review" },
        { icon: ClipboardList, text: "قائمة المهام المكتملة", path: "/my-work" },
      ]
    },
    {
      section: "أدوات المراجعة",
      items: [
        { icon: Languages, text: "المصطلحات المعتمدة", path: "/approved-terms" },
        { icon: Library, text: "المعجم السياقي", path: "/contextual-lexicon" },
        { icon: HelpCircle, text: "اقتراحات الكلمات", path: "/word-suggestions" },
        { icon: MessageCircle, text: "المحادثات", path: "/conversations" },
      ]
    }
  ],
};

export default function Sidebar() {
  const { user, logoutMutation } = useAuth();
  const [location, setLocation] = useLocation();
  const { isOpen, close } = useMobileMenu();
  const { isFeatureEnabled } = useFeature();

  if (!user) return null;

  // Get navigation for user role (temporarily show all items)
  const navigation = roleNavigation[user.role as keyof typeof roleNavigation] || [];
  

  
  // Feature filtering temporarily disabled to show all navigation options
  // const filteredNavigation = baseNavigation.map((section) => ({
  //   ...section,
  //   items: section.items.filter((item) => {
  //     const featureMap: Record<string, string> = {
  //       "/users": "user_management",
  //       "/sources": "source_management",
  //       "/templates": "template_management",
  //       "/work-packets": "work_packet_creation",
  //       "/approved-terms": "approved_terms",
  //       "/style-tags": "style_tags",
  //       "/contextual-lexicon": "contextual_lexicon",
  //       "/word-suggestions": "word_suggestions",
  //       "/export": "data_export",
  //       "/my-work": "translator_workspace",
  //       "/workspace": "translator_workspace",
  //       "/qa-queue": "qa_review",
  //       "/qa-review": "qa_review",
  //       "/platform-control": "platform_control",
  //       "/": "dashboard_analytics",
  //     };
  //     
  //     const featureKey = featureMap[item.path];
  //     return !featureKey || isFeatureEnabled(featureKey);
  //   })
  // })).filter(section => section.items.length > 0);

  const getRoleName = (role: string) => {
    const roleNames = {
      admin: "مدير النظام",
      translator: "مترجم", 
      qa: "مراجع الجودة",
    };
    return roleNames[role as keyof typeof roleNames] || role;
  };

  // Close mobile menu on navigation
  useEffect(() => {
    close();
  }, [location]);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={close}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "fixed top-0 right-0 h-full w-72 bg-[var(--project-sidebar)] border-l border-[var(--project-border)] z-50 shadow-xl flex flex-col",
        "transform transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}>
        {/* Close Button - Always visible */}
        <Button
          variant="ghost"
          size="icon"
          onClick={close}
          className="absolute top-4 left-4"
          title="إغلاق القائمة الجانبية"
        >
          <X className="h-5 w-5" />
        </Button>
        
        {/* Logo Section */}
        <div className="p-4 border-b border-[var(--project-border)]">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="bg-gradient-to-br from-[var(--project-primary)] to-[var(--project-primary)]/70 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg">
              <Languages className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-base text-[var(--project-text-primary)] arabic-text">
                مشروع سند
              </h2>
              <p className="text-xs text-[var(--project-text-secondary)] arabic-text">
                منصة البيانات اللغوية
              </p>
            </div>
          </div>
        </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4" style={{ maxHeight: 'calc(100vh - 200px)' }}>
        <div className="space-y-1 pb-4">
          {navigation.map((section, sectionIndex) => (
            <div key={sectionIndex} className="mb-3">
              <div className="px-3 py-1 mb-1">
                <h3 className="text-xs font-bold text-[var(--project-text-secondary)] uppercase arabic-text tracking-wider">
                  {section.section}
                </h3>
                <div className="w-12 h-0.5 bg-gradient-to-r from-[var(--project-primary)] to-[var(--project-primary)]/30 mt-1 rounded-full"></div>
              </div>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive = location === item.path;
                  
                  return (
                    <Button
                      key={item.path}
                      onClick={() => setLocation(item.path)}
                      variant="ghost"
                      className={`w-full justify-start text-right flex items-center space-x-3 space-x-reverse px-3 py-2 rounded-lg transition-all duration-200 arabic-text ${
                        isActive 
                          ? "text-[var(--project-primary)] bg-gradient-to-r from-[var(--project-primary)]/10 to-[var(--project-primary)]/5 border-r-3 border-[var(--project-primary)] shadow-sm" 
                          : "text-[var(--project-text-secondary)] hover:text-[var(--project-text-primary)] hover:bg-[var(--project-primary)]/5 hover:shadow-sm"
                      }`}
                    >
                      <div className={`p-1 rounded-md ${isActive ? 'bg-[var(--project-primary)]/10' : ''}`}>
                        <item.icon className="w-5 h-5" />
                      </div>
                      <span className="text-sm">{item.text}</span>
                    </Button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-[var(--project-border)] bg-[var(--project-sidebar)]">
        <div className="bg-white rounded-lg p-3 shadow-sm border border-[var(--project-border)]/50">
          <div className="flex items-center space-x-3 space-x-reverse mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[var(--project-primary)] to-[var(--project-primary)]/70 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-[var(--project-text-primary)] arabic-text">
                {user.username}
              </p>
              <p className="text-xs text-[var(--project-text-secondary)] arabic-text">
                {getRoleName(user.role)}
              </p>
            </div>
          </div>
          <Button
            onClick={() => logoutMutation.mutate()}
            variant="ghost"
            className="w-full justify-start text-right flex items-center space-x-3 space-x-reverse px-3 py-2 text-[var(--project-text-secondary)] hover:text-[var(--project-error)] hover:bg-[var(--project-error)]/5 rounded-lg transition-all duration-200 arabic-text"
            disabled={logoutMutation.isPending}
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">تسجيل الخروج</span>
          </Button>
        </div>
      </div>
    </div>
    </>
  );
}
