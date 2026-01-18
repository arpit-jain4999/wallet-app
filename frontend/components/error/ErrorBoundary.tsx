'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Typography } from '@/components/ui/typography';
import { AlertCircle } from 'lucide-react';
import { ERROR_MESSAGES, BUTTON_LABELS, NAV_LABELS } from '@/constants';
import { TypographyVariant, ButtonVariant } from '@/lib/enums';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error Boundary component to catch and handle React errors gracefully
 * 
 * @example
 * ```tsx
 * <ErrorBoundary fallback={<CustomError />}>
 *   <App />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // In production, send to error tracking service (e.g., Sentry)
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to error tracking service
      // logErrorToService(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="rounded-full bg-destructive/10 p-3">
                  <AlertCircle className="h-8 w-8 text-destructive" />
                </div>
                
                <div className="space-y-2">
                  <Typography variant={TypographyVariant.H3}>
                    {ERROR_MESSAGES.SOMETHING_WRONG}
                  </Typography>
                  <Typography variant={TypographyVariant.MUTED}>
                    We're sorry, but something unexpected happened. Please try again.
                  </Typography>
                </div>

                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <div className="w-full p-4 bg-muted rounded-lg text-left">
                    <Typography variant={TypographyVariant.CODE} className="text-xs break-all">
                      {this.state.error.message}
                    </Typography>
                  </div>
                )}

                <div className="flex gap-2 w-full">
                  <Button 
                    onClick={this.handleReset} 
                    className="flex-1"
                  >
                    {BUTTON_LABELS.RETRY}
                  </Button>
                  <Button 
                    onClick={() => window.location.href = '/'} 
                    variant={ButtonVariant.OUTLINE}
                    className="flex-1"
                  >
                    {NAV_LABELS.HOME}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
