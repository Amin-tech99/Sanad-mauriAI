import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { FeatureProvider } from "@/hooks/use-feature";
import { ProtectedRoute } from "@/lib/protected-route";
import { ErrorBoundary } from "@/components/error-boundary";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import Sources from "@/pages/sources";
import Templates from "@/pages/templates";
import WorkPackets from "@/pages/work-packets";
import Users from "@/pages/users";
import ExportPage from "@/pages/export";
import ApprovedTerms from "@/pages/approved-terms";
import StyleTags from "@/pages/style-tags";
import ContextualLexicon from "@/pages/contextual-lexicon";
import WordSuggestions from "@/pages/word-suggestions";
import PlatformControl from "@/pages/platform-control";
import Analytics from "@/pages/analytics";
import MyWork from "@/pages/my-work";
import Workspace from "@/pages/workspace";
import { MobileWorkspace } from "@/pages/mobile-workspace";
import { ResponsiveWorkspace } from "@/pages/responsive-workspace";
import QAQueue from "@/pages/qa-queue";
import QAReview from "@/pages/qa-review";
import Conversations from "@/pages/conversations";
import NotFound from "@/pages/not-found";

// Role-based redirect component
function RoleBasedRedirect() {
  const { user } = useAuth();
  
  if (!user) {
    return <Redirect to="/auth" />;
  }
  
  // Redirect based on user role
  switch (user.role) {
    case "admin":
      return <Redirect to="/dashboard" />;
    case "translator":
      return <Redirect to="/my-work" />;
    case "qa":
      return <Redirect to="/qa-queue" />;
    default:
      return <Redirect to="/auth" />;
  }
}

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/" component={RoleBasedRedirect} />
      <ProtectedRoute path="/dashboard" component={Dashboard} />
      <ProtectedRoute path="/sources" component={Sources} />
      <ProtectedRoute path="/templates" component={Templates} />
      <ProtectedRoute path="/work-packets" component={WorkPackets} />
      <ProtectedRoute path="/users" component={Users} />
      <ProtectedRoute path="/approved-terms" component={ApprovedTerms} />
      <ProtectedRoute path="/style-tags" component={StyleTags} />
      <ProtectedRoute path="/contextual-lexicon" component={ContextualLexicon} />
      <ProtectedRoute path="/word-suggestions" component={WordSuggestions} />
      <ProtectedRoute path="/platform-control" component={PlatformControl} />
      <ProtectedRoute path="/analytics" component={Analytics} />
      <ProtectedRoute path="/export" component={ExportPage} />
      <ProtectedRoute path="/my-work" component={MyWork} />
      <ProtectedRoute path="/workspace" component={() => <ResponsiveWorkspace />} />
      <ProtectedRoute path="/workspace/:id" component={() => <ResponsiveWorkspace />} />
      <ProtectedRoute path="/mobile-workspace" component={() => <MobileWorkspace />} />
      <ProtectedRoute path="/desktop-workspace" component={() => <Workspace />} />
      <ProtectedRoute path="/qa-queue" component={QAQueue} />
      <ProtectedRoute path="/qa-review" component={QAReview} />
      <ProtectedRoute path="/qa-review/:id" component={QAReview} />
      <ProtectedRoute path="/conversations" component={Conversations} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <FeatureProvider>
            <TooltipProvider>
              <div className="rtl-container">
                <Toaster />
                <Router />
              </div>
            </TooltipProvider>
          </FeatureProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
