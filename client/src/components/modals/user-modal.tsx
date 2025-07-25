import { useMutation } from "@tanstack/react-query";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema, type User } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const formSchema = insertUserSchema.extend({
  confirmPassword: z.string().optional(),
}).refine((data) => {
  // Only validate password match for new users or when password is being changed
  if (data.password && data.password !== '') {
    return data.password === data.confirmPassword;
  }
  return true;
}, {
  message: "كلمات المرور غير متطابقة",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof formSchema>;

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: Omit<User, 'password'> | null;
}

export default function UserModal({ isOpen, onClose, user }: UserModalProps) {
  const { toast } = useToast();
  const isEditMode = !!user;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: user?.username || "",
      password: "",
      confirmPassword: "",
      role: user?.role || "translator",
    },
  });

  const saveUserMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const { confirmPassword, ...userData } = data;
      
      if (isEditMode && user) {
        // For edit mode, only include password if it's being changed
        const updateData: any = { username: userData.username, role: userData.role };
        if (userData.password && userData.password.trim() !== '') {
          updateData.password = userData.password;
        }
        await apiRequest("PATCH", `/api/users/${user.id}`, updateData);
      } else {
        const res = await apiRequest("POST", "/api/users", userData);
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: isEditMode ? "تم التحديث بنجاح" : "تم الإنشاء بنجاح",
        description: isEditMode ? "تم تحديث بيانات المستخدم بنجاح" : "تم إنشاء المستخدم الجديد بنجاح",
      });
      handleClose();
    },
    onError: (error: Error) => {
      toast({
        title: isEditMode ? "خطأ في التحديث" : "خطأ في الإنشاء",
        description: error.message || (isEditMode ? "فشل في تحديث المستخدم" : "فشل في إنشاء المستخدم"),
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const onSubmit = (data: FormData) => {
    saveUserMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="arabic-text">{isEditMode ? "تعديل بيانات المستخدم" : "إضافة مستخدم جديد"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="username" className="arabic-text">اسم المستخدم</Label>
            <Input
              id="username"
              {...form.register("username")}
              className="text-right"
              dir="rtl"
              placeholder="أدخل اسم المستخدم"
            />
            {form.formState.errors.username && (
              <p className="text-[var(--project-error)] text-sm mt-1 arabic-text">
                {form.formState.errors.username.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="role" className="arabic-text">الدور</Label>
            <Select onValueChange={(value) => form.setValue("role", value)} defaultValue={user?.role || "translator"}>
              <SelectTrigger className="text-right" dir="rtl">
                <SelectValue placeholder="اختر الدور" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="translator">مترجم</SelectItem>
                <SelectItem value="qa">مراجع الجودة</SelectItem>
                <SelectItem value="admin">مدير النظام</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.role && (
              <p className="text-[var(--project-error)] text-sm mt-1 arabic-text">
                {form.formState.errors.role.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="password" className="arabic-text">
              {isEditMode ? "كلمة المرور (اتركها فارغة إذا لم ترد تغييرها)" : "كلمة المرور"}
            </Label>
            <Input
              id="password"
              type="password"
              {...form.register("password")}
              className="text-right"
              dir="rtl"
              placeholder={isEditMode ? "أدخل كلمة مرور جديدة أو اتركها فارغة" : "أدخل كلمة المرور"}
            />
            {form.formState.errors.password && (
              <p className="text-[var(--project-error)] text-sm mt-1 arabic-text">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          {(!isEditMode || form.watch("password")) && (
            <div>
              <Label htmlFor="confirmPassword" className="arabic-text">تأكيد كلمة المرور</Label>
              <Input
                id="confirmPassword"
                type="password"
                {...form.register("confirmPassword")}
                className="text-right"
                dir="rtl"
                placeholder="أعد إدخال كلمة المرور"
              />
              {form.formState.errors.confirmPassword && (
                <p className="text-[var(--project-error)] text-sm mt-1 arabic-text">
                  {form.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>
          )}

          <DialogFooter className="flex justify-start space-x-4 space-x-reverse">
            <Button
              type="submit"
              disabled={saveUserMutation.isPending}
              className="btn-primary arabic-text"
            >
              {saveUserMutation.isPending ? (isEditMode ? "جاري التحديث..." : "جاري الإنشاء...") : (isEditMode ? "حفظ التغييرات" : "إنشاء المستخدم")}
            </Button>
            <Button
              type="button"
              onClick={handleClose}
              variant="outline"
              className="arabic-text"
            >
              إلغاء
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
