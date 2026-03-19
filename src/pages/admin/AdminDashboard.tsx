import { Component, FC, ReactNode } from "react";
import AdminPanel from "../AdminPanel";

class AdminErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; message?: string }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, message: undefined };
  }

  static getDerivedStateFromError(error: unknown) {
    return { hasError: true, message: error instanceof Error ? error.message : String(error) };
  }

  componentDidCatch(error: unknown, errorInfo: unknown) {
    // Log to console so we can see the real issue when debugging
    // without crashing the whole admin route.
    // eslint-disable-next-line no-console
    console.error("AdminPanel crashed:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8">
          <h1 className="text-2xl font-bold mb-4 text-destructive">Admin dashboard error</h1>
          <p className="text-muted-foreground mb-2">
            Something went wrong while loading the admin panel.
          </p>
          {this.state.message && (
            <pre className="mt-4 rounded bg-muted p-3 text-xs whitespace-pre-wrap break-all">
              {this.state.message}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

// Use the full AdminPanel as the main admin dashboard, wrapped in an error boundary
// so that any runtime error shows a message instead of a blank screen.
const AdminDashboard: FC = () => {
  return (
    <AdminErrorBoundary>
      <AdminPanel />
    </AdminErrorBoundary>
  );
};

export default AdminDashboard;




