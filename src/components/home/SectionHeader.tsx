import { FC, ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SectionHeaderProps {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  viewAllLink?: string;
  viewAllText?: string;
}

export const SectionHeader: FC<SectionHeaderProps> = ({
  icon,
  title,
  subtitle,
  viewAllLink,
  viewAllText = "View All",
}) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
          {icon}
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>
      {viewAllLink && (
        <Button variant="ghost" className="text-primary" asChild>
          <Link to={viewAllLink}>
            {viewAllText}
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </Button>
      )}
    </div>
  );
};
