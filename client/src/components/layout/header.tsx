import { Menu } from "lucide-react";
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
        {/* Menu Button - Always visible */}
        <Button
          variant="ghost"
          size="icon"
          onClick={open}
          className="p-2"
          title="فتح القائمة الجانبية"
        >
          <Menu className="h-6 w-6" />
        </Button>
        
        {/* Title - centered on mobile */}
        <h1 className="text-lg lg:text-xl font-bold text-[var(--project-text-primary)] arabic-text flex-1 lg:flex-none text-center lg:text-right">
          {title}
        </h1>
        
        
      </div>
    </header>
  );
}
