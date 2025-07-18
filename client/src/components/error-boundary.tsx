import React, { Component, ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center min-h-screen p-6">
          <Card className="max-w-md w-full">
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-16 h-16 text-[var(--project-error)] mx-auto mb-4" />
              <h2 className="text-xl font-bold text-[var(--project-text-primary)] mb-2 arabic-text">
                حدث خطأ غير متوقع
              </h2>
              <p className="text-[var(--project-text-secondary)] arabic-text mb-6">
                نعتذر عن هذا الخطأ. يرجى إعادة تحميل الصفحة والمحاولة مرة أخرى.
              </p>
              <Button onClick={this.handleReset} className="btn-primary arabic-text">
                <RefreshCw className="w-4 h-4 ml-2" />
                إعادة تحميل الصفحة
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}