import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RotateCcw, Home, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-md mx-auto my-8 p-6 bg-white rounded-3xl border border-amber-200 shadow-lg text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 stroke-[2.5]" />
          </div>

          <div className="space-y-1">
            <h3 className="text-xl font-bold tracking-normal text-slate-900">
              {this.props.fallbackTitle || 'กำลังเปิดหน้าความทรงจำ...'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              พบปัญหาการแสดงผลชั่วคราว กรุณาแตะปุ่มด้านล่างเพื่อเปิดใหม่อีกครั้งนะคะ
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
            <button
              onClick={this.handleRetry}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>ลองใหม่อีกครั้ง</span>
            </button>

            <button
              onClick={this.handleReload}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-all active:scale-95 cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>รีโหลดหน้านี้</span>
            </button>
          </div>

          {import.meta.env.DEV && this.state.error && (
            <details className="mt-3 text-left text-[11px] text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200 overflow-x-auto">
              <summary className="cursor-pointer font-bold">รายละเอียดข้อผิดพลาด (Debug)</summary>
              <pre className="mt-1 whitespace-pre-wrap">{this.state.error.stack || this.state.error.message}</pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
