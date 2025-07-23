import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../hooks/use-auth";
import { useToast } from "../hooks/use-toast";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Checkbox } from "../components/ui/checkbox";
import Sidebar from "../components/layout/sidebar";
import Header from "../components/layout/header";
import { 
  Upload, 
  MessageCircle, 
  User, 
  Bot, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Users,
  CheckSquare,
  Square
} from "lucide-react";
import type { Conversation, ConversationMessage, User as UserType, StyleTag } from "../../../shared/schema";

interface ConversationUpload {
  title: string;
  description: string;
  customerType: string;
  urgencyLevel: string;
  category: string;
  messages: {
    messageType: 'user' | 'agent';
    speakerRole: string;
    originalText: string;
    emotionalTone?: string;
  }[];
}

export default function Conversations() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("upload");
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  // Upload form state
  const [uploadForm, setUploadForm] = useState<ConversationUpload>({
    title: "",
    description: "",
    customerType: "new",
    urgencyLevel: "medium",
    category: "general",
    messages: []
  });
  const [conversationText, setConversationText] = useState("");
  
  // Multi-conversation upload state
  const [showMultiUploadDialog, setShowMultiUploadDialog] = useState(false);
  const [multiConversationText, setMultiConversationText] = useState("");
  const [detectedConversations, setDetectedConversations] = useState<Array<{
    id: string;
    title: string;
    description: string;
    text: string;
    messages: ConversationUpload['messages'];
    selected: boolean;
  }>>([]);
  const [globalSettings, setGlobalSettings] = useState({
    customerType: "new",
    urgencyLevel: "medium",
    category: "general"
  });

  // Assignment form state
  const [selectedTranslator, setSelectedTranslator] = useState<number | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<number | null>(null);

  // Bulk assignment state
  const [selectedConversations, setSelectedConversations] = useState<number[]>([]);
  const [showBulkAssignDialog, setShowBulkAssignDialog] = useState(false);
  const [bulkTranslator, setBulkTranslator] = useState<number | null>(null);
  const [bulkStyle, setBulkStyle] = useState<number | null>(null);

  // Fetch data
  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations"],
  });

  const { data: translators = [] } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
    select: (users) => users.filter(u => u.role === "translator"),
  });

  const { data: styleTags = [] } = useQuery<StyleTag[]>({
    queryKey: ["/api/style-tags"],
  });

  // Parse conversation text into messages
  const parseConversationText = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    const messages: ConversationUpload['messages'] = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('عميل:') || trimmed.startsWith('Customer:') || trimmed.startsWith('المستخدم:')) {
        messages.push({
          messageType: 'user',
          speakerRole: 'customer',
          originalText: trimmed.replace(/^(عميل:|Customer:|المستخدم:)\s*/, ''),
          emotionalTone: 'neutral'
        });
      } else if (trimmed.startsWith('وكيل:') || trimmed.startsWith('Agent:') || trimmed.startsWith('الدعم:')) {
        messages.push({
          messageType: 'agent',
          speakerRole: 'support_agent',
          originalText: trimmed.replace(/^(وكيل:|Agent:|الدعم:)\s*/, '')
        });
      }
    }
    
    return messages;
  };

  // Parse multiple conversations from text
  const parseMultipleConversations = (text: string) => {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const conversations: string[] = [];
    let currentConversation: string[] = [];
    let lastMessageType: 'user' | 'agent' | null = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check if this is a user or agent message
      const isUserMessage = line.startsWith('عميل:') || line.startsWith('Customer:') || line.startsWith('المستخدم:');
      const isAgentMessage = line.startsWith('وكيل:') || line.startsWith('Agent:') || line.startsWith('الدعم:');
      
      if (isUserMessage || isAgentMessage) {
        const currentMessageType = isUserMessage ? 'user' : 'agent';
        
        // If we encounter a user message after having messages, and the last message was also a user message,
        // this might be a new conversation
        if (isUserMessage && lastMessageType === 'user' && currentConversation.length > 0) {
          // Check if there's an agent response between this and the previous user message
          let hasAgentBetween = false;
          for (let j = currentConversation.length - 1; j >= 0; j--) {
            const prevLine = currentConversation[j];
            if (prevLine.startsWith('وكيل:') || prevLine.startsWith('Agent:') || prevLine.startsWith('الدعم:')) {
              hasAgentBetween = true;
              break;
            }
            if (prevLine.startsWith('عميل:') || prevLine.startsWith('Customer:') || prevLine.startsWith('المستخدم:')) {
              break;
            }
          }
          
          // If no agent response between consecutive user messages, start new conversation
          if (!hasAgentBetween) {
            if (currentConversation.length > 0) {
              conversations.push(currentConversation.join('\n'));
              currentConversation = [];
            }
          }
        }
        
        currentConversation.push(line);
        lastMessageType = currentMessageType;
      } else {
        // Handle separators
        if (line.match(/^---+$/) || line.match(/^===+$/) || line.match(/^\*\*\*+$/) || 
            line.match(/^محادثة \d+/i) || line.match(/^conversation \d+/i)) {
          if (currentConversation.length > 0) {
            conversations.push(currentConversation.join('\n'));
            currentConversation = [];
            lastMessageType = null;
          }
        } else {
          // Regular text line, add to current conversation
          if (currentConversation.length > 0) {
            currentConversation.push(line);
          }
        }
      }
    }
    
    // Add the last conversation if it exists
    if (currentConversation.length > 0) {
      conversations.push(currentConversation.join('\n'));
    }
    
    // Also try splitting by multiple empty lines as fallback
    if (conversations.length <= 1) {
      const fallbackConversations = text.split(/\n\s*\n\s*\n/).filter(conv => conv.trim().length > 0);
      if (fallbackConversations.length > 1) {
        conversations.length = 0;
        conversations.push(...fallbackConversations);
      }
    }
    
    // Filter out empty conversations and parse each one
    const parsedConversations = conversations
      .map(conv => conv.trim())
      .filter(conv => conv.length > 0)
      .map((conv, index) => {
        const messages = parseConversationText(conv);
        if (messages.length === 0) return null;
        
        // Generate title from first customer message or use default
        const firstCustomerMessage = messages.find(m => m.messageType === 'user');
        const title = firstCustomerMessage 
          ? firstCustomerMessage.originalText.substring(0, 50) + (firstCustomerMessage.originalText.length > 50 ? '...' : '')
          : `محادثة ${index + 1}`;
        
        // Generate description based on conversation content
        const userMessageCount = messages.filter(m => m.messageType === 'user').length;
        const agentMessageCount = messages.filter(m => m.messageType === 'agent').length;
        const description = `${userMessageCount} رسائل عميل، ${agentMessageCount} رسائل وكيل`;
        
        return {
          id: `conv-${Date.now()}-${index}`,
          title,
          description,
          text: conv,
          messages,
          selected: true // Default to selected
        };
      })
      .filter(conv => conv !== null);
    
    return parsedConversations;
  };

  const handleMultiConversationParse = () => {
    if (!multiConversationText.trim()) {
      toast({ title: "خطأ", description: "يرجى إدخال النص أولاً", variant: "destructive" });
      return;
    }
    
    const conversations = parseMultipleConversations(multiConversationText);
    
    if (conversations.length === 0) {
      toast({ title: "خطأ", description: "لم يتم العثور على محادثات صحيحة", variant: "destructive" });
      return;
    }
    
    setDetectedConversations(conversations);
    toast({ 
      title: "تم اكتشاف المحادثات", 
      description: `تم اكتشاف ${conversations.length} محادثة` 
    });
  };

  const toggleConversationDetectedSelection = (id: string) => {
    setDetectedConversations(prev => 
      prev.map(conv => 
        conv.id === id ? { ...conv, selected: !conv.selected } : conv
      )
    );
  };

  const selectAllDetectedConversations = () => {
    setDetectedConversations(prev => 
      prev.map(conv => ({ ...conv, selected: true }))
    );
  };

  const deselectAllDetectedConversations = () => {
    setDetectedConversations(prev => 
      prev.map(conv => ({ ...conv, selected: false }))
    );
  };

  // Multi-upload mutation
  const multiUploadMutation = useMutation({
    mutationFn: async (conversations: Array<ConversationUpload>) => {
      const promises = conversations.map(conv => 
        fetch("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(conv),
        })
      );
      
      const responses = await Promise.all(promises);
      const failedUploads = responses.filter(r => !r.ok);
      
      if (failedUploads.length > 0) {
        throw new Error(`Failed to upload ${failedUploads.length} conversations`);
      }
      
      return { uploaded: conversations.length };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      toast({ 
        title: "تم رفع المحادثات بنجاح", 
        description: `تم رفع ${data.uploaded} محادثة وهي جاهزة للتعيين` 
      });
      setShowMultiUploadDialog(false);
      setMultiConversationText("");
      setDetectedConversations([]);
    },
    onError: (error: Error) => {
      toast({ 
        title: "خطأ في رفع المحادثات", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const handleMultiUpload = () => {
    const selectedConversations = detectedConversations.filter(conv => conv.selected);
    
    if (selectedConversations.length === 0) {
      toast({ title: "خطأ", description: "يرجى اختيار محادثة واحدة على الأقل", variant: "destructive" });
      return;
    }
    
    const conversationsToUpload = selectedConversations.map(conv => ({
      title: conv.title,
      description: conv.description,
      customerType: globalSettings.customerType,
      urgencyLevel: globalSettings.urgencyLevel,
      category: globalSettings.category,
      messages: conv.messages.map((msg, index) => ({
        ...msg,
        messageOrder: index + 1
      }))
    }));
    
    multiUploadMutation.mutate(conversationsToUpload);
  };

  // Upload conversation mutation
  const uploadMutation = useMutation({
    mutationFn: async (data: ConversationUpload) => {
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to upload conversation");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      toast({ title: "تم رفع المحادثة بنجاح", description: "تم رفع المحادثة وهي جاهزة للتعيين" });
      setShowUploadDialog(false);
      setUploadForm({
        title: "",
        description: "",
        customerType: "new",
        urgencyLevel: "medium",
        category: "general",
        messages: []
      });
      setConversationText("");
    },
    onError: () => {
      toast({ title: "خطأ", description: "فشل في رفع المحادثة", variant: "destructive" });
    },
  });

  // Assign conversation mutation
  const assignMutation = useMutation({
    mutationFn: async ({ conversationId, translatorId, styleTagId }: { 
      conversationId: number; 
      translatorId: number; 
      styleTagId: number;
    }) => {
      const response = await fetch(`/api/conversations/${conversationId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ translatorId, styleTagId }),
      });
      if (!response.ok) throw new Error("Failed to assign conversation");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      toast({ title: "تم تعيين المحادثة بنجاح", description: "تم تعيين المحادثة للمترجم مع النمط المحدد" });
      setShowAssignDialog(false);
      setSelectedConversation(null);
      setSelectedTranslator(null);
      setSelectedStyle(null);
    },
    onError: () => {
      toast({ title: "خطأ", description: "فشل في تعيين المحادثة", variant: "destructive" });
    },
  });

  // Bulk assign conversations mutation
  const bulkAssignMutation = useMutation({
    mutationFn: async ({ conversationIds, translatorId, styleTagId }: { 
      conversationIds: number[]; 
      translatorId: number; 
      styleTagId: number;
    }) => {
      const promises = conversationIds.map(id => 
        fetch(`/api/conversations/${id}/assign`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ translatorId, styleTagId }),
        })
      );
      
      const responses = await Promise.all(promises);
      const failedAssignments = responses.filter(r => !r.ok);
      
      if (failedAssignments.length > 0) {
        throw new Error(`Failed to assign ${failedAssignments.length} conversations`);
      }
      
      return { assigned: conversationIds.length };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      toast({ 
        title: "تم تعيين المحادثات بنجاح", 
        description: `تم تعيين ${data.assigned} محادثة للمترجم المحدد` 
      });
      setShowBulkAssignDialog(false);
      setSelectedConversations([]);
      setBulkTranslator(null);
      setBulkStyle(null);
    },
    onError: (error: Error) => {
      toast({ 
        title: "خطأ في التعيين الجماعي", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const handleUpload = () => {
    const messages = parseConversationText(conversationText);
    if (messages.length === 0) {
      toast({ title: "خطأ", description: "يرجى إدخال محادثة صحيحة", variant: "destructive" });
      return;
    }

    const userMessages = messages.filter(m => m.messageType === 'user').length;
    const agentMessages = messages.filter(m => m.messageType === 'agent').length;

    uploadMutation.mutate({
      ...uploadForm,
      messages: messages.map((msg, index) => ({
        ...msg,
        messageOrder: index + 1
      }))
    });
  };

  const handleAssign = () => {
    if (!selectedConversation || !selectedTranslator || !selectedStyle) {
      toast({ title: "خطأ", description: "يرجى اختيار جميع الحقول المطلوبة", variant: "destructive" });
      return;
    }

    assignMutation.mutate({
      conversationId: selectedConversation.id,
      translatorId: selectedTranslator,
      styleTagId: selectedStyle,
    });
  };

  const handleBulkAssign = () => {
    if (selectedConversations.length === 0 || !bulkTranslator || !bulkStyle) {
      toast({ title: "خطأ", description: "يرجى اختيار المحادثات والمترجم والنمط", variant: "destructive" });
      return;
    }

    bulkAssignMutation.mutate({
      conversationIds: selectedConversations,
      translatorId: bulkTranslator,
      styleTagId: bulkStyle,
    });
  };

  const toggleConversationSelection = (conversationId: number) => {
    setSelectedConversations(prev => 
      prev.includes(conversationId) 
        ? prev.filter(id => id !== conversationId)
        : [...prev, conversationId]
    );
  };

  const selectAllPendingConversations = () => {
    const pendingIds = conversations
      .filter(c => c.status === 'pending')
      .map(c => c.id);
    setSelectedConversations(pendingIds);
  };

  const clearSelection = () => {
    setSelectedConversations([]);
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { label: "في الانتظار", variant: "secondary" as const },
      assigned: { label: "معين", variant: "default" as const },
      in_progress: { label: "قيد التنفيذ", variant: "default" as const },
      completed: { label: "مكتمل", variant: "default" as const },
      reviewed: { label: "تمت المراجعة", variant: "default" as const },
    };
    return statusMap[status as keyof typeof statusMap] || { label: status, variant: "secondary" as const };
  };

  const getUrgencyColor = (urgency: string) => {
    const colors = {
      low: "text-green-600",
      medium: "text-yellow-600", 
      high: "text-orange-600",
      urgent: "text-red-600"
    };
    return colors[urgency as keyof typeof colors] || "text-gray-600";
  };

  return (
    <div className="container mx-auto p-3 sm:p-6" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">إدارة المحادثات</h1>
          <p className="text-muted-foreground text-sm sm:text-base">رفع وتعيين محادثات دعم العملاء للترجمة من العربية إلى الحسانية</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <Dialog open={showMultiUploadDialog} onOpenChange={setShowMultiUploadDialog}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 px-6 py-3 text-lg font-semibold">
                <Upload className="ml-2 h-5 w-5" />
                رفع محادثات متعددة
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>رفع محادثات متعددة</DialogTitle>
                <DialogDescription>
                  الصق عدة محادثات مرة واحدة وسيتم فصلها تلقائياً، ثم اختر المحادثات التي تريد رفعها
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                {/* Global Settings */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl shadow-sm">
                  <div className="space-y-2">
                    <Label htmlFor="globalCustomerType" className="text-green-800 font-medium">نوع العميل (للجميع)</Label>
                    <Select value={globalSettings.customerType} onValueChange={(value) => setGlobalSettings(prev => ({ ...prev, customerType: value }))}>
                      <SelectTrigger className="border-green-200 focus:border-green-400 focus:ring-green-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">جديد</SelectItem>
                        <SelectItem value="returning">عائد</SelectItem>
                        <SelectItem value="vip">مميز</SelectItem>
                        <SelectItem value="premium">بريميوم</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="globalUrgency" className="text-green-800 font-medium">مستوى الأولوية (للجميع)</Label>
                    <Select value={globalSettings.urgencyLevel} onValueChange={(value) => setGlobalSettings(prev => ({ ...prev, urgencyLevel: value }))}>
                      <SelectTrigger className="border-green-200 focus:border-green-400 focus:ring-green-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">منخفض</SelectItem>
                        <SelectItem value="medium">متوسط</SelectItem>
                        <SelectItem value="high">عالي</SelectItem>
                        <SelectItem value="urgent">عاجل</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="globalCategory" className="text-green-800 font-medium">الفئة (للجميع)</Label>
                    <Select value={globalSettings.category} onValueChange={(value) => setGlobalSettings(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger className="border-green-200 focus:border-green-400 focus:ring-green-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="billing">فوترة</SelectItem>
                        <SelectItem value="technical">تقني</SelectItem>
                        <SelectItem value="complaint">شكوى</SelectItem>
                        <SelectItem value="inquiry">استفسار</SelectItem>
                        <SelectItem value="general">عام</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Text Input */}
                <div className="space-y-3 p-6 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border border-green-200 rounded-xl shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <Label htmlFor="multiConversation" className="text-green-800 font-semibold text-lg">النص المحتوي على محادثات متعددة</Label>
                  </div>
                  <Textarea
                    id="multiConversation"
                    value={multiConversationText}
                    onChange={(e) => setMultiConversationText(e.target.value)}
                    className="border-green-200 focus:border-green-400 focus:ring-green-200 bg-white/80 backdrop-blur-sm"
                    placeholder={`الصق المحادثات هنا. يمكن فصلها بـ:
- خطوط متقطعة (---)
- علامات مساواة (===)
- نجوم (***)
- "محادثة 1"، "محادثة 2"
- أسطر فارغة متعددة
- رسائل عميل متتالية (تبدأ محادثة جديدة تلقائياً)

مثال:
عميل: تغيير الحجز
وكيل: بالتأكيد، ما هو تاريخ الحجز الجديد؟
عميل: أريده الأسبوع القادم
عميل: المنتج تالف
وكيل: أنا آسف لسماع ذلك. هل يمكنك إرسال صورة؟
عميل: نعم، سأرسلها الآن
عميل: سؤال عن العضوية
وكيل: أهلاً بك، ما هو استفسارك؟
عميل: كيف يمكنني الترقية؟`}
                    rows={10}
                  />
                  <div className="flex items-center gap-2 p-3 bg-green-100/60 border border-green-200 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <p className="text-sm text-green-700 font-medium">
                      استخدم "عميل:" أو "وكيل:" في بداية كل رسالة، وافصل المحادثات بخطوط أو أسطر فارغة
                    </p>
                  </div>
                </div>

                {/* Parse Button */}
                <div className="flex justify-center py-4">
                  <Button 
                    onClick={handleMultiConversationParse} 
                    disabled={!multiConversationText.trim()}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 px-8 py-3 text-lg font-semibold"
                  >
                    <MessageCircle className="ml-2 h-5 w-5" />
                    اكتشاف وفصل المحادثات
                  </Button>
                </div>

                {/* Detected Conversations */}
                {detectedConversations.length > 0 && (
                  <div className="space-y-6 p-6 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border border-green-200 rounded-xl shadow-lg">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                        <h3 className="text-xl font-bold text-green-800">المحادثات المكتشفة ({detectedConversations.length})</h3>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          onClick={selectAllDetectedConversations} 
                          variant="outline" 
                          size="sm"
                          className="border-green-300 text-green-700 hover:bg-green-100 hover:border-green-400"
                        >
                          تحديد الكل
                        </Button>
                        <Button 
                          onClick={deselectAllDetectedConversations} 
                          variant="outline" 
                          size="sm"
                          className="border-green-300 text-green-700 hover:bg-green-100 hover:border-green-400"
                        >
                          إلغاء تحديد الكل
                        </Button>
                      </div>
                    </div>

                    <div className="grid gap-4 max-h-96 overflow-y-auto pr-2">
                      {detectedConversations.map((conv) => (
                        <Card key={conv.id} className={`transition-all duration-300 hover:shadow-md ${conv.selected ? "ring-2 ring-green-400 bg-green-50/50 border-green-300" : "border-green-200 hover:border-green-300"}`}>
                          <CardHeader className="pb-3">
                            <div className="flex items-start gap-3">
                              <Checkbox
                                checked={conv.selected}
                                onCheckedChange={() => toggleConversationDetectedSelection(conv.id)}
                                className="mt-1 border-green-400 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                              />
                              <div className="flex-1">
                                <CardTitle className="text-base text-green-800 font-semibold">{conv.title}</CardTitle>
                                <CardDescription className="text-sm text-green-600">{conv.description}</CardDescription>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="text-xs text-green-700 bg-green-100/60 border border-green-200 p-3 rounded-lg max-h-20 overflow-y-auto">
                              {conv.text.substring(0, 200)}...
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-green-200">
                      <Button 
                        variant="outline" 
                        onClick={() => setShowMultiUploadDialog(false)}
                        className="border-green-300 text-green-700 hover:bg-green-100 hover:border-green-400"
                      >
                        إلغاء
                      </Button>
                      <Button 
                        onClick={handleMultiUpload} 
                        disabled={multiUploadMutation.isPending || detectedConversations.filter(c => c.selected).length === 0}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                      >
                        {multiUploadMutation.isPending ? "جاري الرفع..." : `رفع المحادثات المحددة (${detectedConversations.filter(c => c.selected).length})`}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 px-6 py-3 text-lg font-semibold">
                <Upload className="ml-2 h-5 w-5" />
                رفع محادثة واحدة
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>رفع محادثة دعم عملاء</DialogTitle>
              <DialogDescription>
                قم برفع محادثة بين عميل ووكيل دعم لترجمة رسائل العميل فقط إلى الحسانية
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">عنوان المحادثة</Label>
                  <Input
                    id="title"
                    value={uploadForm.title}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="مثال: مشكلة في الفوترة"
                  />
                </div>
                <div>
                  <Label htmlFor="category">الفئة</Label>
                  <Select value={uploadForm.category} onValueChange={(value) => setUploadForm(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="billing">فوترة</SelectItem>
                      <SelectItem value="technical">تقني</SelectItem>
                      <SelectItem value="complaint">شكوى</SelectItem>
                      <SelectItem value="inquiry">استفسار</SelectItem>
                      <SelectItem value="general">عام</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customerType">نوع العميل</Label>
                  <Select value={uploadForm.customerType} onValueChange={(value) => setUploadForm(prev => ({ ...prev, customerType: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">جديد</SelectItem>
                      <SelectItem value="returning">عائد</SelectItem>
                      <SelectItem value="vip">مميز</SelectItem>
                      <SelectItem value="premium">بريميوم</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="urgency">مستوى الأولوية</Label>
                  <Select value={uploadForm.urgencyLevel} onValueChange={(value) => setUploadForm(prev => ({ ...prev, urgencyLevel: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">منخفض</SelectItem>
                      <SelectItem value="medium">متوسط</SelectItem>
                      <SelectItem value="high">عالي</SelectItem>
                      <SelectItem value="urgent">عاجل</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">وصف المحادثة</Label>
                <Textarea
                  id="description"
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="وصف مختصر للمحادثة..."
                />
              </div>

              <div>
                <Label htmlFor="conversation">نص المحادثة</Label>
                <Textarea
                  id="conversation"
                  value={conversationText}
                  onChange={(e) => setConversationText(e.target.value)}
                  placeholder={`مثال:
عميل: مرحباً، لدي مشكلة في فاتورتي
وكيل: مرحباً بك، كيف يمكنني مساعدتك؟
عميل: الفاتورة أعلى من المعتاد
وكيل: دعني أتحقق من حسابك...`}
                  rows={8}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  استخدم "عميل:" أو "وكيل:" في بداية كل رسالة
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
                  إلغاء
                </Button>
                <Button onClick={handleUpload} disabled={uploadMutation.isPending}>
                  {uploadMutation.isPending ? "جاري الرفع..." : "رفع المحادثة"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload">المحادثات المرفوعة</TabsTrigger>
          <TabsTrigger value="assigned">المحادثات المعينة</TabsTrigger>
          <TabsTrigger value="completed">المحادثات المكتملة</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          {/* Bulk Selection Controls */}
          {conversations.filter(c => c.status === 'pending').length > 0 && (
            <div className="flex flex-col sm:flex-row gap-3 p-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl shadow-sm">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={selectedConversations.length === conversations.filter(c => c.status === 'pending').length}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      selectAllPendingConversations();
                    } else {
                      clearSelection();
                    }
                  }}
                  className="border-green-400 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                />
                <span className="text-sm font-medium text-green-800">
                  تحديد الكل ({selectedConversations.length} من {conversations.filter(c => c.status === 'pending').length})
                </span>
              </div>
              
              {selectedConversations.length > 0 && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowBulkAssignDialog(true)}
                    size="sm"
                    className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    <Users className="h-4 w-4" />
                    تعيين المحدد ({selectedConversations.length})
                  </Button>
                  <Button
                    onClick={clearSelection}
                    variant="outline"
                    size="sm"
                    className="border-green-300 text-green-700 hover:bg-green-100 hover:border-green-400"
                  >
                    إلغاء التحديد
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className="grid gap-4">
            {conversations.filter(c => c.status === 'pending').map((conversation) => (
              <Card key={conversation.id} className={selectedConversations.includes(conversation.id) ? "ring-2 ring-primary" : ""}>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <Checkbox
                        checked={selectedConversations.includes(conversation.id)}
                        onCheckedChange={() => toggleConversationSelection(conversation.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <MessageCircle className="h-5 w-5" />
                          {conversation.title}
                        </CardTitle>
                        <CardDescription className="mt-1">{conversation.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={getStatusBadge(conversation.status).variant}>
                        {getStatusBadge(conversation.status).label}
                      </Badge>
                      <Badge variant="outline" className={getUrgencyColor(conversation.urgencyLevel || 'medium')}>
                        {conversation.urgencyLevel}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                    <div className="flex flex-wrap gap-2 sm:gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {conversation.userMessages} رسائل عميل
                      </span>
                      <span className="flex items-center gap-1">
                        <Bot className="h-4 w-4" />
                        {conversation.agentMessages} رسائل وكيل
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {new Date(conversation.createdAt).toLocaleDateString('ar')}
                      </span>
                    </div>
                    <Button 
                      onClick={() => {
                        setSelectedConversation(conversation);
                        setShowAssignDialog(true);
                      }}
                      size="sm"
                      className="w-full sm:w-auto"
                    >
                      تعيين للمترجم
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="assigned" className="space-y-4">
          <div className="grid gap-4">
            {conversations.filter(c => ['assigned', 'in_progress'].includes(c.status)).map((conversation) => (
              <Card key={conversation.id}>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <MessageCircle className="h-5 w-5" />
                        {conversation.title}
                      </CardTitle>
                      <CardDescription className="mt-1">{conversation.description}</CardDescription>
                    </div>
                    <Badge variant={getStatusBadge(conversation.status).variant}>
                      {getStatusBadge(conversation.status).label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 text-sm text-muted-foreground">
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                      <span>المترجم: {conversation.assignedTo}</span>
                      <span>النمط: {conversation.styleTagId}</span>
                      <span>{conversation.userMessages} رسائل للترجمة</span>
                    </div>
                    <span className="text-right sm:text-left">{new Date(conversation.createdAt).toLocaleDateString('ar')}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <div className="grid gap-4">
            {conversations.filter(c => ['completed', 'reviewed'].includes(c.status)).map((conversation) => (
              <Card key={conversation.id}>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        {conversation.title}
                      </CardTitle>
                      <CardDescription className="mt-1">{conversation.description}</CardDescription>
                    </div>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      {getStatusBadge(conversation.status).label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 text-sm text-muted-foreground">
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                      <span>المترجم: {conversation.assignedTo}</span>
                      <span>مكتمل في: {conversation.completedAt ? new Date(conversation.completedAt).toLocaleDateString('ar') : 'غير محدد'}</span>
                    </div>
                    <Button variant="outline" size="sm" className="w-full sm:w-auto">
                      عرض الترجمة
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Assignment Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>تعيين محادثة للمترجم</DialogTitle>
            <DialogDescription>
              اختر المترجم والنمط المطلوب لترجمة رسائل العميل فقط
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>المترجم</Label>
              <Select value={selectedTranslator?.toString()} onValueChange={(value) => setSelectedTranslator(Number(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر المترجم" />
                </SelectTrigger>
                <SelectContent>
                  {translators.map((translator) => (
                    <SelectItem key={translator.id} value={translator.id.toString()}>
                      {translator.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>نمط الترجمة (للعميل فقط)</Label>
              <Select value={selectedStyle?.toString()} onValueChange={(value) => setSelectedStyle(Number(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر النمط" />
                </SelectTrigger>
                <SelectContent>
                  {styleTags.map((style) => (
                    <SelectItem key={style.id} value={style.id.toString()}>
                      {style.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>ملاحظة:</strong> النمط المحدد سيؤثر فقط على ترجمة رسائل العميل. 
                رسائل الوكيل ستبقى كما هي لتدريب الذكاء الاصطناعي على الحسانية الأصيلة.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAssignDialog(false)} className="w-full sm:w-auto">
                إلغاء
              </Button>
              <Button onClick={handleAssign} disabled={assignMutation.isPending} className="w-full sm:w-auto">
                {assignMutation.isPending ? "جاري التعيين..." : "تعيين المحادثة"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Assignment Dialog */}
      <Dialog open={showBulkAssignDialog} onOpenChange={setShowBulkAssignDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>تعيين محادثات متعددة للمترجم</DialogTitle>
            <DialogDescription>
              تعيين {selectedConversations.length} محادثة للمترجم المحدد
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>المترجم</Label>
              <Select value={bulkTranslator?.toString()} onValueChange={(value) => setBulkTranslator(Number(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر المترجم" />
                </SelectTrigger>
                <SelectContent>
                  {translators.map((translator) => (
                    <SelectItem key={translator.id} value={translator.id.toString()}>
                      {translator.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>نمط الترجمة (للعميل فقط)</Label>
              <Select value={bulkStyle?.toString()} onValueChange={(value) => setBulkStyle(Number(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر النمط" />
                </SelectTrigger>
                <SelectContent>
                  {styleTags.map((style) => (
                    <SelectItem key={style.id} value={style.id.toString()}>
                      {style.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="bg-amber-50 p-3 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>تنبيه:</strong> سيتم تعيين جميع المحادثات المحددة ({selectedConversations.length}) 
                للمترجم والنمط المحدد. هذا الإجراء لا يمكن التراجع عنه.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2">
              <Button variant="outline" onClick={() => setShowBulkAssignDialog(false)} className="w-full sm:w-auto">
                إلغاء
              </Button>
              <Button onClick={handleBulkAssign} disabled={bulkAssignMutation.isPending} className="w-full sm:w-auto">
                {bulkAssignMutation.isPending ? "جاري التعيين..." : `تعيين ${selectedConversations.length} محادثة`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}