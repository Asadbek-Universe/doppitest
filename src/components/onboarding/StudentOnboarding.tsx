import { FC, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  BookOpen,
  Target,
  Check,
  ChevronRight,
  ChevronLeft,
  Loader2,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { AvatarUpload } from "@/components/ui/avatar-upload";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useSubjects } from "@/hooks/useCourses";

export interface StudentOnboardingData {
  display_name: string;
  grade: string;
  school: string;
  preferred_language: string;
  avatar_url: string;
  phone: string;
  gender: string;
  city: string;
  studies_at_center: boolean;
  center_name: string;
  purpose: string;
  interests: string[];
  target_exams: string[];
  difficulty_level: string;
  preparing_for_olympiads: boolean;
  study_time_per_day_minutes: number | null;
  weak_subjects: string[];
}

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "uz", label: "O'zbek" },
  { value: "ru", label: "Русский" },
];

const GRADES = [
  "5th Grade", "6th Grade", "7th Grade", "8th Grade", "9th Grade",
  "10th Grade", "11th Grade", "University", "Other",
];

const STUDY_TIME_OPTIONS = [
  { value: 15, label: "15 min/day" },
  { value: 30, label: "30 min/day" },
  { value: 60, label: "1 hour/day" },
  { value: 120, label: "2 hours/day" },
  { value: 180, label: "3+ hours/day" },
];

const DIFFICULTY_OPTIONS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

const TARGET_EXAMS = [
  { value: "olympiad", label: "Olympiads" },
  { value: "sat", label: "SAT" },
  { value: "ielts", label: "IELTS" },
  { value: "entrance", label: "University entrance" },
  { value: "school", label: "School exams" },
];

const FALLBACK_SUBJECTS = [
  { id: "1", name: "Mathematics" },
  { id: "2", name: "Physics" },
  { id: "3", name: "Chemistry" },
  { id: "4", name: "Biology" },
  { id: "5", name: "English" },
  { id: "6", name: "Russian" },
  { id: "7", name: "History" },
  { id: "8", name: "Geography" },
];

const steps = [
  { id: 1, title: "Basic profile", icon: User },
  { id: 2, title: "Interests", icon: BookOpen },
  { id: 3, title: "Goals", icon: Target },
  { id: 4, title: "Confirm", icon: Check },
];

interface StudentOnboardingProps {
  onComplete: (data: StudentOnboardingData) => Promise<void>;
  isLoading?: boolean;
}

const ONBOARDING_USER_DRAFT_KEY = "onboarding_user_draft";

const defaultStudentData = (): StudentOnboardingData => ({
  display_name: "",
  grade: "",
  school: "",
  preferred_language: "en",
  avatar_url: "",
  phone: "",
  gender: "",
  city: "",
  studies_at_center: false,
  center_name: "",
  purpose: "improve",
  interests: [],
  target_exams: [],
  difficulty_level: "intermediate",
  preparing_for_olympiads: false,
  study_time_per_day_minutes: 60,
  weak_subjects: [],
});

