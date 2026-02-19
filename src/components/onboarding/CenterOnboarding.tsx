import { FC, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Building2, MapPin, Users, BookOpen, Phone, Globe, 
  ChevronRight, ChevronLeft, Check, Loader2, Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { AvatarUpload } from "@/components/ui/avatar-upload";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface CenterOnboardingProps {
  onComplete: (data: CenterOnboardingData) => Promise<void>;
  isLoading?: boolean;
}

export interface CenterOnboardingData {
  name: string;
  description: string;
  contact_phone: string;
  email: string;
  city: string;
  address: string;
  founded_year: number | null;
  student_count: number | null;
  specializations: string[];
  website: string;
  logo_url: string;
}

const cities = [
  "Tashkent", "Samarkand", "Bukhara", "Namangan", "Andijan", 
  "Fergana", "Nukus", "Karshi", "Jizzakh", "Urgench", "Other"
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

const studentCountOptions = [
  { value: 50, label: "1-50 students" },
  { value: 100, label: "50-100 students" },
  { value: 300, label: "100-300 students" },
  { value: 500, label: "300-500 students" },
  { value: 1000, label: "500+ students" },
];

const steps = [
  { id: 1, title: "Basic Info", icon: Building2 },
  { id: 2, title: "Location", icon: MapPin },
  { id: 3, title: "Details", icon: Users },
  { id: 4, title: "Subjects", icon: BookOpen },
];

export const CenterOnboarding: FC<CenterOnboardingProps> = ({ onComplete, isLoading }) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<CenterOnboardingData>({
    name: "",
    description: "",
    contact_phone: "",
    email: "",
    city: "",
    address: "",
    founded_year: null,
    student_count: null,
    specializations: [],
    website: "",
    logo_url: "",
  });

  const updateData = <K extends keyof CenterOnboardingData>(
    field: K, 
    value: CenterOnboardingData[K]
  ) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const toggleSpecialization = (value: string) => {
    setData(prev => ({
      ...prev,
      specializations: prev.specializations.includes(value)
        ? prev.specializations.filter(s => s !== value)
        : [...prev.specializations, value]
    }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return data.name.trim() && data.contact_phone.trim();
      case 2:
        return data.city && data.address.trim();
      case 3:
        return data.student_count !== null;
      case 4:
        return data.specializations.length > 0;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete(data);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const progress = (currentStep / 4) * 100;

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <Card className="border-0 shadow-2xl">
          <CardHeader className="text-center pb-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-primary flex items-center justify-center"
            >
              <Building2 className="w-8 h-8 text-primary-foreground" />
            </motion.div>
            <CardTitle className="text-2xl">Set Up Your Center</CardTitle>
            <CardDescription>Let's get your educational center ready</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Step {currentStep} of 4</span>
                <span>{Math.round(progress)}% complete</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Step Indicators */}
            <div className="flex justify-between">
              {steps.map((step) => {
                const Icon = step.icon;
                const isActive = step.id === currentStep;
                const isCompleted = step.id < currentStep;
                return (
                  <div
                    key={step.id}
                    className={cn(
                      "flex flex-col items-center gap-1",
                      isActive && "text-primary",
                      isCompleted && "text-primary",
                      !isActive && !isCompleted && "text-muted-foreground"
                    )}
                  >
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors",
                        isActive && "border-primary bg-primary/10",
                        isCompleted && "border-primary bg-primary text-primary-foreground",
                        !isActive && !isCompleted && "border-muted"
                      )}
                    >
                      {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                    </div>
                    <span className="text-xs font-medium hidden sm:block">{step.title}</span>
                  </div>
                );
              })}
            </div>

            {/* Step Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4 min-h-[280px]"
              >
                {currentStep === 1 && (
                  <>
                    {/* Logo Upload */}
                    <div className="flex justify-center mb-2">
                      {user && (
                        <AvatarUpload
                          userId={user.id}
                          currentAvatarUrl={data.logo_url}
                          onUploadComplete={(url) => updateData("logo_url", url)}
                          size="lg"
                        />
                      )}
                    </div>
                    <p className="text-xs text-center text-muted-foreground -mt-1 mb-2">Upload center logo</p>
                    <div className="space-y-2">
                      <Label htmlFor="center-name">Center Name *</Label>
                      <Input
                        id="center-name"
                        placeholder="Enter your center's name"
                        value={data.name}
                        onChange={(e) => updateData("name", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="center-phone">Contact Phone *</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="center-phone"
                          placeholder="+998 90 123 45 67"
                          value={data.contact_phone}
                          onChange={(e) => updateData("contact_phone", e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Tell students about your center..."
                        value={data.description}
                        onChange={(e) => updateData("description", e.target.value)}
                        rows={2}
                      />
                    </div>
                  </>
                )}

                {currentStep === 2 && (
                  <>
                    <div className="space-y-2">
                      <Label>Select Your City *</Label>
                      <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto">
                        {cities.map((city) => (
                          <button
                            key={city}
                            type="button"
                            onClick={() => updateData("city", city)}
                            className={cn(
                              "p-3 rounded-lg border text-left transition-all",
                              data.city === city
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border hover:border-primary/50"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              <span className="font-medium">{city}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Full Address *</Label>
                      <Input
                        id="address"
                        placeholder="Street, building, district..."
                        value={data.address}
                        onChange={(e) => updateData("address", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website">Website (optional)</Label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="website"
                          placeholder="https://your-center.uz"
                          value={data.website}
                          onChange={(e) => updateData("website", e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </>
                )}

                {currentStep === 3 && (
                  <>
                    <div className="space-y-2">
                      <Label>How many students do you have? *</Label>
                      <div className="grid gap-2">
                        {studentCountOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => updateData("student_count", option.value)}
                            className={cn(
                              "p-3 rounded-lg border text-left transition-all flex items-center gap-3",
                              data.student_count === option.value
                                ? "border-primary bg-primary/10"
                                : "border-border hover:border-primary/50"
                            )}
                          >
                            <Users className="w-5 h-5 text-muted-foreground" />
                            <span className="font-medium">{option.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="founded">Year Founded (optional)</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="founded"
                          type="number"
                          placeholder="e.g., 2015"
                          min={1990}
                          max={new Date().getFullYear()}
                          value={data.founded_year || ""}
                          onChange={(e) => updateData("founded_year", e.target.value ? parseInt(e.target.value) : null)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </>
                )}

                {currentStep === 4 && (
                  <div className="space-y-2">
                    <Label>What subjects do you teach? *</Label>
                    <p className="text-sm text-muted-foreground mb-3">Select all that apply</p>
                    <div className="grid grid-cols-2 gap-2 max-h-[280px] overflow-y-auto">
                      {specializations.map((spec) => (
                        <button
                          key={spec.value}
                          type="button"
                          onClick={() => toggleSpecialization(spec.value)}
                          className={cn(
                            "p-3 rounded-lg border text-left transition-all flex items-center gap-2",
                            data.specializations.includes(spec.value)
                              ? "border-primary bg-primary/10"
                              : "border-border hover:border-primary/50"
                          )}
                        >
                          <Checkbox 
                            checked={data.specializations.includes(spec.value)}
                            className="pointer-events-none"
                          />
                          <span className="text-lg">{spec.icon}</span>
                          <span className="font-medium text-sm">{spec.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex gap-3 pt-4">
              {currentStep > 1 && (
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1"
                  disabled={isLoading}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
              )}
              <Button
                onClick={handleNext}
                disabled={!canProceed() || isLoading}
                className="flex-1 bg-gradient-primary"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : currentStep === 4 ? (
                  <>
                    Complete Setup
                    <Check className="w-4 h-4 ml-1" />
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
