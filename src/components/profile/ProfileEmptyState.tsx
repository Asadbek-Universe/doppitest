import { FC } from "react";
import { Link } from "react-router-dom";
import { BookOpen, FileText, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";

export const ProfileEmptyState: FC<{ type?: "overview" | "courses" | "tests" }> = ({ type = "overview" }) => {
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/30 p-8 md:p-12 text-center">
      <p className="text-muted-foreground mb-4">
        Start your first course or test to begin tracking your learning progress.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button asChild variant="default" className="gap-2">
          <Link to="/">
            <GraduationCap className="w-4 h-4" />
            Start Learning
          </Link>
        </Button>
        <Button asChild variant="outline" className="gap-2">
          <Link to="/courses">
            <BookOpen className="w-4 h-4" />
            Explore Courses
          </Link>
        </Button>
        <Button asChild variant="outline" className="gap-2">
          <Link to="/tests">
            <FileText className="w-4 h-4" />
            Take a Test
          </Link>
        </Button>
      </div>
    </div>
  );
};
