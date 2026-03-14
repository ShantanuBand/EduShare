import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Search, Upload, Bookmark, User as UserIcon, LogOut, ShieldAlert, Library, Menu, X, Home } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "./ui-elements";
import { useLogout, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
      { href: "/profile", label: "Profile", icon: UserIcon },
    ] : []),
    ...(isAdmin ? [{ href: "/admin", label: "Admin", icon: ShieldAlert }] : []),
  ];

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-white/90 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white shadow-md group-hover:shadow-lg transition-all">
              <Library className="w-4 h-4" />
            </div>
            <span className="font-display font-bold text-lg tracking-tight text-foreground">EduShare</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.filter(l => l.href !== '/profile').map(link => {
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
          </nav>

          {/* Desktop Right */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
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
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => setLocation("/login")}>Log in</Button>
                <Button onClick={() => setLocation("/register")}>Sign up</Button>
              </>
            )}
          </div>

          {/* Mobile Right */}
          <div className="flex md:hidden items-center gap-2">
            {isAuthenticated && (
              <Link href="/profile">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm border border-primary/20">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              </Link>
            )}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
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
              className="fixed right-0 top-0 bottom-0 z-50 w-72 bg-white shadow-2xl md:hidden flex flex-col"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white">
                    <Library className="w-4 h-4" />
                  </div>
                  <span className="font-display font-bold text-lg">EduShare</span>
                </div>
                <button onClick={closeMobileMenu} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* User Info */}
              {isAuthenticated && (
                <div className="px-4 py-3 bg-slate-50 border-b">
                  <p className="font-semibold text-slate-900">{user?.name}</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                  <span className="inline-block mt-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium capitalize">{user?.role}</span>
                </div>
              )}

              {/* Nav Links */}
              <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {navLinks.map(link => {
                  const Icon = link.icon;
                  const isActive = location === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={closeMobileMenu}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="w-5 h-5 shrink-0" />
                      {link.label}
                    </Link>
                  );
                })}
              </nav>

              {/* Drawer Footer */}
              <div className="p-4 border-t">
                {isAuthenticated ? (
                  <button
                    onClick={() => { logout(); closeMobileMenu(); }}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    Log out
                  </button>
                ) : (
                  <div className="space-y-2">
                    <Button className="w-full" onClick={() => { setLocation("/login"); closeMobileMenu(); }}>
                      Log in
                    </Button>
                    <Button variant="outline" className="w-full" onClick={() => { setLocation("/register"); closeMobileMenu(); }}>
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
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border/40 md:hidden safe-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {[
            { href: "/", icon: Home, label: "Home" },
            { href: "/upload", icon: Upload, label: "Upload", authOnly: true },
            { href: "/bookmarks", icon: Bookmark, label: "Saved", authOnly: true },
            { href: "/profile", icon: UserIcon, label: "Profile", authOnly: true },
          ].filter(l => !l.authOnly || isAuthenticated).map(link => {
            const Icon = link.icon;
            const isActive = location === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors min-w-0 ${isActive ? 'text-primary' : 'text-slate-400'}`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="text-[10px] font-medium truncate">{link.label}</span>
              </Link>
            );
          })}
          {!isAuthenticated && (
            <Link href="/login" className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors ${location === '/login' ? 'text-primary' : 'text-slate-400'}`}>
              <UserIcon className="w-5 h-5" />
              <span className="text-[10px] font-medium">Login</span>
            </Link>
          )}
        </div>
      </nav>

      {/* Spacer for bottom nav on mobile */}
      <div className="h-16 md:hidden" />

      <footer className="bg-white border-t py-6 mt-auto hidden md:block">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Library className="w-4 h-4 text-primary" />
            <span className="font-display font-bold text-base text-foreground">EduShare</span>
          </div>
          <p>© {new Date().getFullYear()} College Resource Sharing Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
