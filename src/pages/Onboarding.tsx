import { FC, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useUserRole, useOwnsCenter } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { StudentOnboarding, StudentOnboardingData } from "@/components/onboarding/StudentOnboarding";
import { CenterOnboarding, CenterOnboardingData } from "@/components/onboarding/CenterOnboarding";
import { Loader2 } from "lucide-react";

const Onboarding: FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: userRole, isLoading: roleLoading } = useUserRole();
  const { data: ownsCenter, isLoading: ownsCenterLoading } = useOwnsCenter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pathIsCenter = location.pathname === "/onboarding/center";
  const pathIsUser = location.pathname === "/onboarding/user";
  const isCenter = userRole === "center" || !!ownsCenter || pathIsCenter;
  const isLoading = authLoading || profileLoading || roleLoading || (pathIsUser && (roleLoading || ownsCenterLoading));

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }

    if (roleLoading) return;

    // Send center owners to center onboarding (role may not be "center" yet)
    if ((userRole === "center" || ownsCenter) && pathIsUser) {
      navigate("/onboarding/center", { replace: true });
      return;
    }
    if (userRole === "user" && pathIsCenter) {
      navigate("/onboarding/user", { replace: true });
      return;
    }

    if (!profileLoading && profile?.onboarding_completed) {
      if (userRole === 'center' || ownsCenter) {
        navigate("/center-panel");
      } else if (userRole === 'admin') {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    }
  }, [user, authLoading, profile, profileLoading, userRole, roleLoading, ownsCenter, navigate, pathIsUser, pathIsCenter]);

  const handleStudentComplete = async (data: StudentOnboardingData) => {
    if (!user) return;
    setIsSubmitting(true);

    try {
      const goalsParts: string[] = [];
      if (data.target_exams.length) goalsParts.push(`Target: ${data.target_exams.join(", ")}`);
      if (data.difficulty_level) goalsParts.push(`Difficulty: ${data.difficulty_level}`);
      const goals = goalsParts.length ? goalsParts.join(". ") : null;

      const studyTimeText =
        data.study_time_per_day_minutes !== null && data.study_time_per_day_minutes !== undefined
          ? `${data.study_time_per_day_minutes} min/day`
          : null;

      const profileData = {
        user_id: user.id,
        id: user.id,
        display_name: data.display_name,
        grade: data.grade || null,
        school: data.school || null,
        preferred_language: data.preferred_language || "en",
        interests: data.interests?.length ? data.interests : null,
        weak_subjects: data.weak_subjects?.length ? data.weak_subjects : null,
        goals,
        study_time_per_day_minutes: data.study_time_per_day_minutes ?? null,
        preparing_for_olympiads: data.preparing_for_olympiads ?? false,
        avatar_url: data.avatar_url || null,
        phone: data.phone || null,
        gender: data.gender || null,
        city: data.city || null,
        studies_at_center: data.studies_at_center,
        center_name: data.center_name || null,
        purpose: data.purpose,
        role: "user" as const,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      };

      // Use upsert: update() is a no-op if the profile row doesn't exist yet
      const { error } = await supabase
        .from("profiles")
        .upsert(profileData, { onConflict: "user_id" });
      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["user-profile", user.id] });
      toast({
        title: "Welcome aboard! 🎉",
        description: "Your profile is all set up. Start learning!",
      });
      try {
        localStorage.removeItem("onboarding_user_draft");
      } catch {
        /* ignore */
      }
      navigate("/dashboard");
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

    const tierLimits: Record<"free" | "pro" | "enterprise", { max_courses: number; max_tests: number; max_videos: number; can_create_olympiads: boolean; seo_boost_level: number }> = {
      free: { max_courses: 3, max_tests: 5, max_videos: 10, can_create_olympiads: false, seo_boost_level: 0 },
      pro: { max_courses: 15, max_tests: 30, max_videos: 50, can_create_olympiads: true, seo_boost_level: 1 },
      enterprise: { max_courses: 9999, max_tests: 9999, max_videos: 9999, can_create_olympiads: true, seo_boost_level: 3 },
    };
    const tier = data.selected_tier ?? "free";
    const limits = tierLimits[tier];

    try {
      const { data: existingCenter } = await supabase
        .from("educational_centers")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();

      // Map onboarding fields to educational_centers columns (center_name→name, contact_email→email, subjects_offered→specializations, estimated_students→student_count)
      const centerPayload = {
        name: data.name.trim(),
        description: data.description?.trim() || null,
        logo_url: data.logo_url?.trim() || null,
        banner_url: data.banner_url?.trim() || null,
        address: data.address?.trim() || null,
        city: data.city?.trim() || null,
        email: data.contact_email?.trim() || user?.email || null,
        contact_phone: data.contact_phone?.trim() || null,
        website: data.website?.trim() || null,
        specializations: data.specializations?.length ? data.specializations : null,
        grades_served: data.grades_served?.length ? data.grades_served : null,
        languages_supported: data.languages_supported?.length ? data.languages_supported : null,
        teachers_count: data.teachers_count ?? null,
        student_count: data.student_count ?? null,
        founded_year: data.founded_year ?? null,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      };

      let centerId: string;

      if (existingCenter) {
        const { error } = await supabase
          .from("educational_centers")
          .update(centerPayload)
          .eq("id", existingCenter.id);
        if (error) throw error;
        centerId = existingCenter.id;
      } else {
        const { data: inserted, error } = await supabase
          .from("educational_centers")
          .insert({
            owner_id: user.id,
            ...centerPayload,
            status: "pending",
          })
          .select("id")
          .single();
        if (error) throw error;
        centerId = inserted.id;
      }

      const { data: sub } = await supabase
        .from("center_subscriptions")
        .select("id")
        .eq("center_id", centerId)
        .maybeSingle();

      if (sub) {
        const { error: subError } = await supabase
          .from("center_subscriptions")
          .update({
            tier,
            tariff_selected: true,
            selected_at: new Date().toISOString(),
            ...limits,
          })
          .eq("id", sub.id);
        if (subError) throw subError;
      }

      // Update profile with defensive error handling for schema cache issues
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert(
          {
            user_id: user.id,
            id: user.id,
            role: "center",
            onboarding_completed: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );

      if (profileError) {
        toast({
          title: "Profile not saved",
          description:
            profileError.message ||
            "We created your center, but saving your profile failed. Please try again.",
          variant: "destructive",
        });
      }

      await queryClient.invalidateQueries({ queryKey: ["user-profile", user.id] });
      await queryClient.invalidateQueries({ queryKey: ["my-center", user.id] });
      toast({
        title: "Request sent",
        description: "Your request has been sent to admin for approval. You'll get dashboard access after approval.",
      });
      try {
        localStorage.removeItem("onboarding_center_draft");
      } catch {
        /* ignore */
      }
      navigate("/center-panel");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save center",
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
