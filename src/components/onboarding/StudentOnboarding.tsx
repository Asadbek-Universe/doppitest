import { FC, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, MapPin, GraduationCap, Building2, Target, Phone, 
  ChevronRight, ChevronLeft, Check, Loader2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AvatarUpload } from "@/components/ui/avatar-upload";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface StudentOnboardingProps {
  onComplete: (data: StudentOnboardingData) => Promise<void>;
  isLoading?: boolean;
}

export interface StudentOnboardingData {
  display_name: string;
  phone: string;
  gender: string;
  city: string;
  grade: string;
  studies_at_center: boolean;
  center_name: string;
  purpose: string;
  avatar_url: string;
}

const cities = [
  "Tashkent", "Samarkand", "Bukhara", "Namangan", "Andijan", 
  "Fergana", "Nukus", "Karshi", "Jizzakh", "Urgench", "Other"
];

const grades = [
  "5th Grade", "6th Grade", "7th Grade", "8th Grade", "9th Grade",
  "10th Grade", "11th Grade", "University Student", "Working Professional", "Other"
];

const purposes = [
  { value: "olympiad", label: "Prepare for Olympiads", icon: "🏆" },
  { value: "exam", label: "Prepare for Exams", icon: "📝" },
  { value: "improve", label: "Improve Knowledge", icon: "📚" },
  { value: "hobby", label: "Hobby / Interest", icon: "💡" },
  { value: "career", label: "Career Development", icon: "🚀" },
];

const steps = [
  { id: 1, title: "Personal Info", icon: User },
  { id: 2, title: "Location", icon: MapPin },
  { id: 3, title: "Education", icon: GraduationCap },
  { id: 4, title: "Goals", icon: Target },
];

export const StudentOnboarding: FC<StudentOnboardingProps> = ({ onComplete, isLoading }) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<StudentOnboardingData>({
    display_name: "",
    phone: "",
    gender: "",
    city: "",
    grade: "",
    studies_at_center: false,
    center_name: "",
    purpose: "",
    avatar_url: "",
  });

  const updateData = (field: keyof StudentOnboardingData, value: string | boolean) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return data.display_name.trim() && data.phone.trim() && data.gender;
      case 2:
        return data.city;
      case 3:
        return data.grade && (!data.studies_at_center || data.center_name.trim());
      case 4:
        return data.purpose;
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
              <GraduationCap className="w-8 h-8 text-primary-foreground" />
            </motion.div>
            <CardTitle className="text-2xl">Welcome to IMTS!</CardTitle>
            <CardDescription>Let's personalize your learning experience</CardDescription>
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
                    {/* Avatar Upload */}
                    <div className="flex justify-center mb-2">
                      {user && (
                        <AvatarUpload
                          userId={user.id}
                          currentAvatarUrl={data.avatar_url}
                          onUploadComplete={(url) => updateData("avatar_url", url)}
                          size="lg"
                        />
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        placeholder="Enter your full name"
                        value={data.display_name}
                        onChange={(e) => updateData("display_name", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          placeholder="+998 90 123 45 67"
                          value={data.phone}
                          onChange={(e) => updateData("phone", e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Gender</Label>
                      <RadioGroup
                        value={data.gender}
                        onValueChange={(v) => updateData("gender", v)}
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="male" id="male" />
                          <Label htmlFor="male" className="font-normal cursor-pointer">Male</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="female" id="female" />
                          <Label htmlFor="female" className="font-normal cursor-pointer">Female</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </>
                )}

                {currentStep === 2 && (
                  <div className="space-y-2">
                    <Label>Select Your City</Label>
                    <div className="grid grid-cols-2 gap-2 max-h-[280px] overflow-y-auto">
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
                )}

                {currentStep === 3 && (
                  <>
                    <div className="space-y-2">
                      <Label>What grade are you in?</Label>
                      <div className="grid grid-cols-2 gap-2 max-h-[180px] overflow-y-auto">
                        {grades.map((grade) => (
                          <button
                            key={grade}
                            type="button"
                            onClick={() => updateData("grade", grade)}
                            className={cn(
                              "p-3 rounded-lg border text-left transition-all text-sm",
                              data.grade === grade
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border hover:border-primary/50"
                            )}
                          >
                            {grade}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Do you study at an educational center?</Label>
                      <RadioGroup
                        value={data.studies_at_center ? "yes" : "no"}
                        onValueChange={(v) => updateData("studies_at_center", v === "yes")}
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="yes" id="center-yes" />
                          <Label htmlFor="center-yes" className="font-normal cursor-pointer">Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no" id="center-no" />
                          <Label htmlFor="center-no" className="font-normal cursor-pointer">No</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    {data.studies_at_center && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="space-y-2"
                      >
                        <Label htmlFor="center-name">Center Name</Label>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="center-name"
                            placeholder="Enter center name"
                            value={data.center_name}
                            onChange={(e) => updateData("center_name", e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </motion.div>
                    )}
                  </>
                )}

                {currentStep === 4 && (
                  <div className="space-y-2">
                    <Label>What's your main goal?</Label>
                    <div className="grid gap-2">
                      {purposes.map((purpose) => (
                        <button
                          key={purpose.value}
                          type="button"
                          onClick={() => updateData("purpose", purpose.value)}
                          className={cn(
                            "p-4 rounded-lg border text-left transition-all flex items-center gap-3",
                            data.purpose === purpose.value
                              ? "border-primary bg-primary/10"
                              : "border-border hover:border-primary/50"
                          )}
                        >
                          <span className="text-2xl">{purpose.icon}</span>
                          <span className="font-medium">{purpose.label}</span>
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
