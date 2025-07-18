import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import UserModal from "@/components/modals/user-modal";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Ban, UserPlus, Users as UsersIcon, AlertTriangle } from "lucide-react";
import type { User } from "@shared/schema";

export default function Users() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showUserModal, setShowUserModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: users = [], isLoading } = useQuery<Omit<User, 'password'>[]>({
    queryKey: ["/api/users"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const res = await apiRequest("PATCH", `/api/users/${id}/status`, { isActive });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "تم التحديث بنجاح",
        description: "تم تحديث حالة المستخدم",
      });
    },
    onError: () => {
      toast({
        title: "خطأ في التحديث",
        description: "فشل في تحديث حالة المستخدم",
        variant: "destructive",
      });
    },
  });

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && u.isActive) ||
                         (statusFilter === "inactive" && !u.isActive);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      admin: { label: "مدير النظام", className: "bg-purple-100 text-purple-800" },
      translator: { label: "مترجم", className: "bg-blue-100 text-blue-800" },
      qa: { label: "مراجع الجودة", className: "bg-green-100 text-green-800" },
    };
    
    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.translator;
    return (
      <Badge className={`${config.className} arabic-text`}>
        {config.label}
      </Badge>
    );
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <Badge className={`${isActive ? "bg-[var(--project-primary)]/20 text-[var(--project-primary)]" : "bg-red-100 text-red-800"} arabic-text`}>
        {isActive ? "نشط" : "معطل"}
      </Badge>
    );
  };

  const handleToggleStatus = (userId: number, currentStatus: boolean) => {
    updateStatusMutation.mutate({
      id: userId,
      isActive: !currentStatus,
    });
  };

  const getLastActivity = (createdAt: string | null) => {
    if (!createdAt) return "غير متاح";
    
    const date = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "اليوم";
    if (diffDays === 1) return "أمس";
    if (diffDays < 7) return `منذ ${diffDays} أيام`;
    if (diffDays < 30) return `منذ ${Math.floor(diffDays / 7)} أسابيع`;
    return `منذ ${Math.floor(diffDays / 30)} شهور`;
  };

  if (user?.role !== "admin") {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 lg:mr-72">
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
      <div className="flex-1 lg:mr-72">
        <Header title="إدارة المستخدمين" />
        <main className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-[var(--project-text-primary)] arabic-text">
                إدارة المستخدمين
              </h2>
              <p className="text-[var(--project-text-secondary)] arabic-text">
                إنشاء وإدارة حسابات المستخدمين
              </p>
            </div>
            <Button
              onClick={() => setShowUserModal(true)}
              className="btn-primary arabic-text"
            >
              <UserPlus className="w-4 h-4 ml-2" />
              إضافة مستخدم جديد
            </Button>
          </div>

          {/* Filter Bar */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Input
                    placeholder="البحث عن مستخدم..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="text-right"
                    dir="rtl"
                  />
                </div>
                <div>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="text-right" dir="rtl">
                      <SelectValue placeholder="الدور" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الأدوار</SelectItem>
                      <SelectItem value="admin">مدير النظام</SelectItem>
                      <SelectItem value="translator">مترجم</SelectItem>
                      <SelectItem value="qa">مراجع الجودة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="text-right" dir="rtl">
                      <SelectValue placeholder="الحالة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الحالات</SelectItem>
                      <SelectItem value="active">نشط</SelectItem>
                      <SelectItem value="inactive">معطل</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center text-sm text-[var(--project-text-secondary)] arabic-text">
                  إجمالي المستخدمين: {filteredUsers.length}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-[var(--project-text-secondary)] arabic-text">جاري التحميل...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <UsersIcon className="w-16 h-16 text-[var(--project-text-secondary)] mx-auto mb-4" />
                <h3 className="text-lg font-medium text-[var(--project-text-primary)] mb-2 arabic-text">
                  لا توجد مستخدمين
                </h3>
                <p className="text-[var(--project-text-secondary)] mb-4 arabic-text">
                  ابدأ بإضافة أول مستخدم للمشروع
                </p>
                <Button onClick={() => setShowUserModal(true)} className="btn-primary arabic-text">
                  <UserPlus className="w-4 h-4 ml-2" />
                  إضافة مستخدم جديد
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-[var(--project-border)]">
                      <TableHead className="text-right arabic-text">اسم المستخدم</TableHead>
                      <TableHead className="text-right arabic-text">الدور</TableHead>
                      <TableHead className="text-right arabic-text">الحالة</TableHead>
                      <TableHead className="text-right arabic-text">آخر نشاط</TableHead>
                      <TableHead className="text-right arabic-text">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((userData) => (
                      <TableRow key={userData.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium text-[var(--project-text-primary)] arabic-text">
                          {userData.username}
                        </TableCell>
                        <TableCell>
                          {getRoleBadge(userData.role)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(userData.isActive)}
                        </TableCell>
                        <TableCell className="text-[var(--project-text-secondary)] text-sm">
                          {getLastActivity(userData.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2 space-x-reverse">
                            <Button size="sm" variant="outline">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className={userData.isActive ? "text-[var(--project-error)]" : "text-[var(--project-primary)]"}
                              onClick={() => handleToggleStatus(userData.id, userData.isActive)}
                              disabled={updateStatusMutation.isPending}
                            >
                              <Ban className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          <UserModal 
            isOpen={showUserModal} 
            onClose={() => setShowUserModal(false)} 
          />
        </main>
      </div>
    </div>
  );
}
