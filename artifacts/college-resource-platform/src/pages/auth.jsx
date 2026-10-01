import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useLogin,
  useRegister,
  useListColleges,
  getGetMeQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Input, Button, Label, Card, Select } from "@/components/ui-elements";
import { BookOpen, Mail, Lock, User, GraduationCap, Users, Building, ArrowRight, Github } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MAHARASHTRA_CITIES } from "../lib/constants";


const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  collegeName: z.string().optional(),
});

export default function AuthPage({ mode = "login" }) {
  const [isLogin, setIsLogin] = useState(mode === "login");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: colleges } = useListColleges();

  const [selectedCity, setSelectedCity] = useState("");
  const [selectedUniversity, setSelectedUniversity] = useState("");

  const cities = MAHARASHTRA_CITIES;
  const universities = [...new Set(colleges?.filter((c) => c.state?.toLowerCase() === 'maharashtra' && c.city === selectedCity).map((c) => c.university).filter(Boolean))].sort();
  const filteredColleges = colleges?.filter((c) => 
    c.state?.toLowerCase() === 'maharashtra' &&
    (!selectedCity || c.city === selectedCity) && 
    (!selectedUniversity || c.university === selectedUniversity)
  ) || [];

  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
  });

  const registerForm = useForm({
    resolver: zodResolver(registerSchema),
  });

  const { mutate: login, isPending: isLoggingIn } = useLogin({
    mutation: {
      onSuccess: (data) => {
        queryClient.setQueryData(getGetMeQueryKey(), data.user);
        toast({
          title: "Welcome back!",
          description: "You have successfully logged in.",
        });
        setLocation("/");
      },
      onError: (err) => {
        toast({
          title: "Login failed",
          description: err.message || "Invalid credentials",
          variant: "destructive",
        });
      },
    },
  });

  const { mutate: register, isPending: isRegistering } = useRegister({
    mutation: {
      onSuccess: (data) => {
        queryClient.setQueryData(getGetMeQueryKey(), data.user);
        toast({
          title: "Account created!",
          description: "Welcome to EduShare!",
        });
        setLocation("/");
      },
      onError: (err) => {
        toast({
          title: "Registration failed",
          description: err.message || "Something went wrong",
          variant: "destructive",
        });
      },
    },
  });

  const onLoginSubmit = (data) => {
    login({ data });
  };

  const onRegisterSubmit = (data) => {
    register({ data });
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-slate-50 relative overflow-hidden">
      
      {/* Decorative Wavy Background for Right Side */}
      <div className="absolute right-0 top-0 bottom-0 w-1/2 pointer-events-none hidden lg:block overflow-hidden">
        <img
          src={`${import.meta.env.BASE_URL}images/auth-rhs-bg.png`}
          alt="Abstract decorative background"
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>

      {/* Visual Side */}
      <div className="hidden lg:flex flex-col relative p-12 overflow-hidden">
        <img
          src={`${import.meta.env.BASE_URL}images/auth-bg.jpg`}
          alt="Library"
          className="absolute inset-0 w-full h-full object-cover"
        />

        <div className="relative z-10 flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-10 text-emerald-600">
            <BookOpen className="w-8 h-8" />
            <span className="font-display font-bold text-2xl text-slate-800">EduShare</span>
          </div>

          <div className="mt-12 max-w-[540px] bg-white/40 backdrop-blur-md p-8 rounded-[2rem] border border-white/60 shadow-2xl">
            <div className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-bold mb-6 bg-white text-emerald-700 border border-emerald-100 shadow-sm">
              Learn • Share • Grow Together
            </div>
            
            <h1 className="text-[3.5rem] font-display font-extrabold text-slate-900 mb-4 leading-[1.05] tracking-tight">
              Unlock your <br />
              <span className="text-emerald-600">academic</span> potential.
            </h1>
            
            <p className="text-xl text-slate-800 font-bold mb-10">
              Join thousands of students sharing knowledge, notes, and resources
              to succeed together.
            </p>

            <div className="grid grid-cols-2 gap-4 max-w-md">
              <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-white flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                  <Users className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 leading-tight">10K+</h3>
                  <p className="text-slate-500 text-xs font-semibold">Study Resources</p>
                </div>
              </div>
              
              <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-white flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                  <Building className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 leading-tight">50+</h3>
                  <p className="text-slate-500 text-xs font-semibold">Colleges Joined</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Side */}
      <div className="flex flex-col justify-center px-6 py-4 lg:px-24 relative z-10 h-screen overflow-y-auto">
        <div className="w-full max-w-[420px] mx-auto my-auto py-4">
          {/* Mobile Logo */}
          <div className="flex items-center gap-2 mb-6 lg:hidden text-emerald-600">
            <BookOpen className="w-6 h-6" />
            <span className="font-display font-bold text-xl text-slate-900">EduShare</span>
          </div>

          {/* Desktop Form Logo (Matches mockup) */}
          <div className="hidden lg:flex items-center gap-2 mb-6 text-emerald-600">
            <BookOpen className="w-7 h-7" />
            <span className="font-display font-bold text-xl text-slate-900">EduShare</span>
          </div>

          <h2 className="text-3xl lg:text-4xl font-display font-extrabold text-slate-900 mb-2 leading-tight tracking-tight">
            {isLogin ? (
              <>Welcome <span className="text-emerald-600">back</span></>
            ) : (
              <>Create an <span className="text-emerald-600">account</span></>
            )}
          </h2>


          <Card className="p-5 border border-slate-100 shadow-2xl shadow-slate-200/50 rounded-2xl bg-white/90 backdrop-blur-sm">
            {isLogin ? (
              <form
                onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                className="space-y-3"
              >
                <div className="space-y-1.5">
                  <Label className="font-bold text-slate-700">Email</Label>
                  <Input
                    icon={<Mail className="w-4 h-4 text-slate-400" />}
                    placeholder="student@college.edu"
                    className="h-10 bg-slate-50/50 border-slate-200"
                    {...loginForm.register("email")}
                  />
                  {loginForm.formState.errors.email && (
                    <p className="text-sm text-destructive font-medium">
                      {loginForm.formState.errors.email.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <Label className="font-bold text-slate-700">Password</Label>
                    <a
                      href="#"
                      className="text-xs text-blue-600 font-bold hover:underline"
                    >
                      Forgot password?
                    </a>
                  </div>
                  <Input
                    type="password"
                    icon={<Lock className="w-4 h-4 text-slate-400" />}
                    placeholder="••••••••"
                    className="h-10 bg-slate-50/50 border-slate-200"
                    {...loginForm.register("password")}
                  />
                  {loginForm.formState.errors.password && (
                    <p className="text-sm text-destructive font-medium">
                      {loginForm.formState.errors.password.message}
                    </p>
                  )}
                </div>
                <Button
                  type="submit"
                  className="w-full h-10 text-sm font-bold mt-2 bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-lg shadow-emerald-600/20"
                  isLoading={isLoggingIn}
                >
                  Sign In <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </form>
            ) : (
              <form
                onSubmit={registerForm.handleSubmit(onRegisterSubmit)}
                className="space-y-3"
              >
                <div className="space-y-1.5">
                  <Label className="font-bold text-slate-700">Full Name</Label>
                  <Input
                    icon={<User className="w-4 h-4 text-slate-400" />}
                    placeholder="John Doe"
                    className="h-10 bg-slate-50/50 border-slate-200"
                    {...registerForm.register("name")}
                  />
                  {registerForm.formState.errors.name && (
                    <p className="text-sm text-destructive">
                      {registerForm.formState.errors.name.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="font-bold text-slate-700">Email</Label>
                  <Input
                    icon={<Mail className="w-4 h-4 text-slate-400" />}
                    placeholder="student@college.edu"
                    className="h-10 bg-slate-50/50 border-slate-200"
                    {...registerForm.register("email")}
                  />
                  {registerForm.formState.errors.email && (
                    <p className="text-sm text-destructive">
                      {registerForm.formState.errors.email.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="font-bold text-slate-700">Password</Label>
                  <Input
                    type="password"
                    icon={<Lock className="w-4 h-4 text-slate-400" />}
                    placeholder="••••••••"
                    className="h-10 bg-slate-50/50 border-slate-200"
                    {...registerForm.register("password")}
                  />
                  {registerForm.formState.errors.password && (
                    <p className="text-sm text-destructive">
                      {registerForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Academic Details (Optional)
                  </p>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="font-bold text-slate-700">City</Label>
                      <Select 
                        value={selectedCity} 
                        onChange={(e) => {
                          setSelectedCity(e.target.value);
                          setSelectedUniversity("");
                          registerForm.setValue("collegeName", "");
                        }}
                        className="h-10 bg-slate-50/50 border-slate-200 text-sm"
                      >
                        <option value="">Select City</option>
                        {cities.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </Select>
                    </div>
                    
                    <div className="space-y-1.5">
                      <Label className="font-bold text-slate-700">University</Label>
                      <Select 
                        value={selectedUniversity} 
                        onChange={(e) => {
                          setSelectedUniversity(e.target.value);
                          registerForm.setValue("collegeName", "");
                        }}
                        disabled={!selectedCity}
                        className="h-10 bg-slate-50/50 border-slate-200 disabled:opacity-50 text-sm"
                      >
                        <option value="">Select University</option>
                        {universities.map((u) => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="font-bold text-slate-700">College</Label>
                      <Select {...registerForm.register("collegeName")} className="h-10 bg-slate-50/50 border-slate-200 text-sm">
                        <option value="">Select College</option>
                        {filteredColleges.map((c) => (
                          <option key={c.id} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-10 text-sm font-bold mt-3 bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-lg shadow-emerald-600/20"
                  isLoading={isRegistering}
                >
                  Create Account <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </form>
            )}
          </Card>

          <p className="text-center mt-6 text-slate-500 font-medium">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-emerald-600 font-bold hover:underline"
            >
              {isLogin ? "Sign up" : "Log in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
