import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import i18n from "../i18n";

interface Props {
  children?: ReactNode;
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
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#e8e0d8] p-4">
          <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border border-red-100 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={32} className="text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{i18n.t('error.title')}</h1>
            <p className="text-gray-600 mb-6">
              {i18n.t('error.desc')}
            </p>
            {this.state.error && (
              <div className="bg-gray-100 p-4 rounded-lg text-left overflow-auto text-xs text-gray-800 mb-6 max-h-40">
                <code>{this.state.error.message}</code>
              </div>
            )}
            <button
              onClick={() => window.location.href = "/"}
              className="bg-[#1b3a4b] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#234b61] transition-colors w-full"
            >
              {i18n.t('error.back')}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
