import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
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
import MyWork from "@/pages/my-work";
import Workspace from "@/pages/workspace";
import QAQueue from "@/pages/qa-queue";
import QAReview from "@/pages/qa-review";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/sources" component={Sources} />
      <ProtectedRoute path="/templates" component={Templates} />
      <ProtectedRoute path="/work-packets" component={WorkPackets} />
      <ProtectedRoute path="/users" component={Users} />
      <ProtectedRoute path="/approved-terms" component={ApprovedTerms} />
      <ProtectedRoute path="/style-tags" component={StyleTags} />
      <ProtectedRoute path="/contextual-lexicon" component={ContextualLexicon} />
      <ProtectedRoute path="/word-suggestions" component={WordSuggestions} />
      <ProtectedRoute path="/export" component={ExportPage} />
      <ProtectedRoute path="/my-work" component={MyWork} />
      <ProtectedRoute path="/workspace" component={() => <Workspace />} />
      <ProtectedRoute path="/workspace/:id" component={() => <Workspace />} />
      <ProtectedRoute path="/qa-queue" component={QAQueue} />
      <ProtectedRoute path="/qa-review" component={QAReview} />
      <ProtectedRoute path="/qa-review/:id" component={QAReview} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <div className="rtl-container">
              <Toaster />
              <Router />
            </div>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
