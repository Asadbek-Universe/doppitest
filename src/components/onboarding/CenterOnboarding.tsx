import { FC, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  MapPin,
  Users,
  BookOpen,
  Phone,
  Mail,
  Globe,
  ChevronRight,
  ChevronLeft,
  Check,
  Loader2,
  Calendar,
  CreditCard,
  GraduationCap,
  Languages,
  Crown,
  Zap,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AvatarUpload } from "@/components/ui/avatar-upload";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface CenterOnboardingProps {
  onComplete: (data: CenterOnboardingData) => Promise<void>;
  isLoading?: boolean;
}

/** Maps to educational_centers: name, description, logo_url, banner_url, address, city, email, contact_phone, website, specializations, grades_served, languages_supported, teachers_count, student_count, onboarding_completed */
export interface CenterOnboardingData {
  name: string;
  description: string;
  logo_url: string;
  banner_url: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  city: string;
  website: string;
  specializations: string[];
  grades_served: string[];
  languages_supported: string[];
  teachers_count: number | null;
  student_count: number | null;
  experience_level: string;
  founded_year: number | null;
  selected_tier: "free" | "pro" | "enterprise";
}

const cities = [
  "Tashkent", "Samarkand", "Bukhara", "Namangan", "Andijan",
  "Fergana", "Nukus", "Karshi", "Jizzakh", "Urgench", "Other",
];

const specializations = [
  { value: "math", label: "Mathematics", icon: "📐" },
  { value: "physics", label: "Physics", icon: "⚡" },
  { value: "chemistry", label: "Chemistry", icon: "🧪" },
  { value: "biology", label: "Biology", icon: "🧬" },
  { value: "english", label: "English", icon: "🇬🇧" },
  { value: "russian", label: "Russian", icon: "🇷🇺" },
  { value: "programming", label: "Programming", icon: "💻" },
  { value: "olympiad", label: "Olympiad Prep", icon: "🏆" },
  { value: "sat", label: "SAT/IELTS", icon: "📝" },
  { value: "university", label: "University Prep", icon: "🎓" },
];

const GRADES_SERVED = [
  "5th", "6th", "7th", "8th", "9th", "10th", "11th", "University", "All",
];

const LANGUAGES_SUPPORTED = [
  { value: "uz", label: "O'zbek" },
  { value: "ru", label: "Русский" },
  { value: "en", label: "English" },
];

const EXPERIENCE_LEVELS = [
  { value: "beginner", label: "Just starting" },
  { value: "intermediate", label: "1–3 years" },
  { value: "advanced", label: "3+ years" },
];

const studentCountOptions = [
  { value: 50, label: "1–50 students" },
  { value: 100, label: "50–100 students" },
  { value: 300, label: "100–300 students" },
  { value: 500, label: "300–500 students" },
  { value: 1000, label: "500+ students" },
];

const steps = [
  { id: 1, title: "Center info", icon: Building2 },
  { id: 2, title: "Academic focus", icon: BookOpen },
  { id: 3, title: "Team & capacity", icon: Users },
  { id: 4, title: "Plan", icon: CreditCard },
];

const plans: { id: "free" | "pro" | "enterprise"; name: string; icon: typeof Shield; desc: string }[] = [
  { id: "free", name: "Free", icon: Shield, desc: "Basic features" },
  { id: "pro", name: "Pro", icon: Zap, desc: "Growing centers" },
  { id: "enterprise", name: "Enterprise", icon: Crown, desc: "Full access" },
];

const ONBOARDING_CENTER_DRAFT_KEY = "onboarding_center_draft";

const defaultCenterData = (): CenterOnboardingData => ({
  name: "",
  description: "",
  logo_url: "",
  banner_url: "",
  contact_email: "",
  contact_phone: "",
  address: "",
  city: "",
  website: "",
  specializations: [],
  grades_served: [],
  languages_supported: [],
  teachers_count: null,
  student_count: null,
  experience_level: "intermediate",
  founded_year: null,
  selected_tier: "free",
});

