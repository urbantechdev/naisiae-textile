import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-[#08047D] text-white flex flex-col items-center justify-center p-6 text-center space-y-6">
          <div className="max-w-md space-y-4">
            <h1 className="text-4xl font-black uppercase tracking-tight text-[#08047D]">
              System Interrupted
            </h1>
            <p className="text-white/60">
              The apparel platform encountered a critical synchronization error. This is usually caused by a configuration mismatch or missing network credentials.
            </p>
            <div className="bg-white/5 border border-white/10 p-4 rounded-xl text-left overflow-auto max-h-40">
              <p className="font-mono text-[10px] text-red-400 break-all">
                {this.state.error?.toString()}
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="bg-white text-[#08047D] px-8 py-3 rounded-full font-black text-xs uppercase tracking-widest hover:bg-[#FA9411] hover:text-white transition-all shadow-xl"
            >
              Re-initialize Session
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
