import { FC, useState } from "react";
import { Trash2, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

export const DangerZone: FC = () => {
  const { toast } = useToast();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

  const handleDeleteAccount = () => {
    setDeleteOpen(false);
    toast({
      title: "Account deletion",
      description: "Contact support to permanently delete your account.",
      variant: "destructive",
    });
  };

  const handleDataReset = () => {
    setResetOpen(false);
    toast({
      title: "Data reset",
      description: "This feature is not yet available. Contact support if you need to reset progress.",
      variant: "destructive",
    });
  };

  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="w-5 h-5" />
          Danger zone
        </CardTitle>
        <CardDescription>
          Irreversible actions. Proceed with caution.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-lg border border-destructive/30 bg-background">
          <div>
            <p className="font-medium text-foreground">Delete account</p>
            <p className="text-sm text-muted-foreground">
              Permanently delete your account and all data.
            </p>
          </div>
          <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="gap-2">
                <Trash2 className="w-4 h-4" />
                Delete account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete account?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. All your data, progress, and certificates will be permanently removed.
                  If you need help, contact support instead.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  I understand, delete my account
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-lg border border-destructive/30 bg-background">
          <div>
            <p className="font-medium text-foreground">Reset progress data</p>
            <p className="text-sm text-muted-foreground">
              Clear test history, course progress, and goals. Account remains.
            </p>
          </div>
          <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="gap-2 border-destructive/50 text-destructive hover:bg-destructive/10">
                <Trash2 className="w-4 h-4" />
                Reset data
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset all progress?</AlertDialogTitle>
                <AlertDialogDescription>
                  Your test history, course progress, saved items, and goals will be cleared.
                  This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDataReset}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Reset my data
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
};
