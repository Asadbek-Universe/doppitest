import { FC, ReactNode } from "react";
import { Link, Navigate } from "react-router-dom";
import { Building2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole, useOwnsCenter } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  </div>
);

export const CenterPanelGate: FC<{ children: ReactNode }> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const { data: role, isLoading: roleLoading } = useUserRole();
  const { data: ownsCenter, isLoading: ownsCenterLoading } = useOwnsCenter();

  const isCenter = role === "center" || ownsCenter === true;

  if (authLoading || (user && roleLoading) || (user && role !== "center" && ownsCenterLoading)) {
    return <PageLoader />;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 px-4 flex flex-col items-center justify-center min-h-[70vh]">
          <Card className="w-full max-w-md border-primary/20">
            <CardContent className="pt-8 pb-8 text-center space-y-6">
              <Building2 className="w-14 h-14 text-primary mx-auto" />
              <div>
                <h1 className="text-2xl font-bold mb-2">Center Panel</h1>
                <p className="text-muted-foreground text-sm">
                  Sign in with your center account to manage courses, tests, and students.
                </p>
              </div>
              <Button asChild size="lg" className="w-full">
                <Link to="/auth">Sign in</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (!roleLoading && !ownsCenterLoading && !isCenter) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 px-4 flex flex-col items-center justify-center min-h-[70vh]">
          <Card className="w-full max-w-md border-muted">
            <CardContent className="pt-8 pb-8 text-center space-y-6">
              <Building2 className="w-14 h-14 text-muted-foreground mx-auto" />
              <div>
                <h1 className="text-2xl font-bold mb-2">Center access only</h1>
                <p className="text-muted-foreground text-sm">
                  This page is for educational center accounts. Use the dashboard link below to continue.
                </p>
              </div>
              <Button asChild variant="outline" size="lg" className="w-full">
                <Link to="/dashboard">Go to dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return <>{children}</>;
};

export default CenterPanelGate;
