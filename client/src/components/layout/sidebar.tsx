import { useAuth } from "@/hooks/use-auth";
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
  LogOut,
  X
} from "lucide-react";

const roleNavigation = {
  admin: [
    { icon: BarChart3, text: "لوحة التحكم", path: "/" },
    { icon: BookOpen, text: "مكتبة المصادر", path: "/sources" },
    { icon: FileText, text: "نماذج التعليمات", path: "/templates" },
    { icon: Package, text: "إنشاء حزم العمل", path: "/work-packets" },
    { icon: Users, text: "إدارة المستخدمين", path: "/users" },
    { icon: Languages, text: "المصطلحات المعتمدة", path: "/approved-terms" },
    { icon: Download, text: "تصدير البيانات", path: "/export" },
  ],
  translator: [
    { icon: ClipboardList, text: "قائمة مهامي", path: "/my-work" },
    { icon: Edit, text: "مساحة العمل", path: "/workspace" },
  ],
  qa: [
    { icon: CheckCircle, text: "مهام المراجعة", path: "/qa-queue" },
    { icon: Search, text: "مراجعة الجودة", path: "/qa-review" },
  ],
};

export default function Sidebar() {
  const { user, logoutMutation } = useAuth();
  const [location, setLocation] = useLocation();
  const { isOpen, close } = useMobileMenu();

  if (!user) return null;

  const navigation = roleNavigation[user.role as keyof typeof roleNavigation] || [];

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
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={close}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "fixed top-0 right-0 h-full w-64 bg-[var(--project-sidebar)] border-l border-[var(--project-border)] z-50",
        "transform transition-transform duration-300 ease-in-out",
        "lg:translate-x-0",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}>
        {/* Mobile Close Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={close}
          className="absolute top-4 left-4 lg:hidden"
        >
          <X className="h-5 w-5" />
        </Button>
        
        {/* Logo Section */}
        <div className="p-6 border-b border-[var(--project-border)]">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="bg-[var(--project-primary)]/10 w-10 h-10 rounded-full flex items-center justify-center">
            <Languages className="w-5 h-5 text-[var(--project-primary)]" />
          </div>
          <div>
            <h2 className="font-bold text-[var(--project-text-primary)] arabic-text">
              مشروع سند
            </h2>
            <p className="text-xs text-[var(--project-text-secondary)] arabic-text">
              منصة البيانات
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 flex-1">
        <div className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            
            return (
              <Button
                key={item.path}
                onClick={() => setLocation(item.path)}
                variant="ghost"
                className={`w-full justify-start text-right flex items-center space-x-3 space-x-reverse px-4 py-3 transition-colors mb-1 arabic-text ${
                  isActive 
                    ? "text-[var(--project-primary)] bg-[var(--project-primary)]/10" 
                    : "text-[var(--project-text-secondary)] hover:text-[var(--project-text-primary)] hover:bg-[var(--project-primary)]/5"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.text}</span>
              </Button>
            );
          })}
        </div>
      </nav>

      {/* User Section */}
      <div className="absolute bottom-0 right-0 left-0 p-4 border-t border-[var(--project-border)]">
        <div className="flex items-center space-x-3 space-x-reverse mb-3">
          <div className="w-8 h-8 bg-[var(--project-primary)]/20 rounded-full flex items-center justify-center">
            <Users className="w-4 h-4 text-[var(--project-primary)]" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-[var(--project-text-primary)] arabic-text">
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
          className="w-full text-right text-sm text-[var(--project-error)] hover:bg-[var(--project-error)]/10 py-2 px-3 transition-colors arabic-text"
          disabled={logoutMutation.isPending}
        >
          <LogOut className="w-4 h-4 ml-2" />
          تسجيل الخروج
        </Button>
      </div>
    </div>
    </>
  );
}
