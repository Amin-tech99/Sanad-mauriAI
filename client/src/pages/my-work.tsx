import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Play, Clock, Flag, CheckCircle, XCircle, ClipboardList, AlertTriangle } from "lucide-react";
import type { WorkItem } from "@shared/schema";

export default function MyWork() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: workItems = [], isLoading } = useQuery<WorkItem[]>({
    queryKey: ["/api/my-work"],
    enabled: user?.role === "translator",
  });

  // Filter work items by status
  const newTasks = workItems.filter(item => item.status === "pending");
  const reworkTasks = workItems.filter(item => item.status === "rejected");
  const inProgressTasks = workItems.filter(item => item.status === "in_progress");
  const inQATasks = workItems.filter(item => item.status === "in_qa");

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "جديدة", className: "bg-blue-100 text-blue-800", icon: Clock },
      in_progress: { label: "قيد التنفيذ", className: "bg-yellow-100 text-yellow-800", icon: Play },
      in_qa: { label: "في المراجعة", className: "bg-purple-100 text-purple-800", icon: CheckCircle },
      rejected: { label: "مرفوضة", className: "bg-red-100 text-red-800", icon: XCircle },
      approved: { label: "معتمدة", className: "bg-[var(--project-primary)]/20 text-[var(--project-primary)]", icon: CheckCircle },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.className} arabic-text flex items-center space-x-1 space-x-reverse`}>
        <Icon className="w-3 h-3" />
        <span>{config.label}</span>
      </Badge>
    );
  };

  const getTaskTypeLabel = (packetId: number) => {
    // This would ideally come from the work packet data
    // For now, we'll show a generic label
    return "ترجمة نص";
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "غير محدد";
    return new Date(dateString).toLocaleDateString('ar-SA');
  };

  const TaskCard = ({ item }: { item: WorkItem }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 space-x-reverse mb-3">
              {getStatusBadge(item.status)}
              <span className="text-[var(--project-text-secondary)] text-sm">
                مهمة #{item.id}
              </span>
              {item.status === "rejected" && (
                <Badge className="bg-red-100 text-red-800 arabic-text">
                  <Flag className="w-3 h-3 ml-1" />
                  أولوية عالية
                </Badge>
              )}
            </div>
            
            <h3 className="font-semibold text-[var(--project-text-primary)] mb-2 arabic-text">
              {getTaskTypeLabel(item.packetId)}
            </h3>
            
            <p className="text-[var(--project-text-secondary)] text-sm mb-4 arabic-text line-clamp-3" dir="rtl">
              {item.sourceText}
            </p>
            
            {item.status === "rejected" && item.rejectionReason && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
                <p className="text-sm font-medium text-red-800 mb-1 arabic-text">سبب الرفض:</p>
                <p className="text-sm text-red-700 arabic-text">{item.rejectionReason}</p>
              </div>
            )}
            
            <div className="flex items-center space-x-4 space-x-reverse text-xs text-[var(--project-text-secondary)]">
              <span className="flex items-center space-x-1 space-x-reverse">
                <Clock className="w-3 h-3" />
                <span>تاريخ التعيين: {formatDate(item.createdAt)}</span>
              </span>
              {item.status === "rejected" && (
                <span className="flex items-center space-x-1 space-x-reverse">
                  <Flag className="w-3 h-3" />
                  <span className="arabic-text">يحتاج إعادة عمل</span>
                </span>
              )}
            </div>
          </div>
          
          <Button
            onClick={() => setLocation(`/workspace/${item.id}`)}
            className="btn-primary arabic-text"
            disabled={item.status === "in_qa" || item.status === "approved"}
          >
            {item.status === "pending" ? "ابدأ العمل" : 
             item.status === "rejected" ? "إعادة العمل" :
             item.status === "in_progress" ? "متابعة" :
             item.status === "in_qa" ? "في المراجعة" : "معتمدة"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const EmptyState = ({ title, description, icon: Icon }: { title: string; description: string; icon: any }) => (
    <Card>
      <CardContent className="p-8 text-center">
        <Icon className="w-16 h-16 text-[var(--project-text-secondary)] mx-auto mb-4" />
        <h3 className="text-lg font-medium text-[var(--project-text-primary)] mb-2 arabic-text">
          {title}
        </h3>
        <p className="text-[var(--project-text-secondary)] arabic-text">
          {description}
        </p>
      </CardContent>
    </Card>
  );

  if (user?.role !== "translator") {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 mr-64">
          <Header title="غير مخول" />
          <main className="p-6">
            <div className="text-center">
              <AlertTriangle className="w-16 h-16 text-[var(--project-error)] mx-auto mb-4" />
              <h2 className="text-xl font-bold arabic-text">غير مخول للوصول</h2>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 mr-64">
        <Header title="قائمة مهامي" />
        <main className="p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[var(--project-text-primary)] arabic-text">
              قائمة مهامي
            </h2>
            <p className="text-[var(--project-text-secondary)] arabic-text">
              المهام المعينة لك
            </p>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-[var(--project-text-secondary)] arabic-text">جاري التحميل...</p>
            </div>
          ) : (
            <Tabs defaultValue="new" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="new" className="arabic-text">
                  مهام جديدة ({newTasks.length})
                </TabsTrigger>
                <TabsTrigger value="in-progress" className="arabic-text">
                  قيد التنفيذ ({inProgressTasks.length})
                </TabsTrigger>
                <TabsTrigger value="in-qa" className="arabic-text">
                  في المراجعة ({inQATasks.length})
                </TabsTrigger>
                <TabsTrigger value="rework" className="arabic-text">
                  تحتاج مراجعة ({reworkTasks.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="new" className="mt-6">
                {newTasks.length === 0 ? (
                  <EmptyState
                    title="لا توجد مهام جديدة"
                    description="ستظهر المهام الجديدة هنا عند تعيينها لك"
                    icon={ClipboardList}
                  />
                ) : (
                  <div className="space-y-4">
                    {newTasks.map((item) => (
                      <TaskCard key={item.id} item={item} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="in-progress" className="mt-6">
                {inProgressTasks.length === 0 ? (
                  <EmptyState
                    title="لا توجد مهام قيد التنفيذ"
                    description="المهام التي بدأت العمل عليها ستظهر هنا"
                    icon={Play}
                  />
                ) : (
                  <div className="space-y-4">
                    {inProgressTasks.map((item) => (
                      <TaskCard key={item.id} item={item} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="in-qa" className="mt-6">
                {inQATasks.length === 0 ? (
                  <EmptyState
                    title="لا توجد مهام في المراجعة"
                    description="المهام المرسلة للمراجعة ستظهر هنا"
                    icon={CheckCircle}
                  />
                ) : (
                  <div className="space-y-4">
                    {inQATasks.map((item) => (
                      <TaskCard key={item.id} item={item} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="rework" className="mt-6">
                {reworkTasks.length === 0 ? (
                  <EmptyState
                    title="لا توجد مهام مرفوضة"
                    description="المهام التي تحتاج إعادة عمل ستظهر هنا"
                    icon={XCircle}
                  />
                ) : (
                  <div className="space-y-4">
                    {reworkTasks.map((item) => (
                      <TaskCard key={item.id} item={item} />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </main>
      </div>
    </div>
  );
}
