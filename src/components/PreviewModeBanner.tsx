import { FC } from "react";
import { motion } from "framer-motion";
import { Eye, AlertCircle, Building2 } from "lucide-react";
import { usePreviewMode } from "@/hooks/usePreviewMode";
import { cn } from "@/lib/utils";

interface PreviewModeBannerProps {
  className?: string;
  compact?: boolean;
}

export const PreviewModeBanner: FC<PreviewModeBannerProps> = ({ 
  className,
  compact = false 
}) => {
  const { isPreviewMode, isCenter } = usePreviewMode();

  if (!isPreviewMode || !isCenter) return null;

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-600 dark:text-amber-400 text-xs font-medium",
          className
        )}
      >
        <Eye className="w-3.5 h-3.5" />
        <span>Preview Mode</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-500/30 rounded-xl p-4",
        className
      )}
    >
      <div className="flex items-center gap-4">
        <div className="p-2.5 rounded-full bg-amber-500/20">
          <Building2 className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <Eye className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <h3 className="font-semibold text-amber-700 dark:text-amber-300">
              Preview Mode – Center Account
            </h3>
          </div>
          <p className="text-sm text-amber-600/80 dark:text-amber-400/80">
            You're viewing this content as students see it. Interactive features are disabled.
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-amber-500/20 rounded-lg">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
            Read-Only
          </span>
        </div>
      </div>
    </motion.div>
  );
};

// Inline preview indicator for buttons/actions
export const PreviewIndicator: FC<{ className?: string }> = ({ className }) => {
  const { isPreviewMode } = usePreviewMode();

  if (!isPreviewMode) return null;

  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-medium rounded",
      className
    )}>
      <Eye className="w-3 h-3" />
      Preview
    </span>
  );
};
