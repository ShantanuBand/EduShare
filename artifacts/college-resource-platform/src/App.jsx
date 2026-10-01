import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { AuthProvider } from "@/lib/auth";
import Home from "@/pages/home";
import AuthPage from "@/pages/auth";
import ResourceDetail from "@/pages/resource-detail";
import UploadPage from "@/pages/upload";
import ProfilePage from "@/pages/profile";
import BookmarksPage from "@/pages/bookmarks";
import AdminPage from "@/pages/admin";
import AssignmentsPage from "@/pages/assignments";
import PYQPage from "@/pages/pyq";
import ImportantTopicsPage from "@/pages/important-topics";
import PapersPage from "@/pages/papers";
import AiChatPage from "@/pages/ai-chat";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

import { useAuth } from "@/lib/auth";
import { Redirect } from "wouter";
import { Loader2 } from "lucide-react";

function ProtectedRoute({ component: Component }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login">
        <AuthPage mode="login" />
      </Route>
      <Route path="/register">
        <AuthPage mode="register" />
      </Route>
      <Route path="/" component={() => <ProtectedRoute component={Home} />} />
      <Route path="/resource/:id">
        {(params) => <ProtectedRoute component={() => <ResourceDetail params={params} />} />}
      </Route>
      <Route path="/upload" component={() => <ProtectedRoute component={UploadPage} />} />
      <Route path="/profile" component={() => <ProtectedRoute component={ProfilePage} />} />
      <Route path="/bookmarks" component={() => <ProtectedRoute component={BookmarksPage} />} />
      <Route path="/admin" component={() => <ProtectedRoute component={AdminPage} />} />
      <Route path="/assignments" component={() => <ProtectedRoute component={AssignmentsPage} />} />
      <Route path="/pyq" component={() => <ProtectedRoute component={PYQPage} />} />
      <Route path="/important-topics" component={() => <ProtectedRoute component={ImportantTopicsPage} />} />
      <Route path="/papers" component={() => <ProtectedRoute component={PapersPage} />} />
      <Route path="/ai-chat" component={() => <ProtectedRoute component={AiChatPage} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