export const CenterOnboarding: FC<CenterOnboardingProps> = ({ onComplete, isLoading }) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<CenterOnboardingData>(defaultCenterData);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(ONBOARDING_CENTER_DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<CenterOnboardingData> & { step?: number };
        if (parsed && typeof parsed === "object" && (parsed.name != null || parsed.contact_phone || (parsed.specializations?.length ?? 0) > 0)) {
          const { step, email, ...rest } = parsed;
          setData((prev) => ({ ...prev, ...rest, contact_email: rest.contact_email ?? email ?? prev.contact_email } as CenterOnboardingData));
          if (typeof step === "number" && step >= 1 && step <= 4) setCurrentStep(step);
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(ONBOARDING_CENTER_DRAFT_KEY, JSON.stringify({ ...data, step: currentStep }));
    } catch {
      /* ignore */
    }
  }, [data, currentStep]);

  const updateData = <K extends keyof CenterOnboardingData>(
    field: K,
    value: CenterOnboardingData[K]
  ) => setData((prev) => ({ ...prev, [field]: value }));

  const toggleArray = (field: "specializations" | "grades_served" | "languages_supported", value: string) => {
    setData((prev) => {
      const current = Array.isArray(prev[field]) ? (prev[field] as string[]) : [];
      const exists = current.includes(value);
      const updated = exists ? current.filter((x) => x !== value) : [...current, value];
      return {
        ...prev,
        [field]: updated,
      };
    });
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return (
          data.name.trim() !== "" &&
          data.contact_phone.trim() !== "" &&
          data.contact_email.trim() !== "" &&
          (data.city.trim() !== "" || data.address.trim() !== "")
        );
      case 2:
        return Boolean(data.specializations?.length > 0);
      case 3:
        return data.teachers_count != null && data.teachers_count > 0 && data.student_count != null;
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
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg">
        <Card className="border shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
              <Building2 className="w-7 h-7 text-primary" />
            </div>
            <CardTitle className="text-xl">Set up your center</CardTitle>
            <CardDescription>Step {currentStep} of 4</CardDescription>
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
                      (isActive || isDone) && "text-primary"
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
                className="space-y-4 min-h-[320px]"
              >
                {/* Step 1: Basic Center Info — name, description, logo, banner, contact_email, contact_phone, location */}
                {currentStep === 1 && (
                  <>
                    <div className="space-y-2">
                      <Label>Center name *</Label>
                      <Input
                        placeholder="Your center's name"
                        value={data.name}
                        onChange={(e) => updateData("name", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        placeholder="Tell students about your center..."
                        value={data.description}
                        onChange={(e) => updateData("description", e.target.value)}
                        rows={2}
                      />
                    </div>
                    {user && (
                      <>
                        <div className="space-y-2">
                          <Label>Logo</Label>
                          <div className="flex justify-center">
                            <AvatarUpload
                              userId={user.id}
                              currentAvatarUrl={data.logo_url}
                              onUploadComplete={(url) => updateData("logo_url", url)}
                              size="lg"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Banner image URL (optional)</Label>
                          <Input
                            placeholder="https://..."
                            value={data.banner_url}
                            onChange={(e) => updateData("banner_url", e.target.value)}
                          />
                        </div>
                      </>
                    )}
                    <div className="space-y-2">
                      <Label>Contact email *</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          type="email"
                          placeholder="contact@center.uz"
                          value={data.contact_email}
                          onChange={(e) => updateData("contact_email", e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Contact phone *</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="+998 90 123 45 67"
                          value={data.contact_phone}
                          onChange={(e) => updateData("contact_phone", e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Location (city) *</Label>
                      <div className="grid grid-cols-2 gap-2 max-h-[120px] overflow-y-auto">
                        {cities.map((city) => (
                          <button
                            key={city}
                            type="button"
                            onClick={() => updateData("city", city)}
                            className={cn(
                              "p-2 rounded-lg border text-left text-sm flex items-center gap-2",
                              data.city === city ? "border-primary bg-primary/10" : "border-border"
                            )}
                          >
                            <MapPin className="w-4 h-4 shrink-0" />
                            {city}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Full address</Label>
                      <Input
                        placeholder="Street, building, district..."
                        value={data.address}
                        onChange={(e) => updateData("address", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Website (optional)</Label>
                      <Input
                        placeholder="https://your-center.uz"
                        value={data.website}
                        onChange={(e) => updateData("website", e.target.value)}
                      />
                    </div>
                  </>
                )}

                {/* Step 2: Academic Focus */}
                {currentStep === 2 && (
                  <>
                    <Label>Subjects offered *</Label>
                    <p className="text-xs text-muted-foreground">Select at least one</p>
                    <div className="grid grid-cols-2 gap-2 max-h-[140px] overflow-y-auto">
                      {specializations.map((spec) => (
                        <button
                          key={spec.value}
                          type="button"
                          onClick={() => toggleArray("specializations", spec.value)}
                          className={cn(
                            "p-2 rounded-lg border text-left text-sm flex items-center gap-2",
                            data.specializations.includes(spec.value)
                              ? "border-primary bg-primary/10"
                              : "border-border"
                          )}
                        >
                          <span>{spec.icon}</span>
                          <span>{spec.label}</span>
                        </button>
                      ))}
                    </div>
                    {/* Selected subjects summary (helps debug selection state) */}
                    <div className="mt-2">
                      {data.specializations.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium">Selected ({data.specializations.length}):</span>
                          {data.specializations.map((val) => {
                            const s = specializations.find((sp) => sp.value === val);
                            return (
                              <span key={val} className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs">
                                {s?.label ?? val}
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">No subjects selected</div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4" />
                        Grades served
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {GRADES_SERVED.map((g) => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => toggleArray("grades_served", g)}
                            className={cn(
                              "px-3 py-1.5 rounded-full border text-xs",
                              data.grades_served.includes(g) ? "border-primary bg-primary/10" : "border-border"
                            )}
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Languages className="w-4 h-4" />
                        Languages supported
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {LANGUAGES_SUPPORTED.map((l) => (
                          <button
                            key={l.value}
                            type="button"
                            onClick={() => toggleArray("languages_supported", l.value)}
                            className={cn(
                              "px-3 py-1.5 rounded-full border text-xs",
                              data.languages_supported.includes(l.value)
                                ? "border-primary bg-primary/10"
                                : "border-border"
                            )}
                          >
                            {l.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Step 3: Team & Capacity */}
                {currentStep === 3 && (
                  <>
                    <div className="space-y-2">
                      <Label>Number of teachers *</Label>
                      <Input
                        type="number"
                        min={1}
                        placeholder="e.g. 5"
                        value={data.teachers_count ?? ""}
                        onChange={(e) =>
                          updateData("teachers_count", e.target.value ? parseInt(e.target.value, 10) : null)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Estimated students *</Label>
                      <div className="grid gap-2">
                        {studentCountOptions.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => updateData("student_count", opt.value)}
                            className={cn(
                              "p-3 rounded-lg border text-left flex items-center gap-3",
                              data.student_count === opt.value ? "border-primary bg-primary/10" : "border-border"
                            )}
                          >
                            <Users className="w-5 h-5 text-muted-foreground" />
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Experience level</Label>
                      <div className="flex flex-wrap gap-2">
                        {EXPERIENCE_LEVELS.map((e) => (
                          <button
                            key={e.value}
                            type="button"
                            onClick={() => updateData("experience_level", e.value)}
                            className={cn(
                              "px-3 py-2 rounded-lg border text-sm",
                              data.experience_level === e.value ? "border-primary bg-primary/10" : "border-border"
                            )}
                          >
                            {e.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Year founded (optional)</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          type="number"
                          min={1990}
                          max={new Date().getFullYear()}
                          placeholder="e.g. 2015"
                          value={data.founded_year ?? ""}
                          onChange={(e) =>
                            updateData("founded_year", e.target.value ? parseInt(e.target.value, 10) : null)
                          }
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Step 4: Plan selection */}
                {currentStep === 4 && (
                  <>
                    <Label>Choose your plan</Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Your request will be sent to admin for approval. You’ll get dashboard access after approval.
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {plans.map((plan) => {
                        const Icon = plan.icon;
                        const isSelected = data.selected_tier === plan.id;
                        return (
                          <button
                            key={plan.id}
                            type="button"
                            onClick={() => updateData("selected_tier", plan.id)}
                            className={cn(
                              "p-4 rounded-xl border-2 flex flex-col items-center gap-1 text-center transition-all",
                              isSelected ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                            )}
                          >
                            <Icon className="w-6 h-6 text-primary" />
                            <span className="font-medium text-sm">{plan.name}</span>
                            <span className="text-[10px] text-muted-foreground">{plan.desc}</span>
                          </button>
                        );
                      })}
                    </div>
                    <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-800 dark:text-amber-200">
                      After you click &quot;Send request&quot;, your request is sent to admin for approval. Plan status is <em>pending_approval</em> until an admin approves. You can access your dashboard; full access follows approval.
                    </div>
                  </>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Inline hint when Next/Continue is disabled to explain required fields */}
            {!canProceed() && (
              <div className="mb-2 rounded-md border-l-4 border-yellow-400 bg-yellow-50 p-3 text-sm text-yellow-800">
                {currentStep === 1 && (
                  <div>Please fill in <strong>Center name</strong>, <strong>Contact email</strong>, <strong>Contact phone</strong>, and <strong>Location</strong> (city or address) to continue.</div>
                )}
                {currentStep === 2 && (
                  <div>Please select at least one <strong>subject</strong> to continue.</div>
                )}
                {currentStep === 3 && (
                  <div>Please provide the number of <strong>teachers</strong> and estimated <strong>students</strong>.</div>
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
              <Button onClick={handleNext} disabled={!canProceed() || isLoading} className="flex-1">
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : currentStep === 4 ? (
                  <>
                    Send request
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
