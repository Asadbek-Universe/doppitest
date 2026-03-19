import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Submit olympiad for admin approval
export const useSubmitForApproval = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (olympiadId: string) => {
      const { error } = await supabase
        .from("olympiads")
        .update({
          approval_status: "pending_approval",
          submitted_for_approval_at: new Date().toISOString(),
        })
        .eq("id", olympiadId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["center-olympiads"] });
      queryClient.invalidateQueries({ queryKey: ["admin-olympiads"] });
      queryClient.invalidateQueries({ queryKey: ["pending-olympiads-count"] });
      toast.success("Olympiad submitted for approval");
    },
    onError: () => {
      toast.error("Failed to submit for approval");
    },
  });
};

// Update olympiad (only allowed for draft status)
export const useUpdateOlympiad = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      olympiadId,
      ...olympiadData
    }: {
      olympiadId: string;
      title?: string;
      description?: string;
      subject_id?: string;
      grade?: string;
      language?: string;
      difficulty_level?: string;
      thumbnail_url?: string;
      banner_url?: string;
      start_date?: string;
      end_date?: string;
      registration_start_date?: string;
      registration_deadline?: string;
      max_participants?: number;
      entry_code?: string;
      is_public?: boolean;
      duration_minutes?: number;
      auto_submit_when_time_ends?: boolean;
      allow_back_navigation?: boolean;
      shuffle_questions?: boolean;
      shuffle_options?: boolean;
      show_results_immediately?: boolean;
      show_correct_after_submit?: boolean;
      anti_cheat_disable_copy_paste?: boolean;
      prize_description?: string;
      rules?: string;
    }) => {
      // First check if the olympiad is still in draft mode
      const { data: olympiad, error: fetchError } = await supabase
        .from("olympiads")
        .select("approval_status")
        .eq("id", olympiadId)
        .single();

      if (fetchError) throw fetchError;

      if (olympiad.approval_status !== "draft" && olympiad.approval_status !== "rejected") {
        throw new Error("Can only edit olympiads in draft or rejected status");
      }

      const { error } = await supabase
        .from("olympiads")
        .update(olympiadData)
        .eq("id", olympiadId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["center-olympiads"] });
      toast.success("Olympiad updated");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update olympiad");
    },
  });
};

// Resubmit rejected olympiad for approval
export const useResubmitOlympiad = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (olympiadId: string) => {
      const { error } = await supabase
        .from("olympiads")
        .update({
          approval_status: "pending_approval",
          rejection_reason: null,
          submitted_for_approval_at: new Date().toISOString(),
        })
        .eq("id", olympiadId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["center-olympiads"] });
      queryClient.invalidateQueries({ queryKey: ["admin-olympiads"] });
      queryClient.invalidateQueries({ queryKey: ["pending-olympiads-count"] });
      toast.success("Olympiad resubmitted for approval");
    },
    onError: () => {
      toast.error("Failed to resubmit olympiad");
    },
  });
};

// Delete olympiad (only draft or rejected)
export const useDeleteOlympiad = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (olympiadId: string) => {
      // First check if the olympiad can be deleted
      const { data: olympiad, error: fetchError } = await supabase
        .from("olympiads")
        .select("approval_status")
        .eq("id", olympiadId)
        .single();

      if (fetchError) throw fetchError;

      if (olympiad.approval_status !== "draft" && olympiad.approval_status !== "rejected") {
        throw new Error("Can only delete olympiads in draft or rejected status");
      }

      const { error } = await supabase
        .from("olympiads")
        .delete()
        .eq("id", olympiadId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["center-olympiads"] });
      toast.success("Olympiad deleted");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete olympiad");
    },
  });
};
