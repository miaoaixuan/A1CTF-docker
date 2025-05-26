import React, { Component, ReactNode } from "react";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false };

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("Error caught by ErrorBoundary:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback || (
                <div style={{ padding: "20px", textAlign: "center" }}>
                    <h1>⚠️ 发生致命错误</h1>
                    <p>{this.state.error?.message}</p>
                    <button onClick={() => window.location.reload()}>重新加载</button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;