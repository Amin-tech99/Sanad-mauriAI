import { Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMobileMenu } from "@/hooks/use-mobile-menu";

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  const { open } = useMobileMenu();
  
  return (
    <header className="bg-white border-b border-[var(--project-border)] px-4 lg:px-6 py-3 lg:py-4">
      <div className="flex items-center justify-between">
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={open}
          className="lg:hidden p-2"
        >
          <Menu className="h-6 w-6" />
        </Button>
        
        {/* Title - centered on mobile */}
        <h1 className="text-lg lg:text-xl font-bold text-[var(--project-text-primary)] arabic-text flex-1 lg:flex-none text-center lg:text-right">
          {title}
        </h1>
        
        {/* Notification Button */}
        <div className="flex items-center space-x-2 lg:space-x-4 space-x-reverse">
          <Button variant="ghost" size="sm" className="relative p-2">
            <Bell className="w-5 h-5 text-[var(--project-text-secondary)]" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-[var(--project-error)] rounded-full"></span>
          </Button>
        </div>
      </div>
    </header>
  );
}
