import { FC } from "react";
import { motion } from "framer-motion";
import { Clock, AlertCircle, Mail, Phone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface PendingApprovalBannerProps {
  centerName: string;
}

export const PendingApprovalBanner: FC<PendingApprovalBannerProps> = ({ centerName }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <Alert className="border-amber-500/50 bg-amber-500/10">
        <Clock className="h-5 w-5 text-amber-500" />
        <AlertTitle className="text-amber-600 font-semibold">Pending Approval</AlertTitle>
        <AlertDescription className="text-amber-600/80">
          Your center "{centerName}" is currently under review. An administrator will verify your account soon. 
          You can still set up your center profile while waiting.
        </AlertDescription>
      </Alert>

      <Card className="mt-4 border-dashed border-muted-foreground/30">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-muted">
              <AlertCircle className="w-6 h-6 text-muted-foreground" />
            </div>
            <div className="flex-1 space-y-3">
              <h3 className="font-semibold">What happens next?</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">1</span>
                  Our team will review your center information
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">2</span>
                  You'll be notified once your center is approved
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">3</span>
                  After approval, your center will be visible to students
                </li>
              </ul>
              <div className="pt-3 border-t">
                <p className="text-sm text-muted-foreground">
                  Need help? Contact us:
                </p>
                <div className="flex flex-wrap gap-4 mt-2 text-sm">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    support@doppi.uz
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    +998 90 123 45 67
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
