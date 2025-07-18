import React, { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@shared/schema";
import { z } from "zod";
import { Languages, Loader2 } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, "اسم المستخدم مطلوب"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});

const registerSchema = insertUserSchema.extend({
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "كلمات المرور غير متطابقة",
  path: ["confirmPassword"],
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("login");

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      role: "translator",
    },
  });

  // Redirect if already logged in
  React.useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  if (user) {
    return null;
  }

  const onLogin = (data: LoginForm) => {
    loginMutation.mutate(data, {
      onSuccess: () => setLocation("/"),
    });
  };

  const onRegister = (data: RegisterForm) => {
    const { confirmPassword, ...registerData } = data;
    registerMutation.mutate(registerData, {
      onSuccess: () => setLocation("/"),
    });
  };

  return (
    <div className="min-h-screen flex">
      {/* Hero Section */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-[var(--project-primary)]/10 to-[var(--project-background)] items-center justify-center p-12">
        <div className="max-w-md text-center arabic-text">
          <div className="bg-[var(--project-primary)]/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8">
            <Languages className="w-12 h-12 text-[var(--project-primary)]" />
          </div>
          <h1 className="text-4xl font-bold text-[var(--project-text-primary)] mb-4">
            مشروع سند
          </h1>
          <p className="text-xl text-[var(--project-text-secondary)] mb-8">
            منصة التعليق التوضيحي للبيانات
          </p>
          <div className="text-right space-y-4 text-[var(--project-text-secondary)]">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="w-2 h-2 bg-[var(--project-primary)] rounded-full"></div>
              <span>ترجمة من العربية الفصحى إلى الحسانية</span>
            </div>
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="w-2 h-2 bg-[var(--project-primary)] rounded-full"></div>
              <span>مراجعة الجودة المتقدمة</span>
            </div>
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="w-2 h-2 bg-[var(--project-primary)] rounded-full"></div>
              <span>تصدير البيانات المعتمدة</span>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Form Section */}
      <div className="flex-1 flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="bg-[var(--project-primary)]/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Languages className="w-8 h-8 text-[var(--project-primary)]" />
            </div>
            <h2 className="text-2xl font-bold arabic-text">مشروع سند</h2>
            <p className="text-[var(--project-text-secondary)] arabic-text">
              منصة التعليق التوضيحي للبيانات
            </p>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login" className="arabic-text">تسجيل الدخول</TabsTrigger>
                <TabsTrigger value="register" className="arabic-text">إنشاء حساب</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                  <div>
                    <Label htmlFor="username" className="arabic-text">اسم المستخدم</Label>
                    <Input
                      id="username"
                      {...loginForm.register("username")}
                      placeholder="أدخل اسم المستخدم"
                      className="text-right"
                      dir="rtl"
                    />
                    {loginForm.formState.errors.username && (
                      <p className="text-[var(--project-error)] text-sm mt-1 arabic-text">
                        {loginForm.formState.errors.username.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="password" className="arabic-text">كلمة المرور</Label>
                    <Input
                      id="password"
                      type="password"
                      {...loginForm.register("password")}
                      placeholder="أدخل كلمة المرور"
                      className="text-right"
                      dir="rtl"
                    />
                    {loginForm.formState.errors.password && (
                      <p className="text-[var(--project-error)] text-sm mt-1 arabic-text">
                        {loginForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full btn-primary arabic-text"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
                    تسجيل الدخول
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                  <div>
                    <Label htmlFor="reg-username" className="arabic-text">اسم المستخدم</Label>
                    <Input
                      id="reg-username"
                      {...registerForm.register("username")}
                      placeholder="أدخل اسم المستخدم"
                      className="text-right"
                      dir="rtl"
                    />
                    {registerForm.formState.errors.username && (
                      <p className="text-[var(--project-error)] text-sm mt-1 arabic-text">
                        {registerForm.formState.errors.username.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="role" className="arabic-text">الدور</Label>
                    <Select onValueChange={(value) => registerForm.setValue("role", value)} defaultValue="translator">
                      <SelectTrigger className="text-right" dir="rtl">
                        <SelectValue placeholder="اختر الدور" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="translator">مترجم</SelectItem>
                        <SelectItem value="qa">مراجع الجودة</SelectItem>
                        <SelectItem value="admin">مدير النظام</SelectItem>
                      </SelectContent>
                    </Select>
                    {registerForm.formState.errors.role && (
                      <p className="text-[var(--project-error)] text-sm mt-1 arabic-text">
                        {registerForm.formState.errors.role.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="reg-password" className="arabic-text">كلمة المرور</Label>
                    <Input
                      id="reg-password"
                      type="password"
                      {...registerForm.register("password")}
                      placeholder="أدخل كلمة المرور"
                      className="text-right"
                      dir="rtl"
                    />
                    {registerForm.formState.errors.password && (
                      <p className="text-[var(--project-error)] text-sm mt-1 arabic-text">
                        {registerForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="confirm-password" className="arabic-text">تأكيد كلمة المرور</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      {...registerForm.register("confirmPassword")}
                      placeholder="أعد إدخال كلمة المرور"
                      className="text-right"
                      dir="rtl"
                    />
                    {registerForm.formState.errors.confirmPassword && (
                      <p className="text-[var(--project-error)] text-sm mt-1 arabic-text">
                        {registerForm.formState.errors.confirmPassword.message}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full btn-primary arabic-text"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
                    إنشاء الحساب
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