export const StudentOnboarding: FC<StudentOnboardingProps> = ({ onComplete, isLoading }) => {
  const { user } = useAuth();
  const { data: subjects = [] } = useSubjects();
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<StudentOnboardingData>(defaultStudentData);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(ONBOARDING_USER_DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<StudentOnboardingData> & { step?: number };
        if (parsed && typeof parsed === "object" && (parsed.display_name != null || parsed.grade || (parsed.interests?.length ?? 0) > 0)) {
          const { step, ...rest } = parsed;
          setData((prev) => ({ ...prev, ...rest } as StudentOnboardingData));
          if (typeof step === "number" && step >= 1 && step <= 4) setCurrentStep(step);
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(ONBOARDING_USER_DRAFT_KEY, JSON.stringify({ ...data, step: currentStep }));
    } catch {
      /* ignore */
    }
  }, [data, currentStep]);

  const updateData = <K extends keyof StudentOnboardingData>(
    field: K,
    value: StudentOnboardingData[K]
  ) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleArray = (field: "interests" | "target_exams" | "weak_subjects", value: string) => {
    setData((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((x) => x !== value)
        : [...prev[field], value],
    }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return data.display_name.trim() && data.grade;
      case 2:
        return data.interests.length > 0;
      case 3:
        return true;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < 4) setCurrentStep((prev) => prev + 1);
    else onComplete(data);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
  };

  const progress = (currentStep / 4) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <Card className="border shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
              <GraduationCap className="w-7 h-7 text-primary" />
            </div>
            <CardTitle className="text-xl">Welcome! Set up your profile</CardTitle>
            <CardDescription>Step {currentStep} of 4 — we'll personalize your experience</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
            <div className="flex justify-between gap-1">
              {steps.map((step) => {
                const Icon = step.icon;
                const isActive = step.id === currentStep;
                const isDone = step.id < currentStep;
                return (
                  <div
                    key={step.id}
                    className={cn(
                      "flex flex-col items-center gap-1",
                      isActive && "text-primary",
                      isDone && "text-primary"
                    )}
                  >
                    <div
                      className={cn(
                        "w-9 h-9 rounded-full flex items-center justify-center border-2 transition-colors",
                        isActive && "border-primary bg-primary/10",
                        isDone && "border-primary bg-primary text-primary-foreground",
                        !isActive && !isDone && "border-muted"
                      )}
                    >
                      {isDone ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                    </div>
                    <span className="text-[10px] font-medium hidden sm:block">{step.title}</span>
                  </div>
                );
              })}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2 }}
                className="space-y-4 min-h-[300px]"
              >
                {currentStep === 1 && (
                  <>
                    {user && (
                      <div className="flex justify-center">
                        <AvatarUpload
                          userId={user.id}
                          currentAvatarUrl={data.avatar_url}
                          onUploadComplete={(url) => updateData("avatar_url", url)}
                          size="lg"
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label>Full name *</Label>
                      <Input
                        placeholder="Your name"
                        value={data.display_name}
                        onChange={(e) => updateData("display_name", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Grade *</Label>
                      <Select value={data.grade} onValueChange={(v) => updateData("grade", v)}>
                        <SelectTrigger><SelectValue placeholder="Select grade" /></SelectTrigger>
                        <SelectContent>
                          {GRADES.map((g) => (
                            <SelectItem key={g} value={g}>{g}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>School (optional)</Label>
                      <Input
                        placeholder="School name"
                        value={data.school}
                        onChange={(e) => updateData("school", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Preferred language</Label>
                      <Select value={data.preferred_language} onValueChange={(v) => updateData("preferred_language", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {LANGUAGES.map((l) => (
                            <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                {currentStep === 2 && (
                  <>
                    <Label>Subjects you're interested in *</Label>
                    <p className="text-xs text-muted-foreground">Select at least one</p>
                    <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto">
                      {(subjects.length > 0 ? subjects : FALLBACK_SUBJECTS).map((s: { id: string; name: string }) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => toggleArray("interests", s.name)}
                          className={cn(
                            "p-3 rounded-lg border text-left text-sm transition-all",
                            data.interests.includes(s.name)
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border hover:border-primary/50"
                          )}
                        >
                          {s.name}
                        </button>
                      ))}
                    </div>
                    {/* Selected subjects summary */}
                    <div className="mt-2">
                      {data.interests.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium">Selected ({data.interests.length}):</span>
                          {data.interests.map((interest) => (
                            <span key={interest} className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs">
                              {interest}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">No subjects selected</div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Target exams (optional)</Label>
                      <div className="flex flex-wrap gap-2">
                        {TARGET_EXAMS.map((e) => (
                          <button
                            key={e.value}
                            type="button"
                            onClick={() => toggleArray("target_exams", e.value)}
                            className={cn(
                              "px-3 py-1.5 rounded-full border text-xs transition-all",
                              data.target_exams.includes(e.value)
                                ? "border-primary bg-primary/10"
                                : "border-border"
                            )}
                          >
                            {e.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Difficulty level</Label>
                      <Select value={data.difficulty_level} onValueChange={(v) => updateData("difficulty_level", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {DIFFICULTY_OPTIONS.map((d) => (
                            <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                {currentStep === 3 && (
                  <>
                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <p className="font-medium">Preparing for Olympiads?</p>
                        <p className="text-xs text-muted-foreground">We'll suggest olympiad content</p>
                      </div>
                      <Switch
                        checked={data.preparing_for_olympiads}
                        onCheckedChange={(v) => updateData("preparing_for_olympiads", v)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Study time per day</Label>
                      <Select
                        value={data.study_time_per_day_minutes?.toString() ?? ""}
                        onValueChange={(v) => updateData("study_time_per_day_minutes", v ? parseInt(v) : null)}
                      >
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {STUDY_TIME_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value.toString()}>{o.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Weak subjects (optional)</Label>
                      <p className="text-xs text-muted-foreground">We'll recommend more practice here</p>
                      <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto">
                        {subjects.map((s: { id: string; name: string }) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => toggleArray("weak_subjects", s.name)}
                            className={cn(
                              "p-2 rounded-lg border text-left text-sm",
                              data.weak_subjects.includes(s.name)
                                ? "border-primary bg-primary/10"
                                : "border-border"
                            )}
                          >
                            {s.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {currentStep === 4 && (
                  <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
                    <p className="font-medium">Summary</p>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li><span className="text-foreground">Name:</span> {data.display_name}</li>
                      <li><span className="text-foreground">Grade:</span> {data.grade}</li>
                      {data.school && <li><span className="text-foreground">School:</span> {data.school}</li>}
                      <li><span className="text-foreground">Language:</span> {LANGUAGES.find((l) => l.value === data.preferred_language)?.label ?? data.preferred_language}</li>
                      <li><span className="text-foreground">Interests:</span> {data.interests.length} subject(s)</li>
                      <li><span className="text-foreground">Olympiads:</span> {data.preparing_for_olympiads ? "Yes" : "No"}</li>
                      {data.study_time_per_day_minutes && (
                        <li><span className="text-foreground">Study time:</span> {STUDY_TIME_OPTIONS.find((o) => o.value === data.study_time_per_day_minutes)?.label ?? `${data.study_time_per_day_minutes} min`}</li>
                      )}
                    </ul>
                    <p className="text-xs text-muted-foreground pt-2">Click &quot;Start Learning&quot; to save and go to your dashboard.</p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Inline hint when Continue is disabled to explain required fields */}
            {!canProceed() && (
              <div className="mb-2 rounded-md border-l-4 border-yellow-400 bg-yellow-50 p-3 text-sm text-yellow-800">
                {currentStep === 1 && (
                  <div>Please fill in your <strong>full name</strong> and select your <strong>grade</strong> to continue.</div>
                )}
                {currentStep === 2 && (
                  <div>Please select at least one <strong>subject</strong> to continue.</div>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              {currentStep > 1 && (
                <Button variant="outline" onClick={handleBack} className="flex-1" disabled={isLoading}>
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
              )}
              <Button
                onClick={handleNext}
                disabled={!canProceed() || isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : currentStep === 4 ? (
                  <>
                    Start Learning
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </>
                ) : (
                  <>
                    Continue
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
