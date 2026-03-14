import { Link, useLocation } from "wouter";
import { BookOpen, Search, Upload, Bookmark, User as UserIcon, LogOut, ShieldAlert, Library } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "./ui-elements";
import { useLogout } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetMeQueryKey } from "@workspace/api-client-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const { mutate: logout } = useLogout({
    mutation: {
      onSuccess: () => {
        queryClient.setQueryData(getGetMeQueryKey(), null);
        setLocation("/login");
      }
    }
  });

  const navLinks = [
    { href: "/", label: "Browse", icon: Search },
    ...(isAuthenticated ? [
      { href: "/upload", label: "Upload", icon: Upload },
      { href: "/bookmarks", label: "Bookmarks", icon: Bookmark },
    ] : []),
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white shadow-md group-hover:shadow-lg transition-all group-hover:-translate-y-0.5">
              <Library className="w-5 h-5" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-foreground">EduShare</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map(link => {
              const Icon = link.icon;
              const isActive = location === link.href;
              return (
                <Link 
                  key={link.href} 
                  href={link.href}
                  className={`flex items-center gap-2 text-sm font-semibold transition-colors hover:text-primary ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
            {isAdmin && (
              <Link href="/admin" className={`flex items-center gap-2 text-sm font-semibold transition-colors hover:text-accent ${location.startsWith('/admin') ? 'text-accent' : 'text-muted-foreground'}`}>
                <ShieldAlert className="w-4 h-4" />
                Admin
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link href="/profile">
                  <div className="flex items-center gap-2 cursor-pointer group">
                    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm border border-primary/20 group-hover:bg-primary group-hover:text-white transition-colors">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="hidden lg:block text-sm">
                      <p className="font-semibold text-foreground leading-none">{user?.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{user?.role}</p>
                    </div>
                  </div>
                </Link>
                <Button variant="ghost" size="icon" onClick={() => logout()} title="Logout">
                  <LogOut className="w-4 h-4 text-muted-foreground" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Button variant="ghost" onClick={() => setLocation("/login")}>Log in</Button>
                <Button onClick={() => setLocation("/register")}>Sign up</Button>
              </div>
            )}
          </div>
        </div>
      </header>
      
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        {children}
      </main>

      <footer className="bg-white border-t py-8 mt-auto">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Library className="w-5 h-5 text-primary" />
            <span className="font-display font-bold text-lg text-foreground">EduShare</span>
          </div>
          <p>© {new Date().getFullYear()} College Resource Sharing Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
