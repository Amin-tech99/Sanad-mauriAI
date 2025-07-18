import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, X } from "lucide-react";
import type { ApprovedTerm } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

interface ApprovedTermsSuggestionsProps {
  searchQuery: string;
  onSelectTerm: (term: ApprovedTerm) => void;
  position?: { top: number; left: number };
  isVisible: boolean;
  onClose: () => void;
}

export default function ApprovedTermsSuggestions({
  searchQuery,
  onSelectTerm,
  position,
  isVisible,
  onClose,
}: ApprovedTermsSuggestionsProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const { data: suggestions = [], isLoading } = useQuery({
    queryKey: ["/api/approved-terms/search", searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return [];
      const response = await apiRequest("GET", `/api/approved-terms/search?q=${encodeURIComponent(searchQuery)}`);
      return response.json();
    },
    enabled: isVisible && searchQuery.length >= 2,
  });

  const incrementMutation = useMutation({
    mutationFn: async (termId: number) => {
      await apiRequest("POST", `/api/approved-terms/${termId}/increment`);
    },
  });

  useEffect(() => {
    setSelectedIndex(0);
  }, [suggestions]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isVisible || suggestions.length === 0) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % suggestions.length);
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
          break;
        case "Enter":
          e.preventDefault();
          const selectedTerm = suggestions[selectedIndex];
          if (selectedTerm) {
            handleSelectTerm(selectedTerm);
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isVisible, suggestions, selectedIndex, onClose]);

  const handleSelectTerm = (term: ApprovedTerm) => {
    onSelectTerm(term);
    incrementMutation.mutate(term.id);
    onClose();
  };

  if (!isVisible || suggestions.length === 0) return null;

  return (
    <Card
      ref={suggestionsRef}
      className="absolute z-50 w-96 max-h-64 overflow-y-auto shadow-lg border-[var(--project-border)] bg-white"
      style={{
        top: position?.top ? `${position.top}px` : "auto",
        left: position?.left ? `${position.left}px` : "auto",
      }}
    >
      <div className="p-2">
        <div className="flex items-center justify-between mb-2 px-2">
          <div className="flex items-center space-x-2 text-sm text-[var(--project-text-secondary)]">
            <Sparkles className="w-4 h-4 text-[var(--project-primary)]" />
            <span className="arabic-text">المصطلحات المعتمدة</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-6 w-6"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {isLoading ? (
          <div className="p-4 text-center text-sm text-[var(--project-text-secondary)]">
            جاري البحث...
          </div>
        ) : (
          <div className="space-y-1">
            {suggestions.map((term, index) => (
              <button
                key={term.id}
                onClick={() => handleSelectTerm(term)}
                className={cn(
                  "w-full p-3 text-right rounded-md transition-colors",
                  "hover:bg-[var(--project-primary)]/5",
                  selectedIndex === index && "bg-[var(--project-primary)]/10"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-[var(--project-text-primary)] arabic-text">
                      {term.hassaniyaTerm}
                    </div>
                    <div className="text-sm text-[var(--project-text-secondary)] arabic-text">
                      {term.arabicTerm}
                    </div>
                    {term.context && (
                      <div className="text-xs text-[var(--project-text-secondary)] mt-1 arabic-text">
                        السياق: {term.context}
                      </div>
                    )}
                  </div>
                  {term.category && (
                    <span className="text-xs bg-[var(--project-primary)]/10 text-[var(--project-primary)] px-2 py-1 rounded arabic-text">
                      {term.category}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}