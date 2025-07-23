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
    <div className="min-h-screen flex bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Hero Section */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-green-100 via-emerald-100 to-teal-100 items-center justify-center p-12 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-green-200/30 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 right-20 w-32 h-32 bg-emerald-200/30 rounded-full blur-xl"></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-teal-200/30 rounded-full blur-xl"></div>
        
        <div className="max-w-md text-center arabic-text relative z-10">
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl transform hover:scale-105 transition-all duration-300">
            <Languages className="w-14 h-14 text-white" />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-green-800 to-emerald-700 bg-clip-text text-transparent mb-6">
            مشروع سند
          </h1>
          <p className="text-2xl text-green-700 mb-12 font-medium">
            منصة التعليق التوضيحي للبيانات
          </p>
          <div className="text-right space-y-6 text-green-700">
            <div className="flex items-center space-x-4 space-x-reverse p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-green-200 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="font-medium">ترجمة من العربية الفصحى إلى الحسانية</span>
            </div>
            <div className="flex items-center space-x-4 space-x-reverse p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-green-200 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="font-medium">مراجعة الجودة المتقدمة</span>
            </div>
            <div className="flex items-center space-x-4 space-x-reverse p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-green-200 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="w-3 h-3 bg-teal-500 rounded-full animate-pulse"></div>
              <span className="font-medium">تصدير البيانات المعتمدة</span>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Form Section */}
      <div className="flex-1 flex items-center justify-center p-8 relative">
        {/* Background decorative elements for mobile */}
        <div className="lg:hidden absolute top-10 right-10 w-16 h-16 bg-green-200/20 rounded-full blur-xl"></div>
        <div className="lg:hidden absolute bottom-20 left-10 w-24 h-24 bg-emerald-200/20 rounded-full blur-xl"></div>
        
        <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm border border-green-200 shadow-2xl hover:shadow-3xl transition-all duration-500 relative z-10">
          <CardHeader className="text-center pb-8">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl transform hover:scale-110 transition-all duration-300">
              <Languages className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold arabic-text bg-gradient-to-r from-green-800 to-emerald-700 bg-clip-text text-transparent">مشروع سند</h2>
            <p className="text-green-600 arabic-text text-lg font-medium mt-2">
              منصة التعليق التوضيحي للبيانات
            </p>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 bg-green-100/60 border border-green-200 p-1">
                <TabsTrigger 
                  value="login" 
                  className="arabic-text data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
                >
                  تسجيل الدخول
                </TabsTrigger>
                <TabsTrigger 
                  value="register" 
                  className="arabic-text data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
                >
                  إنشاء حساب
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="mt-8">
                <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="arabic-text text-green-800 font-semibold">اسم المستخدم</Label>
                    <Input
                      id="username"
                      {...loginForm.register("username")}
                      placeholder="أدخل اسم المستخدم"
                      className="text-right border-green-200 focus:border-green-400 focus:ring-green-200 bg-white/80 backdrop-blur-sm"
                      dir="rtl"
                    />
                    {loginForm.formState.errors.username && (
                      <p className="text-red-500 text-sm mt-1 arabic-text">
                        {loginForm.formState.errors.username.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="arabic-text text-green-800 font-semibold">كلمة المرور</Label>
                    <Input
                      id="password"
                      type="password"
                      {...loginForm.register("password")}
                      placeholder="أدخل كلمة المرور"
                      className="text-right border-green-200 focus:border-green-400 focus:ring-green-200 bg-white/80 backdrop-blur-sm"
                      dir="rtl"
                    />
                    {loginForm.formState.errors.password && (
                      <p className="text-red-500 text-sm mt-1 arabic-text">
                        {loginForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 py-3 text-lg font-semibold arabic-text"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending && <Loader2 className="w-5 h-5 animate-spin ml-2" />}
                    تسجيل الدخول
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register" className="mt-8">
                <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="reg-username" className="arabic-text text-green-800 font-semibold">اسم المستخدم</Label>
                    <Input
                      id="reg-username"
                      {...registerForm.register("username")}
                      placeholder="أدخل اسم المستخدم"
                      className="text-right border-green-200 focus:border-green-400 focus:ring-green-200 bg-white/80 backdrop-blur-sm"
                      dir="rtl"
                    />
                    {registerForm.formState.errors.username && (
                      <p className="text-red-500 text-sm mt-1 arabic-text">
                        {registerForm.formState.errors.username.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role" className="arabic-text text-green-800 font-semibold">الدور</Label>
                    <Select onValueChange={(value) => registerForm.setValue("role", value)} defaultValue="translator">
                      <SelectTrigger className="text-right border-green-200 focus:border-green-400 focus:ring-green-200 bg-white/80 backdrop-blur-sm" dir="rtl">
                        <SelectValue placeholder="اختر الدور" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="translator">مترجم</SelectItem>
                        <SelectItem value="qa">مراجع الجودة</SelectItem>
                        <SelectItem value="admin">مدير النظام</SelectItem>
                      </SelectContent>
                    </Select>
                    {registerForm.formState.errors.role && (
                      <p className="text-red-500 text-sm mt-1 arabic-text">
                        {registerForm.formState.errors.role.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reg-password" className="arabic-text text-green-800 font-semibold">كلمة المرور</Label>
                    <Input
                      id="reg-password"
                      type="password"
                      {...registerForm.register("password")}
                      placeholder="أدخل كلمة المرور"
                      className="text-right border-green-200 focus:border-green-400 focus:ring-green-200 bg-white/80 backdrop-blur-sm"
                      dir="rtl"
                    />
                    {registerForm.formState.errors.password && (
                      <p className="text-red-500 text-sm mt-1 arabic-text">
                        {registerForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="arabic-text text-green-800 font-semibold">تأكيد كلمة المرور</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      {...registerForm.register("confirmPassword")}
                      placeholder="أعد إدخال كلمة المرور"
                      className="text-right border-green-200 focus:border-green-400 focus:ring-green-200 bg-white/80 backdrop-blur-sm"
                      dir="rtl"
                    />
                    {registerForm.formState.errors.confirmPassword && (
                      <p className="text-red-500 text-sm mt-1 arabic-text">
                        {registerForm.formState.errors.confirmPassword.message}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 py-3 text-lg font-semibold arabic-text"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending && <Loader2 className="w-5 h-5 animate-spin ml-2" />}
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
