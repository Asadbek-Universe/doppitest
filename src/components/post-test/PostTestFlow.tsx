import { FC, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PostTestAnalytics } from "./PostTestAnalytics";
import { RecommendedTestsStep } from "./RecommendedTestsStep";
import { RecommendedCoursesStep } from "./RecommendedCoursesStep";
import { RecommendedCentersStep } from "./RecommendedCentersStep";

interface TestResults {
  score: number;
  totalPoints: number;
  percentage: number;
  correct: number;
  wrong: number;
  skipped: number;
  timeSpent: number;
  subjectId?: string | null;
  weakTopics: string[];
}

interface PostTestFlowProps {
  testId: string;
  testTitle: string;
  results: TestResults;
  onExit: () => void;
  onRetry: () => void;
}

const STEPS = [
  { id: "analytics", label: "Analytics" },
  { id: "tests", label: "Recommended Tests" },
  { id: "courses", label: "Recommended Courses" },
  { id: "centers", label: "Suggested Centers" },
];

export const PostTestFlow: FC<PostTestFlowProps> = ({
  testId,
  testTitle,
  results,
  onExit,
  onRetry,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const totalSteps = STEPS.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const goNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      onExit();
    }
  };

  const goBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const skipToEnd = () => {
    onExit();
  };

  const renderStep = () => {
    switch (STEPS[currentStep].id) {
      case "analytics":
        return (
          <PostTestAnalytics
            testTitle={testTitle}
            results={results}
            onRetry={onRetry}
          />
        );
      case "tests":
        return (
          <RecommendedTestsStep
            results={results}
            currentTestId={testId}
          />
        );
      case "courses":
        return <RecommendedCoursesStep results={results} />;
      case "centers":
        return <RecommendedCentersStep results={results} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex flex-col">
      {/* Header with progress */}
      <header className="bg-background border-b border-border sticky top-0 z-50">
        <div className="container px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="font-bold text-foreground text-lg">Test Completed</h1>
              <p className="text-sm text-muted-foreground">{testTitle}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Step {currentStep + 1} of {totalSteps}
              </span>
            </div>
          </div>
          
          {/* Step indicators */}
          <div className="flex items-center gap-2 mb-3">
            {STEPS.map((step, idx) => (
              <div
                key={step.id}
                className={`flex-1 h-1 rounded-full transition-colors ${
                  idx <= currentStep ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-primary">
              {STEPS[currentStep].label}
            </span>
            <Button variant="ghost" size="sm" onClick={skipToEnd}>
              Skip All
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 container px-6 py-8 max-w-4xl mx-auto pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer navigation */}
      <footer className="fixed bottom-0 left-0 right-0 bg-background border-t border-border py-4">
        <div className="container px-6 flex items-center justify-between max-w-4xl mx-auto">
          <Button
            variant="outline"
            onClick={goBack}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <Button onClick={goNext}>
            {currentStep === totalSteps - 1 ? "Finish" : "Next"}
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </footer>
    </div>
  );
};
