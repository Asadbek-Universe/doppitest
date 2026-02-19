import { FC, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { StudentOnboarding, StudentOnboardingData } from "@/components/onboarding/StudentOnboarding";
import { CenterOnboarding, CenterOnboardingData } from "@/components/onboarding/CenterOnboarding";
import { Loader2 } from "lucide-react";

const Onboarding: FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: userRole, isLoading: roleLoading } = useUserRole();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isLoading = authLoading || profileLoading || roleLoading;
  const isCenter = userRole === "center";

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }

    // If onboarding is already completed, redirect based on role
    if (!profileLoading && profile?.onboarding_completed && !roleLoading) {
      if (userRole === 'center') {
        navigate("/center-panel");
      } else if (userRole === 'admin') {
        navigate("/admin");
      } else {
        navigate("/");
      }
    }
  }, [user, authLoading, profile, profileLoading, userRole, roleLoading, navigate]);

  const handleStudentComplete = async (data: StudentOnboardingData) => {
    if (!user) return;
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: data.display_name,
          phone: data.phone,
          gender: data.gender,
          city: data.city,
          grade: data.grade,
          studies_at_center: data.studies_at_center,
          center_name: data.center_name,
          purpose: data.purpose,
          avatar_url: data.avatar_url || null,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Welcome aboard! 🎉",
        description: "Your profile is all set up. Start learning!",
      });
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save profile",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCenterComplete = async (data: CenterOnboardingData) => {
    if (!user) return;
    setIsSubmitting(true);

    try {
      // First check if center exists
      const { data: existingCenter } = await supabase
        .from("educational_centers")
        .select("id")
        .eq("owner_id", user.id)
        .single();

      if (existingCenter) {
        // Update existing center
        const { error } = await supabase
          .from("educational_centers")
          .update({
            name: data.name,
            description: data.description,
            contact_phone: data.contact_phone,
            email: data.email || user.email,
            city: data.city,
            address: data.address,
            founded_year: data.founded_year,
            student_count: data.student_count,
            specializations: data.specializations,
            website: data.website,
            logo_url: data.logo_url || null,
            onboarding_completed: true,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingCenter.id);

        if (error) throw error;
      } else {
        // Create new center
        const { error } = await supabase
          .from("educational_centers")
          .insert({
            owner_id: user.id,
            name: data.name,
            description: data.description,
            contact_phone: data.contact_phone,
            email: data.email || user.email,
            city: data.city,
            address: data.address,
            founded_year: data.founded_year,
            student_count: data.student_count,
            specializations: data.specializations,
            website: data.website,
            logo_url: data.logo_url || null,
            onboarding_completed: true,
          });

        if (error) throw error;
      }

      // Also mark profile as onboarding completed
      await supabase
        .from("profiles")
        .update({ onboarding_completed: true })
        .eq("user_id", user.id);

      toast({
        title: "Center created! 🎉",
        description: "Your center profile is ready. Start adding courses!",
      });
      navigate("/center-panel");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create center",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-hero">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return isCenter ? (
    <CenterOnboarding onComplete={handleCenterComplete} isLoading={isSubmitting} />
  ) : (
    <StudentOnboarding onComplete={handleStudentComplete} isLoading={isSubmitting} />
  );
};

export default Onboarding;
