import { FC, ReactNode } from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { usePreviewMode } from "@/hooks/usePreviewMode";
import { Eye, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PreviewButtonProps extends ButtonProps {
  children: ReactNode;
  previewText?: string;
}

/**
 * A button that is disabled in preview mode (for Center accounts).
 * Shows a tooltip explaining why the action is disabled.
 */
export const PreviewButton: FC<PreviewButtonProps> = ({
  children,
  previewText = "This action is disabled in preview mode",
  className,
  disabled,
  ...props
}) => {
  const { isPreviewMode, canInteract } = usePreviewMode();

  const isDisabled = disabled || !canInteract;

  if (isPreviewMode && !canInteract) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              {...props}
              className={cn(
                "relative opacity-60 cursor-not-allowed",
                className
              )}
              disabled
            >
              <Lock className="w-3.5 h-3.5 mr-1.5 opacity-70" />
              {children}
            </Button>
          </TooltipTrigger>
          <TooltipContent 
            side="top" 
            className="bg-amber-500/90 text-white border-amber-600"
          >
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              <span>{previewText}</span>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Button {...props} className={className} disabled={isDisabled}>
      {children}
    </Button>
  );
};
