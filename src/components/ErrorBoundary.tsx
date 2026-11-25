import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error?.message || 'Ocurrió un error inesperado en la interfaz.',
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#0B1711] flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-2xl bg-white dark:bg-[#12231A] border border-[#E4E7E4] dark:border-[#243E30] p-6 space-y-4 text-center">
            <div className="mx-auto h-11 w-11 rounded-xl bg-[#9E2A2B]/10 dark:bg-[#9E2A2B]/25 text-[#9E2A2B] dark:text-[#F08A84] flex items-center justify-center">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <h1 className="font-display text-xl font-bold text-[#17211B] dark:text-[#F3E9D4]">
              Algo interrumpió la vista
            </h1>
            <p className="text-sm text-[#5B6860] dark:text-[#B4AA95] leading-relaxed">
              {this.state.message}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#14452F] dark:bg-[#216142] text-white dark:text-[#FAF3E3] text-sm font-semibold hover:bg-[#0F3524] dark:hover:bg-[#297550] inline-flex items-center justify-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Recargar aplicación
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
