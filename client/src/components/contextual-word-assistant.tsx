import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info, Languages } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { StyleTag } from "@shared/schema";

interface ContextualWordAssistantProps {
  styleTag?: StyleTag | null;
  currentText: string;
  onWordSelect: (word: string) => void;
  textareaRef: HTMLTextAreaElement | null;
}

interface WordAlternative {
  word: string;
  styleTags: { id: number; name: string }[];
}

export default function ContextualWordAssistant({
  styleTag,
  currentText,
  onWordSelect,
  textareaRef
}: ContextualWordAssistantProps) {
  const [detectedWord, setDetectedWord] = useState<string>("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Fetch word alternatives based on detected word
  const { data: alternatives = [] } = useQuery<WordAlternative[]>({
    queryKey: ["/api/contextual-lexicon/check", detectedWord],
    queryFn: async () => {
      if (!detectedWord) return [];
      const res = await apiRequest("GET", `/api/contextual-lexicon/check?word=${encodeURIComponent(detectedWord)}`);
      return res.json();
    },
    enabled: !!detectedWord && detectedWord.length > 1,
  });

  // Filter alternatives based on current style tag
  const relevantAlternatives = styleTag
    ? alternatives.filter(alt => 
        alt.styleTags.some(tag => tag.id === styleTag.id)
      )
    : alternatives;

  // Detect Arabic words at cursor position
  useEffect(() => {
    if (!textareaRef) return;

    const detectWordAtCursor = () => {
      const cursorPos = textareaRef.selectionStart;
      const text = textareaRef.value;
      
      // Find word boundaries around cursor
      let start = cursorPos;
      let end = cursorPos;
      
      // Move back to find word start
      while (start > 0 && /[\u0600-\u06FF]/.test(text[start - 1])) {
        start--;
      }
      
      // Move forward to find word end
      while (end < text.length && /[\u0600-\u06FF]/.test(text[end])) {
        end++;
      }
      
      const word = text.substring(start, end);
      
      if (word && /[\u0600-\u06FF]/.test(word)) {
        setDetectedWord(word);
        
        // Calculate position for suggestions
        const rect = textareaRef.getBoundingClientRect();
        const lineHeight = parseInt(window.getComputedStyle(textareaRef).lineHeight);
        const lines = text.substring(0, cursorPos).split('\n');
        const currentLineNumber = lines.length - 1;
        const currentLineOffset = lines[currentLineNumber].length;
        
        setPosition({
          top: rect.top + (currentLineNumber + 1) * lineHeight + 10,
          left: rect.left + (currentLineOffset * 8) // Approximate character width
        });
        
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
        setDetectedWord("");
      }
    };

    const handleTextChange = () => {
      detectWordAtCursor();
    };

    const handleClick = () => {
      detectWordAtCursor();
    };

    textareaRef.addEventListener('input', handleTextChange);
    textareaRef.addEventListener('click', handleClick);
    textareaRef.addEventListener('keyup', handleTextChange);

    return () => {
      textareaRef.removeEventListener('input', handleTextChange);
      textareaRef.removeEventListener('click', handleClick);
      textareaRef.removeEventListener('keyup', handleTextChange);
    };
  }, [textareaRef, currentText]);

  // Close suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleWordSelect = (word: string) => {
    if (textareaRef) {
      const cursorPos = textareaRef.selectionStart;
      const text = textareaRef.value;
      
      // Find word boundaries
      let start = cursorPos;
      let end = cursorPos;
      
      while (start > 0 && /[\u0600-\u06FF]/.test(text[start - 1])) {
        start--;
      }
      
      while (end < text.length && /[\u0600-\u06FF]/.test(text[end])) {
        end++;
      }
      
      // Replace the word
      const newText = text.substring(0, start) + word + text.substring(end);
      onWordSelect(newText);
      
      // Set cursor position after the new word
      setTimeout(() => {
        textareaRef.focus();
        textareaRef.setSelectionRange(start + word.length, start + word.length);
      }, 10);
    }
    
    setShowSuggestions(false);
  };

  if (!styleTag || !showSuggestions || relevantAlternatives.length === 0) {
    return null;
  }

  return (
    <div
      ref={suggestionsRef}
      className="fixed z-50"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        maxWidth: '300px'
      }}
    >
      <Card className="p-3 shadow-lg">
        <div className="mb-2 flex items-center gap-2">
          <Languages className="w-4 h-4 text-[var(--project-primary)]" />
          <span className="text-sm font-medium arabic-text">
            بدائل حسب أسلوب {styleTag.name}
          </span>
        </div>
        
        <div className="space-y-2">
          {relevantAlternatives.map((alt, index) => (
            <button
              key={index}
              onClick={() => handleWordSelect(alt.word)}
              className="w-full text-right p-2 rounded hover:bg-gray-100 transition-colors flex items-center justify-between"
            >
              <Badge variant="secondary" className="text-xs">
                {alt.styleTags.map(t => t.name).join(", ")}
              </Badge>
              <span className="font-medium arabic-text">{alt.word}</span>
            </button>
          ))}
        </div>
        
        <div className="mt-3 pt-3 border-t">
          <div className="flex items-start gap-2">
            <Info className="w-3 h-3 text-[var(--project-text-secondary)] mt-0.5" />
            <p className="text-xs text-[var(--project-text-secondary)] arabic-text">
              اضغط على الكلمة لاستبدال "{detectedWord}"
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}