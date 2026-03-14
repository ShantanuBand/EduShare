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
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login"><AuthPage mode="login" /></Route>
      <Route path="/register"><AuthPage mode="register" /></Route>
      <Route path="/resource/:id" component={ResourceDetail} />
      <Route path="/upload" component={UploadPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/bookmarks" component={BookmarksPage} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/assignments" component={AssignmentsPage} />
      <Route path="/pyq" component={PYQPage} />
      <Route path="/important-topics" component={ImportantTopicsPage} />
      <Route path="/papers" component={PapersPage} />
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
