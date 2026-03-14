import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLogin, useRegister, useListColleges, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Input, Button, Label, Card, Select } from "@/components/ui-elements";
import { Library, Mail, Lock, User, GraduationCap, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  collegeName: z.string().optional(),
  branch: z.string().optional(),
  semester: z.coerce.number().optional(),
});

export default function AuthPage({ mode = 'login' }: { mode?: 'login' | 'register' }) {
  const [isLogin, setIsLogin] = useState(mode === 'login');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: colleges } = useListColleges();

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
  });

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
  });

  const { mutate: login, isPending: isLoggingIn } = useLogin({
    mutation: {
      onSuccess: (data) => {
        queryClient.setQueryData(getGetMeQueryKey(), data.user);
        toast({ title: "Welcome back!", description: "You have successfully logged in." });
        setLocation("/");
      },
      onError: (err) => {
        toast({ title: "Login failed", description: err.message || "Invalid credentials", variant: "destructive" });
      }
    }
  });

  const { mutate: register, isPending: isRegistering } = useRegister({
    mutation: {
      onSuccess: (data) => {
        queryClient.setQueryData(getGetMeQueryKey(), data.user);
        toast({ title: "Account created!", description: "Welcome to EduShare!" });
        setLocation("/");
      },
      onError: (err) => {
        toast({ title: "Registration failed", description: err.message || "Something went wrong", variant: "destructive" });
      }
    }
  });

  const onLoginSubmit = (data: z.infer<typeof loginSchema>) => {
    login({ data });
  };

  const onRegisterSubmit = (data: z.infer<typeof registerSchema>) => {
    register({ data });
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-slate-50">
      {/* Visual Side */}
      <div className="hidden lg:flex flex-col justify-center relative p-12 bg-primary overflow-hidden">
        <img 
          src={`${import.meta.env.BASE_URL}images/auth-bg.png`} 
          alt="Library" 
          className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/50 to-transparent"></div>
        <div className="relative z-10 text-white max-w-lg">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center mb-8 border border-white/30 shadow-2xl">
            <Library className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-5xl font-display font-extrabold mb-6 leading-tight">
            Unlock your academic potential.
          </h1>
          <p className="text-xl text-white/80 font-medium mb-12">
            Join thousands of students sharing knowledge, notes, and resources to succeed together.
          </p>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20">
              <h3 className="text-3xl font-bold mb-1">10k+</h3>
              <p className="text-white/70 text-sm">Study Resources</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20">
              <h3 className="text-3xl font-bold mb-1">50+</h3>
              <p className="text-white/70 text-sm">Colleges Joined</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form Side */}
      <div className="flex flex-col justify-center px-6 py-12 lg:px-24">
        <div className="w-full max-w-md mx-auto">
          <div className="flex items-center gap-2 mb-10 lg:hidden text-primary">
            <Library className="w-8 h-8" />
            <span className="font-display font-bold text-2xl">EduShare</span>
          </div>

          <h2 className="text-3xl font-display font-bold text-slate-900 mb-2">
            {isLogin ? "Welcome back" : "Create an account"}
          </h2>
          <p className="text-slate-500 mb-8">
            {isLogin ? "Enter your details to access your account." : "Get started with your educational journey."}
          </p>

          <Card className="p-8 border-none shadow-xl shadow-slate-200/50">
            {isLogin ? (
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-5">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input icon={<Mail className="w-4 h-4" />} placeholder="student@college.edu" {...loginForm.register("email")} />
                  {loginForm.formState.errors.email && <p className="text-sm text-destructive">{loginForm.formState.errors.email.message}</p>}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>Password</Label>
                    <a href="#" className="text-xs text-primary font-semibold hover:underline">Forgot password?</a>
                  </div>
                  <Input type="password" icon={<Lock className="w-4 h-4" />} placeholder="••••••••" {...loginForm.register("password")} />
                  {loginForm.formState.errors.password && <p className="text-sm text-destructive">{loginForm.formState.errors.password.message}</p>}
                </div>
                <Button type="submit" className="w-full h-12 text-lg mt-2" isLoading={isLoggingIn}>
                  Sign In
                </Button>
              </form>
            ) : (
              <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-5">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input icon={<User className="w-4 h-4" />} placeholder="John Doe" {...registerForm.register("name")} />
                  {registerForm.formState.errors.name && <p className="text-sm text-destructive">{registerForm.formState.errors.name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input icon={<Mail className="w-4 h-4" />} placeholder="student@college.edu" {...registerForm.register("email")} />
                  {registerForm.formState.errors.email && <p className="text-sm text-destructive">{registerForm.formState.errors.email.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input type="password" icon={<Lock className="w-4 h-4" />} placeholder="••••••••" {...registerForm.register("password")} />
                  {registerForm.formState.errors.password && <p className="text-sm text-destructive">{registerForm.formState.errors.password.message}</p>}
                </div>
                
                <div className="pt-4 border-t border-slate-100">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Academic Details (Optional)</p>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>College</Label>
                      <Select {...registerForm.register("collegeName")}>
                        <option value="">Select College</option>
                        {colleges?.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Branch</Label>
                        <Input icon={<GraduationCap className="w-4 h-4" />} placeholder="CS, EE..." {...registerForm.register("branch")} />
                      </div>
                      <div className="space-y-2">
                        <Label>Semester</Label>
                        <Select {...registerForm.register("semester")}>
                          <option value="">Select</option>
                          {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>{s}</option>)}
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>

                <Button type="submit" className="w-full h-12 text-lg mt-4" isLoading={isRegistering}>
                  Create Account
                </Button>
              </form>
            )}
          </Card>

          <p className="text-center mt-8 text-slate-500">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              onClick={() => setIsLogin(!isLogin)} 
              className="text-primary font-bold hover:underline"
            >
              {isLogin ? "Sign up" : "Log in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
