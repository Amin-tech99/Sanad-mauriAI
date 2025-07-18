import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  return (
    <header className="bg-white border-b border-[var(--project-border)] px-6 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[var(--project-text-primary)] arabic-text">
          {title}
        </h1>
        <div className="flex items-center space-x-4 space-x-reverse">
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="w-5 h-5 text-[var(--project-text-secondary)]" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-[var(--project-error)] rounded-full"></span>
          </Button>
        </div>
      </div>
    </header>
  );
}
