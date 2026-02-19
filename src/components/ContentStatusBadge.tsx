import { FC } from "react";
import { FileEdit, AlertCircle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ContentStatus, getStatusLabel } from "@/lib/content-visibility";

interface ContentStatusBadgeProps {
  status: ContentStatus;
  showIcon?: boolean;
  className?: string;
}

/**
 * Badge component for displaying content visibility status
 * Used to show Draft, Incomplete, or Published status for center content
 */
export const ContentStatusBadge: FC<ContentStatusBadgeProps> = ({
  status,
  showIcon = true,
  className,
}) => {
  const label = getStatusLabel(status);
  
  const Icon = status === 'published' 
    ? CheckCircle2 
    : status === 'draft' 
      ? FileEdit 
      : AlertCircle;

  return (
    <Badge variant={status} className={className}>
      {showIcon && <Icon className="w-3 h-3 mr-1" />}
      {label}
    </Badge>
  );
};
