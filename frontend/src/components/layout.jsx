import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Search,
  Upload,
  Bookmark,
  User as UserIcon,
  LogOut,
  ShieldAlert,
  Library, BookOpen,
  Menu,
  X,
  Home,
  ClipboardList,
  FileQuestion,
  Sparkles,
  Layers,
  ChevronDown,
  Bot,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "./ui-elements.jsx";
import { useLogout, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";

const SECTIONS = [
  {
    href: "/assignments",
    label: "Assignments",
    icon: ClipboardList,
    color: "text-orange-600",
  },
  {
    href: "/pyq",
    label: "Previous Year Questions",
    icon: FileQuestion,
    color: "text-violet-600",
  },
  {
    href: "/important-topics",
    label: "Important Topics",
    icon: Sparkles,
    color: "text-emerald-600",
  },
  {
    href: "/papers",
    label: "Semester Papers",
    icon: Layers,
    color: "text-sky-600",
  },
  {
    href: "/ai-chat",
    label: "AI Assistant",
    icon: Bot,
    color: "text-indigo-600",
  },
];

export function Layout({ children }) {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sectionsOpen, setSectionsOpen] = useState(false);
  const queryClient = useQueryClient();

  const { mutate: logout } = useLogout({
    mutation: {
      onSuccess: () => {
        queryClient.setQueryData(getGetMeQueryKey(), null);
        setLocation("/login");
      },
    },
  });

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const isSectionActive = SECTIONS.some((s) => location.startsWith(s.href));

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-white/90 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md group-hover:shadow-lg transition-all">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="font-display font-bold text-lg tracking-tight text-foreground">
              EduShare
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${location === "/" ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-primary hover:bg-slate-50"}`}
            >
              <Search className="w-4 h-4" />
              Browse
            </Link>

            {/* Sections Dropdown */}
            <div className="relative">
              <button
                onClick={() => setSectionsOpen(!sectionsOpen)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${isSectionActive ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-primary hover:bg-slate-50"}`}
              >
                <Layers className="w-4 h-4" />
                Sections
                <ChevronDown
                  className={`w-3 h-3 transition-transform ${sectionsOpen ? "rotate-180" : ""}`}
                />
              </button>
              <AnimatePresence>
                {sectionsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.12 }}
                    className="absolute top-full left-0 mt-1 z-50"
                  >
                    <div 
                      className="fixed inset-0 -z-10" 
                      onClick={() => setSectionsOpen(false)} 
                    />
                    <div className="w-56 bg-white rounded-xl border border-slate-200 shadow-xl p-1.5 relative">
                      {SECTIONS.map((s) => {
                        const Icon = s.icon;
                        return (
                          <Link
                            key={s.href}
                            href={s.href}
                            onClick={() => setSectionsOpen(false)}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors hover:bg-slate-50 ${location === s.href ? "bg-slate-50" : ""}`}
                          >
                            <Icon className={`w-4 h-4 ${s.color}`} />
                            <span className="text-slate-700">{s.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {isAuthenticated && (
              <>
                <Link
                  href="/upload"
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${location === "/upload" ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-primary hover:bg-slate-50"}`}
                >
                  <Upload className="w-4 h-4" />
                  Upload
                </Link>
                <Link
                  href="/bookmarks"
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${location === "/bookmarks" ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-primary hover:bg-slate-50"}`}
                >
                  <Bookmark className="w-4 h-4" />
                  Bookmarks
                </Link>
              </>
            )}
            {isAdmin && (
              <Link
                href="/admin"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${location.startsWith("/admin") ? "text-accent bg-accent/5" : "text-muted-foreground hover:text-accent hover:bg-slate-50"}`}
              >
                <ShieldAlert className="w-4 h-4" />
                Admin
              </Link>
            )}
          </nav>

          {/* Desktop Right */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            {isAuthenticated ? (
              <>
                <Link href="/profile">
                  <div className="flex items-center gap-2 cursor-pointer group">
                    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm border border-primary/20 group-hover:bg-primary group-hover:text-white transition-colors">
                      {user?.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div className="hidden lg:block text-sm">
                      <p className="font-semibold text-foreground leading-none">
                        {user?.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                        {user?.role}
                      </p>
                    </div>
                  </div>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => logout()}
                  title="Logout"
                >
                  <LogOut className="w-4 h-4 text-muted-foreground" />
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => setLocation("/login")}>
                  Log in
                </Button>
                <Button onClick={() => setLocation("/register")}>
                  Sign up
                </Button>
              </>
            )}
          </div>

          {/* Mobile Right */}
          <div className="flex md:hidden items-center gap-2">
            {isAuthenticated && (
              <Link href="/profile">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm border border-primary/20">
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </div>
              </Link>
            )}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm md:hidden"
              onClick={closeMobileMenu}
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-72 bg-white shadow-2xl md:hidden flex flex-col overflow-y-auto"
            >
              <div className="flex items-center justify-between p-4 border-b shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <span className="font-display font-bold text-lg">
                    EduShare
                  </span>
                </div>
                <button
                  onClick={closeMobileMenu}
                  className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {isAuthenticated && (
                <div className="px-4 py-3 bg-slate-50 border-b shrink-0">
                  <p className="font-semibold text-slate-900">{user?.name}</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                  <span className="inline-block mt-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium capitalize">
                    {user?.role}
                  </span>
                </div>
              )}

              <nav className="flex-1 p-4 space-y-1">
                {[
                  { href: "/", label: "Browse All", icon: Search },
                  ...(isAuthenticated
                    ? [
                        { href: "/upload", label: "Upload", icon: Upload },
                        {
                          href: "/bookmarks",
                          label: "Bookmarks",
                          icon: Bookmark,
                        },
                        { href: "/profile", label: "Profile", icon: UserIcon },
                      ]
                    : []),
                  ...(isAdmin
                    ? [{ href: "/admin", label: "Admin", icon: ShieldAlert }]
                    : []),
                ].map((link) => {
                  const Icon = link.icon;
                  const isActive = location === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={closeMobileMenu}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${isActive ? "bg-primary/10 text-primary" : "text-slate-700 hover:bg-slate-100"}`}
                    >
                      <Icon className="w-5 h-5 shrink-0" />
                      {link.label}
                    </Link>
                  );
                })}

                {/* Sections Group */}
                <div className="pt-2">
                  <p className="px-4 py-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Sections
                  </p>
                  {SECTIONS.map((s) => {
                    const Icon = s.icon;
                    const isActive = location === s.href;
                    return (
                      <Link
                        key={s.href}
                        href={s.href}
                        onClick={closeMobileMenu}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${isActive ? "bg-primary/10 text-primary" : "text-slate-700 hover:bg-slate-100"}`}
                      >
                        <Icon className={`w-5 h-5 shrink-0 ${s.color}`} />
                        {s.label}
                      </Link>
                    );
                  })}
                </div>
              </nav>

              <div className="p-4 border-t shrink-0">
                {isAuthenticated ? (
                  <button
                    onClick={() => {
                      logout();
                      closeMobileMenu();
                    }}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    Log out
                  </button>
                ) : (
                  <div className="space-y-2">
                    <Button
                      className="w-full"
                      onClick={() => {
                        setLocation("/login");
                        closeMobileMenu();
                      }}
                    >
                      Log in
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setLocation("/register");
                        closeMobileMenu();
                      }}
                    >
                      Sign up
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-3 sm:p-4 md:p-6 lg:p-8">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border/40 md:hidden">
        <div className="flex items-center justify-around h-16 px-1">
          {[
            { href: "/", icon: Home, label: "Home" },
            { href: "/pyq", icon: FileQuestion, label: "PYQ" },
            { href: "/assignments", icon: ClipboardList, label: "Assignments" },
            { href: "/papers", icon: Layers, label: "Papers" },
            ...(isAuthenticated
              ? [{ href: "/profile", icon: UserIcon, label: "Profile" }]
              : [{ href: "/login", icon: UserIcon, label: "Login" }]),
          ].map((link) => {
            const Icon = link.icon;
            const isActive = location === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors ${isActive ? "text-primary" : "text-slate-400"}`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="text-[10px] font-medium truncate max-w-[52px] text-center">
                  {link.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="h-16 md:hidden" />

      <footer className="bg-white border-t py-6 mt-auto hidden md:block">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Library className="w-4 h-4 text-primary" />
            <span className="font-display font-bold text-base text-foreground">
              EduShare
            </span>
          </div>
          <p>
            © {new Date().getFullYear()} College Resource Sharing Platform. All
            rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
