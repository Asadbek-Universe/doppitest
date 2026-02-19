import { FC } from "react";
import { motion } from "framer-motion";
import { Sparkles, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAllSubjects } from "@/hooks/useHomeFeed";
import { useUserSubjectInterests } from "@/hooks/useUserSubjectInterests";

interface SubjectFilterProps {
  selectedSubject: string | null;
  onSubjectChange: (subjectId: string | null) => void;
  onResetToForYou?: () => void;
  showResetButton?: boolean;
}

export const SubjectFilter: FC<SubjectFilterProps> = ({
  selectedSubject,
  onSubjectChange,
  onResetToForYou,
  showResetButton = false,
}) => {
  const { data: allSubjects } = useAllSubjects();
  const { data: userInterests } = useUserSubjectInterests();

  // Get user's active subjects first, then fill with other subjects
  const sortedSubjects = allSubjects?.sort((a, b) => {
    const aInterest = userInterests?.find((i) => i.subject_id === a.id);
    const bInterest = userInterests?.find((i) => i.subject_id === b.id);
    const aCount = aInterest?.interaction_count || 0;
    const bCount = bInterest?.interaction_count || 0;
    return bCount - aCount;
  });

  const hasInterests = userInterests && userInterests.length > 0;

  return (
    <motion.div
      className="flex flex-wrap gap-2 mb-4"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* All subjects button */}
      <Badge
        variant="outline"
        className={cn(
          "cursor-pointer transition-all hover:scale-105 py-1.5 px-3",
          selectedSubject === null
            ? "bg-primary text-primary-foreground border-primary"
            : "bg-background hover:bg-accent"
        )}
        onClick={() => onSubjectChange(null)}
      >
        <Sparkles className="w-3.5 h-3.5 mr-1.5" />
        Barchasi
      </Badge>

      {/* Subject badges */}
      {sortedSubjects?.map((subject) => {
        const interest = userInterests?.find((i) => i.subject_id === subject.id);
        const isActive = selectedSubject === subject.id;
        const hasActivity = !!interest;

        return (
          <Badge
            key={subject.id}
            variant="outline"
            className={cn(
              "cursor-pointer transition-all hover:scale-105 py-1.5 px-3 gap-1.5",
              isActive
                ? "bg-primary text-primary-foreground border-primary"
                : hasActivity
                ? "bg-accent/50 border-accent-foreground/20"
                : "bg-background hover:bg-accent"
            )}
            onClick={() => onSubjectChange(subject.id)}
          >
            <span>{subject.icon}</span>
            <span>{subject.name_uz || subject.name}</span>
            {hasActivity && !isActive && (
              <span className="text-xs opacity-60">
                ({interest.interaction_count})
              </span>
            )}
          </Badge>
        );
      })}

      {/* Reset to For You button */}
      {showResetButton && hasInterests && onResetToForYou && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onResetToForYou}
          className="h-7 text-xs text-muted-foreground hover:text-primary gap-1"
        >
          <RotateCcw className="w-3 h-3" />
          Siz uchun
        </Button>
      )}

      {/* Hint for new users */}
      {!hasInterests && (
        <span className="text-xs text-muted-foreground self-center ml-2">
          Test yechib, qiziqishlaringizni aniqlang
        </span>
      )}
    </motion.div>
  );
};
