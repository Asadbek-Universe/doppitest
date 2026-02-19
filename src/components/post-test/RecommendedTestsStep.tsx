import { FC } from "react";
import { motion } from "framer-motion";
import { FileText, Clock, TrendingUp, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useRecommendedTests } from "@/hooks/usePostTestRecommendations";
import { useNavigate } from "react-router-dom";

interface TestResults {
  score: number;
  totalPoints: number;
  percentage: number;
  subjectId?: string | null;
  weakTopics: string[];
  timeSpent: number;
}

interface RecommendedTestsStepProps {
  results: TestResults;
  currentTestId: string;
}

const getDifficultyLabel = (difficulty: number) => {
  if (difficulty <= 2) return "Easy";
  if (difficulty <= 4) return "Medium";
  return "Hard";
};

const getDifficultyColor = (difficulty: number) => {
  if (difficulty <= 2) return "text-green-500";
  if (difficulty <= 4) return "text-orange-500";
  return "text-red-500";
};

export const RecommendedTestsStep: FC<RecommendedTestsStepProps> = ({
  results,
  currentTestId,
}) => {
  const navigate = useNavigate();
  const { data: tests, isLoading } = useRecommendedTests(results, currentTestId);

  const handleSolveNow = (testId: string) => {
    // Navigate to tests page - in a full implementation, would start the test directly
    navigate(`/tests?selected=${testId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!tests || tests.length === 0) {
    return (
      <div className="text-center py-16">
        <FileText className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-foreground mb-2">
          No Recommendations Yet
        </h3>
        <p className="text-muted-foreground">
          We couldn't find any additional tests to recommend at this time.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Recommended Tests
        </h2>
        <p className="text-muted-foreground">
          Based on your performance, these tests will help you improve
        </p>
      </div>

      <div className="grid gap-4">
        {tests.map((test, index) => (
          <motion.div
            key={test.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="hover:shadow-lg transition-all duration-300">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {test.subject && (
                        <Badge
                          variant="outline"
                          style={{
                            borderColor: test.subject.color || undefined,
                            color: test.subject.color || undefined,
                          }}
                        >
                          {test.subject.name}
                        </Badge>
                      )}
                      {test.is_official && (
                        <Badge className="bg-primary text-primary-foreground">
                          Official
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">
                      {test.title}
                    </h3>
                    {test.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {test.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        <span>{test.questions_count} questions</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{test.duration_minutes} min</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp
                          className={`w-4 h-4 ${getDifficultyColor(test.difficulty)}`}
                        />
                        <span className={getDifficultyColor(test.difficulty)}>
                          {getDifficultyLabel(test.difficulty)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={() => handleSolveNow(test.id)}
                      className="gap-1"
                    >
                      Solve Now
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
