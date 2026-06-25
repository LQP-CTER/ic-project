import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-surface-secondary p-8">
          <div className="max-w-md w-full bg-surface rounded-2xl border border-border p-8 text-center shadow-sm">
            <div className="w-16 h-16 rounded-full bg-danger-light flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-danger">!</span>
            </div>
            <h1 className="text-xl font-bold text-text-primary mb-2">Đã xảy ra lỗi</h1>
            <p className="text-sm text-text-secondary mb-6 leading-relaxed">
              Ứng dụng gặp sự cố không mong muốn. Vui lòng thử tải lại trang.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-primary text-white rounded-lg font-semibold text-sm hover:bg-primary-hover transition-colors"
            >
              Tải lại trang
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
